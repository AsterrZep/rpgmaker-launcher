# Guía de Migración - RPG Maker Launcher

## Estado Actual

El proyecto está en proceso de migración de **Python sidecar** a **Rust nativo** con Tauri v2.

### Fase 1: Completada ✅
- Backend Python reorganizado en paquete `backend/`
- Estructura Rust modular implementada
- Comandos Tauri IPC creados
- Frontend actualizado para usar invoke() de Tauri

### Fase 2: En Progreso 🔄
- Eliminación de código Python obsoleto
- Actualización de scripts de instalación
- Pruebas de integración

### Fase 3: Pendiente ⏳
- Migración completa de lógica de negocio a Rust
- Eliminación definitiva del servidor HTTP Python
- Optimización de rendimiento

---

## Estructura de Archivos

### Archivos Python (Legacy - Mantener para compatibilidad)
```bash
rpgmaker-config.py      # Wrapper → backend.config
rpgmaker-decrypter.py   # Wrapper → backend.decrypter
rpgmaker-plugins.py     # Wrapper → backend.plugins
rpgmaker-saveedit.py    # Wrapper → backend.saveedit
rpgmaker-sync.py        # Wrapper → backend.sync
rpgmaker-server.py      # Wrapper → backend.server
rpgmaker_api.py         # Wrapper → backend.api
rpgmaker-webview.py     # Wrapper → backend.webview
rpgmaker-launcher-html.py # Frontend HTML legacy
```

### Paquete Backend Python (Nuevo)
```bash
backend/
├── __init__.py          # Package init
├── __main__.py          # Entry point: python -m backend
├── api.py               # API REST + SSE
├── config.py            # Gestión de configuración
├── decrypter.py         # Descifrado de assets
├── plugins.py           # Gestión de plugins
├── saveedit.py          # Edición de saves
├── server.py            # Servidor HTTP
├── sync.py              # Sincronización
├── utils.py             # Utilidades
└── webview.py           # Visor WebKit
```

### Código Rust (Nuevo)
```bash
rpgmaker-launcher-tauri/src/
├── main.rs              # Entry point Tauri
├── core/                # Módulos fundamentales
│   ├── config.rs        # ConfigManager atómico
│   ├── error.rs         # AppError unificado
│   └── state.rs         # AppState global
├── engine/              # Motores de procesamiento
│   ├── decrypter.rs     # Descifrado paralelo
│   ├── save_editor.rs   # Editor de saves
│   ├── injector.rs      # Inyección código
│   └── process.rs       # Gestión procesos
├── commands/            # Comandos Tauri IPC
│   ├── decrypter_cmd.rs
│   ├── save_cmd.rs
│   ├── game_cmd.rs
│   ├── config_cmd.rs
│   ├── sync_cmd.rs
│   └── event_cmd.rs
└── services/            # Servicios externos
    ├── sync.rs
    ├── update.rs
    ├── http.rs
    └── events.rs
```

---

## Comandos de Desarrollo

### Ejecutar en modo desarrollo (Python)
```bash
# Backend Python
python -m backend api --port 8000

# Frontend Vite
cd rpgmaker-launcher-tauri
npm run dev
```

### Ejecutar en modo desarrollo (Rust)
```bash
# Usar el script existente
./run-tauri.sh

# O directamente con cargo
cd rpgmaker-launcher-tauri
cargo run
```

### Compilar para producción
```bash
cd rpgmaker-launcher-tauri
cargo build --release
```

---

## Cambios en la API

### Antes (HTTP + SSE)
```typescript
// Frontend usaba fetch() al servidor Python
const response = await fetch('http://127.0.0.1:8000/api/games');
const data = await response.json();
```

### Ahora (Tauri IPC)
```typescript
// Frontend usa invoke() al backend Rust
import { invoke } from '@tauri-apps/api/core';
const data = await invoke('get_games');
```

---

## Pendiente para Fase 3

1. **Migrar lógica de detección de juegos a Rust**
   - `detect_engine()` → `engine/detector.rs`
   - `find_cover()` → `engine/covers.rs`

2. **Migrar servidor HTTP a Rust**
   - `server.py` → `services/game_server.rs`
   - Eliminar dependencia de Python

3. **Migrar visor WebKit a Rust**
   - `webview.py` → usar Tauri Webview
   - Eliminar dependencia de GTK

4. **Eliminar archivos Python legacy**
   - Mantener wrappers solo si hay usuarios externos
   - Documentar cambios en CHANGELOG

---

## Notas Importantes

- Los wrappers Python se mantienen por compatibilidad hacia atrás
- El servidor HTTP Python sigue siendo necesario para juegos web (MV/MZ)
- La migración completa eliminará la dependencia de Python
- Los tests unitarios Rust están en cada módulo (`#[cfg(test)]`)

---

## Enlaces Útiles

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Rayon - Parallel Processing](https://docs.rs/rayon)
- [Tokio - Async Runtime](https://tokio.rs/)
