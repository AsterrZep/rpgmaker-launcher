#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - descifrador de juegos RPG Maker
#
#  Integra RPGMakerDecrypter (https://github.com/uuksu/RPGMakerDecrypter):
#  descifra archivos cifrados de XP/VX/VX Ace (Game.rgssad, Game.rgss2a,
#  Game.rgss3a) y de MV/MZ (imágenes/audio .rpgmvp/.rpgmvo/.rpgmvm).
#
#  El binario se descarga una sola vez desde los releases oficiales y se
#  guarda en runtimes/. Es un programa de terceros: se ejecuta tal cual.
#
#  Uso:
#    rpgmaker-decrypter.py JUEGO [--output DIR] [--recreate]
#      JUEGO  -> carpeta del juego o archivo .rgss3a/.rgss2a/.rgssad
#      --output DIR  -> carpeta donde escribir (por defecto: JUEGO_descifrado)
#      --recreate    -> intentar reconstruir el proyecto original
#      --download-only -> solo descargar/actualizar el binario y salir
# ============================================================
import argparse
import os
import platform
import shutil
import subprocess
import sys
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUN_DIR = os.path.join(BASE_DIR, "runtimes")
BIN = os.path.join(RUN_DIR, "RPGMakerDecrypter-cli")
VERSION = "v3.0.4"
URL = ("https://github.com/uuksu/RPGMakerDecrypter/releases/download/%s/"
       "RPGMakerDecrypter-cli" % VERSION)

RGSS_EXT = (".rgssad", ".rgss2a", ".rgss3a")


def die(msg):
    print("ERROR: %s" % msg, file=sys.stderr)
    sys.exit(1)


def have_arch(root):
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f.lower().endswith(RGSS_EXT):
                return os.path.join(dirpath, f)
    return None


def ensure_binary():
    if os.path.isfile(BIN) and os.access(BIN, os.X_OK):
        return
    print(">> Descargando RPGMakerDecrypter %s (una sola vez)..." % VERSION)
    os.makedirs(RUN_DIR, exist_ok=True)
    tmp = BIN + ".tmp"
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "rpgmaker-launcher"})
        with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as fh:
            shutil.copyfileobj(r, fh)
        os.chmod(tmp, 0o755)
        os.replace(tmp, BIN)
    except Exception as e:
        try:
            os.remove(tmp)
        except OSError:
            pass
        die("No se pudo descargar el descifrador: %s\n%s" % (e, URL))
    print(">> Binario listo: %s" % BIN)


def find_target(arg):
    if os.path.isdir(arg):
        arch = have_arch(arg)
        if arch:
            return arch
        # MV/MZ: la carpeta entera es la entrada
        return arg
    if os.path.isfile(arg):
        return arg
    die("No existe: %s" % arg)


def main():
    ap = argparse.ArgumentParser(description="Descifra archivos cifrados de juegos RPG Maker")
    ap.add_argument("juego", nargs="?", help="carpeta del juego o archivo .rgss3a/.rgss2a/.rgssad")
    ap.add_argument("--output", "-o", help="carpeta de salida (por defecto: <juego>_descifrado)")
    ap.add_argument("--recreate", action="store_true",
                    help="intentar reconstruir la estructura original del proyecto")
    ap.add_argument("--overwrite", action="store_true",
                    help="sobrescribir archivos de destino existentes")
    ap.add_argument("--download-only", action="store_true")
    args = ap.parse_args()

    ensure_binary()

    if args.download_only:
        print("RPGMakerDecrypter disponible en %s" % BIN)
        return

    if not args.juego:
        ap.print_help()
        sys.exit(1)

    machine = platform.machine().lower()
    if machine not in ("x86_64", "amd64"):
        print("Aviso: binario pensado para x86_64; tu máquina es '%s' (puede no funcionar)." % machine)

    target = find_target(args.juego)
    out = args.output or (os.path.splitext(target)[0] if target.lower().endswith(RGSS_EXT)
                          else target.rstrip(os.sep)) + "_descifrado"

    cmd = [BIN]
    if target.lower().endswith(RGSS_EXT):
        cmd.append(target)
    else:
        cmd.append(target)
    if args.recreate:
        cmd.append("--reconstruct-project")
    if args.overwrite:
        cmd.append("--overwrite")
    cmd.append("--output=%s" % out)

    print(">> Descifrando: %s" % target)
    print(">> Salida:      %s" % out)
    try:
        r = subprocess.run(cmd)
    except OSError as e:
        die("No se pudo ejecutar %s: %s" % (BIN, e))
    if r.returncode == 0:
        print("\n¡Listo! Archivos descifrados en: %s" % out)
    else:
        print("\nEl descifrador terminó con código %d. Revisa el mensaje anterior." % r.returncode)
        sys.exit(r.returncode)


if __name__ == "__main__":
    main()