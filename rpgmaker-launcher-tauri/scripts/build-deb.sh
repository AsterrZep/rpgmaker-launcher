#!/usr/bin/env bash
# ============================================================
#  RPG Maker Launcher - Build .deb Package
# ============================================================
# Construye el paquete .deb directamente usando dpkg-deb.
#
# Uso:
#   ./scripts/build-deb.sh          # Build release + deb
#   ./scripts/build-deb.sh --skip-build  # Solo empaquetar
#
# Requisitos:
#   - dpkg-deb (instalado por defecto en Debian/Ubuntu)
#   - binario compilado en target/release/
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKIP_BUILD=false
VERSION="0.9.2"
PKG_NAME="rpgmaker-launcher"

# Parsear argumentos
for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            ;;
        --help|-h)
            echo "Uso: $0 [--skip-build]"
            echo ""
            echo "Options:"
            echo "  --skip-build   Solo empaquetar, asume binario ya compilado"
            exit 0
            ;;
    esac
done

echo ">> RPG Maker Launcher - Build .deb v${VERSION}"
echo "   Directorio: $PROJECT_DIR"

cd "$PROJECT_DIR"

# Compilar en release
if [ "$SKIP_BUILD" = false ]; then
    echo ">> Compilando en modo release..."
    cargo build --release
    echo ">> Compilación completada."
fi

# Verificar que el binario existe
BIN_PATH="target/release/rpgmaker-launcher-tauri"
if [ ! -f "$BIN_PATH" ]; then
    echo "ERROR: No se encontró el binario en $BIN_PATH"
    exit 1
fi

BIN_SIZE=$(ls -lh "$BIN_PATH" | awk '{print $5}')
echo ">> Binario encontrado: $BIN_SIZE"

# Crear estructura del paquete
PKG_DIR="target/debian/${PKG_NAME}_${VERSION}_amd64"
echo ">> Creando estructura del paquete..."

rm -rf "target/debian"
mkdir -p "$PKG_DIR/DEBIAN"
mkdir -p "$PKG_DIR/usr/bin"
mkdir -p "$PKG_DIR/usr/share/applications"
mkdir -p "$PKG_DIR/usr/share/icons/hicolor/128x128/apps"
mkdir -p "$PKG_DIR/usr/share/doc/${PKG_NAME}"

# Copiar binario
cp "$BIN_PATH" "$PKG_DIR/usr/bin/rpgmaker-launcher-tauri"
chmod 755 "$PKG_DIR/usr/bin/rpgmaker-launcher-tauri"

# Copiar icono
if [ -f "$REPO_DIR/rpgmaker-icon.png" ]; then
    cp "$REPO_DIR/rpgmaker-icon.png" "$PKG_DIR/usr/share/icons/hicolor/128x128/apps/rpgmaker-launcher.png"
fi

# Crear archivo .desktop
cat > "$PKG_DIR/usr/share/applications/rpgmaker-launcher.desktop" << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=RPG Maker Launcher
Comment=Lanza juegos de RPG Maker (MV, MZ, XP, VX, VX Ace, 2000/2003, Ren'Py)
Exec=rpgmaker-launcher-tauri
Icon=rpgmaker-launcher
Terminal=false
Categories=Game;Utility;
StartupNotify=true
EOF

# Copiar documentación
if [ -f "$REPO_DIR/README.md" ]; then
    cp "$REPO_DIR/README.md" "$PKG_DIR/usr/share/doc/${PKG_NAME}/README.md"
fi
if [ -f "$REPO_DIR/LICENSE" ]; then
    cp "$REPO_DIR/LICENSE" "$PKG_DIR/usr/share/doc/${PKG_NAME}/copyright"
fi

# Crear control file
cat > "$PKG_DIR/DEBIAN/control" << EOF
Package: ${PKG_NAME}
Version: ${VERSION}
Section: games
Priority: optional
Architecture: amd64
Maintainer: AsterrZep
Description: RPG Maker Launcher
 RPG Maker Launcher: biblioteca de juegos RPG Maker
 MZ/MV/XP/VX/VX Ace/2000 y Ren'Py con extraccion
 automatica de .zip, servidor HTTP local con puertos
 estables, panel de trucos, rewind/save-states, mods JS,
 editor de partidas, sync y descifrado de assets.
Depends: unzip, xdg-utils
EOF

# Calcular tamaño instalado
INSTALLED_SIZE=$(du -sk "$PKG_DIR" | cut -f1)
echo "Installed-Size: ${INSTALLED_SIZE}" >> "$PKG_DIR/DEBIAN/control"

# Crear postinst script (opcional)
cat > "$PKG_DIR/DEBIAN/postinst" << 'EOF'
#!/bin/bash
# Actualizar caché de iconos
if command -v gtk-update-icon-cache &>/dev/null; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor
fi
# Actualizar base de datos de desktop files
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database /usr/share/applications
fi
EOF
chmod 755 "$PKG_DIR/DEBIAN/postinst"

# Crear prerm script (opcional)
cat > "$PKG_DIR/DEBIAN/prerm" << 'EOF'
#!/bin/bash
# Limpiar antes de desinstalar
if command -v gtk-update-icon-cache &>/dev/null; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor
fi
EOF
chmod 755 "$PKG_DIR/DEBIAN/prerm"

# Generar paquete .deb
echo ">> Generando paquete .deb..."
dpkg-deb --build "$PKG_DIR"

DEB_FILE="target/debian/${PKG_NAME}_${VERSION}_amd64.deb"
if [ -f "$DEB_FILE" ]; then
    DEB_SIZE=$(ls -lh "$DEB_FILE" | awk '{print $5}')
    echo ""
    echo ">> ¡Paquete .deb generado exitosamente!"
    echo "   Archivo: $DEB_FILE"
    echo "   Tamaño:  $DEB_SIZE"
    echo ""
    echo ">> Para instalar:"
    echo "   sudo dpkg -i $DEB_FILE"
    echo "   sudo apt-get install -f  # Resolver dependencias si es necesario"
    echo ""
    echo ">> Para desinstalar:"
    echo "   sudo dpkg -r rpgmaker-launcher"
else
    echo "ERROR: No se pudo generar el paquete .deb"
    exit 1
fi
