#!/usr/bin/env bash
# ============================================================
#  RPG Maker Launcher - Build .deb Package
# ============================================================
# Builds the Wails application for Linux and packages it as a .deb.
#
# Usage:
#   ./scripts/build-deb.sh          # Build for current arch (amd64)
#   ./scripts/build-deb.sh arm64    # Cross-compile for arm64
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

ARCH="${1:-amd64}"
VERSION="${VERSION:-1.0.0}"

echo "════════════════════════════════════════════════════"
echo "  RPG Maker Launcher - Build .deb"
echo "  Arch: $ARCH  Version: $VERSION"
echo "════════════════════════════════════════════════════"

# 1. Check dependencies
echo ""
echo "→ Checking build dependencies..."
for cmd in go wails nfpm; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "  ✗ $cmd not found. Please install it first."
        exit 1
    fi
    echo "  ✓ $cmd found"
done

# 2. Install frontend dependencies
echo ""
echo "→ Installing frontend dependencies..."
cd frontend
if [ -f package.json ]; then
    npm install --silent 2>/dev/null || echo "  (npm install skipped or failed)"
fi
cd "$PROJECT_DIR"

# 3. Build Wails application
echo ""
echo "→ Building Wails application for linux/$ARCH..."
if [ "$ARCH" = "amd64" ]; then
    wails build -platform linux/amd64 -ldflags "-s -w" -tags webkit2_41
else
    wails build -platform "linux/$ARCH" -ldflags "-s -w" -tags webkit2_41
fi

if [ ! -f build/bin/rpgmaker-launcher ]; then
    echo "  ✗ Build failed: build/bin/rpgmaker-launcher not found"
    exit 1
fi

SIZE=$(du -h build/bin/rpgmaker-launcher | cut -f1)
echo "  ✓ Binary built: $SIZE"

# 4. Package as .deb
echo ""
echo "→ Packaging as .deb..."
nfpm package --packager deb --target "build/bin/rpgmaker-launcher_${VERSION}_${ARCH}.deb"

DEB_FILE="build/bin/rpgmaker-launcher_${VERSION}_${ARCH}.deb"
if [ ! -f "$DEB_FILE" ]; then
    echo "  ✗ .deb packaging failed"
    exit 1
fi

DEB_SIZE=$(du -h "$DEB_FILE" | cut -f1)
echo "  ✓ .deb created: $DEB_FILE ($DEB_SIZE)"

# 5. Print summary
echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅ Build complete!"
echo ""
echo "  Binary:  build/bin/rpgmaker-launcher"
echo "  Package: $DEB_FILE"
echo ""
echo "  Install with:"
echo "    sudo dpkg -i $DEB_FILE"
echo "    sudo apt-get install -f  # fix dependencies if needed"
echo ""
echo "  Runtime dependencies (auto-installed):"
echo "    libgtk-3-0, libwebkit2gtk-4.1-0"
echo "════════════════════════════════════════════════════"
