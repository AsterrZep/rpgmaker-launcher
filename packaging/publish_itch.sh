#!/usr/bin/env bash
#  Publica RPG Maker Launcher en itch.io usando butler.
#
#  Requiere:
#    - butler en el PATH (~/.local/bin/butler) y sesion iniciada (butler login)
#    - artefactos de la release en dist/ (*.deb, *.AppImage, *.flatpak)
#
#  Uso:
#    ./packaging/publish_itch.sh <version> [--dry-run] [--hidden]
#    ./packaging/publish_itch.sh 0.8.0                    # publica
#    ./packaging/publish_itch.sh 0.8.0 --dry-run          # simula sin subir
#    ./packaging/publish_itch.sh 0.8.0 --hidden           # sube oculto
#
#  Notas:
#    - La pagina del proyecto debe existir antes del primer push
#      (Dashboard -> Create new project -> URL rpg-maker-launcher,
#       visibilidad Draft). Butler NO la crea automaticamente.
#    - Canal: linux-amd64 (aparece como un unico archivo descargable con
#      .deb + .AppImage + .flatpak + README + docs/).
#    - Cambia TARGET con: ITCH_TARGET=usuario/proyecto ./publish_itch.sh ...

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
STAGE="$DIST/itch/linux-amd64"

TARGET="${ITCH_TARGET:-asterrzep/rpg-maker-launcher}"
CHANNEL="linux-amd64"
APPNAME="RPG-Maker-Launcher-x86_64.AppImage"

if [[ $# -lt 1 ]]; then
    echo "Uso: $0 <version> [--dry-run]" >&2
    exit 1
fi
VERSION="$1"; shift
DRY_RUN=""
HIDDEN=""
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN="--dry-run" ;;
        --hidden)  HIDDEN="--hidden" ;;
    esac
done

command -v butler >/dev/null 2>&1 \
    || { echo ">> butler no esta en el PATH (~/.local/bin/butler)"; exit 1; }

# ---------------------------------------------------------------- staging --
echo ">> Preparando staging en $STAGE"
rm -rf "$STAGE"
mkdir -p "$STAGE/docs"

shopt -s nullglob
falta=()

deb=("$DIST"/*"${VERSION}"_amd64.deb)
appimage=("$DIST"/*"${VERSION}"*_x86_64.AppImage "$DIST"/*"${VERSION}"*_amd64.AppImage)
flatpak=("$DIST"/*"${VERSION}"*.flatpak)

if [[ -n "${deb[0]:-}" ]]; then cp -v "${deb[0]}" "$STAGE/"; else falta+=(".deb"); fi
if [[ -n "${appimage[0]:-}" ]]; then cp -v "${appimage[0]}" "$STAGE/$APPNAME"; else falta+=(".AppImage"); fi
if [[ -n "${flatpak[0]:-}" ]]; then cp -v "${flatpak[0]}" "$STAGE/"; else falta+=(".flatpak"); fi
shopt -u nullglob

cp -v "$ROOT/README.md" "$STAGE/"
cp -v "$ROOT/LICENSE" "$STAGE/" 2>/dev/null || true
cp -v "$ROOT"/docs/*.html "$STAGE/docs/"

cat > "$STAGE/.itch.toml" <<EOF
# Acciones para la app de escritorio de itch.io
[[actions]]
name = "run"
path = "$APPNAME"
console = false
EOF

if [[ ${#falta[@]} -gt 0 ]]; then
    echo ">> FALTAN artefactos en dist/: ${falta[*]}"
    echo "   Descargalos de https://github.com/AsterrZep/rpgmaker-launcher/releases"
    exit 1
fi

# ------------------------------------------------------------------- push --
echo ">> Pusheando a $TARGET:$CHANNEL (version $VERSION)"
butler push "$STAGE" "$TARGET:$CHANNEL" --userversion "$VERSION" $DRY_RUN $HIDDEN

echo ">> Estado del canal:"
butler status "$TARGET:$CHANNEL"
