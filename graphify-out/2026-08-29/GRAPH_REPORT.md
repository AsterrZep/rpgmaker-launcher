# Graph Report - rpgmaker-launcher  (2026-08-29)

## Corpus Check
- 135 files · ~480,132 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1110 nodes · 2346 edges · 66 communities (47 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 56
- Community 58

## God Nodes (most connected - your core abstractions)
1. `AppState` - 49 edges
2. `t()` - 38 edges
3. `buildPanel()` - 36 edges
4. `App` - 34 edges
5. `ApiClient` - 31 edges
6. `Game` - 27 edges
7. `log()` - 24 edges
8. `GameDetector` - 23 edges
9. `EventsService` - 22 edges
10. `ConfigManager` - 21 edges

## Surprising Connections (you probably didn't know these)
- `run_api_server()` --calls--> `run_api_server()`  [EXTRACTED]
  rpgmaker_api.py → backend/api.py
- `main()` --calls--> `run_api_server()`  [EXTRACTED]
  backend/__main__.py → backend/api.py
- `main()` --calls--> `load_config()`  [EXTRACTED]
  backend/__main__.py → backend/config.py
- `main()` --calls--> `get_save_info()`  [EXTRACTED]
  backend/__main__.py → backend/saveedit.py
- `get_all_games()` --calls--> `get_games_dir()`  [EXTRACTED]
  backend/api.py → backend/config.py

## Import Cycles
- None detected.

## Communities (66 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (76): AppConfig, ConfigResult, get_config(), get_data_dir(), get_games_dir(), reset_config(), AppConfig, Default (+68 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (56): activeCounts(), applyAction(), applyPreset(), attachWheel(), buildPanel(), cheatAllItems(), cheatAllSkills(), cheatAllStates() (+48 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (41): Guarda la configuración del usuario a disco., save_config(), decrypt_rgss(), die(), ensure_binary(), Imprime error y termina con código de error., Descarga el binario del descifrador si no existe., Descifra archivos RGSS (XP/VX/VX Ace) usando el binario externo. (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (20): api, AppConfig, PluginItem, TODO: Implement native game launching in Rust, SaveContent, SaveItem, SyncStatus, ActionBarCallbacks (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (9): actor(), actors, antes, FakeActor, fs, inv, path, sws (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (30): clear_event_history(), emit_event(), get_event_history(), off_event(), on_event(), Arc, Option, Result (+22 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (23): AxumPath, AxumState, Bytes, Drop, Html, Router, GameServer, AppResult (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (18): CacheEntry, GameDetector, AppResult, Arc, Default, HashMap, Instant, Option (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (25): CompressError, DecodeError, DecompressError, From, FromHexError, FromUtf8Error, InvalidLength, AppError (+17 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (22): ActorInfo, create_test_mv_save(), AppResult, Error, Ok, Option, Path, PathBuf (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (29): analyze_plugin(), convert_single_quotes(), create_test_game(), find_plugins_js(), get_plugins_status(), load_plugins(), normalize_plugins_js(), PluginCategory (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (20): Devuelve la ruta del archivo de zoom para un juego., zoom_file_for(), load_config_module(), parse_key(), Convierte 'Control+equal' en (keyval, modifier_mask). Devuelve (None, 0) si la…, Carga este módulo por importlib (para archivos con guion)., get_sync_status(), Obtiene el estado de sincronización para todos los juegos. Args: games: Lista… (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (12): GameHandler, SimpleHTTPRequestHandler, Lista todas las partidas existentes con su contenido en base64., Sirve un archivo estático., Sirve la configuración del usuario como JS., Carpeta del juego según el Referer., Sirve un mod JS del juego., Sirve los presets de trucos del juego. (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (15): create_test_encrypted_data(), create_test_key(), Decrypter, DecryptResult, AppResult, Clone, Option, Path (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (27): autoprefixer, postcss, dependencies, @tauri-apps/api, @tauri-apps/plugin-dialog, devDependencies, autoprefixer, postcss (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (15): AppConfig, ConfigManager, default_config(), GeneralConfig, AppConfig, AppResult, Arc, Clone (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (13): ApiHandler, detect_engine(), EventBus, find_cover(), get_all_games(), open_target(), SimpleHTTPRequestHandler, Detecta el motor de un juego RPG Maker. (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.19
Nodes (12): Child, Mutex, ProcessManager, ProcessStatus, AppResult, Arc, Default, Instant (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, src, compilerOptions, allowImportingTsExtensions, isolatedModules, lib (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (6): DataItem, Game, ActionBar, DataBrowserModal, DecryptModal, GameCardCallbacks

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (18): _extract_zip(), extract_zips_api(), install_zip_paths(), Extrae un archivo ZIP., Obtiene el nombre del juego desde un archivo ZIP., Extrae todos los ZIPs pendientes en la carpeta de juegos., Copia y extrae ZIPs desde rutas locales., zip_game_name() (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (16): backup_saves(), count_saves(), execute_sync(), GameSyncResult, GameSyncStatus, get_sync_status(), pull_saves(), push_saves() (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.20
Nodes (9): B, Client, HttpClient, AppResult, Default, Path, Self, String (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (9): ActiveSession, find_mkxpz(), Localiza el runtime mkxp-z., Lanza un juego web (MV/MZ)., Lanza un juego nativo (XP/VX/VX Ace/2000-2003/Ren'Py)., load_state(), Carga el estado del launcher desde disco., Guarda el estado del launcher a disco. (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (12): _ensure_win32_shim(), Inicia el servidor API REST + SSE., Garantiza que el juego RGSS precargue el shim Win32., run_api_server(), _config(), Inicia el servidor HTTP para juegos web. Args: port: Puerto (0 = elegir uno…, Carga la configuración del usuario (atajos, preferencias)., start_game_server() (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (8): InjectionEngine, AppResult, Path, PathBuf, String, Vec, test_cleanup_nwjs_game(), test_prepare_nwjs_game()

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (12): autoKey(), getAuto(), inMap(), loadState(), notifyChange(), pack(), ready(), saveState() (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.31
Nodes (13): applyBridge(), b64decode(), ensureCache(), loadAllAsync(), loadAllSync(), mvFilename(), mzFilename(), read() (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (7): _free_port(), load_mod(), t_config_parse_key(), t_detect_engine(), t_saveedit_roundtrip(), t_server_http(), t_sync_push_pull()

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (12): _detect_engine_uncached(), find_dir(), find_glob(), first_find(), Busca un archivo por nombre en el árbol del directorio., Busca archivos por patrón glob., Busca un directorio por nombre., Verifica que Ren'Py tenga las librerías necesarias. (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (10): decrypt_directory(), decrypt_mv_mz_asset(), find_target(), have_arch(), Descifra un asset individual de RPG Maker MV/MZ. Args: data: Datos del archivo…, Escanea un directorio buscando archivos encriptados de MV/MZ. Args: directory:…, Descifra todos los assets encriptados de un directorio. Args: directory:…, Busca archivos RGSS encriptados en el directorio. (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (9): _config_module(), main(), make_settings(), make_webview(), Crea una ventana WebKit con scripts inyectados., Carga el módulo de configuración., Ejecuta el visor WebKit., Configura las opciones de WebKit. (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (10): dump_save(), get_save_info(), load_save(), Obtiene información detallada de un archivo de guardado. Args: save_path: Ruta…, Actualiza un archivo de guardado con nuevos valores. Args: save_path: Ruta al…, Lee un .rmmzsave/.rvdata2-like MV/MZ y devuelve el objeto JSON. Intenta…, Escribe el objeto como save MV/MZ válido. Si se indica backups_dir, copia el…, Genera un resumen legible del contenido del save. Args: obj: Objeto JSON del… (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (5): Launcher, main(), Inicia el servidor Python backend., Abre el frontend de IA en el navegador., Detiene el servidor backend.

### Community 37 - "Community 37"
Cohesion: 0.36
Nodes (5): AppResult, Self, String, UpdateInfo, UpdateService

### Community 38 - "Community 38"
Cohesion: 0.50
Nodes (7): c_err(), c_log(), c_ok(), c_warn(), die(), need_sudo(), install.sh script

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (3): new(), RPGML, RPGML::DummyAPI

### Community 48 - "Community 48"
Cohesion: 0.60
Nodes (3): keyFor(), poll(), setKey()

## Knowledge Gaps
- **54 isolated node(s):** `build_flatpak_tauri.sh script`, `publish_itch.sh script`, `rpgmaker-launcher-tauri`, `name`, `private` (+49 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppState` connect `Community 0` to `Community 17`, `Community 23`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `PluginInfo` connect `Community 11` to `Community 0`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `PluginsResult` connect `Community 0` to `Community 11`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `build_flatpak_tauri.sh script`, `publish_itch.sh script`, `rpgmaker-launcher-tauri` to the rest of the system?**
  _54 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05131578947368421 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08942139099941554 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07188160676532769 - nodes in this community are weakly interconnected._