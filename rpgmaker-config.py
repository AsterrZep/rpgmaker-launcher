#!/usr/bin/env python3
# ============================================================
#  Wrapper: delega en backend.config
# ============================================================
import sys
import os

# Añadir directorio padre al path para importar backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.config import *
from backend.config import __all__

if __name__ == "__main__":
    import json
    if "--defaults" in sys.argv:
        save_config(_deep_copy(DEFAULT_CONFIG))
        print("Configuración restablecida a los valores por defecto: %s" % CONFIG_FILE)
    else:
        print(json.dumps(load_config(), ensure_ascii=False, indent=2))
