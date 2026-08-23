#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - GUI GTK3 (alternativa ligera a Tkinter)
#
#  Reutiliza TODA la lógica de rpgmaker-launcher-gui.py
#  (Launcher, detección de motor, estado, portadas...) y los
#  diálogos complejos se abren como proceso Tk efímero mediante
#  el modo --tool del otro GUI (en Flatpak sin Tcl/Tk se ocultan).
# ============================================================
import os
import sys
import time
import glob
import json
import shutil
import threading
import subprocess
import importlib.util

import gi
gi.require_version("Gtk", "3.0")
from gi.repository import Gtk, Gdk, GdkPixbuf, GLib

BASE_DIR = os.path.dirname(os.path.realpath(__file__))
DATA_DIR = os.path.expanduser(os.environ.get("RPGMAKER_DATA_DIR", "")) or BASE_DIR

IN_FLATPAK = bool(os.environ.get("FLATPAK_ID"))

CSS = b"""
.gamecard { background: #1b202b; border-radius: 8px; padding: 8px; }
.gamecard:hover { background: #232a3b; }
.gamename { color: #e7e9f0; font-weight: bold; font-size: 11px; }
.gamemeta { color: #7c6cf0; font-size: 9px; }
.gamelast { color: #8a92a8; font-size: 9px; }
.statusbar { color: #cfd4e2; background: #161a22; padding: 6px 10px; }
.header { background: #161a22; }
"""


def load_tkgui():
    spec = importlib.util.spec_from_file_location(
        "rpgmaker_tk_gui", os.path.join(BASE_DIR, "rpgmaker-launcher-gui.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def load_cfgmod():
    spec = importlib.util.spec_from_file_location(
        "rpgmaker_config", os.path.join(BASE_DIR, "rpgmaker-config.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


TKGUI = load_tkgui()
CFG = load_cfgmod()
_ = TKGUI._

TOOLS = [
    ("Plugins", "plugins", ("MZ", "MV", "web")),
    ("Partidas", "saves", ("MZ", "MV", "web")),
    ("Editar contenido", "editor", ("MZ", "MV", "web")),
    ("Plantilla trucos", "preset", ("MZ", "MV", "web")),
    ("Datos", "datos", ("MZ", "MV", "web")),
    ("Mods", "mods", ("MZ", "MV", "web")),
    ("Sync", "sync", None),
    ("Descifrar", "decrypt", ("XP", "VX", "VXAce")),
]


class Card(Gtk.Box):
    """Tarjeta de juego: portada + nombre + meta + estrella favorito."""

    def __init__(self, app, name, root, engine):
        super().__init__(orientation=Gtk.Orientation.VERTICAL, spacing=2)
        self.app = app
        self.name = name
        self.root = root
        self.engine = engine
        self.get_style_context().add_class("gamecard")
        self.set_size_request(186, -1)

        info = app.state.get("games", {}).get(name, {})
        cover = find_cover_local(root)
        img_box = Gtk.Box()
        img_box.set_size_request(170, 128)
        if cover:
            try:
                pb = GdkPixbuf.Pixbuf.new_from_file_at_scale(
                    cover, 170, 128, True)
                img_box.add(Gtk.Image.new_from_pixbuf(pb))
            except Exception:
                img_box.add(Gtk.Label.new((name[:1] or "?").upper()))
        else:
            lbl = Gtk.Label.new((name[:1] or "?").upper())
            lbl.get_style_context().add_class("gamename")
            img_box.add(lbl)
        self.pack_start(img_box, False, False, 0)

        nl = Gtk.Label.new(name)
        nl.set_line_wrap(True)
        nl.set_xalign(0)
        nl.get_style_context().add_class("gamename")
        self.pack_start(nl, False, False, 0)

        hours = info.get("seconds", 0)
        meta = _(TKGUI.ENGINE_LABEL.get(engine, engine))
        if hours:
            meta += " \u00b7 " + TKGUI.fmt_hours(hours)
        ml = Gtk.Label.new(meta)
        ml.set_xalign(0)
        ml.get_style_context().add_class("gamemeta")
        self.pack_start(ml, False, False, 0)

        ll = Gtk.Label.new(TKGUI.fmt_last(info.get("last_played")) or _("sin jugar aun"))
        ll.set_xalign(0)
        ll.get_style_context().add_class("gamelast")
        self.pack_start(ll, False, False, 0)

        star = Gtk.Button.new_with_label("\u2605" if info.get("favorite")
                                         else "\u2606")
        star.set_relief(Gtk.ReliefStyle.NONE)
        star.set_tooltip_text(_("Favorito"))
        star.connect("clicked", lambda b: app.toggle_fav(name))

        ov = Gtk.Overlay()
        ov.add(self)
        ov.add_overlay(star)
        star.set_halign(Gtk.Align.END)
        star.set_valign(Gtk.Align.START)
        ov._card_ref = self
        self._outer = ov


def find_cover_local(root):
    try:
        return TKGUI.find_cover(root, root)
    except Exception:
        return None


class GtkApp:
    def __init__(self):
        self.cfgmod = CFG
        self.cfg = CFG.load_config()
        gen = self.cfg.setdefault("general", {})
        lang = gen.get("lang", "en")
        TKGUI.LANG = lang if lang in ("es", "en") else "en"
        self.use_webkit = Gtk.CheckButton.new_with_label(_("Visor WebKit"))
        self.use_webkit.set_active(bool(gen.get("webkit")))
        self.auto_delete = Gtk.CheckButton.new_with_label(_("Eliminar .zip"))
        self.auto_delete.set_active(bool(gen.get("auto_delete_zip")))

        self.launcher = TKGUI.Launcher()
        self.state = TKGUI.load_state()
        self.session_game = None
        self.session_start = None

        self.win = Gtk.Window(title="RPG Maker Launcher")
        self.win.set_default_size(1040, 680)
        self.win.set_position(Gtk.WindowPosition.CENTER)
        try:
            self.win.set_icon_from_file(os.path.join(BASE_DIR,
                                                     "rpgmaker-icon.png"))
        except Exception:
            pass
        self._build()
        self.reload_games()
        self.win.connect("delete-event", self.on_quit)
        self._setup_dnd()
        self._check_updates_async()

    # ---------- construcción ----------
    def _build(self):
        hb = Gtk.HeaderBar()
        hb.set_show_close_button(True)
        hb.get_style_context().add_class("header")
        hb.props.title = "RPG Maker Launcher"
        self.lang_btn = Gtk.Button.new_with_label(
            "EN" if TKGUI.LANG == "es" else "ES")
        self.lang_btn.connect("clicked", self.toggle_lang)
        hb.pack_end(self.lang_btn)
        btn_up = Gtk.Button.new_from_icon_name("view-refresh-symbolic",
                                               Gtk.IconSize.BUTTON)
        btn_up.set_tooltip_text(_("Actualizar"))
        btn_up.connect("clicked", lambda b: self.rescan())
        hb.pack_end(btn_up)
        self.btn_update = Gtk.Button.new_with_label("")
        self.btn_update.get_style_context().add_class("suggested-action")
        self.btn_update.connect("clicked", self.open_releases)
        hb.pack_end(self.btn_update)
        self.btn_update.hide()
        self.win.set_titlebar(hb)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        self.win.add(vbox)

        sc = Gtk.ScrolledWindow()
        sc.set_vexpand(True)
        vbox.pack_start(sc, True, True, 0)
        self.flow = Gtk.FlowBox()
        self.flow.set_valign(Gtk.Align.START)
        self.flow.set_max_children_per_line(6)
        self.flow.set_min_children_per_line(3)
        self.flow.set_selection_mode(Gtk.SelectionMode.SINGLE)
        self.flow.set_homogeneous(False)
        self.flow.connect("child-activated", lambda fb, ch: self.play())
        sc.add(self.flow)

        bar = Gtk.ActionBar()
        vbox.pack_end(bar, False, False, 0)
        play = Gtk.Button.new_with_label("\u25b6 " + _("Jugar"))
        play.get_style_context().add_class("suggested-action")
        play.connect("clicked", lambda b: self.play())
        bar.pack_start(play)
        stop = Gtk.Button.new_with_label(_("Detener servidor"))
        stop.connect("clicked", self.stop_server)
        bar.pack_start(stop)
        if not IN_FLATPAK:
            self.tools_btn = Gtk.MenuButton()
            self.tools_btn.add(Gtk.Label.new(_("Herramientas")))
            pop = Gtk.Popover()
            vbox_t = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
            vbox_t.set_margin_top(6); vbox_t.set_margin_bottom(6)
            vbox_t.set_margin_start(6); vbox_t.set_margin_end(6)
            for label, key, engines in TOOLS:
                bi = Gtk.Button.new_with_label(label)
                bi.relief = Gtk.ReliefStyle.NONE
                bi.connect("clicked", lambda _b, k=key, e=engines, l=label:
                           (self.tools_pop.popdown(),
                            self.open_tool(k, e, l)))
                vbox_t.add(bi)
            vbox_t.show_all()
            pop.add(vbox_t)
            self.tools_pop = pop
            self.tools_btn.set_popover(pop)
            bar.pack_start(self.tools_btn)
        self.status = Gtk.Label.new(_("Cargando..."))
        self.status.set_ellipsize(3)
        self.status.set_hexpand(True)
        self.status.set_xalign(0)
        self.status.get_style_context().add_class("statusbar")
        bar.pack_end(self.status)
        bar.pack_end(self.use_webkit)
        bar.pack_end(self.auto_delete)

    # ---------- biblioteca ----------
    def reload_games(self):
        self.flow.foreach(lambda c: self.flow.remove(c))
        entries, broken = [], []
        for top in sorted(glob.glob(os.path.join(TKGUI.GAMES_DIR, "*"))):
            if not os.path.isdir(top):
                continue
            name = os.path.basename(top.rstrip(os.sep))
            root, eng = TKGUI.detect_engine(top)
            if eng is None:
                continue
            if eng in ("incomplete", "renpy-incomplete"):
                broken.append((name, eng))
            else:
                entries.append((name, top, root, eng))

        def key(e):
            info = self.state.get("games", {}).get(e[0], {})
            return (0 if info.get("favorite") else 1,
                    -(info.get("last_played") or 0),
                    e[0].lower())
        entries.sort(key=key)
        self.games = [(n, r, e) for n, _t, r, e in entries]

        for name, _top, root, eng in entries:
            card = Card(self, name, root, eng)
            outer = getattr(card, "_outer", card)
            self.flow.add(outer)
        for name, _root, eng in broken:
            lbl = Gtk.Label.new("( ! ) " + _(TKGUI.ENGINE_LABEL.get(eng, eng)))
            self.flow.add(lbl)
        self.flow.show_all()

    def selected(self):
        ch = self.flow.get_selected_children()
        if not ch:
            return None
        inner = ch[0].get_child()
        card_obj = getattr(inner, "_card_ref", None)
        if card_obj is None:
            return None
        return (card_obj.name, card_obj.root, card_obj.engine)

    def toggle_fav(self, name):
        g = self.state.setdefault("games", {}).setdefault(name, {})
        g["favorite"] = not g.get("favorite")
        TKGUI.save_state(self.state)
        self.reload_games()

    def rescan(self):
        self.set_status(_("Buscando nuevos .zip..."))

        def worker():
            done, errs = TKGUI.extract_zips(
                callback=lambda m: GLib.idle_add(self.set_status, m),
                auto_delete=self.auto_delete.get_active())
            GLib.idle_add(self._finish_rescan, done, errs)
        threading.Thread(target=worker, daemon=True).start()

    def _finish_rescan(self, done, errs):
        msg = _("Extraídos: %s") % ", ".join(done) if done \
            else _("Sin nuevos .zip")
        if errs:
            msg += " | ERROR: %s" % ", ".join(errs)
        self.reload_games()
        self.set_status(msg)

    # ---------- lanzar ----------
    def play(self):
        sel = self.selected()
        if not sel:
            return
        name, root, engine = sel
        if engine == "incomplete":
            return
        try:
            if engine in ("MZ", "MV", "web"):
                self.launcher.launch_web(root, name,
                                         webkit=self.use_webkit.get_active())
                self.set_status(_("Servidor iniciado para %s.") % name)
            else:
                self.launcher.launch_native(root, engine)
                self.set_status(_("%s lanzado.") % name)
        except Exception as e:
            self.set_status(str(e))
            return
        self.start_session(name)

    def start_session(self, name):
        g = self.state.setdefault("games", {}).setdefault(name, {})
        g["last_played"] = time.time()
        self.session_game = name
        self.session_start = time.time()
        TKGUI.save_state(self.state)

    def end_session(self):
        if self.session_game and self.session_start:
            g = self.state.setdefault("games", {}).get(self.session_game, {})
            g["seconds"] = g.get("seconds", 0) + int(time.time()
                                                     - self.session_start)
            zf = TKGUI.zoom_file_for(self.session_game)
            try:
                if os.path.isfile(zf):
                    with open(zf, encoding="utf-8") as fh:
                        z = json.load(fh).get("zoom")
                    if isinstance(z, (int, float)) and 0.2 <= z <= 5:
                        g["zoom"] = round(float(z), 3)
            except (OSError, ValueError):
                pass
            self.session_game = None
            self.session_start = None
            TKGUI.save_state(self.state)

    def stop_server(self, b=None):
        if self.launcher.server_running:
            self.launcher.stop_server()
            self.end_session()
            self.set_status(_("Servidor detenido."))
        else:
            self.set_status(_("No hay ningún servidor activo."))

    def on_quit(self, *_a):
        self.end_session()
        self.launcher.stop_server()
        self._save_prefs()
        Gtk.main_quit()
        return False

    def _save_prefs(self):
        gen = self.cfg.setdefault("general", {})
        gen["webkit"] = bool(self.use_webkit.get_active())
        gen["auto_delete_zip"] = bool(self.auto_delete.get_active())
        CFG.save_config(self.cfg)

    # ---------- herramientas (proceso Tk efímero) ----------
    def open_tool(self, key, engines, label):
        sel = self.selected()
        if not sel:
            self.set_status(_("Selecciona un juego."))
            return
        name, root, engine = sel
        if engines and engine not in engines:
            self.set_status(_("%(what)s: disponible para %(eng)s.")
                            % {"what": label,
                               "eng": "/".join(engines)})
            return
        subprocess.Popen([sys.executable,
                          os.path.join(BASE_DIR, "rpgmaker-launcher-gui.py"),
                          "--tool", key, "--root", root,
                          "--name", name, "--engine", engine,
                          "--lang", TKGUI.LANG],
                         stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL)

    # ---------- varios ----------
    def set_status(self, msg):
        GLib.idle_add(self.status.set_text, msg)

    def toggle_lang(self, b=None):
        gen = self.cfg.setdefault("general", {})
        gen["lang"] = "es" if TKGUI.LANG == "en" else "en"
        CFG.save_config(self.cfg)
        GLib.idle_add(Gtk.main_quit)  # reinicia aplicando idioma

    def _setup_dnd(self):
        targets = Gtk.TargetList.new([])
        targets.add_uri_targets(1)
        self.win.drag_dest_set(Gtk.DestDefaults.ALL, [], Gdk.DragAction.COPY)
        self.win.drag_dest_set_target_list(targets)
        self.win.connect("drag-data-received", self.on_drop)

    def on_drop(self, w, ctx, x, y, data, info, t):
        n = 0
        for uri in data.get_uris():
            p = GLib.filename_from_uri(uri)[0]
            if os.path.isfile(p) and p.lower().endswith(".zip"):
                try:
                    shutil.copy2(p, os.path.join(TKGUI.DATA_DIR,
                                                 os.path.basename(p)))
                    n += 1
                except OSError:
                    pass
        if n:
            self.set_status(_("Copiados %d .zip; extrayendo...") % n)
            self.rescan()
        Gtk.drag_finish(ctx, True, False, t)

    def _check_updates_async(self):
        def worker():
            import urllib.request
            try:
                req = urllib.request.Request(
                    TKGUI.REPO_LATEST_API,
                    headers={"User-Agent": "rpgmaker-launcher"})
                with urllib.request.urlopen(req, timeout=8) as fh:
                    tag = json.load(fh).get("tag_name") or ""
                if App_version_newer(tag, TKGUI.APP_VERSION):
                    GLib.idle_add(self.show_update, tag)
            except Exception:
                pass
        threading.Thread(target=worker, daemon=True).start()

    def show_update(self, tag):
        self.btn_update.set_label("\u2193 %s" % tag)
        self.btn_update.set_tooltip_text(_("Nueva versión disponible: %s") % tag)
        self.btn_update.show()
        self.set_status(_("Nueva versión disponible: %s") % tag)

    def open_releases(self, *_a):
        subprocess.Popen(["xdg-open", TKGUI.REPO_RELEASES_URL])


def App_version_newer(tag, current):
    def nums(s):
        return tuple(int(p) for p in s.lstrip("v").split(".") if p.isdigit())
    try:
        return nums(tag) > nums(current)
    except Exception:
        return False


def main():
    screen = Gdk.Screen.get_default()
    css = Gtk.CssProvider.new()
    css.load_from_data(CSS)
    Gtk.StyleContext.add_provider_for_screen(
        screen, css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
    if not os.path.isdir(TKGUI.GAMES_DIR):
        os.makedirs(TKGUI.GAMES_DIR, exist_ok=True)
    app = GtkApp()
    app.win.connect("destroy", app.on_quit)
    app.win.show_all()
    app.btn_update.hide()
    Gtk.main()


if __name__ == "__main__":
    main()
