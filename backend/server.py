#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Servidor HTTP para Juegos Web
# ============================================================
# Sustituye a `python3 -m http.server` (que es de UN SOLO
# hilo y no envía cabeceras de caché). Este servidor:
#   - Atiende peticiones concurrentes (ThreadingHTTPServer)
#   - Envía Cache-Control para que el navegador/visor no
#     vuelva a pedir los assets una y otra vez
#   - Sirve .wasm con el MIME correcto (application/wasm)
#   - No llena la terminal de logs
# ============================================================
import base64
import functools
import json
import os
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from .utils import BASE_DIR, log

# Rutas a scripts estáticos
SCRIPTS_DIR = os.path.dirname(BASE_DIR)
BRIDGE_PATH = os.path.join(SCRIPTS_DIR, "rpgmaker-savebridge.js")

# Scripts a inyectar en index.html
INJECT_SCRIPTS = [
    "/__config.js",
    "/__savebridge.js",
    "/__presets.js",
    "/__rewind.js",
    "/__cheats.js",
    "/__gamepad.js",
    "/__browserkeys.js",
]


def _config():
    """Carga la configuración del usuario (atajos, preferencias)."""
    from . import config
    return config.load_config()


class GameHandler(SimpleHTTPRequestHandler):
    """Handler HTTP personalizado para servir juegos RPG Maker."""
    
    stats = {"requests": 0, "bytes": 0}

    def log_message(self, *args):
        if getattr(self.server, "verbose", False):
            super().log_message(*args)

    def end_headers(self):
        # Evitar cachear configuración crítica
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

    # ---------- Guardado en disco (save bridge) ----------
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
        
        # Save bridge
        if path == "/__savebridge.js":
            self._serve_static_file(BRIDGE_PATH, "application/javascript")
            return
        
        # Save list
        if path == "/__save/__all":
            self._handle_save_list()
            return
        
        # Config JS
        if path == "/__config.js":
            self._serve_config_js()
            return
        
        # Presets JS
        if path == "/__presets.js":
            self._serve_presets_js()
            return
        
        # Mods
        if path.startswith("/__mods/"):
            self._serve_mod(path[len("/__mods/"):])
            return
        
        # Static JS scripts
        static_scripts = {
            "/__rewind.js": "rpgmaker-rewind.js",
            "/__cheats.js": "rpgmaker-cheats.js",
            "/__gamepad.js": "rpgmaker-gamepad.js",
            "/__browserkeys.js": "rpgmaker-browser-keys.js",
        }
        if path in static_scripts:
            script_path = os.path.join(SCRIPTS_DIR, static_scripts[path])
            self._serve_static_file(script_path, "application/javascript")
            return
        
        # Save file
        if path.startswith("/__save/"):
            name = urllib.parse.unquote(path[len("/__save/"):])
            self._handle_save("GET", name)
            return
        
        # Index.html with injection
        if path.endswith("/index.html"):
            self._serve_index_injected(path)
            return
        
        super().do_GET()

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

    def _serve_static_file(self, file_path, content_type):
        """Sirve un archivo estático."""
        try:
            with open(file_path, "rb") as fh:
                data = fh.read()
        except OSError:
            self.send_error(404, "Not Found")
            return
        
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _serve_config_js(self):
        """Sirve la configuración del usuario como JS."""
        cfg = _config()
        data = ("window.__RPG_CONFIG__ = %s;" % json.dumps(cfg, ensure_ascii=False)).encode("utf-8")
        
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _game_root_from_referer(self):
        """Carpeta del juego según el Referer."""
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
        """Sirve un mod JS del juego."""
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
        """Sirve los presets de trucos del juego."""
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

    def _serve_index_injected(self, path):
        """Sirve index.html inyectando scripts (save bridge, trucos, etc.)."""
        full = self.translate_path(path)
        
        try:
            with open(full, "rb") as fh:
                content = fh.read().decode("utf-8", "replace")
        except OSError:
            self.send_error(404, "Not Found")
            return
        
        tags = ['<script src="%s"></script>' % script for script in INJECT_SCRIPTS]
        
        # Silenciar aviso de deprecación del meta antiguo de MV
        content = content.replace(
            'name="apple-mobile-web-app-capable"',
            'name="mobile-web-app-capable"'
        )
        
        # Mods del usuario
        try:
            mods_dir = os.path.join(os.path.dirname(full), "mods")
            for mf in sorted(f for f in os.listdir(mods_dir) if f.endswith(".js")):
                tags.append('<script src="/__mods/%s"></script>'
                            % urllib.parse.quote(mf))
        except OSError:
            pass
        
        # Inyectar tags si no existen
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

    def handle_close(self):
        """Al cerrar el servidor, volcar estadísticas."""
        super().handle_close()
        server = self.server
        if server is not None and getattr(server, "_stat_dumped", False):
            return
        
        server._stat_dumped = True
        print("rpgmaker-server: %d peticiones, %d bytes servidos"
              % (GameHandler.stats["requests"], GameHandler.stats["bytes"]),
              file=sys.stderr)


def start_game_server(port=0, directory=".", verbose=False):
    """Inicia el servidor HTTP para juegos web.
    
    Args:
        port: Puerto (0 = elegir uno libre)
        directory: Directorio del juego a servir
        verbose: Mostrar logs detallados
    
    Returns:
        tuple: (servidor_http, puerto)
    """
    handler = functools.partial(GameHandler, directory=directory)
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    httpd.verbose = verbose
    
    actual_port = httpd.server_address[1]
    log("Servidor HTTP iniciado en http://127.0.0.1:%d" % actual_port)
    
    return httpd, actual_port


# ---------- CLI ----------
if __name__ == "__main__":
    import argparse
    
    ap = argparse.ArgumentParser(description="Servidor HTTP rápido para juegos RPG Maker (MZ/MV)")
    ap.add_argument("port", type=int, nargs="?", default=0, help="puerto (0 = elegir uno libre)")
    ap.add_argument("--dir", default=".", help="carpeta del juego a servir")
    ap.add_argument("--verbose", action="store_true",
                    help="mostrar cada petición y las estadísticas al cerrar")
    args = ap.parse_args()
    
    httpd, port = start_game_server(args.port, args.dir, args.verbose)
    print("rpgmaker-server: sirviendo %s en http://127.0.0.1:%d" % (args.dir, port),
          file=sys.stderr)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
