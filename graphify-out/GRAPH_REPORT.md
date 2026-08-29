# Graph Report - rpgmaker-launcher  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1064 nodes · 2231 edges · 60 communities (41 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ee0b954c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppState
- rpgmaker-cheats.js
- AppError
- plugins.py
- t
- EventsService
- cheats-smoke.js
- log
- GameServer
- GameDetector
- SaveEditor
- ApiClient
- GameHandler
- App
- Decrypter
- package.json
- ConfigManager
- api.py
- sync_cmd.rs
- config.py
- ProcessManager
- .launch_native
- compilerOptions
- Game
- .do_GET
- HttpClient
- InjectionEngine
- rpgmaker-rewind.js
- rpgmaker-savebridge.js
- selftest.py
- webview.py
- Launcher
- SyncModal
- install.sh
- GameCard
- Header
- SavesModal
- PluginsModal
- SaveEditorModal
- SettingsModal
- ShortcutsModal
- RPGML::DummyAPI
- rpgmaker-browser-keys.js
- rpgmaker-gamepad.js
- Sidebar
- StatusBar
- ToastManager
- run-tauri.sh
- build_flatpak_tauri.sh
- publish_itch.sh
- sync-backend.sh
- rpgmaker-launcher-tauri

## God Nodes (most connected - your core abstractions)
1. `AppState` - 46 edges
2. `t()` - 38 edges
3. `buildPanel()` - 36 edges
4. `App` - 34 edges
5. `ApiClient` - 31 edges
6. `Game` - 27 edges
7. `log()` - 24 edges
8. `EventsService` - 23 edges
9. `GameDetector` - 22 edges
10. `ConfigManager` - 21 edges

## Surprising Connections (you probably didn't know these)
- `run_api_server()` --calls--> `run_api_server()`  [EXTRACTED]
  rpgmaker_api.py → backend/api.py
- `App` --references--> `Game`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/app.ts → rpgmaker-launcher-tauri/src/api.ts
- `App` --references--> `ActionBar`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/app.ts → rpgmaker-launcher-tauri/src/components/ActionBar.ts
- `App` --references--> `Header`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/app.ts → rpgmaker-launcher-tauri/src/components/Header.ts
- `App` --references--> `Sidebar`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/app.ts → rpgmaker-launcher-tauri/src/components/Sidebar.ts

## Import Cycles
- None detected.

## Communities (60 total, 19 thin omitted)

### Community 0 - "AppState"
Cohesion: 0.07
Nodes (55): AppConfig, ConfigResult, get_config(), get_data_dir(), get_games_dir(), reset_config(), AppConfig, Default (+47 more)

### Community 1 - "rpgmaker-cheats.js"
Cohesion: 0.09
Nodes (56): activeCounts(), applyAction(), applyPreset(), attachWheel(), buildPanel(), cheatAllItems(), cheatAllSkills(), cheatAllStates() (+48 more)

### Community 2 - "AppError"
Cohesion: 0.08
Nodes (29): CompressError, DecodeError, DecompressError, From, FromHexError, InvalidLength, AppError, Error (+21 more)

### Community 3 - "plugins.py"
Cohesion: 0.07
Nodes (41): Guarda la configuración del usuario a disco., save_config(), decrypt_rgss(), die(), ensure_binary(), Imprime error y termina con código de error., Descarga el binario del descifrador si no existe., Descifra archivos RGSS (XP/VX/VX Ace) usando el binario externo. (+33 more)

### Community 4 - "t"
Cohesion: 0.13
Nodes (21): api, AppConfig, DataItem, PluginItem, TODO: Implement native game launching in Rust, SaveContent, SaveItem, SyncStatus (+13 more)

### Community 5 - "EventsService"
Cohesion: 0.10
Nodes (30): clear_event_history(), emit_event(), get_event_history(), off_event(), on_event(), Arc, Option, Result (+22 more)

### Community 6 - "cheats-smoke.js"
Cohesion: 0.05
Nodes (9): actor(), actors, antes, FakeActor, fs, inv, path, sws (+1 more)

### Community 7 - "log"
Cohesion: 0.07
Nodes (32): decrypt_directory(), decrypt_mv_mz_asset(), find_target(), have_arch(), Descifra un asset individual de RPG Maker MV/MZ. Args: data: Datos del archivo…, Escanea un directorio buscando archivos encriptados de MV/MZ. Args: directory:…, Descifra todos los assets encriptados de un directorio. Args: directory:…, Busca archivos RGSS encriptados en el directorio. (+24 more)

### Community 8 - "GameServer"
Cohesion: 0.15
Nodes (22): AxumPath, Bytes, Drop, Html, Router, GameServer, AppResult, Arc (+14 more)

### Community 9 - "GameDetector"
Cohesion: 0.14
Nodes (17): CacheEntry, GameDetector, AppResult, Arc, Default, HashMap, Instant, Option (+9 more)

### Community 10 - "SaveEditor"
Cohesion: 0.17
Nodes (22): ActorInfo, create_test_mv_save(), AppResult, Error, Ok, Option, Path, PathBuf (+14 more)

### Community 12 - "GameHandler"
Cohesion: 0.12
Nodes (12): GameHandler, SimpleHTTPRequestHandler, Lista todas las partidas existentes con su contenido en base64., Sirve un archivo estático., Sirve la configuración del usuario como JS., Carpeta del juego según el Referer., Sirve un mod JS del juego., Sirve los presets de trucos del juego. (+4 more)

### Community 14 - "Decrypter"
Cohesion: 0.20
Nodes (15): create_test_encrypted_data(), create_test_key(), Decrypter, DecryptResult, AppResult, Clone, Option, Path (+7 more)

### Community 15 - "package.json"
Cohesion: 0.07
Nodes (27): autoprefixer, postcss, dependencies, @tauri-apps/api, @tauri-apps/plugin-dialog, devDependencies, autoprefixer, postcss (+19 more)

### Community 16 - "ConfigManager"
Cohesion: 0.16
Nodes (15): AppConfig, ConfigManager, default_config(), GeneralConfig, AppConfig, AppResult, Arc, Clone (+7 more)

### Community 17 - "api.py"
Cohesion: 0.10
Nodes (24): _detect_engine_uncached(), find_dir(), find_glob(), first_find(), open_target(), Inicia el servidor API REST + SSE., Busca un archivo por nombre en el árbol del directorio., Busca archivos por patrón glob. (+16 more)

### Community 18 - "sync_cmd.rs"
Cohesion: 0.16
Nodes (24): decrypt_game_assets(), DecryptResult, has_encrypted_assets(), read_encryption_key(), Option, Result, State, String (+16 more)

### Community 19 - "config.py"
Cohesion: 0.10
Nodes (24): _extract_zip(), extract_zips_api(), install_zip_paths(), Extrae un archivo ZIP., Obtiene el nombre del juego desde un archivo ZIP., Extrae todos los ZIPs pendientes en la carpeta de juegos., Copia y extrae ZIPs desde rutas locales., zip_game_name() (+16 more)

### Community 20 - "ProcessManager"
Cohesion: 0.19
Nodes (12): Child, Mutex, ProcessManager, ProcessStatus, AppResult, Arc, Default, Instant (+4 more)

### Community 21 - ".launch_native"
Cohesion: 0.14
Nodes (15): ActiveSession, _ensure_win32_shim(), find_mkxpz(), Localiza el runtime mkxp-z., Garantiza que el juego RGSS precargue el shim Win32., Devuelve la ruta del archivo de zoom para un juego., Lanza un juego web (MV/MZ)., Lanza un juego nativo (XP/VX/VX Ace/2000-2003/Ren'Py). (+7 more)

### Community 22 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, src, compilerOptions, allowImportingTsExtensions, isolatedModules, lib (+12 more)

### Community 23 - "Game"
Cohesion: 0.15
Nodes (5): Game, ActionBar, DataBrowserModal, DecryptModal, GameCardCallbacks

### Community 24 - ".do_GET"
Cohesion: 0.19
Nodes (9): ApiHandler, detect_engine(), EventBus, find_cover(), get_all_games(), SimpleHTTPRequestHandler, Detecta el motor de un juego RPG Maker., Busca la imagen de portada de un juego. (+1 more)

### Community 25 - "HttpClient"
Cohesion: 0.20
Nodes (9): B, Client, HttpClient, AppResult, Default, Path, Self, String (+1 more)

### Community 26 - "InjectionEngine"
Cohesion: 0.26
Nodes (8): InjectionEngine, AppResult, Path, PathBuf, String, Vec, test_cleanup_nwjs_game(), test_prepare_nwjs_game()

### Community 27 - "rpgmaker-rewind.js"
Cohesion: 0.33
Nodes (12): autoKey(), getAuto(), inMap(), loadState(), notifyChange(), pack(), ready(), saveState() (+4 more)

### Community 28 - "rpgmaker-savebridge.js"
Cohesion: 0.31
Nodes (13): applyBridge(), b64decode(), ensureCache(), loadAllAsync(), loadAllSync(), mvFilename(), mzFilename(), read() (+5 more)

### Community 29 - "selftest.py"
Cohesion: 0.22
Nodes (7): _free_port(), load_mod(), t_config_parse_key(), t_detect_engine(), t_saveedit_roundtrip(), t_server_http(), t_sync_push_pull()

### Community 30 - "webview.py"
Cohesion: 0.25
Nodes (9): _config_module(), main(), make_settings(), make_webview(), Crea una ventana WebKit con scripts inyectados., Carga el módulo de configuración., Ejecuta el visor WebKit., Configura las opciones de WebKit. (+1 more)

### Community 31 - "Launcher"
Cohesion: 0.22
Nodes (5): Launcher, main(), Inicia el servidor Python backend., Abre el frontend de IA en el navegador., Detiene el servidor backend.

### Community 33 - "install.sh"
Cohesion: 0.50
Nodes (7): c_err(), c_log(), c_ok(), c_warn(), die(), need_sudo(), install.sh script

### Community 41 - "RPGML::DummyAPI"
Cohesion: 0.40
Nodes (3): new(), RPGML, RPGML::DummyAPI

### Community 43 - "rpgmaker-gamepad.js"
Cohesion: 0.60
Nodes (3): keyFor(), poll(), setKey()

## Knowledge Gaps
- **54 isolated node(s):** `ActionBarCallbacks`, `HeaderCallbacks`, `SidebarCallbacks`, `ToastType`, `Lang` (+49 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppState` connect `AppState` to `ConfigManager`, `sync_cmd.rs`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `ConfigManager` connect `ConfigManager` to `AppState`, `sync_cmd.rs`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `cheatVolume()` connect `rpgmaker-cheats.js` to `ConfigManager`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `ActionBarCallbacks`, `HeaderCallbacks`, `SidebarCallbacks` to the rest of the system?**
  _54 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppState` be split into smaller, more focused modules?**
  _Cohesion score 0.06882882882882883 - nodes in this community are weakly interconnected._
- **Should `rpgmaker-cheats.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08942139099941554 - nodes in this community are weakly interconnected._
- **Should `AppError` be split into smaller, more focused modules?**
  _Cohesion score 0.07878787878787878 - nodes in this community are weakly interconnected._