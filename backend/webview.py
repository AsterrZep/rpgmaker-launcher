#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Visor WebKit Ligero
# ============================================================
# Alternativa a abrir el navegador completo: usa WebKitGTK,
# consume menos memoria y arranca más rápido. Los mensajes de
# consola JavaScript se escriben en la salida estándar, de modo
# que el lanzador puede guardarlos en un log para diagnóstico.
# ============================================================
import argparse
import datetime
import json
import os
import time as _time

from .utils import DATA_DIR, log


def make_settings(console_to_stdout=False):
    """Configura las opciones de WebKit."""
    import gi
    gi.require_version("Gtk", "3.0")
    gi.require_version("WebKit2", "4.1")
    from gi.repository import WebKit2
    
    settings = WebKit2.Settings()
    settings.set_enable_developer_extras(False)
    settings.set_media_playback_requires_user_gesture(False)
    settings.set_enable_webgl(True)
    settings.set_allow_file_access_from_file_urls(False)
    settings.set_enable_smooth_scrolling(True)
    settings.set_enable_write_console_messages_to_stdout(console_to_stdout)
    
    try:
        ctx = WebKit2.WebContext.get_default()
        ctx.set_cache_model(WebKit2.CacheModel.DOCUMENT_VIEWER)
    except Exception:
        pass
    
    return settings


# JavaScript para overlay de FPS
FPS_OVERLAY_JS = (
    "(function(){"
    "if(window.__rpg_fps_overlay_installed__)return;"
    "window.__rpg_fps_overlay_installed__=true;"
    "var d=document.createElement('div');"
    "d.id='rpg-fps-overlay';"
    "d.style.cssText='position:fixed;z-index:99999;top:6px;left:8px;font:12px monospace;"
    "color:#fff;background:rgba(0,0,0,0.55);padding:3px 8px;border-radius:6px;"
    "display:none;pointer-events:none;';"
    "document.documentElement.appendChild(d);"
    "var frames=0,last=performance.now?performance.now():Date.now();"
    "window.__rpg_toggle_fps__=function(){"
    "  d.style.display=(d.style.display==='none')?'block':'none';"
    "};"
    "function loop(t){"
    "  frames++;"
    "  if(t-last>=500){"
    "    var fps=Math.round(frames*1000/(t-last));"
    "    d.textContent=fps+' FPS';frames=0;last=t;"
    "  }"
    "  requestAnimationFrame(loop);"
    "}"
    "requestAnimationFrame(loop);"
    "})();"
)

# JavaScript para captura y diagnóstico
CAPTURE_JS = (
    "window.__rpgl_orig_title__=document.title;"
    "window.__rpgl_errors__=[];"
    "window.__rpgl_fps__={samples:[],last:0,ok:false};"
    "if(!window.__rpgl_fps_installed__){window.__rpgl_fps_installed__=true;"
    "  window.__rpgl_fps_tick__=function(){"
    "    var n=(typeof performance!=='undefined')?performance.now():Date.now();"
    "    if(window.__rpgl_fps__.last){"
    "      var d=n-window.__rpgl_fps__.last;"
    "      if(d>4&&d<500){window.__rpgl_fps__.samples.push(d);"
    "        if(window.__rpgl_fps__.samples.length>300)window.__rpgl_fps__.samples.shift();}"
    "    }"
    "    window.__rpgl_fps__.last=n;requestAnimationFrame(window.__rpgl_fps_tick__);"
    "  };requestAnimationFrame(window.__rpgl_fps_tick__);}"
    "window.addEventListener('error',function(e){"
    "  try{window.__rpgl_errors__({"
    "    message:e.message||String(e.error||''),"
    "    file:(e.filename||'').split('/').pop(),"
    "    line:e.lineno||0,"
    "    target:(e.target&&(e.target.src||e.target.id||e.target.tagName))||'window',"
    "    stack:(e.error&&e.error.stack)?e.error.stack.split('\\n').slice(0,4).join(' | '):''"
    "  });}catch(_){}} ,true);"
    "window.addEventListener('unhandledrejection',function(e){"
    "  try{window.__rpgl_errors__({"
    "    message:'UNHANDLED REJECTION: '+String((e.reason&&e.reason.message)||e.reason),"
    "    file:'promise',line:0,target:'rejection',"
    "    stack:(e.reason&&e.reason.stack)?e.reason.stack.split('\\n').slice(0,4).join(' | '):''"
    "  });}catch(_){}} ,true);"
)


def make_webview(url, capture=False, console_to_stdout=False):
    """Crea una ventana WebKit con scripts inyectados."""
    import gi
    gi.require_version("Gtk", "3.0")
    gi.require_version("WebKit2", "4.1")
    from gi.repository import WebKit2
    
    manager = WebKit2.UserContentManager()
    manager.add_script(WebKit2.UserScript.new(
        "window.__rpg_webkit__ = true;",
        WebKit2.UserContentInjectedFrames.TOP_FRAME,
        WebKit2.UserScriptInjectionTime.START, [], []))
    manager.add_script(WebKit2.UserScript.new(
        FPS_OVERLAY_JS, WebKit2.UserContentInjectedFrames.TOP_FRAME,
        WebKit2.UserScriptInjectionTime.START, [], []))
    if capture:
        manager.add_script(WebKit2.UserScript.new(
            CAPTURE_JS, WebKit2.UserContentInjectedFrames.TOP_FRAME,
            WebKit2.UserScriptInjectionTime.START, [], []))
    
    view = WebKit2.WebView.new_with_user_content_manager(manager)
    view.set_settings(make_settings(console_to_stdout))
    view.load_uri(url)
    return view


def _config_module():
    """Carga el módulo de configuración."""
    from . import config
    return config


def run_viewer(args):
    """Ejecuta el visor WebKit."""
    import gi
    gi.require_version("Gtk", "3.0")
    gi.require_version("WebKit2", "4.1")
    from gi.repository import Gtk, Gdk, WebKit2
    
    cfgmod = _config_module()
    cfg = cfgmod.load_config()
    teclas = cfg.get("teclas", {})
    keymap = {}
    for action, _ in cfgmod.KEY_ACTIONS:
        keymap[action] = cfgmod.parse_key(teclas.get(action, ""))

    win = Gtk.Window(title=args.title or "RPG Maker (WebKit)")
    win.set_default_size(960, 600)
    view = make_webview(args.url, capture=False, console_to_stdout=args.log_console)
    win.add(view)

    win.connect("destroy", Gtk.main_quit)

    def _save_zoom():
        if not getattr(args, "zoom_save", None):
            return
        try:
            d = os.path.dirname(args.zoom_save)
            if d:
                os.makedirs(d, exist_ok=True)
            tmp = args.zoom_save + ".tmp"
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump({"zoom": view.get_zoom_level()}, fh)
            os.replace(tmp, args.zoom_save)
        except Exception:
            pass

    win.connect("destroy", lambda *_: _save_zoom())

    if args.zoom:
        try:
            view.set_zoom_level(max(0.2, min(5.0, float(args.zoom))))
        except Exception:
            pass

    def zoom(delta):
        try:
            view.set_zoom_level(view.get_zoom_level() + delta)
            _save_zoom()
        except Exception:
            pass

    def toggle_fullscreen():
        state = win.get_window().get_state() if win.get_window() else 0
        if state & Gdk.WindowState.FULLSCREEN:
            win.unfullscreen()
        else:
            win.fullscreen()

    def toggle_fps():
        try:
            view.run_javascript("window.__rpg_toggle_fps__&&window.__rpg_toggle_fps__()")
        except Exception:
            pass

    handlers = {
        "zoom_in": lambda: zoom(0.15),
        "zoom_out": lambda: zoom(-0.15),
        "zoom_0": lambda: (view.set_zoom_level(1.0), _save_zoom()),
        "pantalla_completa": toggle_fullscreen,
        "salir_pantalla_completa": lambda: win.unfullscreen(),
        "recargar": lambda: view.reload(),
        "fps": toggle_fps,
        "captura": lambda: take_screenshot(),
    }

    def on_key(_, event):
        if event.type != Gdk.EventType.KEY_PRESS:
            return False
        state = event.state & (Gdk.ModifierType.CONTROL_MASK
                               | Gdk.ModifierType.SHIFT_MASK
                               | Gdk.ModifierType.MOD1_MASK)
        for action, handler in handlers.items():
            kv, mods = keymap.get(action, (0, 0))
            if kv and event.keyval == kv and state == mods:
                try:
                    handler()
                except Exception:
                    pass
                return True
        return False

    def take_screenshot():
        shots = os.path.join(DATA_DIR, "screenshots")
        os.makedirs(shots, exist_ok=True)
        stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        base = (args.title or "juego").replace("/", "_").replace(" ", "_")[:40]
        path = os.path.join(shots, "%s-%s.png" % (base, stamp))

        def done(view_, res, p):
            try:
                pixbuf = view_.get_snapshot_finish(res)
                if pixbuf:
                    pixbuf.savev(p, "png", [], [])
                    print("Captura guardada: %s" % p)
                else:
                    print("Captura vacía (¿pantalla oculta?)")
            except Exception as e:
                print("Error al capturar: %s" % e)

        try:
            view.get_snapshot(WebKit2.SnapshotRegion.VISIBLE, None, done, path)
        except Exception as e:
            print("No se pudo capturar: %s" % e)

    win.connect("key-press-event", on_key)
    if args.fullscreen:
        win.fullscreen()
    win.show_all()
    Gtk.main()


# ---------- CLI ----------
def main():
    ap = argparse.ArgumentParser(description="Visor WebKit ligero para juegos RPG Maker (MZ/MV)")
    ap.add_argument("--url", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--fullscreen", action="store_true")
    ap.add_argument("--zoom", type=float, default=None)
    ap.add_argument("--zoom-save", default=None)
    ap.add_argument("--test", action="store_true")
    ap.add_argument("--bench", action="store_true")
    ap.add_argument("--wait", type=int, default=12)
    ap.add_argument("--log-console", action="store_true")
    args = ap.parse_args()
    
    run_viewer(args)


if __name__ == "__main__":
    main()
