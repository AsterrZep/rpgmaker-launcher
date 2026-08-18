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
import datetime
import json
import os
import time as _time

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import Gtk, Gdk, WebKit2, GLib


def make_settings(console_to_stdout=False):
    settings = WebKit2.Settings()
    settings.set_enable_developer_extras(False)
    settings.set_media_playback_requires_user_gesture(False)
    settings.set_enable_webgl(True)
    settings.set_allow_file_access_from_file_urls(False)
    # Rendimiento: aceleración WebGL y caché agresiva para no re-bajar assets
    settings.set_enable_smooth_scrolling(True)
    # Los mensajes de consola JS solo se escriben si se piden explícitamente
    # (con --log-console): si un juego loguea mucho, escribirlos a fichero
    # en cada frame provoca tirones.
    settings.set_enable_write_console_messages_to_stdout(console_to_stdout)
    try:
        ctx = WebKit2.WebContext.get_default()
        ctx.set_cache_model(WebKit2.CacheModel.DOCUMENT_VIEWER)
    except Exception:
        pass
    return settings


FPS_OVERLAY_JS = (
    "(function(){"
    "if(window.__rpg_fps_overlay_installed__)return;"
    "window.__rpg_fps_overlay_installed__=true;"
    "var d=document.createElement('div');"
    "d.id='rpg-fps-overlay';"
    "d.style.cssText='position:fixed;z-index:99999;top:6px;left:8px;font:12px monospace;" +
    "color:#fff;background:rgba(0,0,0,0.55);padding:3px 8px;border-radius:6px;" +
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


def make_webview(url, capture=False, console_to_stdout=False):
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


def run_viewer(args):
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

    def zoom(delta):
        try:
            view.set_zoom_level(view.get_zoom_level() + delta)
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
        "zoom_0": lambda: view.set_zoom_level(1.0),
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
        data_dir = os.path.expanduser(os.environ.get("RPGMAKER_DATA_DIR", ""))
        base_dir = os.path.dirname(os.path.abspath(__file__))
        shots = os.path.join(data_dir if data_dir else base_dir, "screenshots")
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


# ---------- configuración ----------
def _config_module():
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "rpgmaker_config", os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                        "rpgmaker-config.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------- modo diagnóstico ----------
def test_js():
    return (
        "(function(){"
        "var err=document.getElementById('errorPrinter');"
        "var spin=document.getElementById('loadingSpinner');"
        "var scene='none';"
        "if(typeof SceneManager!=='undefined'&&SceneManager&&SceneManager._scene){"
        "  try{scene=SceneManager._scene.constructor.name}catch(e){scene='unknown'}"
        "}"
        # métricas de rendimiento (recursos + carga del documento)
        "var perf={resources:0,bytes:0,fetchMs:0,maxFetchMs:0,slowest:'',domContentLoadedMs:0,loadMs:0,state:document.readyState};"
        "try{"
        "  var t=performance.timing;"
        "  if(t){perf.domContentLoadedMs=t.domContentLoadedEventEnd-t.navigationStart;"
        "        perf.loadMs=t.loadEventEnd-t.navigationStart;}"
        "  var pe=performance.getEntriesByType('resource');"
        "  perf.resources=pe.length;"
        "  for(var i=0;i<pe.length;i++){var r=pe[i];"
        "    var d=r.responseEnd-r.fetchStart;"
        "    perf.fetchMs+=d;"
        "    if(d>perf.maxFetchMs){perf.maxFetchMs=d;perf.slowest=(r.name||'').split('/').slice(-2).join('/');}"
        "    perf.bytes+=(r.transferSize||0);}"
        "}catch(e){}"
        "var fps={samples:0,avgMs:0,p50Ms:0,minMs:0};"
        "try{"
        "  var s=window.__rpgl_fps__&&window.__rpgl_fps__.samples||[];"
        "  fps.samples=s.length;"
        "  if(s.length){var sum=0,ss=s.slice().sort(function(a,b){return a-b});"
        "    for(var j=0;j<s.length;j++)sum+=s[j];"
        "    fps.avgMs=Math.round(sum/s.length*10)/10;"
        "    fps.p50Ms=ss[Math.floor(ss.length/2)];"
        "    fps.minMs=ss[0];}"
        "}catch(e){}"
        # coste por frame del bucle del juego (SceneManager.update)
        "var upd={samples:0,avgMs:0,maxMs:0};"
        "try{"
        "  if(typeof SceneManager!=='undefined'&&SceneManager.update&&!SceneManager.__rpgl_patched__){"
        "    var __o=SceneManager.update,__st={sum:0,n:0,mx:0};"
        "    SceneManager.update=function(){"
        "      var __s=performance.now();"
        "      try{__o.apply(this,arguments);}catch(e){throw e}"
        "      finally{var __d=performance.now()-__s;__st.sum+=__d;__st.n++;if(__d>__st.mx)__st.mx=__d;}"
        "    };"
        "    SceneManager.__rpgl_patched__=true;window.__rpgl_upd__=__st;"
        "  }"
        "  var u=window.__rpgl_upd__;"
        "  if(u&&u.n){upd.samples=u.n;upd.avgMs=Math.round(u.sum/u.n*100)/100;upd.maxMs=Math.round(u.mx*100)/100;}"
        "}catch(e){}"
        "document.title='__RPGML__'+JSON.stringify({"
        "  title:window.__rpgl_orig_title__||'',"
        "  engine:(typeof SceneManager!=='undefined'?'MZ':'other'),"
        "  scene:scene,"
        "  errorPrinter:!!err,"
        "  errorText:err?err.textContent:null,"
        "  errorHtml:err?err.innerHTML:null,"
        "  spinnerVisible:!!spin,"
        "  errors:(window.__rpgl_errors__||[]),"
        "  perf:perf,fps:fps,upd:upd,"
        "  fpsDebug:(typeof window.__rpgl_fps__!=='undefined')"
        "    ? (window.__rpgl_fps__.samples.length+'/'+window.__rpgl_fps__.last+'/inst:'+(window.__rpgl_fps_installed__?1:0)+'/raf:'+typeof window.requestAnimationFrame) : 'undefined'"
        "});"
        "})();"
    )


def _sample_loop(view, wait, done, started):
    def check():
        t = view.get_title() or ""
        if t.startswith("__RPGML__"):
            payload = t[len("__RPGML__"):]
            try:
                data = json.loads(payload)
            except ValueError:
                print("RESULTADO_NO_PARSED: " + payload)
                Gtk.main_quit()
                return False
            if done(data):
                data["t_escena_s"] = round(_time.time() - started, 1)
                print(json.dumps(data, ensure_ascii=False))
                Gtk.main_quit()
        return False

    def poll():
        try:
            view.run_javascript(test_js(), None, None, None, None)
        except Exception as e:
            print(json.dumps({"error": "run_javascript: %s" % e}))
            Gtk.main_quit()
            return False
        GLib.timeout_add(400, check)
        return True  # volver a muestrear dentro de 1 s

    def force_quit():
        print(json.dumps({"error": "timeout sin resultado"}))
        Gtk.main_quit()
        return False

    GLib.timeout_add_seconds(1, poll)
    GLib.timeout_add_seconds(wait + 5, force_quit)
    Gtk.main()


def run_test(args):
    started = _time.time()
    win = Gtk.Window(title="diagnóstico")
    view = make_webview(args.url, capture=True, console_to_stdout=True)
    win.add(view)
    win.show_all()
    win.connect("destroy", Gtk.main_quit)

    def done(data):
        # informar al llegar a una escena, o si hay un error real
        return data["scene"] != "none" or data["errorText"] or data["errors"]

    _sample_loop(view, args.wait, done, started)


def run_bench(args):
    started = _time.time()
    win = Gtk.Window(title="bench")
    view = make_webview(args.url, capture=True, console_to_stdout=True)
    win.add(view)
    win.show_all()
    win.connect("destroy", Gtk.main_quit)

    def done(data):
        # esperar hasta la pantalla de título (u otra escena distinta del arranque)
        s = data["scene"]
        return s == "Scene_Title" or (s != "none" and s != "Scene_Boot") or data["errorText"] or data["errors"]

    _sample_loop(view, args.wait, done, started)


def main():
    ap = argparse.ArgumentParser(description="Visor WebKit ligero para juegos RPG Maker (MZ/MV)")
    ap.add_argument("--url", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--fullscreen", action="store_true")
    ap.add_argument("--test", action="store_true",
                    help="modo diagnóstico: carga la página, evalúa el estado y sale")
    ap.add_argument("--bench", action="store_true",
                    help="modo benchmark: como --test pero espera a la escena de título y "
                         "reporta métricas de rendimiento (recursos, fetch, FPS)")
    ap.add_argument("--wait", type=int, default=12)
    ap.add_argument("--log-console", action="store_true",
                    help="escribir los mensajes de consola JS por stdout (puede ralentizar juegos que loguean mucho)")
    args = ap.parse_args()

    if args.bench:
        run_bench(args)
    elif args.test:
        run_test(args)
    else:
        run_viewer(args)


if __name__ == "__main__":
    main()