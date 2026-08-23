#!/usr/bin/env bash
# ============================================================
#  Construye el paquete .deb de RPG Maker Launcher.
#
#  Requiere: dpkg-deb. Salida: dist/rpgmaker-launcher_*.deb
#  Uso:      ./packaging/build_deb.sh [versión]
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-0.1.0}"
PKG="rpgmaker-launcher"
ARCH="amd64"
DIST="$ROOT/dist"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

LIBDIR="/usr/lib/$PKG"

echo ">> Preparando árbol del paquete..."
PKGROOT="$STAGE/${PKG}_${VERSION}_${ARCH}"
mkdir -p "$PKGROOT/DEBIAN"
mkdir -p "$PKGROOT$LIBDIR"
mkdir -p "$PKGROOT/usr/bin"
mkdir -p "$PKGROOT/usr/share/applications"
mkdir -p "$PKGROOT/usr/share/icons/hicolor/256x256/apps"
mkdir -p "$PKGROOT/usr/share/doc/$PKG"

# ---------- archivos de la app ----------
for f in rpgmaker-launcher.sh rpgmaker-launcher-gtk.py rpgmaker-launcher-gui.py rpgmaker-server.py \
         rpgmaker-webview.py rpgmaker-config.py rpgmaker-decrypter.py \
         rpgmaker-plugins.py rpgmaker-savebridge.js rpgmaker-cheats.js rpgmaker-saveedit.py rpgmaker-rewind.js rpgmaker-sync.py \
         rpgmaker-gamepad.js rpgmaker-browser-keys.js rpgmaker-icon.png; do
    cp "$ROOT/$f" "$PKGROOT$LIBDIR/"
done
cp -r "$ROOT/runtimes" "$PKGROOT$LIBDIR/runtimes"
rm -f "$PKGROOT$LIBDIR/runtimes/rpgmaker-launcher.desktop"
chmod +x "$PKGROOT$LIBDIR/rpgmaker-launcher.sh" \
        "$PKGROOT$LIBDIR/rpgmaker-launcher-gui.py" \
        "$PKGROOT$LIBDIR/rpgmaker-webview.py" \
        "$PKGROOT$LIBDIR/rpgmaker-server.py" \
        "$PKGROOT$LIBDIR/rpgmaker-decrypter.py" \
        "$PKGROOT$LIBDIR/rpgmaker-plugins.py"

# ---------- lanzador en /usr/bin ----------
cat > "$PKGROOT/usr/bin/rpgmaker-launcher" <<EOF
#!/bin/sh
export RPGMAKER_DATA_DIR="\${RPGMAKER_DATA_DIR:-\$HOME/Games}"
if /usr/bin/python3 -c "import gi" >/dev/null 2>&1 && \
   [ -f "$LIBDIR/rpgmaker-launcher-gtk.py" ]; then
  exec /usr/bin/python3 $LIBDIR/rpgmaker-launcher-gtk.py "\$@"
fi
exec /usr/bin/python3 $LIBDIR/rpgmaker-launcher-gui.py "\$@"
EOF
chmod +x "$PKGROOT/usr/bin/rpgmaker-launcher"

# ---------- desktop + icono ----------
cat > "$PKGROOT/usr/share/applications/rpgmaker-launcher.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=RPG Maker Launcher
Comment=Lanza juegos de RPG Maker (MV, MZ, XP, VX, VX Ace, 2000/2003, Ren'Py)
Exec=/usr/bin/rpgmaker-launcher
Icon=rpgmaker-launcher
Terminal=false
Categories=Game;
StartupNotify=true
EOF
cp "$ROOT/rpgmaker-icon.png" "$PKGROOT/usr/share/icons/hicolor/256x256/apps/rpgmaker-launcher.png"

# ---------- control ----------
cat > "$PKGROOT/DEBIAN/control" <<EOF
Package: $PKG
Version: $VERSION
Section: games
Priority: optional
Architecture: $ARCH
Depends: python3, python3-tk, python3-gi, gir1.2-webkit2-4.1, gir1.2-gtk-3.0, xdg-utils, unzip
Maintainer: AsterrZep <asterrzep@users.noreply.github.com>
Homepage: https://github.com/AsterrZep/rpgmaker-launcher
Description: Launcher para juegos de RPG Maker (MV, MZ, XP, VX, VX Ace, 2000/2003, Ren'Py)
 Detecta el motor de cada juego y lo lanza con el runtime adecuado:
 servidor HTTP + navegador o visor WebKit para MV/MZ, EasyRPG Player
 para 2000/2003 y mkxp-z para XP/VX/VX Ace. Incluye menú de trucos,
 guardado de partidas del navegador, atajos configurables y descifrado.
 Los juegos se colocan como .zip o carpetas en ~/Games (o en la variable
 RPGMAKER_DATA_DIR).
EOF

cat > "$PKGROOT/usr/share/doc/$PKG/copyright" <<'EOF'
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: rpgmaker-launcher
Source: https://github.com/AsterrZep/rpgmaker-launcher

Files: *
Copyright: 2026 AsterrZep
License: GPL-3.0-or-later

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

On Debian systems, the complete text of the GNU General Public License
version 3 can be found in '/usr/share/common-licenses/GPL-3'.

Files: runtimes/RPGMakerDecrypter-cli
Copyright: RPGMakerDecrypter authors
License: GPL-3.0-only
EOF

gzip -9n -c "$ROOT/README.md" > "$PKGROOT/usr/share/doc/$PKG/README.md.gz"

# ---------- construir ----------
mkdir -p "$DIST"
dpkg-deb --build --root-owner-group "$PKGROOT" "$DIST/${PKG}_${VERSION}_${ARCH}.deb"
echo ">> Hecho: $DIST/${PKG}_${VERSION}_${ARCH}.deb"