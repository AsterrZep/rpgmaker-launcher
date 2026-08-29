#!/usr/bin/env python3
# ============================================================
#  Wrapper: delega en backend.server
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.server import *
from backend.server import __all__

if __name__ == "__main__":
    import argparse
    
    ap = argparse.ArgumentParser(description="Servidor HTTP rápido para juegos RPG Maker (MZ/MV)")
    ap.add_argument("port", type=int, nargs="?", default=0, help="puerto (0 = elegir uno libre)")
    ap.add_argument("--dir", default=".", help="carpeta del juego a servir")
    ap.add_argument("--api", action="store_true", help="iniciar como servidor API REST/SSE")
    ap.add_argument("--verbose", action="store_true",
                    help="mostrar cada petición y las estadísticas al cerrar")
    args = ap.parse_args()

    if args.api:
        from backend.api import run_api_server
        run_api_server(port=args.port)
    else:
        httpd, port = start_game_server(args.port, args.dir, args.verbose)
        print("rpgmaker-server: sirviendo %s en http://127.0.0.1:%d" % (args.dir, port),
              file=sys.stderr)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            httpd.server_close()
