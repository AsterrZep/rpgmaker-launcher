#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - GUI ligera (Tkinter)
#  Lista los juegos, detecta el motor y los lanza con el
#  runtime adecuado. Incluye control de servidores HTTP y
#  limpieza opcional de los .zip.
# ============================================================
import os
import sys
import time
import glob
import json
import hashlib
import shutil
import threading
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox
from tkinter import simpledialog, filedialog

BASE_DIR = os.path.dirname(os.path.realpath(__file__))
GAMES_DIR = os.path.join(BASE_DIR, "games")
RUN_DIR = os.path.join(BASE_DIR, "runtimes")
BACKUPS_DIR = os.path.join(BASE_DIR, "backups")
STATE_FILE = os.path.join(BASE_DIR, "launcher-state.json")
MKXPZ = os.path.join(RUN_DIR, "mkxp-z")
EASYRPG = "easyrpg-player"
MAX_DEPTH = 5
MARKER = ".extracted"

ENGINE_LABEL = {
    "MZ": "RPG Maker MZ",
    "MV": "RPG Maker MV",
    "web": "Web (MV/MZ)",
    "2000-2003": "RPG Maker 2000/2003",
    "renpy": "Ren'Py",
    "VXAce": "RPG Maker VX Ace",
    "VX": "RPG Maker VX",
    "XP": "RPG Maker XP",
    "incomplete": "Descarga incompleta",
    "renpy-incomplete": "Ren'Py sin parte Linux",
}


# ---------- detección (misma lógica que el lanzador bash) ----------
def first_find(root, name):
    root = os.path.abspath(root)
    for dirpath, dirnames, filenames in os.walk(root):
        depth = dirpath[len(root):].count(os.sep)
        if depth >= MAX_DEPTH:
            dirnames[:] = []
            continue
        dirnames.sort()
        if name in filenames:
            return os.path.join(dirpath, name)
    return None


def find_glob(root, pattern):
    for dirpath, dirnames, filenames in os.walk(root):
        depth = dirpath[len(root):].count(os.sep)
        if depth >= MAX_DEPTH:
            dirnames[:] = []
            continue
        dirnames.sort()
        if filenames:
            m = glob.fnmatch.filter(filenames, pattern)
            if m:
                return os.path.join(dirpath, m[0])
    return None


def find_dir(root, name):
    for dirpath, dirnames, filenames in os.walk(root):
        depth = dirpath[len(root):].count(os.sep)
        if depth >= MAX_DEPTH:
            dirnames[:] = []
            continue
        dirnames.sort()
        if name in dirnames:
            return os.path.join(dirpath, name)
    return None


def detect_engine(top):
    f = first_find(top, "index.html")
    if f:
        root = os.path.dirname(f)
        if os.path.isfile(os.path.join(root, "js", "rmmz_core.js")):
            return root, "MZ"
        if os.path.isfile(os.path.join(root, "js", "rpg_core.js")):
            return root, "MV"
        return root, "web"

    for file, eng in (("Game.rgss3a", "VXAce"), ("Game.rgss2a", "VX"), ("Game.rgssad", "XP")):
        f = first_find(top, file)
        if f:
            return os.path.dirname(f), eng

    for pat in ("RPG_RT.exe", "RPG_RT.ini"):
        f = first_find(top, pat)
        if f:
            return os.path.dirname(f), "2000-2003"
    f = find_glob(top, "*.lmt")
    if f:
        return os.path.dirname(f), "2000-2003"

    f = find_glob(top, "*.py")
    if f:
        rdir = os.path.dirname(f)
        if all(os.path.isdir(os.path.join(rdir, d)) for d in ("renpy", "game", "lib/linux-x86_64")):
            return rdir, "renpy"

    for file, eng in (("Scripts.rvdata2", "VXAce"), ("Scripts.rvdata", "VX"), ("Scripts.rxdata", "XP")):
        f = first_find(top, file)
        if f:
            return os.path.dirname(f), eng

    if first_find(top, "System.json") or first_find(top, "Map001.json"):
        return top, "incomplete"
    if find_dir(top, "renpy"):
        return top, "renpy-incomplete"
    return None, None


def free_port():
    import socket
    s = socket.socket()
    s.bind(("", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def stable_port(game_name):
    """Puerto determinista por juego.

    Los juegos web (MV/MZ) guardan las partidas en LocalStorage/IndexedDB
    del navegador bajo el origen (host + puerto). Si cada lanzamiento usa
    un puerto aleatorio, las partidas quedan "perdidas" porque se guardan
    en otro origen. Con un puerto fijo por juego, las partidas se conservan.
    """
    h = int(hashlib.md5(game_name.encode("utf-8")).hexdigest(), 16)
    port = 18000 + (h % 10000)
    try:
        import socket
        s = socket.socket()
        s.bind(("127.0.0.1", port))
        s.close()
        return port
    except OSError:
        return free_port()


def zip_for_game(name):
    """Devuelve la ruta del .zip correspondiente al nombre de la carpeta del juego."""
    return os.path.join(BASE_DIR, name + ".zip")


# ---------- librería visual / estado ----------
def load_state():
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {"games": {}}


def save_state(state):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as fh:
            json.dump(state, fh, ensure_ascii=False, indent=1)
    except OSError:
        pass


def fmt_last(ts):
    if not ts:
        return ""
    d = time.time() - ts
    if d < 60:
        return "ahora"
    if d < 3600:
        return "hace %d min" % int(d // 60)
    if d < 86400:
        return "hace %d h" % int(d // 3600)
    if d < 7 * 86400:
        return "hace %d d" % int(d // 86400)
    return time.strftime("%d/%m/%y", time.localtime(ts))


def fmt_hours(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    if h and m:
        return "%dh %dm" % (h, m)
    if h:
        return "%dh" % h
    return "%dm" % m


def find_cover(game_top, root):
    for cand in (
        os.path.join(game_top, "cover.png"),
        os.path.join(game_top, "cover.jpg"),
        os.path.join(game_top, "cover.webp"),
        os.path.join(root, "icon", "icon.png"),
        os.path.join(root, "pictures", "title.png"),
        os.path.join(root, "system", "Title.png"),
        os.path.join(root, "system", "title.png"),
    ):
        if os.path.isfile(cand):
            return cand
    return None


def _plugins_module():
    import importlib.util
    path = os.path.join(BASE_DIR, "rpgmaker-plugins.py")
    spec = importlib.util.spec_from_file_location("rpgmaker_plugins", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------- extracción ----------
def extract_zips(callback=None, auto_delete=False):
    done, errors = [], []
    for z in sorted(glob.glob(os.path.join(BASE_DIR, "*.zip"))):
        name = os.path.splitext(os.path.basename(z))[0]
        target = os.path.join(GAMES_DIR, name)
        marker = os.path.join(target, MARKER)
        if os.path.isfile(marker):
            continue
        os.makedirs(target, exist_ok=True)
        if callback:
            callback("Extrayendo: %s ..." % os.path.basename(z))
        r = subprocess.run(["unzip", "-o", "-q", z, "-d", target])
        if r.returncode == 0:
            with open(marker, "w") as fh:
                fh.write("ok\n")
            done.append(name)
            if auto_delete:
                try:
                    os.remove(z)
                    done[-1] = name + " (+ .zip borrado)"
                except OSError as e:
                    errors.append("no se pudo borrar %s: %s" % (os.path.basename(z), e))
        else:
            errors.append(name)
    return done, errors


# ---------- lanzadores ----------
class Launcher:
    def __init__(self):
        self.server_proc = None
        self.server_info = None  # (nombre, puerto)
        self.viewer_proc = None  # visor WebKit (si se usa)

    @property
    def server_running(self):
        return bool(self.server_proc and self.server_proc.poll() is None)

    def stop_server(self):
        if self.server_running:
            self.server_proc.terminate()
            try:
                self.server_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_proc.kill()
        if self.viewer_proc and self.viewer_proc.poll() is None:
            self.viewer_proc.terminate()
            try:
                self.viewer_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.viewer_proc.kill()
        self.server_proc = None
        self.viewer_proc = None
        self.server_info = None

    def launch_web(self, root, name, webkit=False):
        self.stop_server()
        port = stable_port(name)
        server = os.path.join(BASE_DIR, "rpgmaker-server.py")
        self.server_proc = subprocess.Popen(
            [sys.executable, server, str(port), "--dir", root],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.server_info = (name, port)
        time.sleep(1)
        url = "http://localhost:%d/index.html" % port
        if webkit:
            viewer = os.path.join(BASE_DIR, "rpgmaker-webview.py")
            self.viewer_proc = subprocess.Popen(
                [sys.executable, "-u", viewer, "--url", url, "--title", name],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            self.viewer_proc = None
            subprocess.Popen(["xdg-open", url],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return port

    def launch_native(self, root, engine):
        if engine == "2000-2003":
            cmd = [EASYRPG, root]
        elif engine == "renpy":
            py = first_find(root, "*.py")
            cmd = [os.path.join(root, os.path.splitext(py)[0] + ".sh")]
        else:
            cmd = [MKXPZ]
        subprocess.Popen(cmd, cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# ---------- ventana ----------
class App:
    def __init__(self):
        self.launcher = Launcher()
        self.games = []  # (nombre, root, engine) o None si incompleto
        self.state = load_state()
        self._images = {}      # nombre -> PhotoImage (portadas)
        self._session_start = None
        self._session_game = None

        self.root = tk.Tk()
        self.root.title("RPG Maker Launcher")
        self.root.geometry("680x460")
        self.root.minsize(560, 400)
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass

        top = ttk.Frame(self.root, padding=(12, 10))
        top.pack(fill="x")
        ttk.Label(top, text="RPG Maker Launcher", font=("Sans", 14, "bold")).pack(side="left")
        ttk.Label(top, text="Chrome OS / Linux", foreground="#666").pack(side="left", padx=8, pady=6)
        self.auto_delete = tk.BooleanVar(value=False)
        ttk.Checkbutton(top, text="Eliminar .zip tras extraer",
                        variable=self.auto_delete).pack(side="right")
        self.use_webkit = tk.BooleanVar(value=False)
        ttk.Checkbutton(top, text="Visor WebKit (más ligero)",
                        variable=self.use_webkit).pack(side="right", padx=8)

        mid = ttk.Frame(self.root, padding=(12, 0))
        mid.pack(fill="both", expand=True)
        self.tree = ttk.Treeview(mid, columns=("engine", "last"), show="tree headings", selectmode="browse")
        self.tree.heading("#0", text="Juego")
        self.tree.heading("engine", text="Motor")
        self.tree.heading("last", text="Última vez")
        self.tree.column("#0", width=300, anchor="w")
        self.tree.column("engine", width=150, anchor="w")
        self.tree.column("last", width=110, anchor="w")
        vsb = ttk.Scrollbar(mid, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")
        self.tree.bind("<Double-1>", lambda e: self.play_selected())
        self.tree.bind("<<TreeviewSelect>>", lambda e: self._update_tool_buttons())

        btns = ttk.Frame(self.root, padding=(12, 10))
        btns.pack(fill="x")
        self.play_btn = ttk.Button(btns, text="Jugar", command=self.play_selected)
        self.play_btn.pack(side="left")
        ttk.Button(btns, text="Actualizar", command=self.rescan).pack(side="left", padx=6)
        self.stop_btn = ttk.Button(btns, text="Detener servidor", command=self.stop_server_action)
        self.stop_btn.pack(side="left", padx=6)
        self.plugins_btn = ttk.Button(btns, text="Plugins", command=self.plugins_selected, state="disabled")
        self.plugins_btn.pack(side="left", padx=6)
        self.saves_btn = ttk.Button(btns, text="Partidas", command=self.saves_selected, state="disabled")
        self.saves_btn.pack(side="left")
        ttk.Button(btns, text="Borrar .zip", command=self.delete_zip_action).pack(side="left", padx=6)
        ttk.Button(btns, text="Salir", command=self.on_close).pack(side="right")

        self.status = tk.StringVar(value="Cargando...")
        ttk.Label(self.root, textvariable=self.status, padding=(12, 6), foreground="#555").pack(fill="x")

        self.load_games()

    # --- datos ---
    def _cover_photo(self, top, root):
        path = find_cover(top, root)
        if not path:
            return None
        ext = os.path.splitext(path)[1].lower()
        if ext in (".jpg", ".jpeg", ".webp"):
            try:
                from PIL import Image
                img = Image.open(path)
                img.thumbnail((112, 112))
                import io
                buf = io.BytesIO()
                img.save(buf, "PNG")
                return tk.PhotoImage(data=buf.getvalue())
            except Exception:
                return None
        try:
            img = tk.PhotoImage(file=path)
        except tk.TclError:
            return None
        w, h = img.width(), img.height()
        target = 28
        if w > target or h > target:
            s = max(1, min(w, h) // target)
            img = img.subsample(s, s)
        return img

    def load_games(self):
        self.games = []
        self.tree.delete(*self.tree.get_children())
        for top in sorted(glob.glob(os.path.join(GAMES_DIR, "*"))):
            if not os.path.isdir(top):
                continue
            name = os.path.basename(top.rstrip(os.sep))
            root, eng = detect_engine(top)
            if eng is None:
                continue
            if eng in ("incomplete", "renpy-incomplete"):
                label = ENGINE_LABEL.get(eng, eng)
                iid = self.tree.insert("", "end", text=name, values=("(!) " + label, ""))
                self.tree.item(iid, tags=("bad",))
                self.games.append(None)
            else:
                info = self.state.get("games", {}).get(name, {})
                last = fmt_last(info.get("last_played"))
                hours = info.get("seconds", 0)
                eng_lab = ENGINE_LABEL.get(eng, eng)
                if hours:
                    eng_lab += "  ·  %s" % fmt_hours(hours)
                photo = self._cover_photo(top, root)
                self._images[name] = photo
                iid = self.tree.insert("", "end", text=name, image=photo,
                                       values=(eng_lab, last))
                self.games.append((name, root, eng))
        self.tree.tag_configure("bad", foreground="#b00")
        self._update_status("Listos: %d juego(s)" % sum(1 for g in self.games if g))

    def _update_tool_buttons(self):
        sel = self.selected()
        is_web = bool(sel and sel[1] and sel[1][2] in ("MZ", "MV", "web"))
        self.plugins_btn.config(state="normal" if is_web else "disabled")
        self.saves_btn.config(state="normal" if is_web else "disabled")

    # --- sesión de juego (tiempo jugado / última vez) ---
    def _start_session(self, name):
        g = self.state.setdefault("games", {}).setdefault(name, {})
        g["last_played"] = time.time()
        self._session_game = name
        self._session_start = time.time()
        save_state(self.state)

    def _end_session(self):
        if self._session_start and self._session_game:
            g = self.state.setdefault("games", {}).get(self._session_game, {})
            g["seconds"] = g.get("seconds", 0) + int(time.time() - self._session_start)
            self._session_start = None
            self._session_game = None
            save_state(self.state)

    def rescan(self):
        self._update_status("Buscando nuevos .zip...")
        threading.Thread(target=self._rescan_worker, daemon=True).start()

    def _rescan_worker(self):
        extracted, errors = extract_zips(callback=self._set_status,
                                         auto_delete=self.auto_delete.get())
        self.root.after(0, lambda: self._finish_rescan(extracted, errors))

    def _finish_rescan(self, extracted, errors):
        if extracted:
            msg = "Extraídos: %s" % ", ".join(extracted)
        else:
            msg = "Sin nuevos .zip"
        if errors:
            msg += "  |  ERROR: %s" % ", ".join(errors)
        self.load_games()
        self._update_status(msg)

    def _set_status(self, msg):
        self.root.after(0, lambda: self._update_status(msg))

    def _update_status(self, msg):
        if self.launcher.server_running and self.launcher.server_info:
            name, port = self.launcher.server_info
            self.status.set("Servidor ACTIVO: %s -> http://localhost:%d   |   %s"
                            % (name, port, msg))
        else:
            self.status.set(msg)

    # --- acciones ---
    def selected(self):
        sel = self.tree.focus()
        if not sel:
            return None
        idx = self.tree.index(sel)
        if idx >= len(self.games):
            return None
        return idx, self.games[idx]

    def play_selected(self):
        sel = self.selected()
        if not sel:
            return
        idx, game = sel
        if not game:
            messagebox.showwarning("RPG Maker Launcher",
                                   "Este juego está incompleto (descarga con archivos faltantes).\nVuelve a descargarlo.")
            return
        name, root, engine = game
        if engine in ("MZ", "MV", "web"):
            modo = "WebKit" if self.use_webkit.get() else "navegador"
            self._update_status("Iniciando servidor para %s (%s)..." % (name, modo))
            self.root.update_idletasks()
            threading.Thread(target=self._play_web, args=(root, name), daemon=True).start()
        else:
            self._update_status("Lanzando %s (%s) en su ventana..." % (name, ENGINE_LABEL.get(engine, engine)))
            self.root.update_idletasks()
            self.launcher.launch_native(root, engine)
            self._update_status("%s lanzado. Cierra la ventana del juego cuando termines." % name)
        self._start_session(name)

    def _play_web(self, root, name):
        port = self.launcher.launch_web(root, name, webkit=self.use_webkit.get())
        self._set_status("")

    def stop_server_action(self):
        if self.launcher.server_running:
            name, port = self.launcher.server_info
            self.launcher.stop_server()
            self._end_session()
            self._update_status("Servidor de '%s' (puerto %d) detenido." % (name, port))
        else:
            self._update_status("No hay ningún servidor activo.")

    def delete_zip_action(self):
        sel = self.selected()
        if not sel:
            return
        idx, game = sel
        name = self.tree.item(self.tree.focus(), "text")
        zpath = zip_for_game(name)
        if not os.path.isfile(zpath):
            self._update_status("No existe el .zip de '%s'." % name)
            return
        size = os.path.getsize(zpath) / (1024 * 1024)
        ok = messagebox.askyesno("RPG Maker Launcher",
                                 "¿Eliminar el .zip de '%s'?\n\n%s\n(%.0f MB — el juego ya extraído se conserva)"
                                 % (name, os.path.basename(zpath), size))
        if not ok:
            return
        try:
            os.remove(zpath)
            self._update_status(".zip de '%s' eliminado. El juego sigue disponible." % name)
        except OSError as e:
            messagebox.showerror("RPG Maker Launcher", "No se pudo borrar: %s" % e)

    # --- gestor de plugins ---
    def plugins_selected(self):
        sel = self.selected()
        if not sel or not sel[1]:
            return
        name, root, engine = sel[1]
        if engine not in ("MZ", "MV", "web"):
            return
        mod = _plugins_module()
        try:
            path, raw, plugins = mod.load_plugins(root)
        except SystemExit as e:
            messagebox.showwarning("Plugins", str(e))
            return

        win = tk.Toplevel(self.root)
        win.title("Plugins - %s" % name)
        win.geometry("600x460")
        tv = ttk.Treeview(win, columns=("estado", "cat"), show="tree headings", selectmode="extended")
        tv.heading("#0", text="Plugin")
        tv.column("#0", width=290, anchor="w")
        tv.heading("estado", text="Estado")
        tv.column("estado", width=60, anchor="center")
        tv.heading("cat", text="WebKit")
        tv.column("cat", width=190, anchor="w")
        tv.pack(side="left", fill="both", expand=True, padx=(10, 0), pady=10)
        vsb = ttk.Scrollbar(win, orient="vertical", command=tv.yview)
        tv.configure(yscrollcommand=vsb.set)
        vsb.pack(side="left", fill="y", pady=10)

        def _fill():
            tv.delete(*tv.get_children())
            for p in plugins:
                a = mod.analyze(p.get("name", "?"), root)
                lab = {"ok": "ok", "nw-protegido": "NW protegido",
                       "roto": "ROTO (nw.js)", "sin-fichero": "sin fichero"}[a["categoria"]]
                tv.insert("", "end", text=p.get("name", "?"),
                          values=("ON" if p.get("status") else "off", lab))

        def _toggle(on, selected):
            targets = [tv.item(i, "text") for i in selected]
            if not targets:
                messagebox.showinfo("Plugins", "Selecciona al menos un plugin.")
                return
            try:
                path2, raw2, plugins2 = mod.load_plugins(root)
                names = {p.get("name") for p in plugins2}
                bad = [n for n in targets if n not in names]
                if bad:
                    messagebox.showwarning("Plugins", "No encontrados: %s" % ", ".join(bad))
                    return
                ch = 0
                for p in plugins2:
                    if p.get("name") in targets and p.get("status") != on:
                        p["status"] = on
                        ch += 1
                if ch:
                    mod.save_plugins(path2, raw2, plugins2)
            except SystemExit as e:
                messagebox.showerror("Plugins", str(e))
                return
            _fill()
            self._update_status("Plugins de '%s' %s: %d" % (name, "activados" if on else "desactivados", ch))

        def _restore():
            if not messagebox.askyesno("Plugins", "¿Restaurar js/plugins.js al original?"):
                return
            try:
                p, _, _ = mod.load_plugins(root)
                bak = p + ".bak"
                if not os.path.isfile(bak):
                    messagebox.showinfo("Plugins", "Aún no hay copia original (no se ha modificado nada).")
                    return
                shutil.copy2(bak, p)
            except SystemExit as e:
                messagebox.showerror("Plugins", str(e))
                return
            _fill()
            self._update_status("plugins.js de '%s' restaurado." % name)

        btns = ttk.Frame(win)
        btns.pack(fill="x", padx=10, pady=(0, 10))
        ttk.Button(btns, text="Activar",
                   command=lambda: _toggle(True, tv.selection())).pack(side="left")
        ttk.Button(btns, text="Desactivar",
                   command=lambda: _toggle(False, tv.selection())).pack(side="left", padx=6)
        ttk.Button(btns, text="Todo ON",
                   command=lambda: _toggle(True, tv.get_children())).pack(side="left")
        ttk.Button(btns, text="Todo OFF",
                   command=lambda: _toggle(False, tv.get_children())).pack(side="left", padx=6)
        ttk.Button(btns, text="Restaurar original", command=_restore).pack(side="left")
        ttk.Button(btns, text="Cerrar", command=win.destroy).pack(side="right")
        _fill()

    # --- gestor de partidas ---
    def saves_selected(self):
        sel = self.selected()
        if not sel or not sel[1]:
            return
        name, root, engine = sel[1]
        if engine not in ("MZ", "MV", "web"):
            return
        sdir = os.path.join(root, "save")
        if not os.path.isdir(sdir):
            messagebox.showinfo("Partidas",
                                "Aún no existe la carpeta 'save/' de este juego.\n"
                                "Guarda al menos una vez dentro del juego y vuelve.")
            return

        win = tk.Toplevel(self.root)
        win.title("Partidas - %s" % name)
        win.geometry("560x420")
        tv = ttk.Treeview(win, columns=("size", "mod"), show="tree headings", selectmode="extended")
        tv.heading("#0", text="Archivo")
        tv.column("#0", width=250, anchor="w")
        tv.heading("size", text="Tamaño")
        tv.column("size", width=90, anchor="e")
        tv.heading("mod", text="Modificado")
        tv.column("mod", width=130, anchor="w")
        tv.pack(side="left", fill="both", expand=True, padx=(10, 0), pady=10)
        vsb = ttk.Scrollbar(win, orient="vertical", command=tv.yview)
        tv.configure(yscrollcommand=vsb.set)
        vsb.pack(side="left", fill="y", pady=10)

        def _fill():
            tv.delete(*tv.get_children())
            for fn in sorted(os.listdir(sdir)):
                full = os.path.join(sdir, fn)
                if os.path.isfile(full):
                    st = os.stat(full)
                    tv.insert("", "end", text=fn,
                              values=("%.1f KB" % (st.st_size / 1024),
                                      time.strftime("%d/%m/%Y %H:%M", time.localtime(st.st_mtime))))

        def _backup():
            ts = time.strftime("%Y%m%d-%H%M%S")
            dest = os.path.join(BACKUPS_DIR, name, ts)
            os.makedirs(dest, exist_ok=True)
            n = 0
            for fn in os.listdir(sdir):
                full = os.path.join(sdir, fn)
                if os.path.isfile(full):
                    shutil.copy2(full, os.path.join(dest, fn))
                    n += 1
            self._update_status("Copia de '%s': %d archivo(s) en backups/%s/%s" % (name, n, name, ts))
            messagebox.showinfo("Partidas", "Copia de seguridad creada:\n%s" % dest)

        def _restore():
            bdir = os.path.join(BACKUPS_DIR, name)
            if not os.path.isdir(bdir):
                messagebox.showinfo("Partidas", "Aún no hay copias de seguridad.")
                return
            snaps = sorted(d for d in os.listdir(bdir) if os.path.isdir(os.path.join(bdir, d)))
            if not snaps:
                messagebox.showinfo("Partidas", "Aún no hay copias de seguridad.")
                return
            choice = simpledialog.askstring(
                "Restaurar", "Copias disponibles:\n%s\n\nEscribe una para restaurarla:" % "\n".join(snaps))
            if not choice or choice not in snaps:
                return
            src = os.path.join(bdir, choice)
            n = 0
            for fn in os.listdir(src):
                shutil.copy2(os.path.join(src, fn), os.path.join(sdir, fn))
                n += 1
            _fill()
            self._update_status("Partidas de '%s' restauradas desde %s (%d archivo(s))." % (name, choice, n))

        def _export():
            sel = [tv.item(i, "text") for i in tv.selection()]
            if not sel:
                messagebox.showinfo("Partidas", "Selecciona archivos para exportar.")
                return
            dest = filedialog.askdirectory(title="Carpeta de destino")
            if not dest:
                return
            for fn in sel:
                shutil.copy2(os.path.join(sdir, fn), os.path.join(dest, fn))
            self._update_status("Exportadas %d partida(s) a %s" % (len(sel), dest))

        def _delete():
            sel = [tv.item(i, "text") for i in tv.selection()]
            if not sel:
                return
            if not messagebox.askyesno("Partidas", "¿Borrar %d archivo(s) de partida?" % len(sel)):
                return
            for fn in sel:
                try:
                    os.remove(os.path.join(sdir, fn))
                except OSError as e:
                    messagebox.showerror("Partidas", str(e))
            _fill()

        def _open_dir():
            subprocess.Popen(["xdg-open", sdir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        btns = ttk.Frame(win)
        btns.pack(fill="x", padx=10, pady=(0, 10))
        ttk.Button(btns, text="Copia de seguridad", command=_backup).pack(side="left")
        ttk.Button(btns, text="Restaurar", command=_restore).pack(side="left", padx=6)
        ttk.Button(btns, text="Exportar", command=_export).pack(side="left")
        ttk.Button(btns, text="Borrar", command=_delete).pack(side="left", padx=6)
        ttk.Button(btns, text="Abrir carpeta", command=_open_dir).pack(side="left")
        ttk.Button(btns, text="Cerrar", command=win.destroy).pack(side="right")
        _fill()

    def on_close(self):
        self._end_session()
        self.launcher.stop_server()
        self.root.destroy()


def main():
    if not os.path.isdir(GAMES_DIR):
        os.makedirs(GAMES_DIR, exist_ok=True)
    app = App()
    app.root.mainloop()


if __name__ == "__main__":
    main()