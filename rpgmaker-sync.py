#!/usr/bin/env python3
# ============================================================
#  Wrapper: delega en backend.sync
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.sync import *
from backend.sync import __all__

if __name__ == "__main__":
    import argparse
    
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
