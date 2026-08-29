#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Utilidades Compartidas
# ============================================================
import json
import os
import time
import logging

# ---------- Rutas base ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.expanduser(os.environ.get("RPGMAKER_DATA_DIR", "")) or BASE_DIR
DEFAULT_GAMES_DIR = os.path.join(DATA_DIR, "games")
RUN_DIR = os.path.join(BASE_DIR, "runtimes")
BACKUPS_DIR = os.path.join(DATA_DIR, "backups")
STATE_FILE = os.path.join(DATA_DIR, "launcher-state.json")
CONFIG_FILE = os.path.join(DATA_DIR, "launcher-config.json")

# ---------- Logging ----------
LOG_FILE = os.path.join(DATA_DIR, "launcher.log")
GAME_LOGS_DIR = os.path.join(DATA_DIR, "logs")

logger = logging.getLogger("rpgmaker-launcher")


def setup_logging(level=logging.INFO):
    """Configura el logging global de la aplicación."""
    logger.setLevel(level)
    
    # File handler
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
        fh.setLevel(level)
        fh.setFormatter(logging.Formatter(
            "[%(asctime)s] %(levelname)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        ))
        logger.addHandler(fh)
    except OSError:
        pass
    
    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(level)
    ch.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(ch)


def log(msg):
    """Log global de la app (compatibilidad con código anterior)."""
    logger.info(msg)


def safe_log_name(name):
    """Convierte un nombre en un nombre seguro para archivos."""
    safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in name)[:60]
    return safe or "juego"


# ---------- Gestión de estado ----------
def load_state():
    """Carga el estado del launcher desde disco."""
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {"games": {}}


def save_state(state):
    """Guarda el estado del launcher a disco."""
    try:
        os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
        with open(STATE_FILE, "w", encoding="utf-8") as fh:
            json.dump(state, fh, ensure_ascii=False, indent=1)
    except OSError:
        pass


# ---------- Utilidades de archivos ----------
def free_port():
    """Encuentra un puerto libre en localhost."""
    import socket
    s = socket.socket()
    s.bind(("", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def stable_port(game_name):
    """Genera un puerto determinista basado en el nombre del juego."""
    import hashlib
    import socket
    
    h = int(hashlib.md5(game_name.encode("utf-8")).hexdigest(), 16)
    port = 18000 + (h % 10000)
    try:
        s = socket.socket()
        s.bind(("127.0.0.1", port))
        s.close()
        return port
    except OSError:
        return free_port()


def ensure_dir(path):
    """Asegura que un directorio exista, creándolo si es necesario."""
    os.makedirs(path, exist_ok=True)
    return path


def remove_file(path):
    """Elimina un archivo de forma segura, ignorando errores."""
    try:
        if os.path.isfile(path):
            os.remove(path)
            return True
    except OSError:
        pass
    return False
