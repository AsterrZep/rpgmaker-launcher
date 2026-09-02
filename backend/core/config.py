#!/usr/bin/env python3
# ============================================================
#  Configuración central del lanzador (rpgmaker-config.py)
#
#  Guarda las preferencias del usuario en launcher-config.json:
#  atajos de teclado del visor y del menú de trucos, y opciones
#  generales. La GUI la edita y el visor/servidor la leen.
# ============================================================
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# La config de usuario vive en RPGMAKER_DATA_DIR (si está definido)
# para que la versión instalada no escriba en directorios de sistema.
DATA_DIR = os.path.expanduser(os.environ.get("RPGMAKER_DATA_DIR", "")) or BASE_DIR
CONFIG_FILE = os.path.join(DATA_DIR, "launcher-config.json")

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
    return json.loads(json.dumps(obj))


def _merge(base, override):
    out = dict(base)
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            out[k] = _merge(base[k], v)
        else:
            out[k] = v
    return out


def load_config():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return _merge(_deep_copy(DEFAULT_CONFIG), data)
    except (OSError, ValueError):
        return _deep_copy(DEFAULT_CONFIG)


def save_config(cfg):
    with open(CONFIG_FILE, "w", encoding="utf-8") as fh:
        json.dump(cfg, fh, ensure_ascii=False, indent=2)


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
    import importlib.util
    spec = importlib.util.spec_from_file_location("rpgmaker_config", __file__)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


if __name__ == "__main__":
    import sys
    if "--defaults" in sys.argv:
        save_config(_deep_copy(DEFAULT_CONFIG))
        print("Configuración restablecida a los valores por defecto: %s" % CONFIG_FILE)
    else:
        print(json.dumps(load_config(), ensure_ascii=False, indent=2))