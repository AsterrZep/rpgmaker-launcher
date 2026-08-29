#!/usr/bin/env python3
# ============================================================
#  Wrapper: delega en backend.api
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.api import *
from backend.api import __all__

def run_api_server(port=0):
    """Función de compatibilidad para código existente."""
    from backend.api import run_api_server as _run
    _run(port)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="RPG Maker Launcher API Server")
    parser.add_argument("--port", type=int, default=0, help="Puerto (0 = automático)")
    args = parser.parse_args()
    
    from backend.api import run_api_server
    run_api_server(args.port)
