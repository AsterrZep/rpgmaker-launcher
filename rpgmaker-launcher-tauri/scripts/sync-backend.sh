#!/usr/bin/env bash
# Copia los archivos del backend Python (que viven en la raíz del repo)
# a ./backend/ para que Tauri los empaquete como recursos del .deb.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"                  # raíz del repo
DEST="$SCRIPT_DIR/../backend"                            # rpgmaker-launcher-tauri/backend
mkdir -p "$DEST"

FILES=(
  rpgmaker_api.py
  rpgmaker-server.py
  rpgmaker-webview.py
  rpgmaker-config.py
  rpgmaker-plugins.py
  rpgmaker-saveedit.py
  rpgmaker-sync.py
  rpgmaker-decrypter.py
  rpgmaker-cheats.js
  rpgmaker-rewind.js
  rpgmaker-gamepad.js
  rpgmaker-browser-keys.js
  rpgmaker-savebridge.js
)

for f in "${FILES[@]}"; do
  if [ ! -f "$DIR/$f" ]; then
    echo "ERROR: no existe $DIR/$f" >&2
    exit 1
  fi
  cp -f "$DIR/$f" "$DEST/"
done

echo ">> Backend sincronizado en $DEST (${#FILES[@]} archivos)"
