#!/usr/bin/env bash
# ============================================================
#  Construye el AppImage de RPG Maker Launcher.
#
#  Empaqueta un Python de python-build-standalone (con tkinter)
#  junto con todos los scripts. El AppRun usa el python incluido.
#  El visor WebKit necesita python3-gi del sistema (gui/gi).
#
#  Requiere: wget/curl. Salida: dist/rpgmaker-launcher-*.AppImage
#  Uso:      ./packaging/build_appimage.sh [versión]
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-0.1.0}"
PKG="rpgmaker-launcher"
DIST="$ROOT/dist"
CACHE="${RPGMAKER_CACHE:-$HOME/.cache/rpgmaker-launcher-appimage}"
APPID="org.rpgmaker.Launcher"
PBS_RELEASE="20260814"
PBS_ASSET="cpython-3.12.14+20260814-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz"
PBS_URL="https://github.com/astral-sh/python-build-standalone/releases/download/${PBS_RELEASE}/${PBS_ASSET}"
AIT_URL="https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"

APPDIR="$(mktemp -d)"
trap 'rm -rf "$APPDIR"' EXIT
mkdir -p "$CACHE" "$DIST"

echo ">> Asegurando appimagetool..."
if [ ! -x "$CACHE/appimagetool.AppImage" ]; then
    wget -q -O "$CACHE/appimagetool.AppImage" "$AIT_URL"
    chmod +x "$CACHE/appimagetool.AppImage"
fi

echo ">> Asegurando python-build-standalone..."
if [ ! -f "$CACHE/$PBS_ASSET" ]; then
    wget -q -O "$CACHE/$PBS_ASSET" "$PBS_URL"
fi

echo ">> Montando AppDir..."
LIBDIR="$APPDIR/usr/lib/$PKG"
PYDIR="$APPDIR/usr/opt/python"
mkdir -p "$LIBDIR" "$APPDIR/usr/opt" "$APPDIR/usr/bin" \
         "$APPDIR/usr/share/applications" \
         "$APPDIR/usr/share/icons/hicolor/256x256/apps"

tar -xzf "$CACHE/$PBS_ASSET" -C "$APPDIR/usr/opt"
# python-build-standalone extrae en usr/opt/python
ln -s ../opt/python/bin/python3 "$APPDIR/usr/bin/python3"

for f in rpgmaker-launcher.sh rpgmaker-launcher-gui.py rpgmaker-server.py \
         rpgmaker-webview.py rpgmaker-config.py rpgmaker-decrypter.py \
         rpgmaker-plugins.py rpgmaker-savebridge.js rpgmaker-cheats.js rpgmaker-saveedit.py rpgmaker-rewind.js rpgmaker-sync.py \
         rpgmaker-gamepad.js rpgmaker-browser-keys.js rpgmaker-icon.png; do
    cp "$ROOT/$f" "$LIBDIR/"
done
cp -r "$ROOT/runtimes" "$LIBDIR/runtimes"
chmod +x "$LIBDIR"/rpgmaker-launcher.sh "$LIBDIR"/rpgmaker-launcher-gui.py \
        "$LIBDIR"/rpgmaker-webview.py "$LIBDIR"/rpgmaker-server.py \
        "$LIBDIR"/rpgmaker-decrypter.py "$LIBDIR"/rpgmaker-plugins.py

cat > "$APPDIR/AppRun" <<EOF
#!/bin/sh
HERE="\$(dirname "\$(readlink -f "\$0")")"
export RPGMAKER_DATA_DIR="\${RPGMAKER_DATA_DIR:-\$HOME/Games}"
export LD_LIBRARY_PATH="\$HERE/usr/opt/python/lib:\$LD_LIBRARY_PATH"
export PATH="\$HERE/usr/bin:\$PATH"
exec "\$HERE/usr/opt/python/bin/python3" "\$HERE/usr/lib/$PKG/rpgmaker-launcher-gui.py" "\$@"
EOF
chmod +x "$APPDIR/AppRun"

cat > "$APPDIR/$APPID.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=RPG Maker Launcher
Comment=Lanza juegos de RPG Maker (MV, MZ, XP, VX, VX Ace, 2000/2003, Ren'Py)
Exec=rpgmaker-launcher
Icon=rpgmaker-launcher
Terminal=false
Categories=Game;
StartupNotify=true
X-AppImage-Version=$VERSION
EOF
cp "$APPDIR/$APPID.desktop" "$APPDIR/usr/share/applications/rpgmaker-launcher.desktop"
mkdir -p "$APPDIR/usr/share/metainfo"
cp "$ROOT/packaging/org.rpgmaker.Launcher.appdata.xml" "$APPDIR/usr/share/metainfo/"
cp "$ROOT/rpgmaker-icon.png" "$APPDIR/rpgmaker-launcher.png"
cp "$ROOT/rpgmaker-icon.png" "$APPDIR/usr/share/icons/hicolor/256x256/apps/rpgmaker-launcher.png"

echo ">> Empaquetando AppImage..."
export ARCH=x86_64
"$CACHE/appimagetool.AppImage" --appimage-extract-and-run --no-appstream "$APPDIR" \
    "$DIST/${PKG}-${VERSION}-x86_64.AppImage" >/dev/null
echo ">> Hecho: $DIST/${PKG}-${VERSION}-x86_64.AppImage"