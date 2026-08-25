#!/usr/bin/env bash
# ============================================================
#  Construye el Flatpak de RPG Maker Launcher (edición Tauri).
#
#  NO recompila dentro del SDK: empaqueta el binario que Tauri
#  ya produjo (target/release/) más el backend Python, sobre el
#  runtime org.gnome.Platform (incluye WebKit2GTK 4.1 y python3).
#
#  Requiere: flatpak, flatpak-builder, remote flathub.
#  Uso:      ./packaging/build_flatpak_tauri.sh [versión]
#  Salida:   dist/rpgmaker-launcher-<versión>-x86_64.flatpak
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKGDIR="$ROOT/packaging"
DIST="$ROOT/dist"
APP_ID="org.rpgmaker.Launcher"
VERSION="${1:-0.8.0}"
BIN="$ROOT/rpgmaker-launcher-tauri/target/release/rpgmaker-launcher-tauri"
BACKEND="$ROOT/rpgmaker-launcher-tauri/backend"

command -v flatpak-builder >/dev/null || {
    echo "Falta flatpak-builder: sudo apt-get install flatpak-builder" >&2; exit 1; }
# En CI (contenedor de Flathub) llegan como artefacto vía env override.
BIN="${BIN_FILE:-$ROOT/rpgmaker-launcher-tauri/target/release/rpgmaker-launcher-tauri}"
BACKEND="${BACKEND_DIR:-$ROOT/rpgmaker-launcher-tauri/backend}"
[ -x "$BIN" ] || { echo "No existe $BIN — compila antes con: npx tauri build" >&2; exit 1; }
[ -d "$BACKEND" ] || { echo "No existe $BACKEND — ejecuta scripts/sync-backend.sh" >&2; exit 1; }

echo ">> Staging de archivos de la app..."
SRC="$PKGDIR/.flatpak-tauri-src"
rm -rf "$SRC"
mkdir -p "$SRC/bin" "$SRC/backend"

cp "$BIN" "$SRC/bin/"
cp "$BACKEND"/*.py "$BACKEND"/*.js "$SRC/backend/"
cp "$ROOT/rpgmaker-launcher-tauri/icons/icon.png" "$SRC/icon.png"

cat > "$SRC/launcher.desktop" <<EOF
[Desktop Entry]
Categories=Game;
Comment=Lanzador de juegos RPG Maker y Ren'Py para Linux
Exec=rpgmaker-launcher-tauri
StartupWMClass=rpgmaker-launcher-tauri
Icon=$APP_ID
Name=RPG Maker Launcher
Terminal=false
Type=Application
EOF

if [ -f "$PKGDIR/$APP_ID.appdata.xml" ]; then
    cp "$PKGDIR/$APP_ID.appdata.xml" "$SRC/appdata.xml"
else
    # Appdata mínimo válido para que el bundle sea instalable
    cat > "$SRC/appdata.xml" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>$APP_ID</id>
  <name>RPG Maker Launcher</name>
  <summary>Lanzador de juegos RPG Maker y Ren'Py</summary>
  <metadata_license>CC0-1.0</metadata_license>
  <project_license>GPL-3.0-or-later</project_license>
  <releases><release version="$VERSION" date="$(date +%Y-%m-%d)"/></releases>
</component>
EOF
fi

REPO="$PKGDIR/flatpak-repo"
BUILD_DIR="$PKGDIR/flatpak-build"
rm -rf "$REPO" "$BUILD_DIR"
mkdir -p "$DIST"

echo ">> flatpak-builder..."
flatpak-builder --user --force-clean \
    --install-deps-from=flathub \
    --repo="$REPO" "$BUILD_DIR" \
    "$PKGDIR/$APP_ID.tauri.yaml"

OUT="$DIST/rpgmaker-launcher-${VERSION}-x86_64.flatpak"
echo ">> Empaquetando bundle $OUT..."
flatpak build-bundle "$REPO" "$OUT" "$APP_ID"

ls -lh "$OUT"
