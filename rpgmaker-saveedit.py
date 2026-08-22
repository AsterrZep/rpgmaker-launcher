#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - utilidades de edición de partidas
#
#  Los saves de MV/MZ son JSON comprimidos con zlib (pako,
#  nivel 1 en MZ). Este módulo los lee/escribe manteniendo el
#  formato compatible con el juego y hace copia de seguridad
#  antes de sobrescribir.
# ============================================================
import os
import json
import zlib
import shutil
import time


def load_save(path):
    """Lee un .rmmzsave/.rvdata2-like MV/MZ y devuelve el objeto JSON."""
    with open(path, "rb") as fh:
        raw = fh.read()
    try:
        js = zlib.decompress(raw).decode("utf-8")
    except zlib.error:
        # por si algún juego lo guardó sin comprimir
        js = raw.decode("utf-8")
    return json.loads(js)


def dump_save(path, obj, backups_dir=None, game_name=None):
    """Escribe el objeto como save MV/MZ válido.

    Si se indica backups_dir, copia el archivo original a
    <backups_dir>/<game>/save-edit-<ts>/ antes de sobrescribir.
    """
    if backups_dir and os.path.isfile(path):
        ts = time.strftime("%Y%m%d-%H%M%S")
        dest = os.path.join(backups_dir, game_name or "juego",
                            "save-edit-" + ts)
        os.makedirs(dest, exist_ok=True)
        shutil.copy2(path, os.path.join(dest, os.path.basename(path)))
    js = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    tmp = path + ".tmp"
    with open(tmp, "wb") as fh:
        fh.write(zlib.compress(js.encode("utf-8"), 1))
    os.replace(tmp, path)


def summary(obj):
    """Resumen legible del contenido del save."""
    party = obj.get("party") or {}
    items = party.get("_items") or {}
    variables = ((obj.get("variables") or {}).get("_data")) or []
    switches = ((obj.get("switches") or {}).get("_data")) or []
    actors = obj.get("actors") or {}
    names = []
    for a in (actors.get("_data") or []):
        if isinstance(a, dict) and a.get("_name"):
            names.append(a["_name"])
    return {
        "gold": party.get("_gold", 0),
        "items_kinds": len([k for k, v in items.items() if v]),
        "variables_used": len([v for v in variables if v not in (None, 0)]),
        "switches_on": len([s for s in switches if s is True]),
        "actors": ", ".join(names[:6]) or "-",
    }
