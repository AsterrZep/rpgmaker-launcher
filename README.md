<p align="center">
  <img src="https://raw.githubusercontent.com/AsterrZep/rpgmaker-launcher/main/docs/itchio-assets/cover-630x500.png" alt="RPG Maker Launcher" width="600"/>
</p>

<h1 align="center">🎮 RPG Maker Launcher</h1>

<p align="center">
  <b>The ultimate launcher for RPG Maker & Ren'Py games on Linux</b><br>
  Born for Chrome OS (Crostini) · Runs on every distribution
</p>

<p align="center">
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/releases/latest"><img src="https://img.shields.io/github/v/release/AsterrZep/rpgmaker-launcher?label=Latest%20Release&style=for-the-badge&logo=github" alt="Latest Release"></a>
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/releases"><img src="https://img.shields.io/github/downloads/AsterrZep/rpgmaker-launcher/total?style=for-the-badge&logo=github&label=Downloads" alt="Total Downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPLv3-blue?style=for-the-badge" alt="License"></a>
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/actions"><img src="https://img.shields.io/github/actions/workflow/status/AsterrZep/rpgmaker-launcher/release.yml?style=for-the-badge&logo=githubactions&label=Build" alt="Build Status"></a>
</p>

<p align="center">
  <a href="README.es.md">🇪🇸 Español</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-download">Download</a> •
  <a href="#-troubleshooting">Troubleshooting</a>
</p>

---

## 🌟 Why RPG Maker Launcher?

| Before | After |
|--------|-------|
| ❌ Games stuck in browser localStorage | ✅ **Real save files** on disk — copy, backup, edit freely |
| ❌ Each engine needs manual setup | ✅ **Auto-detects engine** — runs with the right runtime instantly |
| ❌ Heavy browser tabs for web games | ✅ **Lightweight WebKit viewer** — 50% less RAM, faster startup |
| ❌ Plugins break in browser | ✅ **Plugin analyzer** — identify & disable incompatible plugins |
| ❌ No cheats, no mods | ✅ **JoyPlay-style cheats** (F8) + **User mods** (drop `.js` in `mods/`) |
| ❌ Encrypted games unplayable | ✅ **Built-in decrypter** — one click to decrypt XP/VX/Ace/MV/MZ |
| ❌ Port changes = lost saves | ✅ **Fixed port per game** — saves persist forever |

---

## ✨ Feature Highlights

### 🎯 **Universal Engine Support**
```
RPG Maker MZ/MV    → Local HTTP server + WebKit viewer or Browser
RPG Maker XP/VX/Ace → mkxp-z native binary
RPG Maker 2000/2003 → EasyRPG Player native binary
Ren'Py             → Bundled Linux engine
```

### 🧠 **Smart Save System**
- **Fixed ports** — every game gets a deterministic port (MD5 hash of name)
- **On-disk saves** — `.rpgsave` / `.rmmzsave` files in `save/` folder
- **Save Manager GUI** — backup, restore, export, delete, open folder
- **Auto-backup** — every edit creates a timestamped backup

### ⚡ **Performance First**
- **Multi-threaded HTTP server** — serves `.wasm` with correct MIME, cache headers
- **WebKit viewer** — no browser chrome, no extensions, pure game
- **Plugin profiler** — disable heavy plugins, gain up to **31% faster game loop**

### 🎮 **Pro Gaming Features**
- **Cheat Menu (F8)** — gold, items, stats, variables, switches, teleport, JS console
- **Cheat Presets** — `cheats-presets.json` → one-click buttons in panel
- **Gamepad Support** — automatic mapping (arrows=move, Z=confirm, X=cancel, Shift=dash)
- **Volume Control** — BGM/BGS/ME/SE sliders in cheat menu, persisted
- **User Mods** — drop `.js` files in `mods/`, auto-injected on launch

### 🔧 **Developer Tools**
- **Plugin Analyzer** — detects nw.js APIs (`require`, `fs`, `process`)
- **Data Browser** — read Items/Weapons/Armors/Skills/Enemies (encrypted DBs supported)
- **Save Editor** — visual editor for gold, items, variables, switches
- **Diagnostic Mode** — `--test` checks if game reaches title scene, timing, JS errors
- **Decrypter** — one-click decrypt of `.rgss3a/.rgss2a/.rgssad` + MV/MZ assets

---

## 📸 Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/AsterrZep/rpgmaker-launcher/main/docs/itchio-assets/banner-960x300.png" alt="Launcher UI" width="800"/>
</p>

> **Left:** Visual library with covers, favorites, play time  
> **Center:** WebKit viewer running an MZ game  
> **Right:** Cheat menu with JoyPlay-style features

---

## 🚀 Quick Start

```bash
# 1. Install (Debian/Ubuntu/Chrome OS)
curl -fsSL https://raw.githubusercontent.com/AsterrZep/rpgmaker-launcher/main/install.sh | bash

# 2. Add your games
# Drop .zip files or extracted folders into ~/Games/

# 3. Play!
# Open "RPG Maker Launcher" from your app menu
```

---

## 📥 Installation Methods

### 🏆 Recommended: Pre-built Packages (No Compiling)

| Platform | Download | Install Command |
|----------|----------|-----------------|
| **Debian / Ubuntu / Linux Mint / Pop!_OS / Chrome OS** | [`.deb`](https://github.com/AsterrZep/rpgmaker-launcher/releases/latest/download/rpgmaker-launcher_0.9.1_amd64.deb) | `sudo apt install ./rpgmaker-launcher_*.deb` |
| **Any Distribution (Portable)** | [`.AppImage`](https://github.com/AsterrZep/rpgmaker-launcher/releases/latest/download/rpgmaker-launcher-0.9.1-x86_64.AppImage) | `chmod +x *.AppImage && ./*.AppImage` |
| **Flatpak (Sandboxed)** | [`.flatpak`](https://github.com/AsterrZep/rpgmaker-launcher/releases/latest/download/rpgmaker-launcher-0.9.1.flatpak) | `flatpak install rpgmaker-launcher-*.flatpak` |

> 💡 **Tip for Chrome OS / Low Disk Space**: Use **`.deb`** or **`.AppImage`**. Flatpak pulls the GNOME runtime (~2-3 GB). The `.deb` is ~1 MB, AppImage ~80 MB.

### 🛠️ From Source (Developers)

```bash
git clone https://github.com/AsterrZep/rpgmaker-launcher.git
cd rpgmaker-launcher
chmod +x install.sh
./install.sh    # installs deps, builds mkxp-z, creates shortcut
```

---

## 🎮 Adding Games — It's That Simple

```
~/Games/
├── My_Game.zip          ← Drop .zip here, auto-extracts on launch
├── Another_Game/        ← Or use extracted folders
└── games/               ← Extracted games (auto-created)
    └── My_Game/
        ├── www/         ← MZ/MV web files
        ├── save/        ← Your save files (real files!)
        └── mods/        ← Drop .js mods here
```

**Supported file detection:**
| File Found | Engine Detected |
|------------|-----------------|
| `index.html` + `js/rmmz_core.js` | RPG Maker MZ |
| `index.html` + `js/rpg_core.js` | RPG Maker MV |
| `Game.rgss3a` | VX Ace |
| `Game.rgss2a` | VX |
| `Game.rgssad` | XP |
| `RPG_RT.exe` / `.ini` / `.lmt` | 2000 / 2003 |
| `*.py` + `renpy/` + `game/` | Ren'Py |

---

## ⌨️ Default Shortcuts (All Configurable)

| Action | Default Key | Works In |
|--------|-------------|----------|
| Open Cheats | `F8` | WebKit + Browser |
| Reload Game | `F5` | WebKit + Browser |
| Show/Hide FPS | `F9` | WebKit + Browser |
| Screenshot | `F12` | WebKit |
| Fullscreen | `F11` | WebKit |
| Exit Fullscreen | `Esc` | WebKit |
| Zoom In/Out | `Ctrl +` / `Ctrl -` | WebKit |
| Reset Zoom | `Ctrl 0` | WebKit |

> Change any key in **Settings → Shortcuts** — works in both WebKit viewer and browser version.

---

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RPGMAKER_DATA_DIR` | `~/Games` | Where games, saves, config live |
| `general.games_dir` | `~/Games` | **New in 0.9.1** — custom folder for games & .zip files |
| `general.webkit` | `false` | Use WebKit viewer by default |
| `general.auto_delete_zip` | `false` | Delete .zip after extraction |
| `sync.folder` | — | Sync saves to Dropbox/Syncthing/Nextcloud/USB |

---

## 🛠️ Troubleshooting

<details>
<summary><b>❌ "Incomplete game" / Game won't start</b></summary>

The download or extraction was interrupted. Delete the game folder in `~/Games/games/` and launch again — the `.zip` re-extracts automatically.
</details>

<details>
<summary><b>❌ `require is not defined` / `nw is not defined`</b></summary>

A plugin uses Node.js APIs only available in nw.js (desktop). 
1. Run diagnostic: `python3 rpgmaker-webview.py --url "http://localhost:PORT/index.html" --test`
2. Check the exact file/line of the error
3. Open **Plugins** in GUI → disable the problematic plugin
4. Or wrap the `require()` call: `if (typeof require !== 'undefined') { ... }`
</details>

<details>
<summary><b>❌ Saves lost between sessions</b></summary>

Ensure you're using the same launcher instance (fixed port per game). If you moved the game folder, the port changes. Don't rename game folders after first launch.
</details>

<details>
<summary><b>❌ Case-sensitive filenames (Windows → Linux)</b></summary>

Linux is case-sensitive. If a game fails, check script paths match exactly:
- `Input.js` ≠ `Input.JS`
- `SceneManager` ≠ `scenemanager`
</details>

<details>
<summary><b>❌ Flatpak: "No space left on device"</b></summary>

Flatpak installs the GNOME runtime (~2-3 GB). On Chrome OS or small disks, use the **`.deb`** or **`.AppImage`** instead.
</details>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri Frontend (Rust + TS)               │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐  │
│  │  Game Grid  │ │  Sidebar    │ │  Settings / Sync /   │  │
│  │  (Covers,   │ │  (Library,  │ │  Plugins / Saves /   │  │
│  │  Favorites) │ │  Plugins,   │ │  Decrypt / Mods      │  │
│  │             │ │  Saves)     │ │                      │  │
│  └─────────────┘ └─────────────┘ └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API + SSE
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Backend (rpgmaker_api.py)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ HTTP Srv │ │Save Bridge│ │Cheat Inj │ │Plugin/Decrypt│   │
│  │ (Multi-  │ │(Real Disk │ │(JoyPlay  │ │  Tools       │   │
│  │ threaded)│ │ Saves)    │ │  Style)  │ │              │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ spawns
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐ ┌─────────────┐ ┌────────────┐
    │  mkxp-z    │ │ EasyRPG     │ │  Ren'Py    │
    │ (XP/VX/Ace)│ │ (2000/2003) │ │ (Visual)   │
    └────────────┘ └─────────────┘ └────────────┘
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

**Code style**: Python (black), TypeScript (prettier), Rust (rustfmt)

---

## 📄 License

Distributed under **GNU GPL v3**. See [`LICENSE`](LICENSE) for details.

> **TL;DR**: Free to use, modify, share. Derivatives must be GPL v3.

---

## 🙏 Credits & Acknowledgments

| Project | Role | License |
|---------|------|---------|
| [mkxp-z](https://github.com/mkxp-z/mkxp-z) | XP/VX/Ace Runtime | GPL-3.0 |
| [EasyRPG Player](https://easyrpg.org/) | 2000/2003 Runtime | GPL-3.0 |
| [Ren'Py](https://www.renpy.org/) | Visual Novel Engine | MIT |
| [Tauri](https://tauri.app/) | Desktop App Framework | MIT/Apache-2.0 |
| [WebKitGTK](https://webkitgtk.org/) | Web Renderer | LGPL |
| [RPGMakerDecrypter](https://github.com/ExpiredLime/RPGMakerDecrypter) | Decryption Tool | GPL-3.0 |

---

## 💬 Community & Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/AsterrZep/rpgmaker-launcher/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/AsterrZep/rpgmaker-launcher/discussions)
- ⭐ **Star the repo** if you find it useful!

---

<p align="center">
  <b>Made with ❤️ for playing RPGs on Linux</b><br>
  <sub>Started as a Chromebook app · Now runs everywhere</sub>
</p>

<p align="center">
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/stargazers"><img src="https://img.shields.io/github/stars/AsterrZep/rpgmaker-launcher?style=social" alt="Stars"></a>
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/forks"><img src="https://img.shields.io/github/forks/AsterrZep/rpgmaker-launcher?style=social" alt="Forks"></a>
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/watchers"><img src="https://img.shields.io/github/watchers/AsterrZep/rpgmaker-launcher?style=social" alt="Watchers"></a>
</p>