#!/usr/bin/env python3
# ============================================================
#  Wrapper: delega en backend.plugins
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.plugins import *
from backend.plugins import __all__

if __name__ == "__main__":
    import argparse
    
    ap = argparse.ArgumentParser(description="Gestor de plugins de juegos RPG Maker (MZ/MV)")
    sub = ap.add_subparsers(dest="cmd")
    sub.required = True
    
    p = sub.add_parser("list", help="ver plugins y su compatibilidad con el visor WebKit")
    p.add_argument("juego")
    
    for nombre, help_ in (("disable", "desactivar"), ("enable", "activar")):
        p = sub.add_parser(nombre, help="%s plugins" % help_)
        p.add_argument("juego")
        p.add_argument("nombres", nargs="*")
        p.add_argument("--all", action="store_true")
    
    p = sub.add_parser("restore", help="volver al plugins.js original")
    p.add_argument("juego")
    
    args = ap.parse_args()
    
    if args.cmd == "list":
        path, analyzed, has_bak = get_plugins_status(args.juego)
        n_on = sum(1 for p in analyzed if p.get("status"))
        print("Plugins: %d activos de %d totales  (%s)" % (n_on, len(analyzed), os.path.relpath(path)))
        if n_on and not has_bak:
            print("(aún sin copia de seguridad: la primera modificación creará plugins.js.bak)")
        print()
        for p in analyzed:
            estado = "ON " if p.get("status") else "off"
            icon = {"roto": "ROTO ", "nw-protegido": "NW  ", "ok": "ok  ", "sin-fichero": "??  "}[p["category"]]
            extra = ""
            if p["category"] != "ok":
                extra = "  <- " + ", ".join(p["motivos"])
            print("%s %s %s%s" % (estado, icon, p.get("name", "?"), extra))
    
    elif args.cmd in ("disable", "enable"):
        activar = args.cmd == "enable"
        try:
            modified = toggle_plugin(args.juego, args.nombres, activar, args.all)
            if not modified:
                print("Nada que cambiar (ya estaban %s)." % ("activados" if activar else "desactivados"))
            else:
                verbo = "activados" if activar else "desactivados"
                print("%s: %d plugin(s) %s" % (verbo, len(modified), ", ".join(modified)))
                if not activar:
                    print("Recuerda: relanza el juego para ver el efecto.")
        except ValueError as e:
            print("Error: %s" % e, file=sys.stderr)
            sys.exit(1)
    
    elif args.cmd == "restore":
        restore_plugins(args.juego)
