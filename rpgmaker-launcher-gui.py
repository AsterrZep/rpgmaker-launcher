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
from tkinter import ttk

BASE_DIR = os.path.dirname(os.path.realpath(__file__))
# Los datos de usuario (juegos, backups, estado, config) van a
# RPGMAKER_DATA_DIR si está definido; si no, junto a la app
# (modo portátil: carpeta del repositorio).
DATA_DIR = os.path.expanduser(os.environ.get("RPGMAKER_DATA_DIR", "")) or BASE_DIR
GAMES_DIR = os.path.join(DATA_DIR, "games")
RUN_DIR = os.path.join(BASE_DIR, "runtimes")
BACKUPS_DIR = os.path.join(DATA_DIR, "backups")
STATE_FILE = os.path.join(DATA_DIR, "launcher-state.json")
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

# ---------- idioma (es -> en) ----------
# El español es el idioma base del código; LANG selecciona el idioma
# activo ("es" devuelve el texto tal cual, "en" lo traduce).
LANG = "es"
CLI_LANG = None

I18N = {
    # juego / estado
    "ahora": "now",
    "hace %d min": "%d min ago",
    "hace %d h": "%d h ago",
    "hace %d d": "%d d ago",
    "sin jugar aun": "not played yet",
    "No se puede lanzar": "Cannot launch",
    "Descarga incompleta": "Incomplete download",
    "Ren'Py sin parte Linux": "Ren'Py without the Linux part",
    "No hay juegos todavia.\nColoca los .zip junto al "
    "lanzador y pulsa Actualizar.": "No games yet.\nPut the .zip files next to "
    "the launcher and press Refresh.",
    "Listos: %d juego(s)": "Ready: %d game(s)",
    "No se encontró el lanzador .sh del juego Ren'Py en:\n%s":
        "No Ren'Py .sh launcher found for the game at:\n%s",
    "Cargando...": "Loading...",

    # extracción
    "Extrayendo: %s ...": "Extracting: %s ...",
    "no se pudo borrar %s: %s": "could not delete %s: %s",
    "Extraídos: %s": "Extracted: %s",
    "Sin nuevos .zip": "No new .zip files",
    "Buscando nuevos .zip...": "Looking for new .zip files...",

    # botones generales
    "Aceptar": "OK",
    "Cancelar": "Cancel",
    "Sí": "Yes",
    "No": "No",
    "Actualizar": "Refresh",
    "Eliminar .zip": "Delete .zip",
    "Visor WebKit": "WebKit viewer",
    "Jugar": "Play",
    "Plugins": "Plugins",
    "Partidas": "Saves",
    "Descifrar": "Decrypt",
    "Detener servidor": "Stop server",
    "Borrar .zip": "Delete .zip",
    "Atajos": "Shortcuts",
    "Salir": "Quit",
    "Subir": "Up",
    "Seleccionar": "Select",
    "Cerrar": "Close",
    "Guardar": "Save",
    "Restaurar valores por defecto": "Restore default values",
    "Todo OFF": "All OFF",
    "Todo ON": "All ON",
    "Desactivar": "Disable",
    "Activar": "Enable",
    "Restaurar original": "Restore original",
    "Restaurar": "Restore",
    "Abrir carpeta": "Open folder",
    "Exportar": "Export",
    "Borrar": "Delete",
    "Copia de seguridad": "Backup",
    "Carpeta de destino": "Destination folder",

    # cabecera / estado
    "Juegos de RPG Maker · Linux (origen: Chrome OS)":
        "RPG Maker games · Linux (born on Chrome OS)",
    "● Servidor ACTIVO: %s → http://localhost:%d   ·   %s":
        "● Server ACTIVE: %s → http://localhost:%d   ·   %s",

    # selección / lanzamiento
    "Este juego está incompleto (descarga con archivos faltantes).\nVuelve a descargarlo.":
        "This game is incomplete (download with missing files).\nDownload it again.",
    "navegador": "browser",
    "WebKit": "WebKit",
    "Iniciando servidor para %s (%s)...": "Starting server for %s (%s)...",
    "Lanzando %s (%s) en su ventana...": "Launching %s (%s) in its own window...",
    "No se pudo lanzar '%s' (%s).\n\n%s": "Could not launch '%s' (%s).\n\n%s",
    "%s lanzado. Cierra la ventana del juego cuando termines.":
        "%s launched. Close the game window when you are done.",
    "Servidor de '%s' (puerto %d) detenido.": "Server of '%s' (port %d) stopped.",
    "No hay ningún servidor activo.": "There is no active server.",
    "Selecciona un juego primero.": "Select a game first.",
    "No existe el .zip de '%s'.": "There is no .zip for '%s'.",
    "¿Eliminar el .zip de '%s'?\n\n%s\n(%.0f MB — el juego ya extraído se conserva)":
        "Delete the .zip of '%s'?\n\n%s\n(%.0f MB — the already-extracted game is kept)",
    ".zip de '%s' eliminado. El juego sigue disponible.":
        ".zip of '%s' deleted. The game is still available.",
    "No se pudo borrar: %s": "Could not delete: %s",

    # descifrado
    "¿Descifrar '%s'?\n\n"
    "Se descargará RPGMakerDecrypter (una sola vez) y los archivos "
    "del archivo cifrado (%s) se escribirán en:\n%s":
        "Decrypt '%s'?\n\n"
        "RPGMakerDecrypter will be downloaded (once) and the files "
        "from the encrypted archive (%s) will be written to:\n%s",
    "Descifrando '%s'... esto puede tardar un poco.":
        "Decrypting '%s'... this can take a little while.",
    "Descifrado de '%s' %s.\n%s": "Decryption of '%s' %s.\n%s",
    "completado": "completed",
    "con errores (código %d)": "with errors (code %d)",

    # atajos
    "Atajos de teclado": "Keyboard shortcuts",
    "Atajos de teclado del visor": "Viewer keyboard shortcuts",
    "Haz clic en un atajo y pulsa la combinación de teclas.\n"
    "Escape cancela la captura. Se guardan en launcher-config.json.":
        "Click a shortcut and press the key combination.\n"
        "Escape cancels the capture. Saved to launcher-config.json.",
    "Pulsa la tecla...": "Press a key...",
    "Tecla no válida: %s": "Invalid key: %s",
    "No se pudo guardar: %s": "Could not save: %s",
    "Atajos de teclado guardados.": "Keyboard shortcuts saved.",

    # plugins
    "Activa o desactiva los plugins del juego (js/plugins.js).":
        "Enable or disable the game plugins (js/plugins.js).",
    "Plugin": "Plugin",
    "Estado": "Status",
    "WebKit": "WebKit",
    "ok": "ok",
    "NW protegido": "NW protected",
    "ROTO (nw.js)": "BROKEN (nw.js)",
    "sin fichero": "no file",
    "Selecciona al menos un plugin.": "Select at least one plugin.",
    "No encontrados: %s": "Not found: %s",
    "Plugins de '%s' %s: %d": "Plugins of '%s' %s: %d",
    "activados": "enabled",
    "desactivados": "disabled",
    "¿Restaurar js/plugins.js al original?": "Restore js/plugins.js to the original?",
    "Aún no hay copia original (no se ha modificado nada).":
        "There is no original copy yet (nothing has been modified).",
    "plugins.js de '%s' restaurado.": "plugins.js of '%s' restored.",

    # partidas
    "Aún no existe la carpeta 'save/' de este juego.\n"
    "Guarda al menos una vez dentro del juego y vuelve.":
        "The 'save/' folder of this game does not exist yet.\n"
        "Save at least once inside the game and come back.",
    "Copia, restaura, exporta o borra los archivos de guardado.":
        "Copy, restore, export or delete the save files.",
    "Archivo": "File",
    "Tamaño": "Size",
    "Modificado": "Modified",
    "Copia de '%s': %d archivo(s) en backups/%s/%s":
        "Backup of '%s': %d file(s) in backups/%s/%s",
    "Copia de seguridad creada:\n%s": "Backup created:\n%s",
    "Aún no hay copias de seguridad.": "There are no backups yet.",
    "Copias disponibles:\n%s\n\nEscribe una para restaurarla:":
        "Available backups:\n%s\n\nType one to restore it:",
    "Partidas de '%s' restauradas desde %s (%d archivo(s)).":
        "Saves of '%s' restored from %s (%d file(s)).",
    "Selecciona archivos para exportar.": "Select files to export.",
    "Exportadas %d partida(s) a %s": "Exported %d save(s) to %s",
    "¿Borrar %d archivo(s) de partida?": "Delete %d save file(s)?",
}


def _(s):
    if LANG == "en":
        return I18N.get(s, s)
    return s



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


# Comprueba si existe la parte Linux de un juego Ren'Py.
# Ren'Py moderno (Py3) usa lib/linux-{x86_64,i686}; versiones
# antiguas (Py2) usan lib/py2-linux-{x86_64,i686}.
def _renpy_lib_ok(rdir):
    for d in ("linux-x86_64", "linux-i686", "py2-linux-x86_64", "py2-linux-i686"):
        if os.path.isdir(os.path.join(rdir, "lib", d)):
            return True
    return False


def renpy_launcher_sh(root):
    """Devuelve el script .sh que arranca un juego Ren'Py.

    Los juegos Ren'Py llevan <nombre>.sh junto a su <nombre>.py
    (p. ej. "Game of Whores.py" -> "Game of Whores.sh"). Si ese par
    no existe, se usa cualquier .sh de la raíz del juego.
    """
    py = find_glob(root, "*.py")
    if py:
        candidate = os.path.splitext(py)[0] + ".sh"
        if os.path.isfile(candidate):
            return candidate
    for f in sorted(os.listdir(root)):
        if f.endswith(".sh") and os.path.isfile(os.path.join(root, f)):
            return os.path.join(root, f)
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
        if all(os.path.isdir(os.path.join(rdir, d)) for d in ("renpy", "game")) and _renpy_lib_ok(rdir):
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
    return os.path.join(DATA_DIR, name + ".zip")


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
        return _("ahora")
    if d < 3600:
        return _("hace %d min") % int(d // 60)
    if d < 86400:
        return _("hace %d h") % int(d // 3600)
    if d < 7 * 86400:
        return _("hace %d d") % int(d // 86400)
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


def _config_module():
    import importlib.util
    path = os.path.join(BASE_DIR, "rpgmaker-config.py")
    spec = importlib.util.spec_from_file_location("rpgmaker_config", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------- extracción ----------
def extract_zips(callback=None, auto_delete=False):
    done, errors = [], []
    for z in sorted(glob.glob(os.path.join(DATA_DIR, "*.zip"))):
        name = os.path.splitext(os.path.basename(z))[0]
        target = os.path.join(GAMES_DIR, name)
        marker = os.path.join(target, MARKER)
        if os.path.isfile(marker):
            continue
        os.makedirs(target, exist_ok=True)
        if callback:
            callback(_("Extrayendo: %s ...") % os.path.basename(z))
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
                    errors.append(_("no se pudo borrar %s: %s") % (os.path.basename(z), e))
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
            sh = renpy_launcher_sh(root)
            if not sh:
                raise RuntimeError(
                    _("No se encontró el lanzador .sh del juego Ren'Py en:\n%s") % root)
            cmd = [sh]
        else:
            cmd = [MKXPZ]
        subprocess.Popen(cmd, cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# ---------- ventana (GUI moderna) ----------
# Tema oscuro propio (sin dependencias extra): cards con portada,
# botones planos con hover, toggles y barra de estado.
BG = "#0f1115"
SURFACE = "#161a22"
CARD = "#1b202b"
CARD_HOVER = "#232a3b"
CARD_SEL = "#252c41"
BORDER = "#2a3142"
ACCENT = "#7c6cf0"
ACCENT_HOVER = "#9182f6"
ACCENT_SOFT = "#2a2f52"
TEXT = "#e7e9f0"
MUTED = "#8a92a8"
FAINT = "#5a6275"
BAD = "#e06c75"
OK = "#4ade80"
WARN = "#e5b567"

F_TITLE = ("DejaVu Sans", 17, "bold")
F_SUB = ("DejaVu Sans", 9)
F_BTN = ("DejaVu Sans", 10)
F_CARD = ("DejaVu Sans", 10, "bold")
F_META = ("DejaVu Sans", 8)

CARD_W = 178
CARD_H = 218
IMG_W = 150
IMG_H = 104
GAP = 12
PADX = 16

ICON_PATH = os.path.join(BASE_DIR, "rpgmaker-icon.png")


class GameCard(tk.Frame):
    """Tarjeta de juego: portada, nombre y metadatos, con hover y seleccion."""

    def __init__(self, master, name, meta, last, photo,
                 on_click=None, on_play=None):
        super().__init__(master, bg=BORDER, bd=0, highlightthickness=0)
        self.config(width=CARD_W, height=CARD_H)
        self.pack_propagate(False)
        self._sel = False

        inner = tk.Frame(self, bg=CARD, bd=0)
        inner.pack(fill="both", expand=True, padx=2, pady=2)
        self._paint = [inner]

        cover = tk.Frame(inner, bg="#131721", width=IMG_W, height=IMG_H)
        cover.pack_propagate(False)
        cover.pack(pady=(14, 8))
        if photo:
            lbl = tk.Label(cover, image=photo, bg="#131721", bd=0)
            lbl.image = photo
        else:
            lbl = tk.Label(cover, text=(name[:1] or "?").upper(),
                           font=("DejaVu Sans", 44, "bold"),
                           fg="#2b3153", bg="#131721")
        lbl.pack(expand=True)

        name_lbl = tk.Label(inner, text=name, font=F_CARD, fg=TEXT, bg=CARD,
                            wraplength=CARD_W - 34, justify="left")
        name_lbl.pack(padx=15, anchor="w")
        self._paint.append(name_lbl)

        meta_lbl = tk.Label(inner, text=meta, font=F_META, fg=ACCENT, bg=CARD,
                            anchor="w")
        meta_lbl.pack(padx=15, pady=(5, 0), anchor="w")
        self._paint.append(meta_lbl)

        last_lbl = tk.Label(inner, text=last or _("sin jugar aun"), font=F_META,
                            fg=FAINT, bg=CARD, anchor="w")
        last_lbl.pack(padx=15, pady=(1, 0), anchor="w")
        self._paint.append(last_lbl)

        for w in (self, inner, cover, lbl) + tuple(self._paint):
            w.bind("<Button-1>", lambda e: on_click and on_click(self))
            w.bind("<Double-Button-1>", lambda e: on_play and on_play())
        for w in (self, inner) + tuple(self._paint):
            w.bind("<Enter>", lambda e: self._on_hover(True))
            w.bind("<Leave>", lambda e: self._on_hover(False))
        self._paint_bg()

    def set_selected(self, sel):
        self._sel = sel
        self._paint_bg()

    def _on_hover(self, on):
        if not self._sel:
            self._paint_bg(hover=on)

    def _paint_bg(self, hover=False):
        bg = CARD_SEL if self._sel else (CARD_HOVER if hover else CARD)
        self.config(bg=ACCENT if self._sel else BORDER)
        for w in self._paint:
            w.config(bg=bg)


class App:
    def __init__(self):
        self.launcher = Launcher()
        self.games = []      # (nombre, root, engine) o None si incompleto
        self._cards = []     # (GameCard, juego_o_None)
        self._sel = None
        self.state = load_state()
        self._images = {}    # nombre -> PhotoImage (portadas)
        self._session_start = None
        self._session_game = None

        self.root = tk.Tk()
        self.root.title("RPG Maker Launcher")
        self.root.geometry("1020x660")
        self.root.minsize(760, 520)
        self.root.configure(bg=BG)
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        cfg = _config_module().load_config()
        global LANG
        LANG = CLI_LANG or cfg.get("general", {}).get("lang", "es")
        if LANG not in ("es", "en"):
            LANG = "es"
        self.use_webkit = tk.BooleanVar(
            value=cfg.get("general", {}).get("webkit", False))
        self.auto_delete = tk.BooleanVar(
            value=cfg.get("general", {}).get("auto_delete_zip", False))
        self._set_icon()

        self._setup_ttk()
        self._build_ui()
        self.load_games()
        self.root.after(60, self._reflow)

    # --- icono de la ventana ---
    def _set_icon(self):
        try:
            img = tk.PhotoImage(file=ICON_PATH)
            self._icon = img
            self.root.iconphoto(True, img)
        except tk.TclError:
            pass

    # --- estilo ttk (tablas de los dialogos) ---
    def _setup_ttk(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure("TFrame", background=SURFACE)
        style.configure("TLabel", background=SURFACE, foreground=TEXT)
        style.configure("TTreeview", background=CARD, fieldbackground=CARD,
                        foreground=TEXT, borderwidth=0, rowheight=28)
        style.map("TTreeview",
                  background=[("selected", ACCENT_SOFT)],
                  foreground=[("selected", "#ffffff")])
        style.configure("TTreeview.Heading", background=SURFACE, foreground=MUTED,
                        borderwidth=0, relief="flat", padding=(8, 6))
        style.map("TTreeview.Heading", background=[("active", BORDER)])
        style.configure("TScrollbar", background=SURFACE, troughcolor=BG,
                        arrowcolor=MUTED, borderwidth=0, width=14)
        style.map("TScrollbar", background=[("active", BORDER)])
        style.configure("TButton", background=SURFACE, foreground=TEXT,
                        borderwidth=0, padding=(12, 7), focuscolor=ACCENT)
        style.map("TButton",
                  background=[("active", BORDER), ("pressed", BORDER)],
                  foreground=[("disabled", FAINT)])

    # --- botones ---
    def _make_button(self, parent, text, command=None, accent=False):
        btn = tk.Button(parent, text=text, command=command, font=F_BTN,
                        relief="flat", bd=0, takefocus=0, cursor="hand2",
                        padx=20 if accent else 14, pady=8, highlightthickness=0)
        btn._accent = accent
        self._style_btn(btn, True)
        if not accent:
            btn.bind("<Enter>",
                     lambda e: btn.config(bg=BORDER) if btn["state"] != "disabled" else None)
            btn.bind("<Leave>", lambda e: btn.config(bg=SURFACE))
        return btn

    def _style_btn(self, btn, enabled):
        accent = getattr(btn, "_accent", False)
        if enabled:
            if accent:
                btn.config(state="normal", bg=ACCENT, fg="#ffffff", cursor="hand2",
                           activebackground=ACCENT_HOVER, activeforeground="#ffffff")
            else:
                btn.config(state="normal", bg=SURFACE, fg=TEXT, cursor="hand2",
                           activebackground=BORDER, activeforeground=TEXT)
        else:
            btn.config(state="disabled", bg=SURFACE, fg=FAINT, cursor="arrow",
                       activebackground=SURFACE, activeforeground=FAINT)

    # --- toggles ---
    def _make_toggle(self, parent, label, var):
        btn = tk.Button(parent, text="", font=F_BTN, relief="flat", bd=0,
                        takefocus=0, cursor="hand2", padx=10, pady=8,
                        highlightthickness=0,
                        command=lambda: self._flip_toggle(btn, var))
        btn._label = label
        self._paint_toggle(btn, var)
        return btn

    def _flip_toggle(self, btn, var):
        var.set(not var.get())
        self._paint_toggle(btn, var)
        try:
            mod = _config_module()
            cfg = mod.load_config()
            cfg.setdefault("general", {})["webkit"] = self.use_webkit.get()
            cfg["general"]["auto_delete_zip"] = self.auto_delete.get()
            mod.save_config(cfg)
        except Exception:
            pass

    def _paint_toggle(self, btn, var):
        on = var.get()
        btn.config(text=("● " if on else "○ ") + btn._label,
                   bg=ACCENT_SOFT if on else SURFACE,
                   fg="#ffffff" if on else MUTED,
                   activebackground=ACCENT_SOFT if on else BORDER,
                   activeforeground="#ffffff" if on else MUTED)

    # --- cambio de idioma (reconstruye la UI) ---
    def toggle_lang(self):
        self.set_lang("en" if LANG == "es" else "es")

    def set_lang(self, lang):
        global LANG
        LANG = "en" if lang == "en" else "es"
        try:
            mod = _config_module()
            cfg = mod.load_config()
            cfg.setdefault("general", {})["lang"] = LANG
            mod.save_config(cfg)
        except Exception:
            pass
        self._end_session()
        self.launcher.stop_server()
        self._images.clear()
        for child in self.root.winfo_children():
            child.destroy()
        self._build_ui()
        self.load_games()

    # --- dialogos oscuros ---
    _DLG_KIND = {"info": OK, "warn": WARN, "error": BAD}

    def _dlg_center(self, win):
        win.update_idletasks()
        try:
            x = self.root.winfo_rootx() + max(0, (self.root.winfo_width() - win.winfo_reqwidth()) // 2)
            y = self.root.winfo_rooty() + max(0, (self.root.winfo_height() - win.winfo_reqheight()) // 2)
            win.geometry("+%d+%d" % (x, y))
        except tk.TclError:
            pass

    def _dlg_show(self, title, msg, kind="info", buttons=None):
        if not buttons:
            buttons = (_("Aceptar"),)
        win = tk.Toplevel(self.root)
        win.title(title)
        win.configure(bg=BG)
        win.resizable(False, False)
        win.transient(self.root)
        body = tk.Frame(win, bg=BG)
        body.pack(padx=22, pady=18)
        tk.Label(body, text="● " + title,
                 font=("DejaVu Sans", 12, "bold"),
                 fg=self._DLG_KIND.get(kind, ACCENT), bg=BG).pack(anchor="w")
        tk.Label(body, text=msg, font=("DejaVu Sans", 10), fg=MUTED, bg=BG,
                 wraplength=430, justify="left").pack(anchor="w", pady=(8, 0))
        bar = tk.Frame(body, bg=BG)
        bar.pack(fill="x", pady=(18, 0))
        result = {"v": None}

        def choose(v):
            result["v"] = v
            win.destroy()

        for i, label in enumerate(buttons):
            b = self._make_button(bar, label,
                                  command=lambda v=label: choose(v),
                                  accent=(i == len(buttons) - 1))
            b.pack(side="right", padx=(8, 0))
        self._dlg_center(win)
        win.grab_set()
        self.root.wait_window(win)
        return result["v"]

    def _info(self, title, msg):
        self._dlg_show(title, msg, kind="info")

    def _warn(self, title, msg):
        self._dlg_show(title, msg, kind="warn")

    def _error(self, title, msg):
        self._dlg_show(title, msg, kind="error")

    def _ask(self, title, msg, yes=None, no=None):
        if not yes:
            yes = _("Sí")
        if not no:
            no = _("No")
        return self._dlg_show(title, msg, kind="warn", buttons=(no, yes)) == yes

    def _ask_text(self, title, prompt):
        win = tk.Toplevel(self.root)
        win.title(title)
        win.configure(bg=BG)
        win.resizable(False, False)
        win.transient(self.root)
        body = tk.Frame(win, bg=BG)
        body.pack(padx=22, pady=18)
        tk.Label(body, text="● " + title,
                 font=("DejaVu Sans", 12, "bold"), fg=ACCENT, bg=BG).pack(anchor="w")
        tk.Label(body, text=prompt, font=("DejaVu Sans", 10), fg=MUTED, bg=BG,
                 wraplength=430, justify="left").pack(anchor="w", pady=(8, 0))
        e = tk.Entry(body, font=("DejaVu Sans", 10), bg=CARD, fg=TEXT,
                     insertbackground=TEXT, relief="flat", bd=0,
                     highlightthickness=1, highlightbackground=BORDER,
                     highlightcolor=ACCENT)
        e.pack(fill="x", pady=(10, 0))
        result = {"v": None}

        def ok(event=None):
            result["v"] = e.get()
            win.destroy()

        e.bind("<Return>", ok)
        bar = tk.Frame(body, bg=BG)
        bar.pack(fill="x", pady=(16, 0))
        self._make_button(bar, _("Cancelar"), command=win.destroy).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Aceptar"), command=ok, accent=True).pack(side="right", padx=(8, 0))
        self._dlg_center(win)
        win.grab_set()
        e.focus_set()
        self.root.wait_window(win)
        return result["v"]

    def _ask_dir(self, title, start=None):
        cur = [os.path.abspath(start or ".")]
        result = {"v": None}
        win = tk.Toplevel(self.root)
        win.title(title)
        win.configure(bg=BG)
        win.geometry("560x440")
        win.transient(self.root)
        header = tk.Frame(win, bg=SURFACE)
        header.pack(fill="x")
        path_lbl = tk.Label(header, text="", font=("DejaVu Sans", 10, "bold"),
                            fg=TEXT, bg=SURFACE, anchor="w")
        path_lbl.pack(padx=16, pady=(12, 6), fill="x")
        nav = tk.Frame(header, bg=SURFACE)
        nav.pack(fill="x", padx=16, pady=(0, 12))

        def _refresh():
            lb.delete(0, "end")
            path_lbl.config(text=cur[0])
            try:
                for d in sorted(x for x in os.listdir(cur[0])
                                if os.path.isdir(os.path.join(cur[0], x))):
                    lb.insert("end", d)
            except OSError:
                pass

        def _up():
            p = os.path.dirname(cur[0])
            if os.path.isdir(p):
                cur[0] = p
                _refresh()

        self._make_button(nav, _("Subir"), command=_up).pack(side="left")
        self._make_button(nav, _("Actualizar"), command=_refresh).pack(side="left", padx=(8, 0))
        body = tk.Frame(win, bg=BG)
        body.pack(fill="both", expand=True, padx=16, pady=12)
        lb = tk.Listbox(body, bg=CARD, fg=TEXT, selectbackground=ACCENT_SOFT,
                        selectforeground="#ffffff", relief="flat", bd=0,
                        highlightthickness=0, font=("DejaVu Sans", 10))
        lb.pack(side="left", fill="both", expand=True)
        vsb = tk.Scrollbar(body, command=lb.yview, bg=SURFACE, troughcolor=BG,
                           activebackground=BORDER, bd=0, highlightthickness=0, width=12)
        lb.configure(yscrollcommand=vsb.set)
        vsb.pack(side="left", fill="y", padx=(4, 0))

        def _enter(event=None):
            sel = lb.curselection()
            if sel:
                cur[0] = os.path.join(cur[0], lb.get(sel[0]))
                _refresh()

        lb.bind("<Double-Button-1>", _enter)
        lb.bind("<Return>", _enter)
        bar = tk.Frame(win, bg=SURFACE)
        bar.pack(fill="x", padx=16, pady=(0, 14))

        def _ok():
            result["v"] = cur[0]
            win.destroy()

        self._make_button(bar, _("Cancelar"), command=win.destroy).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Seleccionar"), command=_ok, accent=True).pack(side="right", padx=(8, 0))
        _refresh()
        win.grab_set()
        self.root.wait_window(win)
        return result["v"]

    # --- construccion de la interfaz ---
    def _build_ui(self):
        header = tk.Frame(self.root, bg=SURFACE)
        header.pack(fill="x")
        hinner = tk.Frame(header, bg=SURFACE)
        hinner.pack(fill="x", padx=PADX, pady=(12, 10))

        try:
            icon = tk.PhotoImage(file=ICON_PATH).subsample(8, 8)
            self._head_icon = icon
            tk.Label(hinner, image=icon, bg=SURFACE).pack(side="left")
        except tk.TclError:
            pass

        titles = tk.Frame(hinner, bg=SURFACE)
        titles.pack(side="left", padx=(10, 0))
        tk.Label(titles, text="RPG Maker Launcher", font=F_TITLE,
                 fg=TEXT, bg=SURFACE).pack(anchor="w")
        tk.Label(titles, text=_("Juegos de RPG Maker · Linux (origen: Chrome OS)"),
                 font=F_SUB, fg=MUTED, bg=SURFACE).pack(anchor="w")

        self._btn_refresh = self._make_button(hinner, _("Actualizar"), self.rescan)
        self._btn_refresh.pack(side="right")
        self._btn_lang = self._make_button(hinner, "EN" if LANG == "es" else "ES",
                                           self.toggle_lang)
        self._btn_lang.pack(side="right", padx=(8, 0))
        self._tog_del = self._make_toggle(hinner, _("Eliminar .zip"), self.auto_delete)
        self._tog_del.pack(side="right", padx=(8, 0))
        self._tog_webkit = self._make_toggle(hinner, _("Visor WebKit"), self.use_webkit)
        self._tog_webkit.pack(side="right", padx=(8, 0))

        body = tk.Frame(self.root, bg=BG)
        body.pack(fill="both", expand=True)
        self.canvas = tk.Canvas(body, bg=BG, highlightthickness=0, bd=0)
        self.canvas.pack(side="left", fill="both", expand=True,
                         padx=(PADX, 0), pady=14)
        sb = tk.Scrollbar(body, orient="vertical", command=self.canvas.yview,
                          bg=SURFACE, troughcolor=BG, bd=0,
                          highlightthickness=0, width=10)
        sb.pack(side="left", fill="y", padx=(4, PADX), pady=14)
        self.canvas.configure(yscrollcommand=sb.set)

        self.inner = tk.Frame(self.canvas, bg=BG)
        self._win = self.canvas.create_window((0, 0), window=self.inner, anchor="nw")
        self.inner.bind("<Configure>",
                        lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.bind("<Configure>", self._on_canvas_resize)
        self.canvas.bind("<Button-4>", lambda e: self.canvas.yview_scroll(-1, "units"))
        self.canvas.bind("<Button-5>", lambda e: self.canvas.yview_scroll(1, "units"))
        self.canvas.bind("<MouseWheel>",
                         lambda e: self.canvas.yview_scroll(-1 * (e.delta // 120), "units"))

        footer = tk.Frame(self.root, bg=SURFACE)
        footer.pack(fill="x")
        bar = tk.Frame(footer, bg=SURFACE)
        bar.pack(fill="x", padx=PADX, pady=(10, 8))
        self.play_btn = self._make_button(bar, _("Jugar"), self.play_selected, accent=True)
        self.play_btn.pack(side="left")
        self.plugins_btn = self._make_button(bar, _("Plugins"), self.plugins_selected)
        self.plugins_btn.pack(side="left", padx=(8, 0))
        self.saves_btn = self._make_button(bar, _("Partidas"), self.saves_selected)
        self.saves_btn.pack(side="left", padx=(8, 0))
        self.decrypt_btn = self._make_button(bar, _("Descifrar"), self.decrypt_selected)
        self.decrypt_btn.pack(side="left", padx=(8, 0))
        self.stop_btn = self._make_button(bar, _("Detener servidor"), self.stop_server_action)
        self.stop_btn.pack(side="left", padx=(8, 0))
        self._btn_delzip = self._make_button(bar, _("Borrar .zip"), self.delete_zip_action)
        self._btn_delzip.pack(side="left", padx=(8, 0))
        self._btn_shortcuts = self._make_button(bar, _("Atajos"), self.shortcuts_dialog)
        self._btn_shortcuts.pack(side="right", padx=(8, 0))
        self._btn_quit = self._make_button(bar, _("Salir"), self.on_close)
        self._btn_quit.pack(side="right")

        self.status = tk.StringVar(value=_("Cargando..."))
        self.status_lbl = tk.Label(footer, textvariable=self.status, font=F_META,
                                   fg=MUTED, bg=SURFACE, anchor="w")
        self.status_lbl.pack(fill="x", padx=PADX, pady=(0, 8))

    def _on_canvas_resize(self, e):
        self.canvas.itemconfig(self._win, width=e.width)
        self._reflow()

    def _reflow(self):
        w = self.canvas.winfo_width()
        if w <= 0:
            return
        n = max(1, (w + GAP) // (CARD_W + GAP))
        for i, (card, _) in enumerate(self._cards):
            card.grid_remove()
        for i, (card, _) in enumerate(self._cards):
            card.grid(row=i // n, column=i % n,
                      padx=GAP // 2, pady=GAP // 2, sticky="n")

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
                img.thumbnail((IMG_W, IMG_H))
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
        if w <= 0 or h <= 0:
            return None
        if w < IMG_W or h < IMG_H:
            z = min(IMG_W // max(w, 1), IMG_H // max(h, 1), 2)
            if z > 1:
                img = img.zoom(z, z)
                w, h = img.width(), img.height()
        scale = min(IMG_W / w, IMG_H / h, 1.0)
        if scale < 1.0:
            s = max(1, int(round(1 / scale)))
            img = img.subsample(s, s)
        return img

    def load_games(self):
        self.games = []
        self._cards = []
        self._sel = None
        for child in self.inner.winfo_children():
            child.destroy()

        for top in sorted(glob.glob(os.path.join(GAMES_DIR, "*"))):
            if not os.path.isdir(top):
                continue
            name = os.path.basename(top.rstrip(os.sep))
            root, eng = detect_engine(top)
            if eng is None:
                continue
            if eng in ("incomplete", "renpy-incomplete"):
                label = "(!) " + _(ENGINE_LABEL.get(eng, eng))
                card = GameCard(self.inner, name, label, _("No se puede lanzar"),
                                None, on_click=self._select,
                                on_play=self.play_selected)
                self._cards.append((card, None))
                self.games.append(None)
            else:
                info = self.state.get("games", {}).get(name, {})
                last = fmt_last(info.get("last_played"))
                hours = info.get("seconds", 0)
                meta = _(ENGINE_LABEL.get(eng, eng))
                if hours:
                    meta += " · " + fmt_hours(hours)
                photo = self._cover_photo(top, root)
                self._images[name] = photo
                card = GameCard(self.inner, name, meta, last, photo,
                                on_click=self._select, on_play=self.play_selected)
                self._cards.append((card, (name, root, eng)))
                self.games.append((name, root, eng))

        if not self._cards:
            tk.Label(self.inner,
                     text=_("No hay juegos todavia.\nColoca los .zip junto al "
                            "lanzador y pulsa Actualizar."),
                     font=("DejaVu Sans", 12), fg=FAINT, bg=BG,
                     justify="center").pack(pady=70)
        self._reflow()
        self._update_tool_buttons()
        self._update_status(_("Listos: %d juego(s)") % sum(1 for g in self.games if g))

    def _select(self, card):
        for i, (c, g) in enumerate(self._cards):
            c.set_selected(c is card)
            if c is card:
                self._sel = i
        self._update_tool_buttons()

    def _update_tool_buttons(self):
        sel = self.selected()
        eng = sel[1][2] if sel and sel[1] else None
        has = bool(sel and sel[1])
        self._style_btn(self.play_btn, has)
        self._style_btn(self.plugins_btn, has and eng in ("MZ", "MV", "web"))
        self._style_btn(self.saves_btn, has and eng in ("MZ", "MV", "web"))
        self._style_btn(self.decrypt_btn, has and eng in ("XP", "VX", "VXAce"))

    def decrypt_selected(self):
        sel = self.selected()
        if not sel or not sel[1]:
            return
        name, root, engine = sel[1]
        if engine not in ("XP", "VX", "VXAce"):
            return
        out = root.rstrip(os.sep) + "_descifrado"
        if not self._ask(
                _("Descifrar"),
                _("¿Descifrar '%s'?\n\n"
                  "Se descargará RPGMakerDecrypter (una sola vez) y los archivos "
                  "del archivo cifrado (%s) se escribirán en:\n%s")
                % (name, os.path.basename(root), out)):
            return
        self._update_status(_("Descifrando '%s'... esto puede tardar un poco.") % name)
        threading.Thread(target=self._decrypt_worker, args=(root, out, name), daemon=True).start()

    def _decrypt_worker(self, root, out, name):
        script = os.path.join(BASE_DIR, "rpgmaker-decrypter.py")
        r = subprocess.run([sys.executable, script, root, "--output", out],
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                           text=True)
        tail = "\n".join((r.stdout or "").strip().splitlines()[-6:])
        self._set_status(_("Descifrado de '%s' %s.\n%s") % (
            name, (_("completado") if r.returncode == 0
                   else _("con errores (código %d)") % r.returncode), tail))

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
        self._update_status(_("Buscando nuevos .zip..."))
        threading.Thread(target=self._rescan_worker, daemon=True).start()

    def _rescan_worker(self):
        extracted, errors = extract_zips(callback=self._set_status,
                                         auto_delete=self.auto_delete.get())
        self.root.after(0, lambda: self._finish_rescan(extracted, errors))

    def _finish_rescan(self, extracted, errors):
        if extracted:
            msg = _("Extraídos: %s") % ", ".join(extracted)
        else:
            msg = _("Sin nuevos .zip")
        if errors:
            msg += "  |  ERROR: %s" % ", ".join(errors)
        self.load_games()
        self._update_status(msg)

    def _set_status(self, msg):
        self.root.after(0, lambda: self._update_status(msg))

    def _update_status(self, msg):
        if self.launcher.server_running and self.launcher.server_info:
            name, port = self.launcher.server_info
            self.status.set(_("● Servidor ACTIVO: %s → http://localhost:%d   ·   %s")
                            % (name, port, msg))
            self.status_lbl.config(fg=OK)
        else:
            self.status.set(msg)
            self.status_lbl.config(fg=MUTED)

    # --- acciones ---
    def selected(self):
        if self._sel is None or self._sel >= len(self.games):
            return None
        return self._sel, self.games[self._sel]

    def play_selected(self):
        sel = self.selected()
        if not sel:
            return
        idx, game = sel
        if not game:
            self._warn("RPG Maker Launcher",
                       _("Este juego está incompleto (descarga con archivos faltantes).\nVuelve a descargarlo."))
            return
        name, root, engine = game
        if engine in ("MZ", "MV", "web"):
            modo = _("WebKit") if self.use_webkit.get() else _("navegador")
            self._update_status(_("Iniciando servidor para %s (%s)...") % (name, modo))
            self.root.update_idletasks()
            threading.Thread(target=self._play_web, args=(root, name), daemon=True).start()
        else:
            self._update_status(_("Lanzando %s (%s) en su ventana...") % (name, _(ENGINE_LABEL.get(engine, engine))))
            self.root.update_idletasks()
            try:
                self.launcher.launch_native(root, engine)
            except Exception as e:
                self._error("RPG Maker Launcher",
                            _("No se pudo lanzar '%s' (%s).\n\n%s") % (name, _(ENGINE_LABEL.get(engine, engine)), e))
                return
            self._update_status(_("%s lanzado. Cierra la ventana del juego cuando termines.") % name)
        self._start_session(name)

    def _play_web(self, root, name):
        port = self.launcher.launch_web(root, name, webkit=self.use_webkit.get())
        self._set_status("")

    def stop_server_action(self):
        if self.launcher.server_running:
            name, port = self.launcher.server_info
            self.launcher.stop_server()
            self._end_session()
            self._update_status(_("Servidor de '%s' (puerto %d) detenido.") % (name, port))
        else:
            self._update_status(_("No hay ningún servidor activo."))

    def delete_zip_action(self):
        sel = self.selected()
        if not sel or not sel[1]:
            self._update_status(_("Selecciona un juego primero."))
            return
        name = sel[1][0]
        zpath = zip_for_game(name)
        if not os.path.isfile(zpath):
            self._update_status(_("No existe el .zip de '%s'.") % name)
            return
        size = os.path.getsize(zpath) / (1024 * 1024)
        ok = self._ask(_("Borrar .zip"),
                       _("¿Eliminar el .zip de '%s'?\n\n%s\n(%.0f MB — el juego ya extraído se conserva)")
                       % (name, os.path.basename(zpath), size))
        if not ok:
            return
        try:
            os.remove(zpath)
            self._update_status(_(".zip de '%s' eliminado. El juego sigue disponible.") % name)
        except OSError as e:
            self._error("RPG Maker Launcher", _("No se pudo borrar: %s") % e)

    # --- editor de atajos de teclado ---
    def shortcuts_dialog(self):
        mod = _config_module()
        cfg = mod.load_config()
        working = dict(cfg.get("teclas", {}))
        defaults = dict(mod.DEFAULT_CONFIG["teclas"])

        win = tk.Toplevel(self.root)
        win.title(_("Atajos de teclado"))
        win.geometry("560x600")
        win.configure(bg=BG)
        win.transient(self.root)

        header = tk.Frame(win, bg=SURFACE)
        header.pack(fill="x")
        tk.Label(header, text=_("Atajos de teclado del visor"),
                 font=("DejaVu Sans", 13, "bold"), fg=TEXT, bg=SURFACE
                 ).pack(padx=16, pady=(12, 4), anchor="w")
        tk.Label(header, text=_("Haz clic en un atajo y pulsa la combinación de teclas.\n"
                                "Escape cancela la captura. Se guardan en launcher-config.json."),
                 font=F_META, fg=MUTED, bg=SURFACE).pack(padx=16, pady=(0, 12), anchor="w")

        body = tk.Frame(win, bg=BG)
        body.pack(fill="both", expand=True, padx=16, pady=12)
        canvas = tk.Canvas(body, bg=BG, highlightthickness=0, bd=0)
        canvas.pack(side="left", fill="both", expand=True)
        vsb = tk.Scrollbar(body, orient="vertical", command=canvas.yview,
                           bg=SURFACE, troughcolor=BG, activebackground=BORDER,
                           bd=0, highlightthickness=0, width=12)
        canvas.configure(yscrollcommand=vsb.set)
        vsb.pack(side="left", fill="y", padx=(6, 0))
        inner = tk.Frame(canvas, bg=BG)
        win_id = canvas.create_window((0, 0), window=inner, anchor="nw")
        inner.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.bind("<Configure>", lambda e: canvas.itemconfig(win_id, width=e.width))
        canvas.bind("<Button-4>", lambda e: canvas.yview_scroll(-1, "units"))
        canvas.bind("<Button-5>", lambda e: canvas.yview_scroll(1, "units"))

        keybtns = {}

        def _make_row(desc, action):
            row = tk.Frame(inner, bg=BG)
            row.pack(fill="x", pady=4)
            tk.Label(row, text=desc, font=F_BTN, fg=TEXT, bg=BG,
                     anchor="w").pack(side="left")
            btn = tk.Button(row, text="", font=("DejaVu Sans", 9, "bold"),
                            bg=CARD, fg=ACCENT, activebackground=BORDER,
                            activeforeground=TEXT, relief="flat", bd=0,
                            cursor="hand2", padx=14, pady=4,
                            highlightthickness=0)
            btn.pack(side="right")

            def set_text():
                key = working.get(action, "") or "—"
                btn.config(text=key)
                btn.config(fg=ACCENT if working.get(action) else FAINT)

            btn.config(command=lambda: _begin_record(btn))
            set_text()
            keybtns[action] = (btn, set_text)

        def _begin_record(btn):
            win.recording = btn
            for b, _ in keybtns.values():
                b.config(bg=CARD, fg=ACCENT)
            btn.config(text=_("Pulsa la tecla..."), bg=ACCENT, fg="#ffffff")
            win.focus_force()

        def _on_key(e):
            btn = getattr(win, "recording", None)
            if btn is None:
                return
            if e.keysym in ("Escape",):
                win.recording = None
                for b, set_text in keybtns.values():
                    b.config(bg=CARD, fg=ACCENT)
                    set_text()
                return
            if e.keysym in ("Control_L", "Control_R", "Shift_L", "Shift_R",
                            "Alt_L", "Alt_R", "Super_L", "Super_R", "Mode_switch"):
                return
            mods = []
            if e.state & 0x4:
                mods.append("Control")
            if e.state & 0x1:
                mods.append("Shift")
            if e.state & 0x8:
                mods.append("Alt")
            keysym = e.keysym
            value = "+".join(mods + [keysym])
            action = next((a for a, (b, _) in keybtns.items() if b is btn), None)
            if action is not None:
                try:
                    kv, _m = mod.parse_key(value)
                    if not kv:
                        self._warn(_("Atajos"), _("Tecla no válida: %s") % value)
                        win.recording = None
                        return
                except Exception:
                    pass
                working[action] = value
            win.recording = None
            for b, set_text in keybtns.values():
                b.config(bg=CARD, fg=ACCENT)
                set_text()

        win.bind("<Key>", _on_key)
        win.bind("<Button-4>", lambda e: canvas.yview_scroll(-1, "units"))
        win.bind("<Button-5>", lambda e: canvas.yview_scroll(1, "units"))

        for action, desc in mod.KEY_ACTIONS:
            _make_row(desc, action)

        bar = tk.Frame(win, bg=SURFACE)
        bar.pack(fill="x", padx=16, pady=(0, 14))

        def _restore():
            working.clear()
            working.update(defaults)
            for b, set_text in keybtns.values():
                set_text()

        def _save():
            try:
                cfg["teclas"] = working
                mod.save_config(cfg)
            except OSError as e:
                self._error(_("Atajos"), _("No se pudo guardar: %s") % e)
                return
            win.destroy()
            self._update_status(_("Atajos de teclado guardados."))

        self._make_button(bar, _("Cancelar"), command=win.destroy).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Guardar"), command=_save, accent=True).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Restaurar valores por defecto"), command=_restore).pack(side="left")

        win.grab_set()

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
            self._warn(_("Plugins"), str(e))
            return

        win = tk.Toplevel(self.root)
        win.title(_("Plugins") + " - %s" % name)
        win.geometry("660x480")
        win.configure(bg=BG)
        header = tk.Frame(win, bg=SURFACE)
        header.pack(fill="x")
        tk.Label(header, text=_("Plugins") + " · %s" % name,
                 font=("DejaVu Sans", 13, "bold"), fg=TEXT, bg=SURFACE
                 ).pack(padx=16, pady=(12, 4), anchor="w")
        tk.Label(header, text=_("Activa o desactiva los plugins del juego (js/plugins.js)."),
                 font=F_META, fg=MUTED, bg=SURFACE).pack(padx=16, pady=(0, 12), anchor="w")
        body = tk.Frame(win, bg=BG)
        body.pack(fill="both", expand=True, padx=16, pady=12)
        tv = ttk.Treeview(body, columns=("estado", "cat"),
                          show="tree headings", selectmode="extended")
        tv.heading("#0", text=_("Plugin"))
        tv.column("#0", width=300, anchor="w")
        tv.heading("estado", text=_("Estado"))
        tv.column("estado", width=60, anchor="center")
        tv.heading("cat", text=_("WebKit"))
        tv.column("cat", width=190, anchor="w")
        tv.pack(side="left", fill="both", expand=True)
        vsb = tk.Scrollbar(body, orient="vertical", command=tv.yview,
                           bg=SURFACE, troughcolor=BG, activebackground=BORDER,
                           bd=0, highlightthickness=0, width=12)
        tv.configure(yscrollcommand=vsb.set)
        vsb.pack(side="left", fill="y", padx=(6, 0))

        def _fill():
            tv.delete(*tv.get_children())
            for p in plugins:
                a = mod.analyze(p.get("name", "?"), root)
                lab = {_("ok"): "ok", _("NW protegido"): "nw-protegido",
                       _("ROTO (nw.js)"): "roto", _("sin fichero"): "sin-fichero"}[a["categoria"]]
                tv.insert("", "end", text=p.get("name", "?"),
                          values=("ON" if p.get("status") else "off", lab))

        def _toggle(on, selected):
            targets = [tv.item(i, "text") for i in selected]
            if not targets:
                self._info(_("Plugins"), _("Selecciona al menos un plugin."))
                return
            try:
                path2, raw2, plugins2 = mod.load_plugins(root)
                names = {p.get("name") for p in plugins2}
                bad = [n for n in targets if n not in names]
                if bad:
                    self._warn(_("Plugins"), _("No encontrados: %s") % ", ".join(bad))
                    return
                ch = 0
                for p in plugins2:
                    if p.get("name") in targets and p.get("status") != on:
                        p["status"] = on
                        ch += 1
                if ch:
                    mod.save_plugins(path2, raw2, plugins2)
            except SystemExit as e:
                self._error(_("Plugins"), str(e))
                return
            _fill()
            self._update_status(_("Plugins de '%s' %s: %d") %
                                (name, _("activados") if on else _("desactivados"), ch))

        def _restore():
            if not self._ask(_("Plugins"), _("¿Restaurar js/plugins.js al original?")):
                return
            try:
                p, _, _ = mod.load_plugins(root)
                bak = p + ".bak"
                if not os.path.isfile(bak):
                    self._info(_("Plugins"), _("Aún no hay copia original (no se ha modificado nada)."))
                    return
                shutil.copy2(bak, p)
            except SystemExit as e:
                self._error(_("Plugins"), str(e))
                return
            _fill()
            self._update_status(_("plugins.js de '%s' restaurado.") % name)

        bar = tk.Frame(win, bg=SURFACE)
        bar.pack(fill="x", padx=16, pady=(0, 14))
        self._make_button(bar, _("Cerrar"), command=win.destroy).pack(side="right")
        self._make_button(bar, _("Restaurar original"), command=_restore).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Todo OFF"),
                          command=lambda: _toggle(False, tv.get_children())).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Todo ON"),
                          command=lambda: _toggle(True, tv.get_children())).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Desactivar"),
                          command=lambda: _toggle(False, tv.selection())).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Activar"),
                          command=lambda: _toggle(True, tv.selection()), accent=True).pack(side="right", padx=(8, 0))
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
            self._info(_("Partidas"),
                       _("Aún no existe la carpeta 'save/' de este juego.\n"
                         "Guarda al menos una vez dentro del juego y vuelve."))
            return

        win = tk.Toplevel(self.root)
        win.title(_("Partidas") + " - %s" % name)
        win.geometry("620x460")
        win.configure(bg=BG)
        header = tk.Frame(win, bg=SURFACE)
        header.pack(fill="x")
        tk.Label(header, text=_("Partidas") + " · %s" % name,
                 font=("DejaVu Sans", 13, "bold"), fg=TEXT, bg=SURFACE
                 ).pack(padx=16, pady=(12, 4), anchor="w")
        tk.Label(header, text=_("Copia, restaura, exporta o borra los archivos de guardado."),
                 font=F_META, fg=MUTED, bg=SURFACE).pack(padx=16, pady=(0, 12), anchor="w")
        body = tk.Frame(win, bg=BG)
        body.pack(fill="both", expand=True, padx=16, pady=12)
        tv = ttk.Treeview(body, columns=("size", "mod"),
                          show="tree headings", selectmode="extended")
        tv.heading("#0", text=_("Archivo"))
        tv.column("#0", width=270, anchor="w")
        tv.heading("size", text=_("Tamaño"))
        tv.column("size", width=90, anchor="e")
        tv.heading("mod", text=_("Modificado"))
        tv.column("mod", width=130, anchor="w")
        tv.pack(side="left", fill="both", expand=True)
        vsb = tk.Scrollbar(body, orient="vertical", command=tv.yview,
                           bg=SURFACE, troughcolor=BG, activebackground=BORDER,
                           bd=0, highlightthickness=0, width=12)
        tv.configure(yscrollcommand=vsb.set)
        vsb.pack(side="left", fill="y", padx=(6, 0))

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
            self._update_status(_("Copia de '%s': %d archivo(s) en backups/%s/%s") % (name, n, name, ts))
            self._info(_("Partidas"), _("Copia de seguridad creada:\n%s") % dest)

        def _restore():
            bdir = os.path.join(BACKUPS_DIR, name)
            if not os.path.isdir(bdir):
                self._info(_("Partidas"), _("Aún no hay copias de seguridad."))
                return
            snaps = sorted(d for d in os.listdir(bdir) if os.path.isdir(os.path.join(bdir, d)))
            if not snaps:
                self._info(_("Partidas"), _("Aún no hay copias de seguridad."))
                return
            choice = self._ask_text(
                _("Restaurar"), _("Copias disponibles:\n%s\n\nEscribe una para restaurarla:") % "\n".join(snaps))
            if not choice or choice not in snaps:
                return
            src = os.path.join(bdir, choice)
            n = 0
            for fn in os.listdir(src):
                shutil.copy2(os.path.join(src, fn), os.path.join(sdir, fn))
                n += 1
            _fill()
            self._update_status(_("Partidas de '%s' restauradas desde %s (%d archivo(s)).") % (name, choice, n))

        def _export():
            sel = [tv.item(i, "text") for i in tv.selection()]
            if not sel:
                self._info(_("Partidas"), _("Selecciona archivos para exportar."))
                return
            dest = self._ask_dir(_("Carpeta de destino"))
            if not dest:
                return
            for fn in sel:
                shutil.copy2(os.path.join(sdir, fn), os.path.join(dest, fn))
            self._update_status(_("Exportadas %d partida(s) a %s") % (len(sel), dest))

        def _delete():
            sel = [tv.item(i, "text") for i in tv.selection()]
            if not sel:
                return
            if not self._ask(_("Partidas"), _("¿Borrar %d archivo(s) de partida?") % len(sel)):
                return
            for fn in sel:
                try:
                    os.remove(os.path.join(sdir, fn))
                except OSError as e:
                    self._error(_("Partidas"), str(e))
            _fill()

        def _open_dir():
            subprocess.Popen(["xdg-open", sdir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        bar = tk.Frame(win, bg=SURFACE)
        bar.pack(fill="x", padx=16, pady=(0, 14))
        self._make_button(bar, _("Cerrar"), command=win.destroy).pack(side="right")
        self._make_button(bar, _("Abrir carpeta"), command=_open_dir).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Borrar"), command=_delete).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Exportar"), command=_export).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Restaurar"), command=_restore).pack(side="right", padx=(8, 0))
        self._make_button(bar, _("Copia de seguridad"), command=_backup,
                          accent=True).pack(side="right", padx=(8, 0))
        _fill()

    def on_close(self):
        self._end_session()
        self.launcher.stop_server()
        self.root.destroy()


def main():
    global CLI_LANG
    args = sys.argv[1:]
    if "--lang" in args:
        i = args.index("--lang")
        if i + 1 < len(args) and args[i + 1] in ("es", "en"):
            CLI_LANG = args[i + 1]
    if not os.path.isdir(GAMES_DIR):
        os.makedirs(GAMES_DIR, exist_ok=True)
    app = App()
    app.root.mainloop()


if __name__ == "__main__":
    main()
