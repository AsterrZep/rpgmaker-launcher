# RPG Maker Launcher — Plan de Arquitectura

## 📊 Estado Actual

El proyecto tiene **3 implementaciones paralelas** del mismo launcher:

| Rama | Stack | Archivos |
|------|-------|----------|
| `main` | Python + Tauri frontend | 9 `.py` + 5 `.js` + Tauri TS |
| `feat/go-migration` | Go/Wails + TS frontend | ~15 `.go` + TS |
| `feat/rust-migration-phase1` | Rust/Tauri + TS frontend | ~10 `.rs` + TS |

Todas comparten la **misma lógica de detección** con el **mismo bug** en Ren'Py 8.x.

---

## 🎯 Objetivo

Reestructurar la rama `main` (Python) con separación clara frontend/backend:

```
rpgmaker-launcher/
├── backend/                    # 🐍 Python backend
│   ├── core/                   # Modelos, configuración, utilidades
│   │   ├── __init__.py
│   │   ├── config.py           # Gestión de configuración
│   │   ├── models.py           # Dataclasses del dominio
│   │   └── constants.py        # Versiones, paths, labels
│   ├── engine/                 # Motor de detección y ejecución
│   │   ├── __init__.py
│   │   ├── detector.py         # Detección de motores (FIX: Ren'Py 8.x)
│   │   ├── process.py          # Lanzamiento de juegos
│   │   ├── decrypter.py        # Desencriptación de assets
│   │   ├── plugins.py          # Gestión de plugins (MZ/MV)
│   │   ├── save_editor.py      # Editor de saves (Ruby Marshal)
│   │   └── ruby_marshal.py     # Parser Ruby Marshal
│   ├── services/               # Servicios de negocio
│   │   ├── __init__.py
│   │   ├── game_server.py      # Servidor HTTP para juegos web
│   │   ├── sync.py             # Sincronización de saves
│   │   ├── zip_extract.py      # Extracción de .zip
│   │   └── webview.py          # Visor WebKit
│   ├── api/                    # Capa HTTP (REST + SSE)
│   │   ├── __init__.py
│   │   ├── server.py           # Servidor HTTP principal
│   │   ├── handlers.py         # Handlers de rutas
│   │   └── events.py           # Event bus SSE
│   ├── scripts/                # Scripts de launcher
│   │   ├── game_script.js      # Inyección en juegos web
│   │   ├── cheats.js           # Menú de trucos
│   │   ├── savebridge.js       # Puente de saves
│   │   ├── browser_keys.js     # Atajos de teclado
│   │   ├── gamepad.js          # Soporte gamepad
│   │   └── rewind.js           # Sistema de rewind
│   ├── runtimes/               # Binarios de motores
│   │   ├── mkxp-z              # Runtime para XP/VX/VX Ace
│   │   └── win32-shim.rb       # Shim Win32 para mkxp-z
│   ├── tests/                  # Tests
│   │   ├── test_detector.py
│   │   ├── test_plugins.py
│   │   ├── test_save_editor.py
│   │   └── test_api.py
│   └── main.py                 # Entry point del backend
│
├── frontend/                   # 🎨 Frontend Tauri
│   ├── src/
│   │   ├── api.ts              # Cliente HTTP
│   │   ├── app.ts              # App principal
│   │   ├── main.ts             # Entry point
│   │   ├── i18n.ts             # Internacionalización
│   │   ├── components/         # Componentes UI
│   │   │   ├── Header.ts
│   │   │   ├── Sidebar.ts
│   │   │   ├── GameCard.ts
│   │   │   ├── ActionBar.ts
│   │   │   ├── StatusBar.ts
│   │   │   ├── PluginsModal.ts
│   │   │   ├── SavesModal.ts
│   │   │   ├── SaveEditorModal.ts
│   │   │   ├── DataBrowserModal.ts
│   │   │   ├── SyncModal.ts
│   │   │   ├── DecryptModal.ts
│   │   │   ├── SettingsModal.ts
│   │   │   ├── ShortcutsModal.ts
│   │   │   └── Toasts.ts
│   │   └── styles/
│   │       └── main.css
│   ├── dist/                   # Build output
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── packaging/                  # 📦 Empaquetado
│   ├── org.rpgmaker.Launcher.desktop
│   ├── org.rpgmaker.Launcher.appdata.xml
│   ├── org.rpgmaker.Launcher.yaml
│   └── build_flatpak_tauri.sh
│
├── docs/                       # 📚 Documentación
│   ├── ARCHITECTURE_PLAN.md    # Este archivo
│   ├── UI-SPEC.md
│   └── itchio.md
│
├── tests/                      # 🧪 Tests E2E
│   ├── selftest.py
│   └── cheats-smoke.js
│
├── .github/                    # CI/CD
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── .gitignore
├── LICENSE
├── README.md
├── README.es.md
└── install.sh                  # Script de instalación
```

---

## 🔧 Fix Crítico: Ren'Py 8.x Compatibility

### Problema

La función `renpy_lib_ok` en **todas** las versiones solo verifica:

```python
# ❌ ACTUAL (falta Ren'Py 8.x)
def _renpy_lib_ok(rdir):
    for d in ("linux-x86_64", "linux-i686", "py2-linux-x86_64", "py2-linux-i686"):
        if os.path.isdir(os.path.join(rdir, "lib", d)):
            return True
    return False
```

### Solución

```python
# ✅ NUEVO (compatible con todas las versiones)
RENPY_LIB_DIRS = [
    # Ren'Py 8.x (Python 3) — versiones modernas
    "py3-linux-x86_64",
    "py3-linux-i686",
    "py3-linux-aarch64",    # ARM64: Steam Deck, Raspberry Pi, Chromebooks
    # Ren'Py 7.x (Python 2) — versiones legacy
    "py2-linux-x86_64",
    "py2-linux-i686",
    "py2-linux-aarch64",
    # Ren'Py muy antiguo (< 7.x)
    "linux-x86_64",
    "linux-i686",
    "linux-aarch64",
]

def _renpy_lib_ok(rdir):
    """Verifica que el juego Ren'Py tenga las librerías nativas para Linux."""
    lib_dir = os.path.join(rdir, "lib")
    for d in RENPY_LIB_DIRS:
        if os.path.isdir(os.path.join(lib_dir, d)):
            return True
    return False
```

### Versiones de Ren'Py soportadas

| Versión | Python | Lib Dir | Estado |
|---------|--------|---------|--------|
| Ren'Py 8.5.x (2026) | Python 3.12 | `py3-linux-x86_64` | ⚠️ Actualmente NO detectado |
| Ren'Py 8.4.x (2025) | Python 3.12 | `py3-linux-x86_64` | ⚠️ Actualmente NO detectado |
| Ren'Py 8.3.x (2024) | Python 3.12 | `py3-linux-x86_64` | ⚠️ Actualmente NO detectado |
| Ren'Py 8.2.x (2023) | Python 3.12 | `py3-linux-x86_64` | ⚠️ Actualmente NO detectado |
| Ren'Py 8.1.x (2022) | Python 3.10 | `py3-linux-x86_64` | ⚠️ Actualmente NO detectado |
| Ren'Py 8.0.x (2022) | Python 3.9 | `py3-linux-x86_64` | ⚠️ Actualmente NO detectado |
| Ren'Py 7.6.x (2023) | Python 2.7 | `py2-linux-x86_64` | ✅ Detectado |
| Ren'Py 7.5.x (2022) | Python 2.7 | `py2-linux-x86_64` | ✅ Detectado |
| Ren'Py 7.4.x (2021) | Python 2.7 | `py2-linux-x86_64` | ✅ Detectado |
| Ren'Py 7.3.x (2019) | Python 2.7 | `py2-linux-x86_64` | ✅ Detectado |
| Ren'Py < 7.3 | Python 2.7 | `linux-x86_64` | ✅ Detectado |

**Nota:** Ren'Py 8.x es la versión actual (2022-presente). La mayoría de juegos nuevos usan esta versión. El bug afecta potencialmente a **todos los juegos Ren'Py modernos**.

---

## 📁 Migración de Archivos

### Python Backend (desde raíz → `backend/`)

| Archivo Actual | Destino | Cambios |
|----------------|---------|---------|
| `rpgmaker_api.py` | `backend/main.py` + `backend/api/server.py` | Separar en entry point + handlers |
| `rpgmaker-config.py` | `backend/core/config.py` | Renombrar, limpiar |
| `rpgmaker-server.py` | `backend/services/game_server.py` | Mover a services |
| `rpgmaker-decrypter.py` | `backend/engine/decrypter.py` | Mover a engine |
| `rpgmaker-plugins.py` | `backend/engine/plugins.py` | Mover a engine |
| `rpgmaker-saveedit.py` | `backend/engine/save_editor.py` | Mover a engine |
| `rpgmaker-sync.py` | `backend/services/sync.py` | Mover a services |
| `rpgmaker-webview.py` | `backend/services/webview.py` | Mover a services |
| `rpgmaker-launcher-html.py` | `backend/api/server.py` | Integrar en server |

### JavaScript (desde raíz → `backend/scripts/`)

| Archivo Actual | Destino |
|----------------|---------|
| `rpgmaker-cheats.js` | `backend/scripts/cheats.js` |
| `rpgmaker-savebridge.js` | `backend/scripts/savebridge.js` |
| `rpgmaker-browser-keys.js` | `backend/scripts/browser_keys.js` |
| `rpgmaker-gamepad.js` | `backend/scripts/gamepad.js` |
| `rpgmaker-rewind.js` | `backend/scripts/rewind.js` |

### Frontend Tauri (desde `rpgmaker-launcher-tauri/` → `frontend/`)

Mover todo el directorio `src/`, `package.json`, configs de build.

### Runtimes

| Archivo Actual | Destino |
|----------------|---------|
| `runtimes/mkxp-z` | `backend/runtimes/mkxp-z` |
| `runtimes/icon.png` | `backend/runtimes/icon.png` |
| `win32-shim.rb` | `backend/runtimes/win32-shim.rb` |

---

## 🔄 Estrategia de Migración

### Fase 1: Fix Ren'Py 8.x (Inmediato)
1. Crear rama `fix/renpy-8x-compat` desde `main`
2. Actualizar `_renpy_lib_ok` en `rpgmaker_api.py`
3. Actualizar `renpyLibOK` en `rpgmaker-launcher-go/internal/engine/detector.go`
5. Actualizar `renpy_lib_ok` en `rpgmaker-launcher-tauri/src/engine/detector.rs`
6. Tests y merge

### Fase 2: Reestructurar Carpetas (Siguiente)
1. Crear rama `refactor/clean-architecture` desde `main`
2. Mover archivos Python a `backend/`
3. Mover archivos JS a `backend/scripts/`
4. Mover frontend Tauri a `frontend/`
5. Actualizar imports y paths
6. Tests y merge

### Fase 3: Unificar (Futuro)
1. Decidir stack final (Python vs Go vs Rust)
2. Migrar funcionalidad faltante
3. Deprecar implementaciones alternativas

---

## 🧪 Tests Requeridos

```bash
# Detector tests
python -m pytest backend/tests/test_detector.py -v

# API tests
python -m pytest backend/tests/test_api.py -v

# Plugin tests
python -m pytest backend/tests/test_plugins.py -v

# E2E tests
python tests/selftest.py
```

---

## 📝 Notas

- El frontend TypeScript se mantiene igual (ya está bien estructurado)
- Los scripts JS se mueven a `backend/scripts/` porque son servidos por el backend
- Los runtimes van en `backend/runtimes/` porque son usados por el backend
- El `install.sh` se actualiza para reflejar la nueva estructura
- Los tests se consolidan en `backend/tests/` y `tests/`
