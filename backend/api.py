#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - API REST + SSE para Frontend
# ============================================================
# Expone la API REST + Server-Sent Events para el frontend
# Tauri (o navegador). Este es el punto de entrada principal
# del backend Python.
# ============================================================
import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from . import config
from . import decrypter
from . import plugins
from . import saveedit
from . import sync
from .utils import (
    BASE_DIR, DATA_DIR, BACKUPS_DIR, RUN_DIR, STATE_FILE,
    log, safe_log_name, load_state, save_state, free_port, stable_port
)

# ---------- Configuración ----------
DEFAULT_GAMES_DIR = os.path.join(DATA_DIR, "games")
MKXPZ = os.path.join(RUN_DIR, "mkxp-z")
EASYRPG = "easyrpg-player"
MAX_DEPTH = 5
MARKER = ".extracted"
APP_VERSION = "0.9.2"
REPO_LATEST_API = "https://api.github.com/repos/AsterrZep/rpgmaker-launcher/releases/latest"
REPO_RELEASES_URL = "https://github.com/AsterrZep/rpgmaker-launcher/releases"
SHIM_FILE = os.path.join(BASE_DIR, "win32-shim.rb")
NATIVE_RGSS_ENGINES = {"VXAce", "VX", "XP"}

# ---------- Etiquetas de motores ----------
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


# ---------- Event Bus (SSE) ----------
class EventBus:
    def __init__(self):
        self._lock = threading.Lock()
        self._clients = []

    def register(self, wfile):
        with self._lock:
            self._clients.append(wfile)

    def unregister(self, wfile):
        with self._lock:
            if wfile in self._clients:
                self._clients.remove(wfile)

    def broadcast(self, event_type, data):
        msg = f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")
        with self._lock:
            dead = []
            for wfile in self._clients:
                try:
                    wfile.write(msg)
                    wfile.flush()
                except Exception:
                    dead.append(wfile)
            for d in dead:
                if d in self._clients:
                    self._clients.remove(d)


EVENT_BUS = EventBus()


# ---------- Plantilla de mods ----------
MOD_TEMPLATE = """// ============================================================
//  Mod de ejemplo para RPG Maker Launcher
//
//  Todos los .js de esta carpeta se inyectan automaticamente en
//  el juego al arrancar (despues de los scripts base y antes de
//  que empiece la partida). Borra o renombra este archivo para
//  desactivar el ejemplo.
//
//  Ideas:
//   - Parchear prototipos del motor (rmmz_objects.js, etc.)
//   - Atajos propios con document.addEventListener("keydown", ...)
//   - HUDs personalizados, autoguardado extra, estadisticas...
// ============================================================

(function () {
    "use strict";

    // Ejemplo 1: F10 alterna pantalla completa
    document.addEventListener("keydown", function (ev) {
        if (ev.key === "F10") {
            ev.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
    });

    // Ejemplo 2: log en consola cuando el juego esta listo
    var timer = setInterval(function () {
        if (typeof window.$gameParty !== "undefined" && window.$gameParty) {
            clearInterval(timer);
            console.log("[mod ejemplo] juego cargado; oro:", window.$gameParty._gold);
        }
    }, 700);
})();
"""


# ---------- Utilidades de detección ----------
def first_find(root, name):
    """Busca un archivo por nombre en el árbol del directorio."""
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
    """Busca archivos por patrón glob."""
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
    """Busca un directorio por nombre."""
    for dirpath, dirnames, filenames in os.walk(root):
        depth = dirpath[len(root):].count(os.sep)
        if depth >= MAX_DEPTH:
            dirnames[:] = []
            continue
        dirnames.sort()
        if name in dirnames:
            return os.path.join(dirpath, name)
    return None


def _renpy_lib_ok(rdir):
    """Verifica que Ren'Py tenga las librerías necesarias."""
    for d in ("linux-x86_64", "linux-i686", "py2-linux-x86_64", "py2-linux-i686"):
        if os.path.isdir(os.path.join(rdir, "lib", d)):
            return True
    return False


def renpy_launcher_sh(root):
    """Busca el script .sh de lanzamiento de Ren'Py."""
    py = find_glob(root, "*.py")
    if py:
        candidate = os.path.splitext(py)[0] + ".sh"
        if os.path.isfile(candidate):
            return candidate
    
    for f in sorted(os.listdir(root)):
        if f.endswith(".sh") and os.path.isfile(os.path.join(root, f)):
            return os.path.join(root, f)
    
    return None


_DETECT_CACHE = {}

def detect_engine(top):
    """Detecta el motor de un juego RPG Maker."""
    key = os.path.abspath(top)
    now = time.time()
    cached = _DETECT_CACHE.get(key)
    if cached and (now - cached[0]) < 60:
        return cached[1], cached[2]
    
    root, engine = _detect_engine_uncached(top)
    _DETECT_CACHE[key] = (now, root, engine)
    return root, engine


def _detect_engine_uncached(top):
    """Detecta el motor sin usar caché."""
    # MV/MZ/Web
    f = first_find(top, "index.html")
    if f:
        root = os.path.dirname(f)
        if os.path.isfile(os.path.join(root, "js", "rmmz_core.js")):
            return root, "MZ"
        if os.path.isfile(os.path.join(root, "js", "rpg_core.js")):
            return root, "MV"
        return root, "web"

    # VX Ace, VX, XP
    for file, eng in (("Game.rgss3a", "VXAce"), ("Game.rgss2a", "VX"), ("Game.rgssad", "XP")):
        f = first_find(top, file)
        if f:
            return os.path.dirname(f), eng

    # RPG Maker 2000/2003
    for pat in ("RPG_RT.exe", "RPG_RT.ini"):
        f = first_find(top, pat)
        if f:
            return os.path.dirname(f), "2000-2003"
    
    f = find_glob(top, "*.lmt")
    if f:
        return os.path.dirname(f), "2000-2003"

    # Ren'Py
    f = find_glob(top, "*.py")
    if f:
        rdir = os.path.dirname(f)
        if all(os.path.isdir(os.path.join(rdir, d)) for d in ("renpy", "game")) and _renpy_lib_ok(rdir):
            return rdir, "renpy"

    # VX Ace/VX/XP (archivos de scripts)
    for file, eng in (("Scripts.rvdata2", "VXAce"), ("Scripts.rvdata", "VX"), ("Scripts.rxdata", "XP")):
        f = first_find(top, file)
        if f:
            return os.path.dirname(f), eng

    # Incompletos
    if first_find(top, "System.json") or first_find(top, "Map001.json"):
        return top, "incomplete"
    if find_dir(top, "renpy"):
        return top, "renpy-incomplete"
    
    return None, None


def find_cover(game_top, root):
    """Busca la imagen de portada de un juego."""
    for cand in (
        os.path.join(game_top, "cover.png"),
        os.path.join(game_top, "cover.jpg"),
        os.path.join(game_top, "cover.webp"),
        os.path.join(root, "icon", "icon.png"),
        os.path.join(root, "pictures", "title.png"),
        os.path.join(root, "system", "Title.png"),
        os.path.join(root, "system", "title.png"),
        os.path.join(root, "game", "gui", "main_menu.png"),
        os.path.join(root, "game", "gui", "game_menu.png"),
    ):
        if os.path.isfile(cand):
            return cand
    
    # Capturas automáticas de Ren'Py
    shots = sorted(glob.glob(os.path.join(root, "screenshot*.png")))
    if shots:
        return shots[0]
    
    return None


def version_newer(tag, current):
    """Compara versiones semánticas."""
    def nums(s):
        return tuple(int(p) for p in s.lstrip("v").split(".") if p.isdigit())
    try:
        return nums(tag) > nums(current)
    except Exception:
        return False


def open_target(target):
    """Abre una carpeta o URL."""
    if target.startswith("http://") or target.startswith("https://"):
        subprocess.Popen(["xdg-open", target],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    
    real = os.path.realpath(target)
    allowed_roots = [os.path.realpath(DATA_DIR), os.path.realpath(BASE_DIR)]
    if not any(real == r or real.startswith(r + os.sep) for r in allowed_roots):
        raise PermissionError("Ruta fuera del directorio de datos")
    if not os.path.isdir(real):
        raise FileNotFoundError("La carpeta no existe")
    
    subprocess.Popen(["xdg-open", real],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return True


# ---------- Gestión de juegos ----------
def get_all_games(cfg=None):
    """Obtiene la lista de todos los juegos instalados."""
    if cfg is None:
        cfg = config.load_config()
    
    games_dir = config.get_games_dir(cfg)
    os.makedirs(games_dir, exist_ok=True)
    state = load_state().get("games", {})
    games = []
    
    if os.path.isdir(games_dir):
        for name in sorted(os.listdir(games_dir)):
            game_top = os.path.join(games_dir, name)
            if not os.path.isdir(game_top):
                continue
            
            root, engine = detect_engine(game_top)
            if not engine:
                continue
            
            st_data = state.get(name, {})
            cover_file = find_cover(game_top, root) if root else None
            
            # Check if saves exist
            saves_dir = os.path.join(root if root else game_top, "save")
            has_saves = (os.path.isdir(saves_dir) and 
                        len(os.listdir(saves_dir)) > 0 if os.path.isdir(saves_dir) else False)

            games.append({
                "name": name,
                "path": root or game_top,
                "engine": engine,
                "engine_label": ENGINE_LABEL.get(engine, engine),
                "is_web": engine in ("MZ", "MV", "web"),
                "is_incomplete": engine in ("incomplete", "renpy-incomplete"),
                "has_cover": bool(cover_file),
                "cover_url": f"/api/covers/{urllib.parse.quote(name)}" if cover_file else None,
                "favorite": st_data.get("favorite", False),
                "seconds": st_data.get("seconds", 0),
                "last_played": st_data.get("last_played", None),
                "has_saves": has_saves,
            })

    # Sort: Favorites first, then last played, then alphabetically
    def sort_key(g):
        if g["is_incomplete"]:
            return (2, 0, g["name"].lower())
        fav = 0 if g["favorite"] else 1
        lp = -(g["last_played"] or 0)
        return (0, fav, lp, g["name"].lower())

    games.sort(key=sort_key)
    return games


def _extract_zip(zip_path, target):
    """Extrae un archivo ZIP."""
    if shutil.which("unzip"):
        return subprocess.run(["unzip", "-o", "-q", zip_path, "-d", target]).returncode
    
    try:
        import zipfile
        with zipfile.ZipFile(zip_path) as zf:
            zf.extractall(target)
            for info in zf.infolist():
                perm = info.external_attr >> 16
                if perm and not info.is_dir():
                    path = os.path.join(target, info.filename)
                    if os.path.isfile(path):
                        os.chmod(path, perm)
        return 0
    except Exception:
        return 1


def zip_game_name(zip_path):
    """Obtiene el nombre del juego desde un archivo ZIP."""
    name = os.path.basename(zip_path)
    while name.lower().endswith(".zip"):
        name = name[:-4]
    return name or "juego"


def extract_zips_api(auto_delete=False, cfg=None):
    """Extrae todos los ZIPs pendientes en la carpeta de juegos."""
    if cfg is None:
        cfg = config.load_config()
    
    games_dir = config.get_games_dir(cfg)
    done, errors = [], []
    zip_files = sorted(glob.glob(os.path.join(games_dir, "*.zip")))
    total = len(zip_files)
    
    for idx, z in enumerate(zip_files):
        name = zip_game_name(z)
        target = os.path.join(games_dir, name)
        marker = os.path.join(target, MARKER)
        
        if os.path.isfile(marker):
            continue
        
        EVENT_BUS.broadcast("extraction_progress", {
            "current": idx + 1,
            "total": total,
            "filename": os.path.basename(z),
            "game": name,
        })

        os.makedirs(target, exist_ok=True)
        if _extract_zip(z, target) == 0:
            with open(marker, "w") as fh:
                fh.write("ok\n")
            done.append(name)
            _DETECT_CACHE.pop(os.path.abspath(target), None)
            if auto_delete:
                try:
                    os.remove(z)
                except OSError as e:
                    errors.append(f"No se pudo borrar {os.path.basename(z)}: {e}")
        else:
            errors.append(name)
            
    EVENT_BUS.broadcast("extraction_complete", {"done": done, "errors": errors})
    log("extract: done=%s errors=%s" % (done, errors))
    return done, errors


def install_zip_paths(paths, auto_delete=False, cfg=None):
    """Copia y extrae ZIPs desde rutas locales."""
    if cfg is None:
        cfg = config.load_config()
    
    games_dir = config.get_games_dir(cfg)
    copied, skipped = [], []
    log("install: paths=%s auto_delete=%s games_dir=%s" % (paths, auto_delete, games_dir))
    
    for p in paths or []:
        try:
            if not os.path.isfile(p) or not p.lower().endswith(".zip"):
                raise ValueError("no es un .zip")
            dest = os.path.join(games_dir, zip_game_name(p) + ".zip")
            shutil.copy2(p, dest)
            copied.append(dest)
        except (OSError, ValueError) as e:
            skipped.append("%s: %s" % (os.path.basename(p), e))
    
    done, errors = ([], []) if not copied else extract_zips_api(auto_delete=auto_delete, cfg=cfg)
    return copied, skipped + errors, done


def find_mkxpz():
    """Localiza el runtime mkxp-z."""
    cands = []
    env_dir = os.path.expanduser(os.environ.get("RPGMAKER_RUNTIMES", ""))
    if env_dir:
        cands.append(os.path.join(env_dir, "mkxp-z"))
    
    cands += [
        os.path.join(RUN_DIR, "mkxp-z"),
        os.path.join(BASE_DIR, os.pardir, "runtimes", "mkxp-z"),
        os.path.join(DATA_DIR, "runtimes", "mkxp-z"),
    ]
    
    for c in cands:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    
    return shutil.which("mkxp-z")


def _ensure_win32_shim(root):
    """Garantiza que el juego RGSS precargue el shim Win32."""
    if not os.path.isfile(SHIM_FILE):
        log("AVISO: falta win32-shim.rb en %s" % BASE_DIR)
        return False
    
    cfg_path = os.path.join(root, "mkxp.json")
    cfg = {}
    try:
        with open(cfg_path, "r", encoding="utf-8") as fh:
            cfg = json.load(fh)
    except (OSError, ValueError):
        cfg = {}
    
    pre = [p for p in (cfg.get("preloadScript") or []) if isinstance(p, str)]
    if not any(p.endswith("win32-shim.rb") for p in pre):
        pre.append(SHIM_FILE)
        cfg["preloadScript"] = pre
        try:
            with open(cfg_path, "w", encoding="utf-8") as fh:
                json.dump(cfg, fh, indent=2)
            log("shim Win32 activado en %s" % root)
        except OSError as e:
            log("no se pudo escribir mkxp.json en %s: %s" % (root, e))
            return False
    
    return True


def zoom_file_for(name):
    """Devuelve la ruta del archivo de zoom para un juego."""
    safe = safe_log_name(name)
    os.makedirs(os.path.join(DATA_DIR, "zooms"), exist_ok=True)
    return os.path.join(DATA_DIR, "zooms", safe + ".json")


# ---------- Gestor de Sesiones ----------
class ActiveSession:
    def __init__(self):
        self.lock = threading.Lock()
        self.active_game = None
        self.active_port = None
        self.start_time = None
        self.server_proc = None
        self.viewer_proc = None

    def status(self):
        with self.lock:
            running = bool(self.server_proc and self.server_proc.poll() is None)
            return {
                "active_game": self.active_game if running else None,
                "port": self.active_port if running else None,
                "running": running,
                "start_time": self.start_time if running else None,
            }

    def stop(self):
        with self.lock:
            elapsed = 0
            if self.start_time:
                elapsed = int(time.time() - self.start_time)
            game_name = self.active_game
            
            if self.server_proc and self.server_proc.poll() is None:
                self.server_proc.terminate()
                try:
                    self.server_proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    self.server_proc.kill()
            
            if self.viewer_proc and self.viewer_proc.poll() is None:
                self.viewer_proc.terminate()
                try:
                    self.viewer_proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    self.viewer_proc.kill()
            
            self.server_proc = None
            self.viewer_proc = None
            self.active_game = None
            self.active_port = None
            self.start_time = None

            total = 0
            if game_name and elapsed > 0:
                st = load_state()
                gdata = st.setdefault("games", {}).setdefault(game_name, {})
                gdata["seconds"] = gdata.get("seconds", 0) + elapsed
                gdata["last_played"] = int(time.time())
                total = gdata["seconds"]
                save_state(st)
                
                # Auto-sync check
                cfg = config.load_config()
                sync_folder, sync_auto = config.get_sync_settings(cfg)
                games_dir = config.get_games_dir(cfg)
                if sync_auto and sync_folder:
                    saves_dir = os.path.join(games_dir, game_name, "save")
                    dest_dir = os.path.join(sync_folder, game_name, "save")
                    if os.path.isdir(saves_dir):
                        try:
                            sync.push(saves_dir, dest_dir)
                            EVENT_BUS.broadcast("sync_complete", {"game": game_name, "direction": "push"})
                        except Exception as e:
                            log("[AutoSync Error] %s" % e)

            EVENT_BUS.broadcast("server_stopped", {
                "game": game_name, 
                "seconds_added": elapsed, 
                "total_seconds": total
            })
            return game_name, elapsed, total

    def launch_web(self, name, root, webkit=False):
        """Lanza un juego web (MV/MZ)."""
        self.stop()
        port = stable_port(name)
        server_py = os.path.join(BASE_DIR, "server.py")
        
        proc = subprocess.Popen(
            [sys.executable, "-m", "backend.server", str(port), "--dir", root],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        
        with self.lock:
            self.server_proc = proc
            self.active_game = name
            self.active_port = port
            self.start_time = time.time()

        # Update last_played
        st = load_state()
        st.setdefault("games", {}).setdefault(name, {})["last_played"] = int(time.time())
        save_state(st)

        time.sleep(0.5)
        url = f"http://localhost:{port}/index.html"
        
        if webkit:
            viewer_py = os.path.join(BASE_DIR, "webview.py")
            cmd = [sys.executable, "-u", viewer_py, "--url", url, "--title", name, 
                   "--zoom-save", zoom_file_for(name)]
            vproc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            with self.lock:
                self.viewer_proc = vproc
        else:
            subprocess.Popen(["xdg-open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        EVENT_BUS.broadcast("server_started", {"game": name, "port": port, "webkit": webkit})
        return port

    def launch_native(self, name, root, engine):
        """Lanza un juego nativo (XP/VX/VX Ace/2000-2003/Ren'Py)."""
        self.stop()
        st = load_state()
        st.setdefault("games", {}).setdefault(name, {})["last_played"] = int(time.time())
        save_state(st)

        if engine == "2000-2003":
            cmd = [EASYRPG, root]
        elif engine == "renpy":
            sh = renpy_launcher_sh(root)
            if not sh:
                raise RuntimeError(f"No se encontró el lanzador .sh de Ren'Py en: {root}")
            cmd = [sh]
        else:
            mk = find_mkxpz()
            if not mk:
                raise RuntimeError(
                    "Runtime mkxp-z no encontrado (necesario para XP/VX/VX Ace). "
                    "Compílalo con install.sh o colócalo en runtimes/mkxp-z.")
            cmd = [mk]
            if engine in NATIVE_RGSS_ENGINES:
                _ensure_win32_shim(root)

        env = dict(os.environ, SRCDIR=root)
        try:
            os.makedirs(os.path.join(DATA_DIR, "logs"), exist_ok=True)
            game_log = os.path.join(DATA_DIR, "logs", safe_log_name(name) + ".log")
            gl = open(game_log, "ab")
        except OSError:
            gl = subprocess.DEVNULL
            game_log = None
        
        log("launch %s [%s]: cmd=%s cwd=%s log=%s" % (name, engine, cmd, root, game_log))
        subprocess.Popen(cmd, cwd=root, env=env, stdout=gl, stderr=gl)
        EVENT_BUS.broadcast("game_launched", {"game": name, "engine": engine})


ACTIVE_SESSION = ActiveSession()


# ---------- API Request Handler ----------
class ApiHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def _json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, message, code=400):
        self._json({"error": message, "code": code}, code=code)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. SSE Events stream
        if path == "/api/events":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            EVENT_BUS.register(self.wfile)
            try:
                while True:
                    time.sleep(15)
                    self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
            except Exception:
                EVENT_BUS.unregister(self.wfile)
            return

        # 2. Status
        if path == "/api/status":
            st = ACTIVE_SESSION.status()
            st["version"] = APP_VERSION
            self._json(st)
            return

        # 3. Games List
        if path == "/api/games":
            cfg = config.load_config()
            games = get_all_games(cfg)
            self._json({"games": games, "total": len(games)})
            return

        # 4. Cover Image
        if path.startswith("/api/covers/"):
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game_name = urllib.parse.unquote(path[len("/api/covers/"):])
            game_top = os.path.join(games_dir, game_name)
            root, _ = detect_engine(game_top)
            cover_path = find_cover(game_top, root or game_top) if os.path.isdir(game_top) else None
            if cover_path and os.path.isfile(cover_path):
                import mimetypes
                mime, _ = mimetypes.guess_type(cover_path)
                with open(cover_path, "rb") as fh:
                    img_data = fh.read()
                self.send_response(200)
                self.send_header("Content-Type", mime or "image/png")
                self.send_header("Content-Length", str(len(img_data)))
                self.send_header("Cache-Control", "public, max-age=3600")
                self.end_headers()
                self.wfile.write(img_data)
            else:
                self._error("Cover not found", 404)
            return

        # 5. Config
        if path == "/api/config":
            cfg = config.load_config()
            self._json(cfg)
            return

        # 6. Plugins
        if path == "/api/plugins":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = query.get("game", [""])[0]
            if not game:
                self._error("Missing game query param")
                return
            game_top = os.path.join(games_dir, game)
            root, _ = detect_engine(game_top)
            if not root:
                self._error("Game root not found")
                return
            try:
                p_path, analyzed, has_bak = plugins.get_plugins_status(root)
                self._json({"plugins": analyzed, "has_backup": has_bak, "path": p_path})
            except Exception as e:
                self._error(str(e))
            return

        # 7. Saves list
        if path == "/api/saves":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = query.get("game", [""])[0]
            if not game:
                self._error("Missing game query param")
                return
            game_top = os.path.join(games_dir, game)
            root, _ = detect_engine(game_top)
            saves_dir = os.path.join(root or game_top, "save")
            saves = []
            if os.path.isdir(saves_dir):
                for f in sorted(os.listdir(saves_dir)):
                    full = os.path.join(saves_dir, f)
                    if os.path.isfile(full):
                        st = os.stat(full)
                        saves.append({
                            "name": f,
                            "size_bytes": st.st_size,
                            "size_kb": round(st.st_size / 1024, 1),
                            "mtime": int(st.st_mtime),
                            "mtime_str": time.strftime("%d/%m/%Y %H:%M", time.localtime(st.st_mtime)),
                        })
            self._json({"saves": saves, "saves_dir": saves_dir, "count": len(saves)})
            return

        # 8. Save Content
        if path == "/api/saves/content":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = query.get("game", [""])[0]
            filename = query.get("file", [""])[0]
            if not game or not filename:
                self._error("Missing game or file param")
                return
            game_top = os.path.join(games_dir, game)
            root, _ = detect_engine(game_top)
            save_path = os.path.join(root or game_top, "save", filename)
            if not os.path.isfile(save_path):
                self._error("Save file not found")
                return
            data = saveedit.get_save_info(save_path)
            if data:
                self._json(data)
            else:
                self._error("Error reading save")
            return

        # 9. Database Browser
        if path == "/api/data":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = query.get("game", [""])[0]
            cat = query.get("cat", ["Items"])[0]
            if not game:
                self._error("Missing game param")
                return
            game_top = os.path.join(games_dir, game)
            root, _ = detect_engine(game_top)
            data_dir = os.path.join(root or game_top, "data")
            
            fn_map = {
                "Items": "Items.json",
                "Weapons": "Weapons.json",
                "Armors": "Armors.json",
                "Skills": "Skills.json",
                "Enemies": "Enemies.json",
            }
            target_fn = fn_map.get(cat, "Items.json")
            
            items = []
            if os.path.isdir(data_dir):
                base = os.path.splitext(target_fn)[0]
                for cand in (target_fn, base + ".rpgmdata", base + ".json_", base + ".rndata"):
                    p = os.path.join(data_dir, cand)
                    if os.path.isfile(p):
                        try:
                            with open(p, "rb") as fh:
                                raw = fh.read()
                            if raw[:5] in (b"RPGMV", b"RGGO"):
                                raw = raw[16:]
                            parsed_db = json.loads(raw.decode("utf-8", "replace"))
                            for idx, entry in enumerate(parsed_db):
                                if not entry or not isinstance(entry, dict):
                                    continue
                                eid = entry.get("id", idx)
                                ename = entry.get("name", "")
                                if not ename:
                                    continue
                                
                                params = entry.get("params") or []
                                def get_p(i):
                                    return params[i] if i < len(params) else 0

                                item_entry = {
                                    "id": eid,
                                    "name": ename,
                                    "description": entry.get("description", ""),
                                }
                                if cat in ("Items", "Weapons", "Armors"):
                                    item_entry["price"] = entry.get("price", 0)
                                if cat == "Weapons":
                                    item_entry["atk"] = get_p(2)
                                elif cat == "Armors":
                                    item_entry["def"] = get_p(3)
                                elif cat == "Skills":
                                    item_entry["mp_cost"] = entry.get("mpCost", 0)
                                elif cat == "Enemies":
                                    item_entry["hp"] = get_p(0)
                                    item_entry["exp"] = entry.get("exp", 0)
                                    item_entry["gold"] = entry.get("gold", 0)
                                items.append(item_entry)
                            break
                        except Exception:
                            continue
            self._json({"category": cat, "items": items, "count": len(items)})
            return

        # 10. Sync Status
        if path == "/api/sync/status":
            cfg = config.load_config()
            dest_dir, _auto = config.get_sync_settings(cfg)
            games = get_all_games(cfg)
            status = sync.get_sync_status(games, dest_dir, _auto)
            self._json(status)
            return

        # 11. Update check
        if path == "/api/update/check":
            result = {
                "update_available": False, 
                "tag_name": "", 
                "current_version": APP_VERSION, 
                "url": REPO_RELEASES_URL
            }
            try:
                req = urllib.request.Request(
                    REPO_LATEST_API,
                    headers={"Accept": "application/vnd.github+json", 
                            "User-Agent": "rpgmaker-launcher"})
                with urllib.request.urlopen(req, timeout=8) as fh:
                    data = json.load(fh)
                tag = data.get("tag_name") or ""
                result["tag_name"] = tag
                result["update_available"] = bool(tag) and version_newer(tag, APP_VERSION)
            except Exception as e:
                result["error"] = str(e)
            self._json(result)
            return

        # 12. Open folder / URL
        if path == "/api/open":
            target = query.get("target", [""])[0]
            if not target:
                self._error("Missing target query param")
                return
            try:
                open_target(target)
                self._json({"ok": True})
            except Exception as e:
                self._error(str(e), 403 if isinstance(e, PermissionError) else 400)
            return

        self._error("Not found", 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_json()

        # 1. Rescan and extract .zips
        if path == "/api/games/rescan":
            cfg = config.load_config()
            auto_delete = body.get("auto_delete", False)
            done, errors = extract_zips_api(auto_delete=auto_delete, cfg=cfg)
            games = get_all_games(cfg)
            self._json({"extracted": done, "errors": errors, "games": games})
            return

        # 1b. Install .zips
        if path == "/api/games/install":
            cfg = config.load_config()
            paths = body.get("paths") or []
            if not isinstance(paths, list):
                self._error("paths debe ser una lista")
                return
            auto_delete = body.get("auto_delete", False)
            copied, skipped, done = install_zip_paths(paths, auto_delete=auto_delete, cfg=cfg)
            games = get_all_games(cfg)
            self._json({
                "copied": [os.path.basename(c) for c in copied],
                "skipped": skipped, 
                "extracted": done, 
                "games": games
            })
            return

        # 2. Favorite toggle
        if path == "/api/games/favorite":
            name = body.get("name")
            if not name:
                self._error("Missing game name")
                return
            st = load_state()
            gdata = st.setdefault("games", {}).setdefault(name, {})
            current_fav = gdata.get("favorite", False)
            new_fav = body.get("favorite", not current_fav)
            gdata["favorite"] = new_fav
            save_state(st)
            self._json({"ok": True, "name": name, "favorite": new_fav})
            return

        # 3. Launch game
        if path == "/api/games/launch":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            name = body.get("name")
            viewer = body.get("viewer", "webkit")
            if not name:
                self._error("Missing game name")
                return
            game_top = os.path.join(games_dir, name)
            root, engine = detect_engine(game_top)
            if not engine or engine in ("incomplete", "renpy-incomplete"):
                self._error(f"Cannot launch incomplete game '{name}'")
                return

            if engine in ("MZ", "MV", "web"):
                use_webkit = (viewer == "webkit")
                port = ACTIVE_SESSION.launch_web(name, root, webkit=use_webkit)
                self._json({"ok": True, "type": "web", "port": port, "viewer": viewer})
            else:
                ACTIVE_SESSION.launch_native(name, root, engine)
                self._json({"ok": True, "type": "native", "engine": engine})
            return

        # 4. Stop Server
        if path == "/api/games/stop":
            name, elapsed, total = ACTIVE_SESSION.stop()
            self._json({"ok": True, "game": name, "seconds_added": elapsed, "total_seconds": total})
            return

        # 5. Config update
        if path == "/api/config":
            config.save_config(body)
            self._json({"ok": True, "config": body})
            return

        # 6. Plugins Toggle / Restore
        if path == "/api/plugins/toggle":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = body.get("game")
            action = body.get("action")
            if not game:
                self._error("Missing game")
                return
            game_top = os.path.join(games_dir, game)
            root, _ = detect_engine(game_top)
            
            if action == "restore":
                plugins.restore_plugins(root)
                self._json({"ok": True, "action": "restore"})
                return

            names = body.get("names", [])
            status = body.get("status", True)
            is_all = body.get("all", False)
            
            try:
                modified = plugins.toggle_plugin(root, names, status, is_all)
                self._json({"ok": True, "updated": list(modified), "status": status})
            except ValueError as e:
                self._error(str(e))
            return

        # 7. Save Editor Update
        if path == "/api/saves/content":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = body.get("game")
            filename = body.get("file")
            if not game or not filename:
                self._error("Missing params")
                return
            game_top = os.path.join(games_dir, game)
            root, _ = detect_engine(game_top)
            save_path = os.path.join(root or game_top, "save", filename)
            if not os.path.isfile(save_path):
                self._error("Save file does not exist")
                return

            updates = {}
            if "gold" in body:
                updates["gold"] = body["gold"]
            if "items" in body:
                updates["items"] = body["items"]
            if "variables" in body:
                updates["variables"] = body["variables"]
            if "switches" in body:
                updates["switches"] = body["switches"]

            success = saveedit.update_save(save_path, updates, 
                                          backups_dir=BACKUPS_DIR, 
                                          game_name=game)
            if success:
                self._json({"ok": True, "message": "Partida guardada con copia de seguridad."})
            else:
                self._error("Error saving file")
            return

        # 8. Saves Backup
        if path == "/api/saves/backup":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = body.get("game")
            if not game:
                self._error("Missing game name")
                return
            game_top = os.path.join(games_dir, game)
            root, _ = detect_engine(game_top)
            saves_dir = os.path.join(root or game_top, "save")
            if not os.path.isdir(saves_dir) or not os.listdir(saves_dir):
                self._error("No saves to backup")
                return
            
            ts = time.strftime("%Y%m%d-%H%M%S")
            dest = os.path.join(BACKUPS_DIR, game, f"snapshot-{ts}")
            os.makedirs(dest, exist_ok=True)
            for fn in os.listdir(saves_dir):
                src = os.path.join(saves_dir, fn)
                if os.path.isfile(src):
                    shutil.copy2(src, os.path.join(dest, fn))
            self._json({"ok": True, "backup_path": dest, "timestamp": ts})
            return

        # 9. Sync Execute
        if path == "/api/sync/execute":
            mode = body.get("mode", "push")
            cfg = config.load_config()
            dest_folder, _auto = config.get_sync_settings(cfg)
            override = str(body.get("folder") or "").strip()
            if override:
                dest_folder = os.path.abspath(os.path.expanduser(override))
                cfg.setdefault("sync", {})["folder"] = dest_folder
                config.save_config(cfg)
            
            if not dest_folder:
                self._error("Destination folder not configured")
                return
            
            games = get_all_games(cfg)
            game_list = [(g["name"], os.path.join(g["path"], "save")) for g in games]
            results = sync.sync_all(game_list, dest_folder, mode)
            EVENT_BUS.broadcast("sync_complete", {"mode": mode, "results": results})
            self._json({"ok": True, "mode": mode, "results": [
                {"game": name, "count": n} for name, n in results
            ]})
            return

        # 10. Decrypt
        if path == "/api/decrypt":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = body.get("game")
            recreate = body.get("recreate", False)
            if not game:
                self._error("Missing game name")
                return
            game_top = os.path.join(games_dir, game)
            root, engine = detect_engine(game_top)
            
            if engine in ("MV", "MZ", "web"):
                # MV/MZ: descifrado nativo
                key_file = os.path.join(root, "www", "rpg_project.json")
                if not os.path.isfile(key_file):
                    self._error("No se encontró rpg_project.json con la clave de encriptación")
                    return
                with open(key_file, "r") as fh:
                    proj = json.load(fh)
                key = proj.get("encryptionKey", "")
                if not key:
                    self._error("Clave de encriptación vacía")
                    return
                success, failed, files = decrypter.decrypt_directory(root, key)
                self._json({
                    "ok": True, 
                    "output_dir": root,
                    "log": f"Descifrados: {success}, Errores: {failed}"
                })
            else:
                # XP/VX/VX Ace: usar binario externo
                code, out = decrypter.decrypt_rgss(root, recreate=recreate)
                self._json({
                    "ok": code == 0, 
                    "output_dir": out,
                    "log": f"Código de salida: {code}"
                })
            return

        # 11. Setup Mods
        if path == "/api/tools/mods":
            cfg = config.load_config()
            games_dir = config.get_games_dir(cfg)
            game = body.get("game")
            if not game:
                self._error("Missing game name")
                return
            game_top = os.path.join(games_dir, game)
            root, engine = detect_engine(game_top)
            if not root:
                self._error("Game root not found")
                return
            
            mods_dir = os.path.join(root, "mods")
            created = not os.path.isdir(mods_dir)
            os.makedirs(mods_dir, exist_ok=True)
            
            # Crear ejemplo si está vacío
            if created or not os.listdir(mods_dir):
                example = os.path.join(mods_dir, "ejemplo.js")
                with open(example, "w", encoding="utf-8") as fh:
                    fh.write(MOD_TEMPLATE)
            
            self._json({"ok": True, "mods_dir": mods_dir, "created": created})
            return

        self._error("Not found", 404)


# ---------- Servidor API ----------
def run_api_server(port=0):
    """Inicia el servidor API REST + SSE."""
    handler = ApiHandler
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    
    actual_port = httpd.server_address[1]
    print("RPG_MAKER_API_PORT=%d" % actual_port, flush=True)
    log("API server iniciado en puerto %d" % actual_port)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        # Cleanup on exit
        ACTIVE_SESSION.stop()
        httpd.server_close()


# ---------- CLI ----------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RPG Maker Launcher API Server")
    parser.add_argument("--port", type=int, default=0, help="Puerto (0 = automático)")
    args = parser.parse_args()
    
    run_api_server(args.port)
