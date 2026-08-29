#!/usr/bin/env python3
# ============================================================
#  Wrapper: delega en backend.decrypter
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.decrypter import *
from backend.decrypter import __all__

if __name__ == "__main__":
    import argparse
    
    ap = argparse.ArgumentParser(description="Descifra archivos cifrados de juegos RPG Maker")
    ap.add_argument("juego", nargs="?", help="carpeta del juego o archivo .rgss3a/.rgss2a/.rgssad")
    ap.add_argument("--output", "-o", help="carpeta de salida")
    ap.add_argument("--recreate", action="store_true",
                    help="intentar reconstruir la estructura original del proyecto")
    ap.add_argument("--overwrite", action="store_true",
                    help="sobrescribir archivos de destino existentes")
    ap.add_argument("--download-only", action="store_true")
    args = ap.parse_args()

    ensure_binary()

    if args.download_only:
        print("RPGMakerDecrypter disponible en %s" % BIN)
        sys.exit(0)

    if not args.juego:
        ap.print_help()
        sys.exit(1)

    import platform
    machine = platform.machine().lower()
    if machine not in ("x86_64", "amd64"):
        print("Aviso: binario pensado para x86_64; tu máquina es '%s' (puede no funcionar)." % machine)

    target = find_target(args.juego)
    code, out = decrypt_rgss(target, args.output, args.recreate, args.overwrite)
    sys.exit(code)
