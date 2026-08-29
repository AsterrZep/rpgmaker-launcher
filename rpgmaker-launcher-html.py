#!/usr/bin/env python3
# ============================================================
#  Wrapper: Frontend HTML (simplificado)
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import subprocess
import time
import webbrowser
import signal
import atexit

BASE_DIR = os.path.dirname(os.path.realpath(__file__))
SERVER_SCRIPT = os.path.join(BASE_DIR, "rpgmaker_api.py")


class Launcher:
    def __init__(self):
        self.server_proc = None
        self.server_port = None
        
    def start_server(self):
        """Inicia el servidor Python backend."""
        import hashlib
        import socket
        
        # Puerto determinista
        h = int(hashlib.md5(b"rpgmaker-launcher").hexdigest(), 16)
        port = 18000 + (h % 10000)
        try:
            s = socket.socket()
            s.bind(("127.0.0.1", port))
            s.close()
        except OSError:
            port = 18321
            
        self.server_proc = subprocess.Popen(
            [sys.executable, SERVER_SCRIPT, "--port", str(port)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.server_port = port
        time.sleep(1)
        return port
    
    def open_frontend(self, port):
        """Abre el frontend de IA en el navegador."""
        url = f"http://127.0.0.1:{port}/code-launcher.html"
        webbrowser.open(url)
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
    atexit.register(launcher.stop_server)
    
    def signal_handler(signum, frame):
        launcher.stop_server()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("Iniciando backend Python...")
    port = launcher.start_server()
    print(f"Servidor iniciado en puerto {port}")
    
    print("Abriendo frontend de diseño IA...")
    launcher.open_frontend(port)


if __name__ == "__main__":
    main()
