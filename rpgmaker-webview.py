#!/usr/bin/env python3
# ============================================================
#  Wrapper: delega en backend.webview
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.webview import *
from backend.webview import __all__

if __name__ == "__main__":
    import argparse
    
    ap = argparse.ArgumentParser(description="Visor WebKit ligero para juegos RPG Maker (MZ/MV)")
    ap.add_argument("--url", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--fullscreen", action="store_true")
    ap.add_argument("--zoom", type=float, default=None)
    ap.add_argument("--zoom-save", default=None)
    ap.add_argument("--test", action="store_true")
    ap.add_argument("--bench", action="store_true")
    ap.add_argument("--wait", type=int, default=12)
    ap.add_argument("--log-console", action="store_true")
    args = ap.parse_args()
    
    run_viewer(args)
