#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - servidor HTTP rápido para juegos web
#
#  Sustituye a `python3 -m http.server` (que es de UN SOLO
#  hilo y no envía cabeceras de caché). Este servidor:
#    - Atiende peticiones concurrentes (ThreadingHTTPServer)
#    - Envía Cache-Control para que el navegador/visor no
#      vuelva a pedir los assets una y otra vez
#    - Sirve .wasm con el MIME correcto (application/wasm)
#    - No llena la terminal de logs
#
#  Uso:
#    rpgmaker-server.py PUERTO --dir CARPETA_DEL_JUEGO
# ============================================================
import argparse
import functools
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class GameHandler(SimpleHTTPRequestHandler):
    # No hacer log de cada petición en el terminal
    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "public, max-age=300")
        super().end_headers()

    def guess_type(self, path):
        mime = super().guess_type(path)
        if path.endswith(".wasm") and mime == "application/octet-stream":
            return "application/wasm"
        return mime


def main():
    ap = argparse.ArgumentParser(description="Servidor HTTP rápido para juegos RPG Maker (MZ/MV)")
    ap.add_argument("port", type=int, help="puerto (0 = elegir uno libre)")
    ap.add_argument("--dir", default=".", help="carpeta del juego a servir")
    args = ap.parse_args()

    handler = functools.partial(GameHandler, directory=args.dir)
    httpd = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print("rpgmaker-server: sirviendo %s en http://127.0.0.1:%d"
          % (args.dir, httpd.server_address[1]), file=sys.stderr)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()