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
    stats = {"requests": 0, "bytes": 0}

    def log_message(self, *args):
        if getattr(self.server, "verbose", False):
            super().log_message(*args)

    def end_headers(self):
        # Evitar cachear configuración crítica que el usuario o el lanzador modifican,
        # como plugins.js, index.html o package.json.
        path = self.path.split("?")[0].lower()
        if path.endswith("plugins.js") or path.endswith("index.html") or path.endswith("package.json"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        else:
            self.send_header("Cache-Control", "public, max-age=300")
        super().end_headers()

    def log_request(self, code="-", size="-"):
        GameHandler.stats["requests"] += 1
        try:
            GameHandler.stats["bytes"] += int(size)
        except (TypeError, ValueError):
            pass
        if getattr(self.server, "verbose", False):
            super().log_request(code, size)

    def guess_type(self, path):
        mime = super().guess_type(path)
        if path.endswith(".wasm") and mime == "application/octet-stream":
            return "application/wasm"
        return mime

    # Al cerrar el servidor, volcar estadísticas a stderr
    def handle_close(self):
        super().handle_close()
        server = self.server
        if server is not None and getattr(server, "_stat_dumped", False):
            return
        server._stat_dumped = True
        print("rpgmaker-server: %d peticiones, %d bytes servidos"
              % (GameHandler.stats["requests"], GameHandler.stats["bytes"]),
              file=sys.stderr)


def main():
    ap = argparse.ArgumentParser(description="Servidor HTTP rápido para juegos RPG Maker (MZ/MV)")
    ap.add_argument("port", type=int, help="puerto (0 = elegir uno libre)")
    ap.add_argument("--dir", default=".", help="carpeta del juego a servir")
    ap.add_argument("--verbose", action="store_true",
                    help="mostrar cada petición y las estadísticas al cerrar")
    args = ap.parse_args()

    handler = functools.partial(GameHandler, directory=args.dir)
    httpd = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    httpd.verbose = args.verbose
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