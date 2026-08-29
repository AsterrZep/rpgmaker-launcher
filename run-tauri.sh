#!/usr/bin/env bash
# ============================================================
#  RPG Maker Launcher - Lanzador con Tauri v2 (Rust puro)
# ============================================================
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_DIR="$BASE_DIR/rpgmaker-launcher-tauri"

echo ">> Iniciando RPG Maker Launcher (Tauri v2 + Rust)..."

# En desarrollo los datos (juegos, config, saves) viven en el repo.
# La app instalada por .deb usa ~/.local/share/rpgmaker-launcher.
export RPGMAKER_DATA_DIR="${RPGMAKER_DATA_DIR:-$BASE_DIR}"

cd "$TAURI_DIR"

if [ ! -d "dist" ]; then
    echo ">> Compilando frontend Web (Vite + Tailwind)..."
    npm run build
fi

cargo run --manifest-path "$TAURI_DIR/Cargo.toml" "$@"
