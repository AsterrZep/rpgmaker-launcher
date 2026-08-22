#!/usr/bin/env bash
# ============================================================
#  Construye el Flatpak de RPG Maker Launcher.
#
#  Requiere: flatpak, flatpak-builder y el remote flathub.
#  Compila tcl/tk, Python 3.12 (con tkinter) y PyGObject sobre
#  el runtime org.gnome.Platform (incluye WebKit2GTK 4.1).
#
#  Uso:      ./packaging/build_flatpak.sh
#  Salida:   dist/rpgmaker-launcher-*.flatpak (bundle instalable)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
PKG="org.rpgmaker.Launcher"
VERSION="${1:-0.1.0}"

command -v flatpak-builder >/dev/null || { echo "Falta flatpak-builder. sudo apt-get install flatpak-builder"; exit 1; }

echo ">> Preparando staging de archivos de la app..."
SRC="$ROOT/packaging/.flatpak-src"
rm -rf "$SRC"
mkdir -p "$SRC/runtimes"
for f in rpgmaker-launcher.sh rpgmaker-launcher-gui.py rpgmaker-server.py \
         rpgmaker-webview.py rpgmaker-config.py rpgmaker-decrypter.py \
         rpgmaker-plugins.py rpgmaker-savebridge.js rpgmaker-cheats.js rpgmaker-saveedit.py \
         rpgmaker-gamepad.js rpgmaker-browser-keys.js rpgmaker-icon.png; do
    cp "$ROOT/$f" "$SRC/"
done
cp -r "$ROOT/runtimes/mkxp-z" "$SRC/runtimes/" 2>/dev/null || \
    echo ">> aviso: no existe runtimes/mkxp-z (se compila con install.sh); el Flatpak no podrá lanzar XP/VX/VX Ace."
if [ -f "$ROOT/runtimes/RPGMakerDecrypter-cli" ]; then
    cp -r "$ROOT/runtimes/RPGMakerDecrypter-cli" "$SRC/runtimes/"
fi

echo ">> Instalando runtime/sdk org.gnome.Platform 48 (si falta)..."
flatpak install -y --noninteractive --user flathub org.gnome.Platform//48 org.gnome.Sdk//48 >/dev/null

mkdir -p "$DIST"
echo ">> Construyendo ($PKG)..."
flatpak-builder --user --force-clean --disable-rofiles-fuse --repo="$DIST/flatpak-repo" \
    "$DIST/flatpak-build" "$ROOT/packaging/org.rpgmaker.Launcher.yaml"

echo ">> Generando bundle..."
flatpak build-bundle "$DIST/flatpak-repo" "$DIST/rpgmaker-launcher-${VERSION}.flatpak" "$PKG" master

echo ">> Hecho: $DIST/rpgmaker-launcher-${VERSION}.flatpak"