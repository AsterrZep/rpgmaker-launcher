# Graph Report - rpgmaker-launcher  (2026-08-29)

## Corpus Check
- 96 files · ~471,792 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1538 nodes · 2678 edges · 86 communities (67 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f6da71ec`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppState
- rpgmaker-cheats.js
- Communities (122 total, 6 thin omitted)
- t
- cheats-smoke.js
- EventsService
- GameServer
- GameDetector
- AppError
- SaveEditor
- ApiClient
- plugins.rs
- 🚀 Guía de Migración - RPG Maker Launcher
- Chapter 1 - Coding Styles and Idioms
- App
- Decrypter
- package.json
- ConfigManager
- Tauri v2+ Development Skill
- ProcessManager
- compilerOptions
- Game
- Tauri v2+ Capabilities & Permissions Reference
- sync_cmd.rs
- README.md
- README.es.md
- 4. Pantallas y apartados
- InjectionEngine
- rpgmaker-rewind.js
- rpgmaker-savebridge.js
- selftest.py
- Commands (invoke)
- Chapter 5 - Automated Testing
- Chapter 8 - Comments vs Documentation
- tools_cmd.rs
- SyncService
- SyncModal
- UpdateService
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
- Tauri v2+ Development Skill
- rpgmaker-launcher-tauri
- 9.2 When to use pointers:
- Tauri v2+ Plugin Reference
- Chapter 4 - Errors Handling
- Chapter 6 - Generics, Dynamic Dispatch and Static Dispatch
- Chapter 3 - Performance Mindset
- Chapter 7 - Type State Pattern
- utils.rs
- Quick Reference
- RPG Maker Launcher — página de itch.io
- Graph Report - graphify  (2026-08-28)
- Chapter 2 - Clippy and Linting Discipline
- Part 1: Updater (tauri-plugin-updater)
- Tauri v2+ Updater & Distribution Reference
- Tauri v2+ Advanced Runtime Reference
- Chapter 9 - Understanding Pointers
- Auto-Trigger Keywords
- Tauri v2 References
- build-deb.sh

## God Nodes (most connected - your core abstractions)
1. `Communities (122 total, 6 thin omitted)` - 115 edges
2. `AppState` - 57 edges
3. `t()` - 38 edges
4. `buildPanel()` - 36 edges
5. `App` - 34 edges
6. `ApiClient` - 32 edges
7. `Game` - 27 edges
8. `GameDetector` - 23 edges
9. `EventsService` - 22 edges
10. `ConfigManager` - 21 edges

## Surprising Connections (you probably didn't know these)
- `App` --references--> `Game`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/app.ts → rpgmaker-launcher-tauri/src/api.ts
- `GameCard` --references--> `Game`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/components/GameCard.ts → rpgmaker-launcher-tauri/src/api.ts
- `GameCardCallbacks` --references--> `Game`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/components/GameCard.ts → rpgmaker-launcher-tauri/src/api.ts
- `PluginsModal` --references--> `Game`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/components/PluginsModal.ts → rpgmaker-launcher-tauri/src/api.ts
- `SaveEditorModal` --references--> `Game`  [EXTRACTED]
  rpgmaker-launcher-tauri/src/components/SaveEditorModal.ts → rpgmaker-launcher-tauri/src/api.ts

## Import Cycles
- None detected.

## Communities (86 total, 19 thin omitted)

### Community 0 - "AppState"
Cohesion: 0.05
Nodes (78): AppConfig, ConfigResult, get_config(), get_data_dir(), get_games_dir(), reset_config(), AppConfig, Default (+70 more)

### Community 1 - "rpgmaker-cheats.js"
Cohesion: 0.09
Nodes (56): activeCounts(), applyAction(), applyPreset(), attachWheel(), buildPanel(), cheatAllItems(), cheatAllSkills(), cheatAllStates() (+48 more)

### Community 2 - "Communities (122 total, 6 thin omitted)"
Cohesion: 0.02
Nodes (115): Communities (122 total, 6 thin omitted), Community 0 - "Community 0", Community 100 - "Community 100", Community 101 - "Community 101", Community 102 - "Community 102", Community 105 - "Community 105", Community 106 - "Community 106", Community 107 - "Community 107" (+107 more)

### Community 3 - "t"
Cohesion: 0.14
Nodes (19): api, AppConfig, DataItem, PluginItem, SaveContent, SaveItem, SyncStatus, ActionBarCallbacks (+11 more)

### Community 4 - "cheats-smoke.js"
Cohesion: 0.05
Nodes (9): actor(), actors, antes, FakeActor, fs, inv, path, sws (+1 more)

### Community 5 - "EventsService"
Cohesion: 0.10
Nodes (30): clear_event_history(), emit_event(), get_event_history(), off_event(), on_event(), Arc, Option, Result (+22 more)

### Community 6 - "GameServer"
Cohesion: 0.14
Nodes (23): AxumPath, AxumState, Bytes, Drop, Html, Router, GameServer, AppResult (+15 more)

### Community 7 - "GameDetector"
Cohesion: 0.14
Nodes (18): CacheEntry, GameDetector, AppResult, Arc, Default, HashMap, Instant, Option (+10 more)

### Community 8 - "AppError"
Cohesion: 0.09
Nodes (25): B, Client, CompressError, DecodeError, DecompressError, From, FromHexError, FromUtf8Error (+17 more)

### Community 9 - "SaveEditor"
Cohesion: 0.17
Nodes (22): ActorInfo, create_test_mv_save(), AppResult, Error, Ok, Option, Path, PathBuf (+14 more)

### Community 11 - "plugins.rs"
Cohesion: 0.13
Nodes (39): get_plugins(), PluginsResult, restore_plugins(), RestoreResult, Result, State, String, Vec (+31 more)

### Community 12 - "🚀 Guía de Migración - RPG Maker Launcher"
Cohesion: 0.04
Nodes (48): 2.1 API Client Actualizado (`api.ts`), 2.2 Sistema de Eventos Nativo, 2.3 Comandos Tauri IPC Agregados, 3.1 Motor de Detección de Juegos, 3.2 Servidor HTTP para Juegos Web, 3.3 Visor WebKit (Reemplazo por Tauri Webview), 3.4 Gestión de Configuración Avanzada, 5.1 Pruebas Unitarias Rust (+40 more)

### Community 13 - "Chapter 1 - Coding Styles and Idioms"
Cohesion: 0.04
Nodes (48): 1.1 Borrowing Over Cloning, 1.2 When to pass by value? (Copy trait), 1.3 Handling `Option<T>` and `Result<T, E>`, 1.4 Prevent Early Allocation, 1.5 Iterator, `.iter` vs `for`, 1.6 Comments: Context, not Clutter, 1.7 Use Declarations - "imports", 1.8 When to Extract a Function (and When Not To) (+40 more)

### Community 15 - "Decrypter"
Cohesion: 0.20
Nodes (15): create_test_encrypted_data(), create_test_key(), Decrypter, DecryptResult, AppResult, Clone, Option, Path (+7 more)

### Community 16 - "package.json"
Cohesion: 0.07
Nodes (27): autoprefixer, postcss, dependencies, @tauri-apps/api, @tauri-apps/plugin-dialog, devDependencies, autoprefixer, postcss (+19 more)

### Community 17 - "ConfigManager"
Cohesion: 0.15
Nodes (16): AppConfig, ConfigManager, default_config(), GeneralConfig, AppConfig, AppResult, Arc, Clone (+8 more)

### Community 18 - "Tauri v2+ Development Skill"
Cohesion: 0.06
Nodes (36): Always Do, Before You Start, Bundled Resources, Cargo.toml, Channel Streaming Pattern, Command Returns Undefined, Common Mistakes, Common Patterns (+28 more)

### Community 19 - "ProcessManager"
Cohesion: 0.19
Nodes (12): Child, Mutex, ProcessManager, ProcessStatus, AppResult, Arc, Default, Instant (+4 more)

### Community 20 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, src, compilerOptions, allowImportingTsExtensions, isolatedModules, lib (+12 more)

### Community 21 - "Game"
Cohesion: 0.16
Nodes (5): Game, ActionBar, DataBrowserModal, DecryptModal, GameCardCallbacks

### Community 22 - "Tauri v2+ Capabilities & Permissions Reference"
Cohesion: 0.07
Nodes (30): Anti-Pattern: Missing Capability, Capability Best Practices, Capability File Structure, Clipboard (`tauri-plugin-clipboard-manager`), Common Capability Patterns, Contents, Core Permissions, Custom Permission Files (+22 more)

### Community 23 - "sync_cmd.rs"
Cohesion: 0.29
Nodes (16): backup_saves(), count_saves(), execute_sync(), GameSyncResult, GameSyncStatus, get_sync_status(), pull_saves(), push_saves() (+8 more)

### Community 24 - "README.md"
Cohesion: 0.07
Nodes (27): 🎮 Adding Games — It's That Simple, 🏗️ Architecture, 💬 Community & Support, 🔧 Configuration, 🤝 Contributing, 🙏 Credits & Acknowledgments, Data Browser, ⌨️ Default Shortcuts (All Configurable) (+19 more)

### Community 25 - "README.es.md"
Cohesion: 0.07
Nodes (27): 🏗️ Arquitectura, ⌨️ Atajos Por Defecto (Todos Configurables), 🎮 Añadir Juegos — Así de Simple, Biblioteca Principal, 📸 Capturas, ✨ Características Destacadas, 💬 Comunidad y Soporte, 🔧 Configuración (+19 more)

### Community 26 - "4. Pantallas y apartados"
Cohesion: 0.08
Nodes (23): 1. Visión general del producto, 2. Arquitectura objetivo (migración Tauri), 3.1 Paleta oscura, 3.2 Métricas actuales, 3.3 Iconografía, 3. Design System actual (referencia a mantener/mejorar), 4.10 OTROS APARTADOS, 4.1 HOMEPAGE / BIBLIOTECA (pantalla principal) (+15 more)

### Community 27 - "InjectionEngine"
Cohesion: 0.26
Nodes (8): InjectionEngine, AppResult, Path, PathBuf, String, Vec, test_cleanup_nwjs_game(), test_prepare_nwjs_game()

### Community 28 - "rpgmaker-rewind.js"
Cohesion: 0.33
Nodes (12): autoKey(), getAuto(), inMap(), loadState(), notifyChange(), pack(), ready(), saveState() (+4 more)

### Community 29 - "rpgmaker-savebridge.js"
Cohesion: 0.31
Nodes (13): applyBridge(), b64decode(), ensureCache(), loadAllAsync(), loadAllSync(), mvFilename(), mzFilename(), read() (+5 more)

### Community 30 - "selftest.py"
Cohesion: 0.22
Nodes (7): _free_port(), load_mod(), t_config_parse_key(), t_detect_engine(), t_saveedit_roundtrip(), t_server_http(), t_sync_push_pull()

### Community 31 - "Commands (invoke)"
Cohesion: 0.09
Nodes (23): Async Command, Basic Command, Channels: Typed Streaming, Command with Multiple Arguments, Command with Raw Binary Data, Command with Result Error Handling, Command with State, Command with Window Access (+15 more)

### Community 32 - "Chapter 5 - Automated Testing"
Cohesion: 0.09
Nodes (22): 5.1 Tests as Living Documentation, 5.2 Add Test Examples to your Docs, 5.3 Unit Test vs Integration Tests vs Doc tests, 5.4 How to `assert!`, 5.5 Snapshot Testing with `cargo insta`, 5.6 ✅ Snapshot Best Practices, 🚨 `assert!` reminders, Attributes: (+14 more)

### Community 33 - "Chapter 8 - Comments vs Documentation"
Cohesion: 0.10
Nodes (20): 8.1 Comments vs Documentation: Know the Difference, 8.2 When to use comments, 8.3 When comments get in the way, 8.4 Don't Write Living Documentation (living comments), 8.5 Replace Comments with Code, 8.6 `TODO` should become issues, 8.7 When to use doc comments, 8.8 Documentation in Rust: How, When and Why (+12 more)

### Community 34 - "tools_cmd.rs"
Cohesion: 0.27
Nodes (18): check_update(), DataItem, DataResult, get_data(), get_status(), has_no_mods(), ModsResult, open_target() (+10 more)

### Community 35 - "SyncService"
Cohesion: 0.25
Nodes (9): AppResult, Path, PathBuf, Self, String, Vec, SyncResult, SyncService (+1 more)

### Community 37 - "UpdateService"
Cohesion: 0.36
Nodes (5): AppResult, Self, String, UpdateInfo, UpdateService

### Community 38 - "install.sh"
Cohesion: 0.50
Nodes (7): c_err(), c_log(), c_ok(), c_warn(), die(), need_sudo(), install.sh script

### Community 46 - "RPGML::DummyAPI"
Cohesion: 0.40
Nodes (3): new(), RPGML, RPGML::DummyAPI

### Community 48 - "rpgmaker-gamepad.js"
Cohesion: 0.60
Nodes (3): keyFor(), poll(), setKey()

### Community 56 - "Tauri v2+ Development Skill"
Cohesion: 0.12
Nodes (16): Companion Agent (Deprecated), Core Capabilities, Dependencies, Don't Use This Skill For, File Structure, Known Issues Prevention, Official Documentation, Quick Usage (+8 more)

### Community 66 - "9.2 When to use pointers:"
Cohesion: 0.13
Nodes (15): 9.2 When to use pointers:, [`Arc<T>`](https://doc.rust-lang.org/std/sync/struct.Arc.html) - Atomic Reference Counter (multi-thread), [`Box<T>`](https://doc.rust-lang.org/std/boxed/struct.Box.html) - Heap Allocated, [`Cell<T>`](https://doc.rust-lang.org/std/cell/struct.Cell.html) - Copy-only interior mutability, [`*const T/*mut T`](https://doc.rust-lang.org/std/primitive.pointer.html) - Raw pointers, [`LazyCell`](https://doc.rust-lang.org/std/cell/struct.LazyCell.html) - Lazy initialization of `OnceCell`, [`LazyLock`](https://doc.rust-lang.org/std/sync/struct.LazyLock.html) - thread-safe `LazyCell`, `&mut T` - Exclusive Borrow: (+7 more)

### Community 67 - "Tauri v2+ Plugin Reference"
Cohesion: 0.13
Nodes (15): 10. Deep Link (`tauri-plugin-deep-link`), 11. Opener (`tauri-plugin-opener`), 12. Process (`tauri-plugin-process`), 1. File System (`tauri-plugin-fs`), 2. Dialog (`tauri-plugin-dialog`), 3. Shell (`tauri-plugin-shell`), 4. HTTP (`tauri-plugin-http`), 5. Store (`tauri-plugin-store`) (+7 more)

### Community 68 - "Chapter 4 - Errors Handling"
Cohesion: 0.14
Nodes (13): 4.1 Prefer `Result`, avoid panic 🫨, 4.2 Avoid `unwrap`/`expect` in Production, 4.3 `thiserror` for Crate level errors, 4.4 Reserve `anyhow` for Binaries, 4.5 Use `?` to Bubble Errors, 4.6 Unit Test should exercise errors, 4.7 Important Topics, 🚨 Alternative ways of handling `unwrap`/`expect`: (+5 more)

### Community 69 - "Chapter 6 - Generics, Dynamic Dispatch and Static Dispatch"
Cohesion: 0.14
Nodes (14): 6.1 [Generics](https://doc.rust-lang.org/book/ch10-00-generics.html), 6.2 Static Dispatch: `impl Trait` or `<T: Trait>`, 6.3 Dynamic Dispatch: `dyn Trait`, 6.4 Trade-off summary, 6.5 Best Practices for Dynamic Dispatch, 6.6 🚨 Trait Objects Ergonomics, ❌ Avoid Dynamic Dispatch When:, ✅ Best when: (+6 more)

### Community 70 - "Chapter 3 - Performance Mindset"
Cohesion: 0.15
Nodes (13): 3.1 Flamegraph, 3.2 Avoid Redundant Cloning, 3.3 Stack vs Heap: Be size-smart!, 3.4 Iterators and Zero-Cost Abstractions, A good first steps, ❗ Avoid creating intermediate collections unless it is really needed:, ❗ Be Mindful, Chapter 3 - Performance Mindset (+5 more)

### Community 71 - "Chapter 7 - Type State Pattern"
Cohesion: 0.17
Nodes (12): 7.1 What is Type State Pattern?, 7.2 Why use it?, 7.3 Simple Example: File State, 7.4 Real-World Examples, 7.5 Pros and Cons, ❌ Avoid it when:, Builder Pattern with Compile-Time Guarantees, Chapter 7 - Type State Pattern (+4 more)

### Community 72 - "utils.rs"
Cohesion: 0.20
Nodes (7): ensure_dir(), remove_file(), Path, Result, String, safe_log_name(), test_safe_log_name_unicode()

### Community 73 - "Quick Reference"
Cohesion: 0.18
Nodes (11): Best Practices Reference, Borrowing & Ownership, Documentation, Error Handling, Generics & Dispatch, Linting, Performance, Quick Reference (+3 more)

### Community 74 - "RPG Maker Launcher — página de itch.io"
Cohesion: 0.18
Nodes (10): 1. Datos de la página, 2. Descripción completa (pégalo en el editor), 3. Material que debes subir / preparar, 4. Textos para publicitarlo (copiar y pegar), Consejos para el lanzamiento, Descripción larga (HTML con diseño), Dónde publicar, RPG Maker Launcher — página de itch.io (+2 more)

### Community 75 - "Graph Report - graphify  (2026-08-28)"
Cohesion: 0.18
Nodes (10): Community Hubs (Navigation), Corpus Check, God Nodes (most connected - your core abstractions), Graph Freshness, Graph Report - graphify  (2026-08-28), Import Cycles, Knowledge Gaps, Suggested Questions (+2 more)

### Community 77 - "Chapter 2 - Clippy and Linting Discipline"
Cohesion: 0.25
Nodes (8): 2.1 Why care about linting?, 2.2 Always run `cargo clippy`, 2.3 Important Clippy Lints to Respect, 2.4 Fix warnings, don't silence them!, 2.5 Configure workspace/package lints, Chapter 2 - Clippy and Linting Discipline, Example:, Handling false positives

### Community 79 - "Part 1: Updater (tauri-plugin-updater)"
Cohesion: 0.25
Nodes (8): Capability Permission, Checking for Updates in Code, Configuration (tauri.conf.json), Install, Key Generation, Part 1: Updater (tauri-plugin-updater), Signed Build, Update Server Response Format

### Community 80 - "Tauri v2+ Updater & Distribution Reference"
Cohesion: 0.29
Nodes (7): Contents, Linux, macOS, Part 2: Distribution and Signing, Part 3: Bundle Configuration, Tauri v2+ Updater & Distribution Reference, Windows

### Community 81 - "Tauri v2+ Advanced Runtime Reference"
Cohesion: 0.33
Nodes (6): Contents, Section 1: System Tray (`TrayIconBuilder`), Section 2: Sidecars (External Binaries), Section 3: Deep Links (`tauri-plugin-deep-link`), Section 4: Custom Protocols, Tauri v2+ Advanced Runtime Reference

### Community 82 - "Chapter 9 - Understanding Pointers"
Cohesion: 0.40
Nodes (4): 9.1 Thread Safety, Chapter 9 - Understanding Pointers, 📌 Language Comparison, References

### Community 83 - "Auto-Trigger Keywords"
Cohesion: 0.50
Nodes (4): Auto-Trigger Keywords, Error-Based Keywords, Primary Keywords, Secondary Keywords

### Community 84 - "Tauri v2 References"
Cohesion: 0.67
Nodes (3): Navigation Guide, Reference Files, Tauri v2 References

## Knowledge Gaps
- **535 isolated node(s):** `build_flatpak_tauri.sh script`, `publish_itch.sh script`, `rpgmaker-launcher-tauri`, `name`, `private` (+530 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppState` connect `AppState` to `ConfigManager`, `tools_cmd.rs`, `plugins.rs`, `sync_cmd.rs`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `ConfigManager` connect `ConfigManager` to `AppState`, `sync_cmd.rs`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `cheatVolume()` connect `rpgmaker-cheats.js` to `ConfigManager`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `build_flatpak_tauri.sh script`, `publish_itch.sh script`, `rpgmaker-launcher-tauri` to the rest of the system?**
  _535 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppState` be split into smaller, more focused modules?**
  _Cohesion score 0.05176116838487973 - nodes in this community are weakly interconnected._
- **Should `rpgmaker-cheats.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08942139099941554 - nodes in this community are weakly interconnected._
- **Should `Communities (122 total, 6 thin omitted)` be split into smaller, more focused modules?**
  _Cohesion score 0.017391304347826087 - nodes in this community are weakly interconnected._