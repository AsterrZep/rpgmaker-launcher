#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Frontend de IA (HTML/Tailwind)
#  Diseño generado por IA, sirve el frontend web en lugar
#  de GTK3. backend Python conservado.
# ============================================================
import os
import sys
import subprocess
import time
import webbrowser
import signal
import atexit
import shutil

API_DIR = os.path.dirname(os.path.realpath(__file__))
BACKEND_DIR = os.path.dirname(API_DIR)
BASE_DIR = os.path.dirname(BACKEND_DIR)
DATA_DIR = os.path.expanduser(os.environ.get("RPGMAKER_DATA_DIR", "")) or BASE_DIR
GAMES_DIR = os.path.join(DATA_DIR, "games")
SERVER_SCRIPT = os.path.join(BACKEND_DIR, "services", "game_server.py")
HTML_FRONTEND = os.path.join(BASE_DIR, "code-launcher.html")

# Asegurar que el HTML esté en el mismo directorio que el servidor
HTML_DEST = os.path.join(API_DIR, "code-launcher.html")
if not os.path.isfile(HTML_DEST):
    shutil.copy2(HTML_FRONTEND, HTML_DEST)

# Puerto determinista
import hashlib
def stable_port(game_name):
    h = int(hashlib.md5(game_name.encode("utf-8")).hexdigest(), 16)
    port = 18000 + (h % 10000)
    import socket
    try:
        s = socket.socket()
        s.bind(("127.0.0.1", port))
        s.close()
        return port
    except OSError:
        pass
    return None

class Launcher:
    def __init__(self):
        self.server_proc = None
        self.server_port = None
        
    def start_server(self):
        """Inicia el servidor Python backend."""
        port = stable_port("rpgmaker-launcher")
        if port is None:
            port = 18321
            
        self.server_proc = subprocess.Popen(
            [sys.executable, SERVER_SCRIPT, str(port)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.server_port = port
        time.sleep(1)
        return port
    
    def open_frontend(self, port):
        """Abre el frontend de IA en el navegador."""
        url = f"http://127.0.0.1:{port}/code-launcher.html"
        webbrowser.open(url)
        # Mantener el proceso vivo mientras el navegador esté abierto
        try:
            while self.server_proc.poll() is None:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
    
    def stop_server(self):
        """Detiene el servidor backend."""
        if self.server_proc and self.server_proc.poll() is None:
            self.server_proc.terminate()
            try:
                self.server_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_proc.kill()

def main():
    launcher = Launcher()
    
    # Registro para limpieza al salir
    atexit.register(launcher.stop_server)
    
    # Señal de interrupción
    def signal_handler(signum, frame):
        launcher.stop_server()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Iniciar servidor backend
    print("Iniciando backend Python...")
    port = launcher.start_server()
    print(f"Servidor iniciado en puerto {port}")
    
    # Abrir frontend de IA en navegador
    print("Abriendo frontend de diseño IA...")
    launcher.open_frontend(port)

if __name__ == "__main__":
    main()