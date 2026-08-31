#!/bin/bash
cd "$(dirname "$0")"

# ── ChromeOS / Wayland fix ──────────────────────────────────────
# WebKitGTK on Chrome OS (Crostini) with Wayland has a bug where the
# compositing mode prevents the webview from loading embedded frontend
# assets, showing "Could not connect to localhost: Connection refused".
# Setting this env var forces WebKitGTK to bypass the compositor.
# See: https://github.com/AsterrZep/rpgmaker-launcher/issues
export WEBKIT_DISABLE_COMPOSITING_MODE=1

exec ./rpgmaker-launcher-tauri
