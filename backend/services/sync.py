#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - sincronización de partidas
#
#  Copia los saves de cada juego hacia/desde una carpeta de
#  destino elegida por el usuario. Funciona con cualquier
#  carpeta sincronizada por terceros (Dropbox, Syncthing,
#  Nextcloud, USB...): aquí solo se copian archivos.
#
#  - push: local -> destino
#  - pull: destino -> local (con backup automático previo)
# ============================================================
import os
import shutil
import time


def _copy_files(src, dst):
    n = 0
    os.makedirs(dst, exist_ok=True)
    for fn in os.listdir(src):
        full = os.path.join(src, fn)
        if os.path.isfile(full):
            shutil.copy2(full, os.path.join(dst, fn))
            n += 1
    return n


def count_saves(saves_dir):
    if not os.path.isdir(saves_dir):
        return -1  # el juego aún no tiene save/
    return sum(1 for f in os.listdir(saves_dir)
               if os.path.isfile(os.path.join(saves_dir, f)))


def push(saves_dir, dest_dir):
    """Local -> destino. Devuelve nº de archivos copiados."""
    if not os.path.isdir(saves_dir):
        return 0
    return _copy_files(saves_dir, dest_dir)


def pull(saves_dir, dest_dir):
    """Destino -> local con backup automático previo.

    Devuelve (copiados, ruta_backup o None).
    """
    if not os.path.isdir(dest_dir):
        return 0, None
    bak = None
    if os.path.isdir(saves_dir) and os.listdir(saves_dir):
        ts = time.strftime("%Y%m%d-%H%M%S")
        bak = saves_dir.rstrip(os.sep) + "-pre-pull-" + ts
        os.makedirs(bak, exist_ok=True)
        for fn in os.listdir(saves_dir):
            full = os.path.join(saves_dir, fn)
            if os.path.isfile(full):
                shutil.copy2(full, os.path.join(bak, fn))
    return _copy_files(dest_dir, saves_dir), bak


def sync_all(games, sync_root, mode):
    """Sincroniza varios juegos de una vez.

    games: lista de tuplas (nombre, saves_dir)
    mode: "push" o "pull"
    Devuelve lista de (nombre, nº_archivos).
    """
    results = []
    for name, saves_dir in games:
        dest = os.path.join(sync_root, name, "save")
        if not os.path.isdir(saves_dir):
            continue
        if mode == "push":
            results.append((name, push(saves_dir, dest)))
        else:
            n, _bak = pull(saves_dir, dest)
            results.append((name, n))
    return results
