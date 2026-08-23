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
import base64
import functools
import json
import os
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BRIDGE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rpgmaker-savebridge.js")


def _config():
    """Carga la configuración del usuario (atajos, preferencias)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "rpgmaker_config", os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                        "rpgmaker-config.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.load_config()


class GameHandler(SimpleHTTPRequestHandler):
    stats = {"requests": 0, "bytes": 0}

    def log_message(self, *args):
        if getattr(self.server, "verbose", False):
            super().log_message(*args)

    def end_headers(self):
        # Evitar cachear configuración crítica que el usuario o el lanzador modifican,
        # como plugins.js, index.html, package.json o las rutas de guardado.
        path = self.path.split("?")[0].lower()
        if (path.endswith("plugins.js") or path.endswith("index.html")
                or path.endswith("package.json")
                or path == "/__savebridge.js"
                or path == "/__config.js"
                or path.startswith("/__save/")):
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

    # ---------- guardado en disco (save bridge) ----------
    def _save_path(self, name):
        """Devuelve la ruta segura al archivo de partida en save/."""
        if not name or "/" in name or "\\" in name or ".." in name:
            return None
        save_dir = os.path.join(self.directory, "save")
        return os.path.join(save_dir, name)

    def _handle_save(self, method, name):
        path = self._save_path(name)
        if path is None:
            self.send_error(400, "Bad Request")
            return
        if method == "GET":
            if os.path.isfile(path):
                with open(path, "rb") as fh:
                    data = fh.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                self.send_error(404, "Not Found")
            return
        if method == "POST":
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as fh:
                fh.write(data)
            self.send_response(204, "No Content")
            self.end_headers()
            return
        if method == "DELETE":
            if os.path.isfile(path):
                os.remove(path)
            self.send_response(204, "No Content")
            self.end_headers()
            return
        self.send_error(405, "Method Not Allowed")

    def _handle_save_list(self):
        """Lista todas las partidas existentes con su contenido en base64."""
        save_dir = os.path.join(self.directory, "save")
        out = {}
        if os.path.isdir(save_dir):
            for fn in sorted(os.listdir(save_dir)):
                full = os.path.join(save_dir, fn)
                if os.path.isfile(full):
                    with open(full, "rb") as fh:
                        out[fn] = base64.b64encode(fh.read()).decode("ascii")
        data = json.dumps(out).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/__savebridge.js":
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            with open(BRIDGE_PATH, "rb") as fh:
                data = fh.read()
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if path == "/__save/__all":
            self._handle_save_list()
            return
        if path == "/__config.js":
            self._serve_config_js()
            return
        if path == "/__presets.js":
            self._serve_presets_js()
            return
        if path.startswith("/__mods/"):
            self._serve_mod(path[len("/__mods/"):])
            return
        if path == "/__rewind.js":
            self._serve_static_js("rpgmaker-rewind.js")
            return
        if path == "/__cheats.js":
            self._serve_static_js("rpgmaker-cheats.js")
            return
        if path == "/__gamepad.js":
            self._serve_static_js("rpgmaker-gamepad.js")
            return
        if path == "/__browserkeys.js":
            self._serve_static_js("rpgmaker-browser-keys.js")
            return
        if path.startswith("/__save/"):
            name = urllib.parse.unquote(path[len("/__save/"):])
            self._handle_save("GET", name)
            return
        if path.endswith("/index.html"):
            self._serve_index_injected(path)
            return
        super().do_GET()

    def _serve_static_js(self, filename):
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
        try:
            with open(path, "rb") as fh:
                data = fh.read()
        except OSError:
            self.send_error(404, "Not Found")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _serve_config_js(self):
        """Sirve la configuración del usuario como JS (atajos, preferencias)."""
        cfg = _config()
        data = ("window.__RPG_CONFIG__ = %s;" % json.dumps(cfg, ensure_ascii=False)).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _game_root_from_referer(self):
        """Carpeta del juego (donde vive index.html) según el Referer."""
        ref = self.headers.get("Referer")
        if not ref:
            return None
        try:
            p = urllib.parse.urlparse(ref).path
            if p.endswith("/index.html"):
                return os.path.dirname(self.translate_path(p))
        except Exception:
            return None
        return None

    def _serve_mod(self, name):
        """Sirve un mod JS del juego (carpeta mods/ junto a index.html)."""
        name = os.path.basename(urllib.parse.unquote(name))
        groot = self._game_root_from_referer()
        fpath = os.path.join(groot or "", "mods", name)
        if not (groot and os.path.isfile(fpath)):
            self.send_error(404, "Not Found")
            return
        with open(fpath, "rb") as fh:
            data = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _serve_presets_js(self):
        """Sirve los presets de trucos del juego (cheats-presets.json).

        El juego se identifica por el Referer (…/index.html); el JSON se
        busca como cheats-presets.json junto a index.html. Si no existe
        se responde null para que el panel oculte la pestaña.
        """
        presets = None
        groot = self._game_root_from_referer()
        if groot:
            try:
                with open(os.path.join(groot, "cheats-presets.json"),
                          "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                if isinstance(data, dict) and isinstance(data.get("presets"), list):
                    presets = data
            except (OSError, ValueError):
                presets = None
        payload = ("window.__RPG_CHEATS_PRESETS__ = %s;"
                   % json.dumps(presets, ensure_ascii=False)).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        path = self.path.split("?")[0]
        if path.startswith("/__save/"):
            name = urllib.parse.unquote(path[len("/__save/"):])
            self._handle_save("POST", name)
            return
        self.send_error(405, "Method Not Allowed")

    def do_DELETE(self):
        path = self.path.split("?")[0]
        if path.startswith("/__save/"):
            name = urllib.parse.unquote(path[len("/__save/"):])
            self._handle_save("DELETE", name)
            return
        self.send_error(405, "Method Not Allowed")

    def _serve_index_injected(self, path):
        """Sirve index.html inyectando save bridge, trucos y gamepad (una sola vez)."""
        full = self.translate_path(path)
        try:
            with open(full, "rb") as fh:
                content = fh.read().decode("utf-8", "replace")
        except OSError:
            self.send_error(404, "Not Found")
            return
        tags = ['<script src="/__config.js"></script>',
                '<script src="/__savebridge.js"></script>',
                '<script src="/__presets.js"></script>',
                '<script src="/__rewind.js"></script>',
                '<script src="/__cheats.js"></script>',
                '<script src="/__gamepad.js"></script>',
                '<script src="/__browserkeys.js"></script>']
        # Silencia el aviso de deprecación del meta antiguo de MV
        content = content.replace('name="apple-mobile-web-app-capable"',
                                  'name="mobile-web-app-capable"')
        # mods del usuario: <juego>/mods/*.js se cargan tras los scripts base
        try:
            mods_dir = os.path.join(os.path.dirname(full), "mods")
            for mf in sorted(f for f in os.listdir(mods_dir) if f.endswith(".js")):
                tags.append('<script src="/__mods/%s"></script>'
                            % urllib.parse.quote(mf))
        except OSError:
            pass
        for tag in tags:
            if tag not in content:
                if "</head>" in content:
                    content = content.replace("</head>", tag + "</head>", 1)
                elif "</body>" in content:
                    content = content.replace("</body>", tag + "</body>", 1)
                else:
                    content += tag
        data = content.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

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