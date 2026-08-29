#!/usr/bin/env python3
# ============================================================
#  Wrapper: delega en backend.saveedit
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.saveedit import *
from backend.saveedit import __all__

if __name__ == "__main__":
    import argparse
    import json
    
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
