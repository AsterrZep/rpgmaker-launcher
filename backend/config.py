#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Configuración Central
# ============================================================
# Módulo para gestionar las preferencias del usuario en
# launcher-config.json: atajos de teclado, opciones generales,
# rutas de sincronización, etc.
# ============================================================
import json
import os
import importlib.util

from .utils import DATA_DIR, CONFIG_FILE

DEFAULT_CONFIG = {
    "teclas": {
        "trucos": "F8",            # abrir/cerrar menú de trucos (inyectado en MZ/MV)
        "recargar": "F5",          # recargar el juego en el visor
        "fps": "F9",               # mostrar/ocultar contador de FPS
        "captura": "F12",          # captura de pantalla
        "pantalla_completa": "F11",
        "salir_pantalla_completa": "Escape",
        "zoom_in": "Control+equal",
        "zoom_out": "Control+minus",
        "zoom_0": "Control+0",
    },
    "general": {
        "webkit": False,           # visor WebKit por defecto
        "auto_delete_zip": False,  # borrar el .zip tras extraer
        "games_dir": "",           # carpeta de juegos (vacío = DATA_DIR/games)
    },
}

# Orden y etiquetas para el menú de configuración
KEY_ACTIONS = [
    ("trucos", "Abrir/cerrar menú de trucos"),
    ("recargar", "Recargar el juego"),
    ("fps", "Mostrar/ocultar FPS"),
    ("captura", "Captura de pantalla"),
    ("pantalla_completa", "Pantalla completa"),
    ("salir_pantalla_completa", "Salir de pantalla completa"),
    ("zoom_in", "Acercar zoom"),
    ("zoom_out", "Alejar zoom"),
    ("zoom_0", "Zoom normal"),
]

GENERAL_OPTIONS = [
    ("webkit", "Usar el visor WebKit (más ligero) por defecto"),
    ("auto_delete_zip", "Eliminar el .zip tras extraer (por defecto)"),
    ("games_dir", "Carpeta donde guardar juegos y archivos .zip"),
]


def _deep_copy(obj):
    """Crea una copia profunda de un objeto serializable."""
    return json.loads(json.dumps(obj))


def _merge(base, override):
    """Fusiona recursivamente dos diccionarios."""
    out = dict(base)
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            out[k] = _merge(base[k], v)
        else:
            out[k] = v
    return out


def load_config():
    """Carga la configuración del usuario desde disco.
    
    Si el archivo no existe o está corrupto, retorna la configuración
    por defecto. La configuración del usuario se fusiona con los defaults
    para asegurar que siempre estén presentes todas las claves.
    """
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return _merge(_deep_copy(DEFAULT_CONFIG), data)
    except (OSError, ValueError):
        return _deep_copy(DEFAULT_CONFIG)


def save_config(cfg):
    """Guarda la configuración del usuario a disco."""
    with open(CONFIG_FILE, "w", encoding="utf-8") as fh:
        json.dump(cfg, fh, ensure_ascii=False, indent=2)


def get_games_dir(cfg=None):
    """Devuelve la carpeta de juegos configurada.
    
    Si está vacía, usa DATA_DIR/games (compatibilidad hacia atrás).
    """
    if cfg is None:
        cfg = load_config()
    gen = cfg.get("general") or {}
    custom = (gen.get("games_dir") or "").strip()
    if custom:
        return os.path.expanduser(custom)
    return os.path.join(DATA_DIR, "games")


def get_sync_settings(cfg=None):
    """Lee la carpeta/auto-sync aceptando ambos formatos de configuración.
    
    Formatos soportados:
    - Nuevo: sync.folder/sync.auto
    - Legacy GUI: general.sync_dir/sync_auto
    """
    if cfg is None:
        cfg = load_config()
    sync = cfg.get("sync") or {}
    gen = cfg.get("general") or {}
    folder = sync.get("folder") or gen.get("sync_dir") or ""
    auto = bool(sync.get("auto", gen.get("sync_auto", False)))
    return folder, auto


def parse_key(name):
    """Convierte 'Control+equal' en (keyval, modifier_mask).
    
    Devuelve (None, 0) si la tecla no se puede interpretar. Gdk se importa
    aquí (no en tiempo de importación) para que la GUI también pueda usar
    este módulo sin tocar Gtk.
    """
    import gi
    gi.require_version("Gdk", "3.0")
    from gi.repository import Gdk

    mods = 0
    key = name or ""
    parts = key.split("+")
    modmap = {
        "control": Gdk.ModifierType.CONTROL_MASK,
        "ctrl": Gdk.ModifierType.CONTROL_MASK,
        "shift": Gdk.ModifierType.SHIFT_MASK,
        "alt": Gdk.ModifierType.MOD1_MASK,
    }
    if len(parts) > 1:
        key = parts[-1]
        for p in parts[:-1]:
            mods |= modmap.get(p.strip().lower(), 0)
    kv = Gdk.keyval_from_name(key) if key else 0
    return kv, mods


def load_config_module():
    """Carga este módulo por importlib (para archivos con guion)."""
    spec = importlib.util.spec_from_file_location("rpgmaker_config", __file__)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------- CLI ----------
if __name__ == "__main__":
    import sys
    if "--defaults" in sys.argv:
        save_config(_deep_copy(DEFAULT_CONFIG))
        print("Configuración restablecida a los valores por defecto: %s" % CONFIG_FILE)
    else:
        print(json.dumps(load_config(), ensure_ascii=False, indent=2))
