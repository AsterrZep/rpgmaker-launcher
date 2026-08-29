#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Editor de Partidas Guardadas
# ============================================================
# Los saves de MV/MZ son JSON comprimidos con zlib (pako,
# nivel 1 en MZ). Este módulo los lee/escribe manteniendo el
# formato compatible con el juego y hace copia de seguridad
# antes de sobrescribir.
# ============================================================
import json
import os
import shutil
import time
import zlib

from .utils import BACKUPS_DIR, log


def load_save(path):
    """Lee un .rmmzsave/.rvdata2-like MV/MZ y devuelve el objeto JSON.
    
    Intenta descomprimir con zlib; si falla, asume que está sin comprimir.
    
    Args:
        path: Ruta al archivo de guardado
    
    Returns:
        dict: Objeto JSON del save
    """
    with open(path, "rb") as fh:
        raw = fh.read()
    
    try:
        js = zlib.decompress(raw).decode("utf-8")
    except zlib.error:
        # Por si algún juego lo guardó sin comprimir
        js = raw.decode("utf-8")
    
    return json.loads(js)


def dump_save(path, obj, backups_dir=None, game_name=None):
    """Escribe el objeto como save MV/MZ válido.
    
    Si se indica backups_dir, copia el archivo original a
    <backups_dir>/<game>/save-edit-<ts>/ antes de sobrescribir.
    
    Args:
        path: Ruta donde guardar el save
        obj: Objeto JSON a serializar
        backups_dir: Directorio de backups (opcional)
        game_name: Nombre del juego para el backup (opcional)
    """
    if backups_dir and os.path.isfile(path):
        ts = time.strftime("%Y%m%d-%H%M%S")
        dest = os.path.join(
            backups_dir, game_name or "juego",
            "save-edit-" + ts
        )
        os.makedirs(dest, exist_ok=True)
        shutil.copy2(path, os.path.join(dest, os.path.basename(path)))
    
    js = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    tmp = path + ".tmp"
    
    with open(tmp, "wb") as fh:
        fh.write(zlib.compress(js.encode("utf-8"), 1))
    
    os.replace(tmp, path)


def summary(obj):
    """Genera un resumen legible del contenido del save.
    
    Args:
        obj: Objeto JSON del save
    
    Returns:
        dict: Resumen con estadísticas
    """
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


def get_save_info(save_path):
    """Obtiene información detallada de un archivo de guardado.
    
    Args:
        save_path: Ruta al archivo de guardado
    
    Returns:
        dict: Información del save (contenido, resumen, metadatos)
    """
    try:
        data = load_save(save_path)
        sum_info = summary(data)
        
        # Extract gold
        party = data.get("party") or {}
        gold = party.get("_gold", 0)
        
        # Extract items
        items_raw = party.get("_items") or {}
        weapons_raw = party.get("_weapons") or {}
        armors_raw = party.get("_armors") or {}
        
        # Extract variables & switches
        variables_raw = ((data.get("variables") or {}).get("_data")) or []
        switches_raw = ((data.get("switches") or {}).get("_data")) or []
        
        # Extract actors
        actors_raw = ((data.get("actors") or {}).get("_data")) or []
        actors = []
        for idx, a in enumerate(actors_raw):
            if isinstance(a, dict) and a.get("_name"):
                actors.append({
                    "id": a.get("_actorId", idx),
                    "name": a.get("_name", ""),
                    "level": a.get("_level", 1),
                    "hp": a.get("_hp", 0),
                    "mp": a.get("_mp", 0),
                })
        
        return {
            "summary": sum_info,
            "gold": gold,
            "items": items_raw,
            "weapons": weapons_raw,
            "armors": armors_raw,
            "variables": {str(i): v for i, v in enumerate(variables_raw) if v is not None},
            "switches": {str(i): v for i, v in enumerate(switches_raw) if v is not None},
            "actors": actors,
        }
    except Exception as e:
        log("Error leyendo save %s: %s" % (save_path, e))
        return None


def update_save(save_path, updates, backups_dir=None, game_name=None):
    """Actualiza un archivo de guardado con nuevos valores.
    
    Args:
        save_path: Ruta al archivo de guardado
        updates: Dict con los campos a actualizar (gold, items, variables, switches)
        backups_dir: Directorio de backups (opcional)
        game_name: Nombre del juego para el backup (opcional)
    
    Returns:
        bool: True si se guardó correctamente
    """
    try:
        save_obj = load_save(save_path)
        
        # Apply gold
        if "gold" in updates:
            save_obj.setdefault("party", {})["_gold"] = int(updates["gold"])
        
        # Apply items
        if "items" in updates:
            party = save_obj.setdefault("party", {})
            party_items = party.setdefault("_items", {})
            for k, v in updates["items"].items():
                party_items[str(k)] = int(v)
        
        # Apply weapons
        if "weapons" in updates:
            party = save_obj.setdefault("party", {})
            party_weapons = party.setdefault("_weapons", {})
            for k, v in updates["weapons"].items():
                party_weapons[str(k)] = int(v)
        
        # Apply armors
        if "armors" in updates:
            party = save_obj.setdefault("party", {})
            party_armors = party.setdefault("_armors", {})
            for k, v in updates["armors"].items():
                party_armors[str(k)] = int(v)
        
        # Apply variables
        if "variables" in updates:
            var_obj = save_obj.setdefault("variables", {}).setdefault("_data", [])
            for k, v in updates["variables"].items():
                idx = int(k)
                while len(var_obj) <= idx:
                    var_obj.append(0)
                var_obj[idx] = v
        
        # Apply switches
        if "switches" in updates:
            sw_obj = save_obj.setdefault("switches", {}).setdefault("_data", [])
            for k, v in updates["switches"].items():
                idx = int(k)
                while len(sw_obj) <= idx:
                    sw_obj.append(False)
                sw_obj[idx] = bool(v)
        
        dump_save(save_path, save_obj, backups_dir=backups_dir, game_name=game_name)
        log("Save actualizado: %s" % save_path)
        return True
        
    except Exception as e:
        log("Error actualizando save %s: %s" % (save_path, e))
        return False


def create_backup(save_path, backups_dir=None, game_name=None):
    """Crea una copia de seguridad de un save.
    
    Args:
        save_path: Ruta al archivo de guardado
        backups_dir: Directorio de backups (por defecto BACKUPS_DIR)
        game_name: Nombre del juego (por defecto "juego")
    
    Returns:
        str: Ruta del backup creado, o None si falló
    """
    if not os.path.isfile(save_path):
        return None
    
    dest_dir = backups_dir or BACKUPS_DIR
    name = game_name or "juego"
    ts = time.strftime("%Y%m%d-%H%M%S")
    
    backup_path = os.path.join(dest_dir, name, "backup-" + ts)
    os.makedirs(backup_path, exist_ok=True)
    
    try:
        shutil.copy2(save_path, os.path.join(backup_path, os.path.basename(save_path)))
        log("Backup creado: %s" % backup_path)
        return backup_path
    except Exception as e:
        log("Error creando backup: %s" % e)
        return None


# ---------- CLI ----------
if __name__ == "__main__":
    import argparse
    import sys
    
    ap = argparse.ArgumentParser(description="Editor de partidas guardadas RPG Maker")
    sub = ap.add_subparsers(dest="cmd")
    sub.required = True
    
    p = sub.add_parser("show", help="mostrar contenido de un save")
    p.add_argument("save_file")
    
    p = sub.add_parser("backup", help="crear backup de un save")
    p.add_argument("save_file")
    p.add_argument("--game", default="juego")
    
    args = ap.parse_args()
    
    if args.cmd == "show":
        info = get_save_info(args.save_file)
        if info:
            print(json.dumps(info, ensure_ascii=False, indent=2))
        else:
            print("Error al leer el save", file=sys.stderr)
            sys.exit(1)
    
    elif args.cmd == "backup":
        path = create_backup(args.save_file, game_name=args.game)
        if path:
            print("Backup creado en: %s" % path)
        else:
            print("Error al crear backup", file=sys.stderr)
            sys.exit(1)
