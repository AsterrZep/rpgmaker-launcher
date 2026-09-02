#!/usr/bin/env bash
# ============================================================
#  RPG Maker Launcher - Build .deb package
#
#  Builds a .deb from the new backend/ frontend/ structure.
#
#  Usage: ./scripts/build-deb.sh [VERSION]
# ============================================================
set -euo pipefail

VERSION="${1:-1.0.0}"
PKG_NAME="rpgmaker-launcher"
ARCH="amd64"
BUILD_DIR="/tmp/${PKG_NAME}-deb-build"
INSTALL_DIR="/usr/lib/${PKG_NAME}"
DEB_OUT="dist/${PKG_NAME}_${VERSION}_${ARCH}.deb"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔨 Building ${PKG_NAME} v${VERSION} .deb ..."

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/DEBIAN"
mkdir -p "$BUILD_DIR${INSTALL_DIR}"
mkdir -p "$BUILD_DIR/usr/bin"
mkdir -p "$BUILD_DIR/usr/share/applications"
mkdir -p "$BUILD_DIR/usr/share/doc/${PKG_NAME}"
mkdir -p "$BUILD_DIR/usr/share/icons/hicolor/256x256/apps"

# ---------- Control file ----------
cat > "$BUILD_DIR/DEBIAN/control" <<EOF
Package: ${PKG_NAME}
Version: ${VERSION}
Section: games
Priority: optional
Architecture: ${ARCH}
Depends: python3 (>= 3.9), python3-tk, python3-gi, gir1.2-webkit2-4.1, gir1.2-gtk-3.0, xdg-utils, unzip
Maintainer: AsterrZep <asterrzep@users.noreply.github.com>
Homepage: https://github.com/AsterrZep/rpgmaker-launcher
Description: Launcher para juegos de RPG Maker y Ren'Py (MV, MZ, XP, VX, VX Ace, 2000/2003, Ren'Py)
 Detecta el motor de cada juego y lo lanza con el runtime adecuado:
 servidor HTTP + navegador o visor WebKit para MV/MZ, EasyRPG Player
 para 2000/2003, mkxp-z para XP/VX/VX Ace y lanzador nativo para Ren'Py.
 Incluye menu de trucos, guardado de partidas, editor de saves,
 sincronizacion, descifrado de assets y soporte para plugins.
 Los juegos se colocan como .zip o carpetas en ~/Games (o en la variable
 RPGMAKER_DATA_DIR).
EOF

# ---------- Backend files ----------
echo "  📦 Copying backend..."
cp -r "$PROJECT_ROOT/backend/"* "$BUILD_DIR${INSTALL_DIR}/"
# Clean up __pycache__ and .pyc files
find "$BUILD_DIR${INSTALL_DIR}" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$BUILD_DIR${INSTALL_DIR}" -name "*.pyc" -delete 2>/dev/null || true

# ---------- Runtimes ----------
echo "  📦 Copying runtimes..."
chmod +x "$BUILD_DIR${INSTALL_DIR}/runtimes/mkxp-z" 2>/dev/null || true

# ---------- Icon ----------
echo "  🎨 Copying icon..."
cp "$PROJECT_ROOT/rpgmaker-icon.png" \
   "$BUILD_DIR/usr/share/icons/hicolor/256x256/apps/org.rpgmaker.Launcher.png"

# ---------- Desktop file ----------
echo "  📄 Creating desktop file..."
cat > "$BUILD_DIR/usr/share/applications/rpgmaker-launcher.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=RPG Maker Launcher
Comment=Lanza juegos de RPG Maker y Ren'Py (MV, MZ, XP, VX, VX Ace, 2000/2003)
Exec=rpgmaker-launcher
Icon=org.rpgmaker.Launcher
Terminal=false
Categories=Game;
StartupNotify=true
EOF

# ---------- Tauri binary ----------
echo "  🦀 Copying Tauri binary..."
cp "$PROJECT_ROOT/rpgmaker-launcher-tauri/target/release/rpgmaker-launcher-tauri" "$BUILD_DIR${INSTALL_DIR}/rpgmaker-launcher-tauri"
chmod +x "$BUILD_DIR${INSTALL_DIR}/rpgmaker-launcher-tauri"

# ---------- Frontend dist ----------
echo "  🎨 Copying frontend dist..."
mkdir -p "$BUILD_DIR${INSTALL_DIR}/dist"
cp -r "$PROJECT_ROOT/rpgmaker-launcher-tauri/dist/"* "$BUILD_DIR${INSTALL_DIR}/dist/"

# ---------- Launcher script ----------
echo "  🚀 Creating launcher script..."
cat > "$BUILD_DIR/usr/bin/rpgmaker-launcher" <<'LAUNCHER'
#!/usr/bin/env bash
# RPG Maker Launcher - Tauri entry point
APP_DIR="/usr/lib/rpgmaker-launcher"
export RPGMAKER_DATA_DIR="${RPGMAKER_DATA_DIR:-$HOME/.local/share/rpgmaker-launcher}"
mkdir -p "$RPGMAKER_DATA_DIR/games"
exec "$APP_DIR/rpgmaker-launcher-tauri" "$@"
LAUNCHER
chmod +x "$BUILD_DIR/usr/bin/rpgmaker-launcher"

# ---------- HTML frontend ----------
echo "  🌐 Copying HTML frontend..."
cp "$PROJECT_ROOT/code-launcher.html" "$BUILD_DIR${INSTALL_DIR}/code-launcher.html" 2>/dev/null || true

# ---------- License ----------
echo "  📜 Copying license..."
cp "$PROJECT_ROOT/LICENSE" "$BUILD_DIR/usr/share/doc/${PKG_NAME}/COPYING"
cat > "$BUILD_DIR/usr/share/doc/${PKG_NAME}/changelog.Debian" <<EOF
${PKG_NAME} (${VERSION}) unstable; urgency=medium

  * Clean frontend/backend architecture
  * Ren'Py 8.x compatibility fix (py3-linux-x86_64 support)
  * Modular Python backend (core, engine, services, api)
  * TypeScript frontend with components

 -- AsterrZep <asterrzep@users.noreply.github.com>  $(date -R)
EOF
gzip -9 -n "$BUILD_DIR/usr/share/doc/${PKG_NAME}/changelog.Debian"

# ---------- Build .deb ----------
echo "  📦 Building .deb package..."
mkdir -p "$PROJECT_ROOT/dist"
dpkg-deb --root-owner-group --build "$BUILD_DIR" "$PROJECT_ROOT/$DEB_OUT"

echo ""
echo "✅ Built: $DEB_OUT"
echo "   Size: $(du -h "$PROJECT_ROOT/$DEB_OUT" | cut -f1)"
echo ""
echo "To install: sudo dpkg -i $DEB_OUT"
echo "To remove:  sudo dpkg -r ${PKG_NAME}"

# Cleanup
rm -rf "$BUILD_DIR"
