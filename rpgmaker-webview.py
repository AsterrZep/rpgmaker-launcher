#!/usr/bin/env python3
# ============================================================
#  RPG Maker WebKit Viewer - visor ligero para juegos web (MZ/MV)
#
#  Alternativa a abrir el navegador completo: usa WebKitGTK,
#  consume menos memoria y arranca más rápido. Los mensajes de
#  consola JavaScript se escriben en la salida estándar, de modo
#  que el lanzador puede guardarlos en un log para diagnóstico.
#
#  Uso:
#    rpgmaker-webview.py --url URL [--title TITULO]
#                          [--fullscreen]
#    rpgmaker-webview.py --url URL --test [--wait SEGUNDOS]
#                          (modo diagnóstico: evalúa el estado del
#                           juego, imprime el resultado y sale)
# ============================================================
import argparse
import json
import sys

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import Gtk, Gdk, WebKit2, GLib


def make_settings():
    settings = WebKit2.Settings()
    settings.set_enable_developer_extras(False)
    settings.set_media_playback_requires_user_gesture(False)
    settings.set_enable_webgl(True)
    settings.set_allow_file_access_from_file_urls(False)
    # Los errores de consola JS salen por stdout -> el lanzador los guarda
    settings.set_enable_write_console_messages_to_stdout(True)
    return settings


CAPTURE_JS = (
    "window.__rpgl_errors__=[];"
    "window.addEventListener('error',function(e){"
    "  try{window.__rpgl_errors__.push({"
    "    message:e.message||String(e.error||''),"
    "    file:(e.filename||'').split('/').pop(),"
    "    line:e.lineno||0,"
    "    target:(e.target&&(e.target.src||e.target.id||e.target.tagName))||'window',"
    "    stack:(e.error&&e.error.stack)?e.error.stack.split('\\n').slice(0,4).join(' | '):''"
    "  });}catch(_){}} ,true);"
    "window.addEventListener('unhandledrejection',function(e){"
    "  try{window.__rpgl_errors__.push({"
    "    message:'UNHANDLED REJECTION: '+String((e.reason&&e.reason.message)||e.reason),"
    "    file:'promise',line:0,target:'rejection',"
    "    stack:(e.reason&&e.reason.stack)?e.reason.stack.split('\\n').slice(0,4).join(' | '):''"
    "  });}catch(_){}} ,true);"
)


def make_webview(url, capture=True):
    view = WebKit2.WebView.new_with_settings(make_settings())
    if capture:
        manager = WebKit2.UserContentManager()
        script = WebKit2.UserScript.new(
            CAPTURE_JS, WebKit2.UserContentInjectedFrames.TOP_FRAME,
            WebKit2.UserScriptInjectionTime.START, [], [])
        manager.add_script(script)
        view = WebKit2.WebView.new_with_user_content_manager(manager)
        view.set_settings(make_settings())
    view.load_uri(url)
    return view


def run_viewer(args):
    win = Gtk.Window(title=args.title or "RPG Maker (WebKit)")
    win.set_default_size(960, 600)
    view = make_webview(args.url)
    win.add(view)

    win.connect("destroy", Gtk.main_quit)

    def zoom(delta):
        try:
            view.set_zoom_level(view.get_zoom_level() + delta)
        except Exception:
            pass

    def on_key(_, event):
        if event.type != Gdk.EventType.KEY_PRESS:
            return False
        ctrl = event.state & Gdk.ModifierType.CONTROL_MASK
        if ctrl and event.keyval in (Gdk.KEY_plus, Gdk.KEY_equal):
            zoom(0.15)
            return True
        if ctrl and event.keyval in (Gdk.KEY_minus, Gdk.KEY_underscore):
            zoom(-0.15)
            return True
        if ctrl and event.keyval == Gdk.KEY_0:
            view.set_zoom_level(1.0)
            return True
        if event.keyval == Gdk.KEY_F11:
            state = win.get_window().get_state() if win.get_window() else 0
            if state & Gdk.WindowState.FULLSCREEN:
                win.unfullscreen()
            else:
                win.fullscreen()
            return True
        if event.keyval == Gdk.KEY_Escape:
            win.unfullscreen()
            return True
        if event.keyval == Gdk.KEY_F5:
            view.reload()
            return True
        return False

    win.connect("key-press-event", on_key)
    if args.fullscreen:
        win.fullscreen()
    win.show_all()
    Gtk.main()


# ---------- modo diagnóstico ----------
def test_js():
    return (
        "(function(){"
        "var err=document.getElementById('errorPrinter');"
        "var spin=document.getElementById('loadingSpinner');"
        "var scene='none';"
        "if(typeof SceneManager!=='undefined'&&SceneManager._scene){"
        "  try{scene=SceneManager._scene.constructor.name}catch(e){scene='unknown'}"
        "}"
        "document.title='__RPGML__'+JSON.stringify({"
        "  title:document.title.replace('__RPGML__',''),"
        "  engine:(typeof SceneManager!=='undefined'?'MZ':'other'),"
        "  scene:scene,"
        "  errorPrinter:!!err,"
        "  errorText:err?err.textContent:null,"
        "  errorHtml:err?err.innerHTML:null,"
        "  spinnerVisible:!!spin,"
        "  errors:(window.__rpgl_errors__||[])"
        "});"
        "})();"
    )


def run_test(args):
    win = Gtk.Window(title="diagnóstico")
    view = make_webview(args.url)
    win.add(view)
    win.show_all()
    win.connect("destroy", Gtk.main_quit)

    def read_title():
        t = view.get_title() or ""
        if t.startswith("__RPGML__"):
            payload = t[len("__RPGML__"):]
            try:
                print(json.dumps(json.loads(payload), ensure_ascii=False))
            except ValueError:
                print("RESULTADO_NO_PARSED: " + payload)
            Gtk.main_quit()
            return False
        return True  # reintentar

    def do_check():
        try:
            view.run_javascript(test_js(), None, None, None, None)
        except Exception as e:
            print(json.dumps({"error": "run_javascript: %s" % e}))
            Gtk.main_quit()
            return False
        GLib.timeout_add(400, read_title)
        return False

    def force_quit():
        print(json.dumps({"error": "timeout sin resultado"}))
        Gtk.main_quit()
        return False

    GLib.timeout_add_seconds(args.wait, do_check)
    GLib.timeout_add_seconds(args.wait + 5, force_quit)
    Gtk.main()


def main():
    ap = argparse.ArgumentParser(description="Visor WebKit ligero para juegos RPG Maker (MZ/MV)")
    ap.add_argument("--url", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--fullscreen", action="store_true")
    ap.add_argument("--test", action="store_true",
                    help="modo diagnóstico: carga la página, evalúa el estado y sale")
    ap.add_argument("--wait", type=int, default=12)
    args = ap.parse_args()

    if args.test:
        run_test(args)
    else:
        run_viewer(args)


if __name__ == "__main__":
    main()