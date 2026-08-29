# ============================================================
#  RPG Maker Launcher - Backend Python (Package Modular)
# ============================================================
# Reorganización del backend monolítico en módulos separados.
# Cada módulo maneja una responsabilidad específica:
#
#   config.py      - Gestión de configuración del usuario
#   decrypter.py   - Descifrado de assets RPG Maker
#   plugins.py     - Gestión de plugins para juegos web
#   saveedit.py    - Edición de partidas guardadas
#   sync.py        - Sincronización de partidas
#   server.py      - Servidor HTTP para juegos web
#   api.py         - API REST + SSE para el frontend
#   webview.py     - Visor WebKit ligero
#   utils.py       - Utilidades compartidas
# ============================================================

__version__ = "0.9.2"
__author__ = "AsterrZep"

from . import config
from . import decrypter
from . import plugins
from . import saveedit
from . import sync
from . import utils

__all__ = [
    "config",
    "decrypter", 
    "plugins",
    "saveedit",
    "sync",
    "utils",
]
