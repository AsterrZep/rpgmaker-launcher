# 🎮 RPG Maker Launcher

**English** · [Español](README.es.md)

A universal launcher for RPG Maker and Ren'Py games on **Linux** desktops. It was born for **Chrome OS** (Linux / Crostini) and has evolved to run on any distribution: it auto-detects the engine of every game, extracts the `.zip` if needed and runs it with the right runtime, without touching the game itself.

> Tested on: Debian 13 trixie x86_64 and Chrome OS with Linux container (Debian trixie).

---

## ✨ Features

- **Automatic engine detection** — MZ, MV, XP, VX, VX Ace, 2000 and 2003, and Ren'Py.
- **Automatic extraction** — if the game comes as a `.zip`, it is extracted on the fly (only once) with an integrity marker.
- **Graphical interface** — a simple app-style window with **Stop server**, **Delete .zip** and an option to remove the archive after extraction.
- **Lightweight WebKit viewer** — web games (MZ/MV) can open in their own WebKit viewer instead of the full browser: less memory and faster startup for heavy games.
- **Configurable shortcuts** — all keys (cheats, FPS, screenshot, fullscreen, reload, zoom) are editable from the GUI and work both in the WebKit viewer and in the browser version.
- **Fast HTTP server** — web games are served by a multithreaded server that sends cache headers and the correct MIME for `.wasm`. Avoids stutter when loading many assets at once (the plain `python3 -m http.server` is single-threaded).
- **Plugin manager (MZ/MV)** — `rpgmaker-plugins.py` tool and a **Plugins** button in the GUI to list, analyze WebKit compatibility (nw.js APIs) and enable/disable plugins. Disabling heavy plugins can cut the game loop time by up to 31%.
- **Safe on-disk saves** — web game saves are stored as real files in each game's `save/` folder (with a fixed port per game), so you can copy, export or edit them. The GUI includes a **save manager** with backups, restore, export and delete.
- **JoyPlay-style cheats** — floating cheat menu (F8) in MZ/MV games: gold, HP/MP, items, variables, switches, teleport and a code console.
- **Gamepad support** — play MZ/MV with a controller (automatic mapping to the engine's keys).
- **Visual library** — covers in the list, "last played" and total play time.
- **Built-in decrypter** — **Decrypt** button and script to open encrypted XP/VX/VX Ace/MV/MZ files (downloads RPGMakerDecrypter on the fly).
- **Terminal version** — a classic menu for those who prefer the console.
- **No overlapping servers** — if you launch a web game and then another, the previous server closes itself.
- **Incomplete download warning** — detects half-extracted games or cut-off downloads.
- **Error diagnostics** — the viewer has a `--test` mode that checks whether the game reaches the title screen, how long it takes and which JavaScript errors appear.

## 🎛️ Supported engines

| Engine | Generation | Runtime | How it runs |
|-------|-----------|---------|--------------------|
| RPG Maker MZ | Web | Local HTTP server | Browser or **lightweight WebKit viewer** |
| RPG Maker MV | Web | Local HTTP server | Browser or **lightweight WebKit viewer** |
| RPG Maker XP / VX / VX Ace | Desktop | [mkxp-z](https://github.com/mkxp-z/mkxp-z) | native binary |
| RPG Maker 2000 / 2003 | Desktop | [EasyRPG Player](https://easyrpg.org/) | native binary |
| Ren'Py | Desktop | Bundled Ren'Py engine | Linux `.sh` |

## 📦 Requirements

- Any Linux with a desktop (including Chrome OS with **Linux/Crostini** enabled).
- Python 3 (comes with every distribution).
- `unzip`.
- For XP/VX/VX Ace: build `mkxp-z` (done by `install.sh`).
- For 2000/2003: install `easyrpg-player` (done by `install.sh`).
- For the graphical interface: `python3-tk` (done by `install.sh`).

## 🚀 Installation

```bash
git clone https://github.com/AsterrZep/rpgmaker-launcher.git
cd rpgmaker-launcher
chmod +x install.sh
./install.sh
```

The installation script:

1. Installs system dependencies (`python3-tk`, `unzip`, SDL, etc.).
2. Installs **EasyRPG Player** (2000/2003).
3. Compiles **mkxp-z** from source (XP/VX/VX Ace).
4. Generates and installs the app shortcut on your desktop (Linux or Chrome OS).

When it finishes, look for **RPG Maker Launcher** in your system's application list. On Chrome OS, if it does not appear, log out and back in (or restart the Linux container).

## 📦 Packages and releases

Every version is published as a GitHub release with ready-to-use binaries (no compiling needed):

| Format | File | What it installs |
|---------|---------|-------------|
| **Debian/Ubuntu** | `rpgmaker-launcher_<version>_amd64.deb` | App in the system, shortcut and runtimes (`sudo apt install ./rpgmaker-launcher_*.deb`) |
| **AppImage** | `rpgmaker-launcher-<version>-x86_64.AppImage` | Portable, includes its own Python with tkinter (`chmod +x` and run) |
| **Flatpak** | `rpgmaker-launcher-<version>.flatpak` | GNOME sandbox (`flatpak install rpgmaker-launcher-*.flatpak`) |

> ⚠️ **About Flatpak**: it is the **least recommended if disk space is a concern**. The package itself is ~55 MB, but Flatpak installs the GNOME runtime (`org.gnome.Platform` + SDK, **~2-3 GB** on disk) the first time. On machines with little space (e.g. the Chrome OS Linux container) prefer the **`.deb`** or the **AppImage**: they take much less room and install instantly. All three provide the exact same launcher.

Installed versions keep games in `~/Games/` (changeable with the `RPGMAKER_DATA_DIR` variable). The packaging scripts are in `packaging/`:

```bash
./packaging/build_deb.sh 0.1.0        # requires dpkg-deb
./packaging/build_appimage.sh 0.1.0   # downloads python-build-standalone + appimagetool
./packaging/build_flatpak.sh 0.1.0    # requires flatpak-builder and flathub
```

> **Automatic builds**: when you publish a `v*` tag (e.g. `git tag v0.1.3 && git push origin v0.1.3`), **GitHub Actions** builds the three packages (`.deb`, AppImage and `.flatpak`) and attaches them to the release automatically (`.github/workflows/release.yml`).

## 🕹️ Usage

### Graphical interface

1. Open the **RPG Maker Launcher** app.
2. If there is a `.zip` in `~/Games`, it is extracted automatically when launching the game.
3. Click the game name. Web games (MZ/MV) open in the browser (or in the **lightweight WebKit viewer** if you check the "WebKit viewer (lighter)" box); the rest open in a window.
4. With a web game selected, the **Plugins** and **Saves** buttons open their managers. With an XP/VX/VX Ace game, the **Decrypt** button extracts its encrypted data.
5. Use **Stop server** to shut down the web server at any time (it also stops itself when you close the app).

### Lightweight WebKit viewer

For heavy web games, check the **"WebKit viewer (lighter)"** box before pressing **Play**: instead of opening the full browser (which uses a lot of memory), the game opens in a WebKitGTK window with only the game page.

- Shortcuts: `Ctrl + / Ctrl -` zoom, `Ctrl 0` normal size, `F11` fullscreen, `Esc` exit fullscreen, `F5` reload, `F9` show/hide FPS, `F12` save a screenshot in `screenshots/`. **All can be changed** with the **Shortcuts** button in the GUI. In the browser version the configurable shortcuts also work (reload, fullscreen and FPS); cheats open with the configured key (F8 by default).
- By default it does **not** write console messages to a file: doing it every frame would cause stutter in games that log a lot. If you need to see them to diagnose, add `--log-console`.
- From the terminal, the launcher asks you how to open each web game.

### Diagnosing a game that won't start

The viewer includes a diagnostic mode that loads the game and checks whether it reaches the title scene, how long it takes (`t_scene_s`), whether there are JavaScript errors and whether it got stuck in the loader:

```bash
python3 rpgmaker-webview.py --url "http://localhost:PORT/index.html" --test
```

Example output: `{"scene": "Scene_Title", "t_scene_s": 6.8, "errors": []}` (game OK) or `{"scene": "none", "errors": [{"message": "...", "file": "...", "line": ...}]}` with the exact error.

### Plugin manager (`rpgmaker-plugins.py`)

Many web games ship dozens of plugins (Yanfly, VisuMZ, etc.) that add per-frame overhead. Also, some use desktop-only APIs (`require()`, `process.`, `fs.`).

`rpgmaker-plugins.py` lets you analyze and manage the plugins of any MZ/MV game:

```bash
# List plugins and check their WebKit compatibility
python3 rpgmaker-plugins.py list "games/My_Game"

# Disable problematic or heavy plugins
python3 rpgmaker-plugins.py disable "games/My_Game" IncompatiblePlugin

# Restore the original js/plugins.js
python3 rpgmaker-plugins.py restore "games/My_Game"
```

The first modification automatically creates a backup in `js/plugins.js.bak`.

### Save files (MZ/MV web games)

Web games (MZ/MV) usually save in browser storage (`LocalStorage`/`IndexedDB`), which **is isolated by origin** (host + port). This launcher solves that problem in two ways:

1. **Fixed port per game** — every game always gets the same port (computed from its name), so the browser always uses the same "origin" and saves are not lost between sessions.
2. **Real on-disk saves** — the server injects a small bridge (`rpgmaker-savebridge.js`) that redirects saves to real files in each game's `save/` folder:

```
games/My_Game/www/save/
├── file1.rpgsave      ← save 1 (MV)
├── global.rpgsave     ← global save info (MV)
├── config.rpgsave     ← game config (MV)
├── file1.rmmzsave     ← save 1 (MZ)
└── global.rmmzsave    ← (MZ)
```

That folder is visible on your disk: you can **copy, export, back up or edit** them with external tools (RPG Maker save editors) while the game is closed. The formats are the native ones of each engine (`.rpgsave` for MV, `.rmmzsave` for MZ).

From the **GUI**, the **Saves** button (MZ/MV games) lets you back up, restore, export, delete save files and open the `save/` folder (backups go to `backups/<game>/<date>/`).

### Cheats (JoyPlay style)

The server injects a floating **cheat menu** into MZ/MV games: press **F8** (or the "T" button at the bottom right) to open it. It allows:

- Give **gold**.
- **HP/MP/TP to max** and remove states from the party.
- Give **items** by ID (or 99 of everything).
- Change **variables** and **switches** by ID.
- **Teleport** (map, X, Y).
- **Code console** to run JavaScript directly (`$gameParty._gold = 999999`).

### Gamepad

MZ/MV games can be played with a controller: the `rpgmaker-gamepad.js` script translates the gamepad to the engine's shortcuts (arrows = move, Z = confirm, X = cancel, Shift = run, Start/Select = menu). Requires a browser or viewer with the Gamepad API (modern WebKitGTK supports it).

### Decrypting encrypted games (`rpgmaker-decrypter.py`)

Some XP/VX/VX Ace games ship encrypted data in `Game.rgss3a`/`.rgss2a`/`.rgssad` (and MV/MZ may have encrypted images/audio). For modding or translation you can decrypt them:

```bash
# Decrypts the game (downloads RPGMakerDecrypter to runtimes/ on first run)
python3 rpgmaker-decrypter.py "games/My_Game"

# Options: --output DIR, --recreate (rebuild the project), --overwrite
python3 rpgmaker-decrypter.py "games/My_Game" --recreate --overwrite
```

In the GUI there is a **Decrypt** button active when an XP/VX/VX Ace game is selected.

### Terminal

```bash
./rpgmaker-launcher.sh
```

## 🎯 Adding games

Just place the `.zip` (or the already-extracted game folder) inside `~/Games/`:

```
~/Games/
├── rpgmaker-launcher.sh
├── rpgmaker-launcher-gui.py
├── games/            ← extracted games (created automatically)
│   └── My_Game/
└── My_Game.zip      ← extracts itself when launched
```

The launcher detects the engine by looking at these files:

| File | Engine |
|---------|-------|
| `index.html` + `js/rmmz_core.js` | MZ |
| `index.html` + `js/rpg_core.js` | MV |
| `Game.rgss3a` | VX Ace |
| `Game.rgss2a` | VX |
| `Game.rgssad` | XP |
| `RPG_RT.exe` / `.ini` / `.lmt` | 2000 / 2003 |
| `*.py` + `renpy/` + `game/` | Ren'Py |
| `Data/Scripts.rvdata2` / `.rvdata` / `.rxdata` | VX Ace / VX / XP |

## 🛠️ Troubleshooting

- **"Incomplete game"**: it means the download or extraction was interrupted. Delete the game folder and launch it again (the `.zip` re-extracts itself).
- **`require is not defined`** (or another console error): some plugin or part of the game is designed only for the desktop version (nw.js) and uses Node modules. Run the `--test` diagnostic (or add `--log-console`): it shows the exact file and line of the error. In some games (e.g. the `Text2Frame` plugin of *Hotel Pretender*) it is enough to guard the `require()` call so it doesn't break the game in the browser.
- **An MV/MZ game fails to load** with `nw is not defined`: some plugins (e.g. `SRD_HUDMakerUltra`) are designed for the desktop version and fail in a browser. The launcher handles it if the game ships the correct plugins; check the game's `README`.
- **Windows games with odd capitalization**: on Linux filenames are case-sensitive. If a game fails to open, check that its script paths match exactly (e.g. `Input.js` vs `Input.JS`).

## ⚖️ Legal notice

This project is a **launcher**: it does not include any games. The saves and archives you put in `~/Games/` are yours and their respective authors'. This repository contains no commercial games or third-party protected material.

## 📄 License

This project is distributed under the **GNU General Public License version 3** (`GPLv3`).

You can **use, modify and share** this launcher freely, as long as derivative works are also distributed under the same license (copyleft) and the author is credited. See the [full license](https://www.gnu.org/licenses/gpl-3.0.html) for details.

See the [`LICENSE`](LICENSE) file for the full text.

## 🙏 Credits

- [mkxp-z](https://github.com/mkxp-z/mkxp-z) — RPG Maker XP/VX/VX Ace runtime reimplementation (GPL).
- [EasyRPG Player](https://easyrpg.org/) — RPG Maker 2000/2003 runtime (GPL).
- [Ren'Py](https://www.renpy.org/) — visual novel engine (MIT).

---

Made with ❤️ for playing on Linux (started as a Chromebook app).