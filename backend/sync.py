#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Sincronización de Partidas
# ============================================================
# Copia los saves de cada juego hacia/desde una carpeta de
# destino elegida por el usuario. Funciona con cualquier
# carpeta sincronizada por terceros (Dropbox, Syncthing,
# Nextcloud, USB...): aquí solo se copian archivos.
#
# - push: local -> destino
# - pull: destino -> local (con backup automático previo)
# ============================================================
import os
import shutil
import time

from .utils import log


def _copy_files(src, dst):
    """Copia todos los archivos de src a dst.
    
    Args:
        src: Directorio origen
        dst: Directorio destino
    
    Returns:
        int: Número de archivos copiados
    """
    n = 0
    os.makedirs(dst, exist_ok=True)
    
    for fn in os.listdir(src):
        full = os.path.join(src, fn)
        if os.path.isfile(full):
            shutil.copy2(full, os.path.join(dst, fn))
            n += 1
    
    return n


def count_saves(saves_dir):
    """Cuenta el número de archivos de guardado en un directorio.
    
    Args:
        saves_dir: Directorio con los saves
    
    Returns:
        int: Número de saves, o -1 si el directorio no existe
    """
    if not os.path.isdir(saves_dir):
        return -1
    
    return sum(1 for f in os.listdir(saves_dir)
               if os.path.isfile(os.path.join(saves_dir, f)))


def push(saves_dir, dest_dir):
    """Copia saves locales al directorio destino.
    
    Args:
        saves_dir: Directorio de saves local
        dest_dir: Directorio destino
    
    Returns:
        int: Número de archivos copiados
    """
    if not os.path.isdir(saves_dir):
        return 0
    
    return _copy_files(saves_dir, dest_dir)


def pull(saves_dir, dest_dir):
    """Copia saves del destino al directorio local con backup automático.
    
    Args:
        saves_dir: Directorio de saves local
        dest_dir: Directorio origen (destino de sync)
    
    Returns:
        tuple: (número_archivos_copiados, ruta_backup_o_None)
    """
    if not os.path.isdir(dest_dir):
        return 0, None
    
    bak = None
    
    # Crear backup previo si hay saves locales
    if os.path.isdir(saves_dir) and os.listdir(saves_dir):
        ts = time.strftime("%Y%m%d-%H%M%S")
        bak = saves_dir.rstrip(os.sep) + "-pre-pull-" + ts
        os.makedirs(bak, exist_ok=True)
        
        for fn in os.listdir(saves_dir):
            full = os.path.join(saves_dir, fn)
            if os.path.isfile(full):
                shutil.copy2(full, os.path.join(bak, fn))
        
        log("Backup pre-pull creado: %s" % bak)
    
    # Copiar desde destino a local
    n = _copy_files(dest_dir, saves_dir)
    return n, bak


def sync_all(games, sync_root, mode):
    """Sincroniza varios juegos de una vez.
    
    Args:
        games: Lista de tuplas (nombre, saves_dir)
        sync_root: Directorio raíz de sincronización
        mode: "push" o "pull"
    
    Returns:
        list: Lista de tuplas (nombre, número_archivos)
    """
    results = []
    
    for name, saves_dir in games:
        dest = os.path.join(sync_root, name, "save")
        
        if not os.path.isdir(saves_dir):
            continue
        
        if mode == "push":
            n = push(saves_dir, dest)
            results.append((name, n))
        else:
            n, _bak = pull(saves_dir, dest)
            results.append((name, n))
    
    return results


def get_sync_status(games, sync_folder, auto_sync):
    """Obtiene el estado de sincronización para todos los juegos.
    
    Args:
        games: Lista de juegos (dicts con 'name' y 'path')
        sync_folder: Carpeta de sincronización
        auto_sync: Si la sincronización automática está habilitada
    
    Returns:
        dict: Estado de sincronización
    """
    games_summary = []
    
    for g in games:
        name = g["name"]
        local_save_dir = os.path.join(g["path"], "save")
        local_count = count_saves(local_save_dir)
        
        dest_save_dir = os.path.join(sync_folder, name, "save") if sync_folder else ""
        dest_count = count_saves(dest_save_dir) if sync_folder else -1
        
        games_summary.append({
            "name": name,
            "local_saves": local_count,
            "dest_saves": dest_count,
        })
    
    return {
        "destination": sync_folder,
        "auto_sync": auto_sync,
        "games": games_summary,
    }


# ---------- CLI ----------
if __name__ == "__main__":
    import argparse
    import sys
    
    ap = argparse.ArgumentParser(description="Sincronización de partidas RPG Maker")
    sub = ap.add_subparsers(dest="cmd")
    sub.required = True
    
    p = sub.add_parser("push", help="Copiar saves locales al destino")
    p.add_argument("saves_dir")
    p.add_argument("dest_dir")
    
    p = sub.add_parser("pull", help="Copiar saves del destino al local")
    p.add_argument("saves_dir")
    p.add_argument("dest_dir")
    
    p = sub.add_parser("status", help="Mostrar estado de sincronización")
    p.add_argument("saves_dir")
    p.add_argument("dest_dir")
    
    args = ap.parse_args()
    
    if args.cmd == "push":
        n = push(args.saves_dir, args.dest_dir)
        print("Copiados: %d archivos" % n)
    
    elif args.cmd == "pull":
        n, bak = pull(args.saves_dir, args.dest_dir)
        print("Copiados: %d archivos" % n)
        if bak:
            print("Backup: %s" % bak)
    
    elif args.cmd == "status":
        local = count_saves(args.saves_dir)
        dest = count_saves(args.dest_dir)
        print("Local: %d saves" % local)
        print("Destino: %d saves" % dest)
