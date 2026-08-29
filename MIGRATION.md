# 🚀 Guía de Migración - RPG Maker Launcher
## De Python Sidecar a Rust Nativo con Tauri v2

**Fecha de inicio:** 29 de Agosto, 2026
**Última actualización:** 29 de Agosto, 2026
**Rama de desarrollo:** `feat/rust-migration-phase1`

---

## 📊 Estado General de la Migración

| Fase | Estado | Progreso | Descripción |
|------|--------|----------|-------------|
| Fase 1 | ✅ Completada | 100% | Backend Python reorganizado |
| Fase 2 | ✅ Completada | 100% | Frontend Tauri IPC + Eventos |
| Fase 3 | 🔄 En Progreso | 0% | Migración lógica de negocio a Rust |
| Fase 4 | ⏳ Pendiente | 0% | Eliminación dependencia Python |
| Fase 5 | ⏳ Pendiente | 0% | Pruebas y optimización |

---

## ✅ Fase 1: Backend Python Reorganizado
**Estado:** Completada
**Fecha:** 29/08/2026

### Objetivo
Reorganizar el backend Python monolítico en un paquete modular estructurado.

### Archivos Creados
```
backend/
├── __init__.py          # Package init con exports
├── __main__.py          # Entry point: python -m backend
├── api.py               # API REST + SSE (1,256 líneas)
├── config.py            # Gestión de configuración (164 líneas)
├── decrypter.py         # Descifrado de assets (275 líneas)
├── plugins.py           # Gestión de plugins (319 líneas)
├── saveedit.py          # Edición de saves (284 líneas)
├── server.py            # Servidor HTTP para juegos (401 líneas)
├── sync.py              # Sincronización (207 líneas)
├── utils.py             # Utilidades compartidas (122 líneas)
└── webview.py           # Visor WebKit (272 líneas)
```

### Cambios en Archivos Originales
- `rpgmaker-config.py` → Wrapper delgado que importa `backend.config`
- `rpgmaker-decrypter.py` → Wrapper delgado que importa `backend.decrypter`
- `rpgmaker-plugins.py` → Wrapper delgado que importa `backend.plugins`
- `rpgmaker-saveedit.py` → Wrapper delgado que importa `backend.saveedit`
- `rpgmaker-sync.py` → Wrapper delgado que importa `backend.sync`
- `rpgmaker-server.py` → Wrapper delgado que importa `backend.server`
- `rpgmaker_api.py` → Wrapper delgado que importa `backend.api`
- `rpgmaker-webview.py` → Wrapper delgado que importa `backend.webview`

### Beneficios
- ✅ Backward compatibility mantenida
- ✅ Código reutilizable y testeable
- ✅ Imports limpios y organizados
- ✅ CLI unificado via `python -m backend`

---

## ✅ Fase 2: Frontend Tauri IPC y Sistema de Eventos
**Estado:** Completada
**Fecha:** 29/08/2026

### Objetivo
Actualizar el frontend TypeScript para usar Tauri's invoke() en lugar de fetch() HTTP.

### Cambios Realizados

#### 2.1 API Client Actualizado (`api.ts`)
```typescript
// ANTES: Fetch HTTP al servidor Python
const response = await fetch('http://127.0.0.1:8000/api/games');

// AHORA: Tauri IPC invoke() al backend Rust
import { invoke } from '@tauri-apps/api/core';
const data = await invoke('get_games');
```

- Detección automática de entorno (Tauri vs HTTP)
- Fallback a HTTP para funcionalidad no implementada
- Soporte para modo desarrollo con Vite

#### 2.2 Sistema de Eventos Nativo
```
services/events.rs     # Servicio de eventos
commands/event_cmd.rs  # Comandos IPC para eventos
```

Eventos soportados:
- `extraction_progress` - Progreso de extracción de ZIPs
- `server_started` - Servidor de juego iniciado
- `server_stopped` - Servidor de juego detenido
- `sync_complete` - Sincronización completada
- `game_launched` - Juego lanzado

#### 2.3 Comandos Tauri IPC Agregados
```rust
// Eventos
emit_event()           # Emitir eventos
get_event_history()    # Obtener historial
clear_event_history()  # Limpiar historial
on_event()             # Registrar listener
off_event()            # Eliminar listener
```

### Beneficios
- ✅ Comunicación nativa de alta performance
- ✅ Eliminación de dependencia HTTP en producción
- ✅ Soporte para modo desarrollo
- ✅ Sistema de eventos flexible

---

## 🔄 Fase 3: Migración Lógica de Negocio a Rust
**Estado:** En Progreso (0%)
**Fecha estimada:** Semana 2-3

### Objetivo
Migrar la lógica principal del backend Python a módulos Rust nativos.

### Módulos a Migrar

#### 3.1 Motor de Detección de Juegos
```rust
// Actualmente en Python: api.py → detect_engine()
// Objetivo en Rust: engine/detector.rs

pub struct GameDetector {
    cache: Arc<RwLock<HashMap<PathBuf, (Instant, String, String)>>>,
}

impl GameDetector {
    pub async fn detect_engine(&self, path: &Path) -> Option<(PathBuf, String)>;
    pub async fn find_cover(&self, game_top: &Path, root: &Path) -> Option<PathBuf>;
    pub async fn scan_games(&self, games_dir: &Path) -> Vec<GameInfo>;
}
```

**Dependencias Rust necesarias:**
- `walkdir` - Exploración de directorios
- `regex` - Detección de patrones
- `tokio` - Async runtime

#### 3.2 Servidor HTTP para Juegos Web
```rust
// Actualmente en Python: server.py
// Objetivo en Rust: services/game_server.rs

pub struct GameServer {
    handler: GameHandler,
}

impl GameServer {
    pub async fn start(port: u16, dir: &Path) -> Result<Self>;
    pub async fn stop(&self) -> Result<()>;
    pub fn port(&self) -> u16;
}
```

**Dependencias Rust necesarias:**
- `axum` o `actix-web` - Framework HTTP
- `tower` - Middleware
- `tokio` - Async runtime

#### 3.3 Visor WebKit (Reemplazo por Tauri Webview)
```rust
// Actualmente en Python: webview.py (GTK + WebKit)
// Objetivo: Usar Tauri Webview nativo

// En lugar de crear un visor personalizado,
// usar la funcionalidad de Tauri para crear
// ventanas webview dedicadas.
```

#### 3.4 Gestión de Configuración Avanzada
```rust
// Actualmente en Python: config.py
// Objetivo en Rust: core/config.rs (ya implementado)

// Estado: ✅ Completado en Fase 1
// Pendiente: Integración completa con frontend
```

### Dependencias Rust a Agregar
```toml
# Para servidor HTTP
axum = "0.7"
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "fs"] }

# Para detección de juegos
walkdir = "2.5"
regex = "1.10"

# Para procesamiento de imágenes (portadas)
image = "0.25"

# Para compresión ZIP
zip = "0.6"
```

### Tareas Específicas
- [ ] Implementar `GameDetector` con caché
- [ ] Implementar `GameServer` con Axum
- [ ] Integrar Tauri Webview para juegos
- [ ] Migrar lógica de plugins a Rust
- [ ] Migrar lógica de sync a Rust
- [ ] Actualizar comandos Tauri IPC

---

## ⏳ Fase 4: Eliminación Dependencia Python
**Estado:** Pendiente
**Fecha estimada:** Semana 4

### Objetivo
Eliminar completamente la dependencia de Python runtime.

### Archivos a Eliminar
```bash
# Wrappers Python (ya no necesarios)
rpgmaker-config.py
rpgmaker-decrypter.py
rpgmaker-plugins.py
rpgmaker-saveedit.py
rpgmaker-sync.py
rpgmaker-server.py
rpgmaker_api.py
rpgmaker-webview.py
rpgmaker-launcher-html.py

# Backend Python completo
backend/

# Scripts de soporte
win32-shim.rb
```

### Archivos a Actualizar
```bash
# Scripts de instalación
install.sh           # Eliminar dependencias Python
run-tauri.sh         # Simplificar (solo Rust)

# Configuración de empaquetado
packaging/*.yaml     # Eliminar dependencia python3
tauri.conf.json      # Actualizar bundle config
```

### Dependencias del Sistema a Eliminar
```bash
# En install.sh
- python3-tk
- python3-pil
- python3-gi
- gir1.2-webkit2-4.1
```

### Prerrequisitos
- [ ] Todo el backend Python migrado a Rust
- [ ] Servidor HTTP implementado en Rust
- [ ] Visor WebKit reemplazado por Tauri Webview
- [ ] Pruebas de integración completas

---

## ⏳ Fase 5: Pruebas y Optimización
**Estado:** Pendiente
**Fecha estimada:** Semana 5

### Objetivo
Asegurar calidad, rendimiento y estabilidad.

### 5.1 Pruebas Unitarias Rust
```rust
// Tests para cada módulo
#[cfg(test)]
mod tests {
    #[test]
    fn test_game_detection() { ... }
    
    #[test]
    fn test_asset_decryption() { ... }
    
    #[test]
    fn test_save_parsing() { ... }
    
    #[tokio::test]
    async fn test_game_server() { ... }
}
```

### 5.2 Pruebas de Integración
```bash
# Pruebas end-to-end
cargo test --workspace

# Pruebas de rendimiento
cargo bench

# Pruebas de seguridad
cargo audit
```

### 5.3 Optimización de Rendimiento
```toml
# Cargo.toml - Profile release optimizado
[profile.release]
codegen-units = 1
lto = "fat"
opt-level = "z"      # Mínimo tamaño
panic = "abort"
strip = true         # Sin símbolos debug
```

### 5.4 Métricas Objetivo
| Métrica | Estado Actual | Objetivo |
|---------|---------------|----------|
| Tiempo inicio | ~2s | <0.25s |
| Memoria RAM | ~180MB | <25MB |
| Tamaño paquete | ~85MB | ~10MB |
| Procesos | 2-3 | 1 |

### 5.5 Documentación
- [ ] Actualizar README.md
- [ ] Crear CHANGELOG.md
- [ ] Documentar API Rust
- [ ] Guía de contribución

---

## 📈 Progreso por Commits

```
ed57386 feat: Fase 2 - Frontend Tauri IPC y sistema de eventos
cfdeade feat: Fase 1 de migración a Rust - Backend modular y estructura Tauri
```

### Estadísticas
- **Archivos modificados:** 50+
- **Líneas agregadas:** ~9,000
- **Líneas eliminadas:** ~2,800
- **Módulos Rust creados:** 20
- **Comandos Tauri IPC:** 25+

---

## 🔧 Comandos de Desarrollo

### Ejecutar en Modo Desarrollo
```bash
# Backend Python (para referencia)
python -m backend api --port 8000

# Frontend Tauri
./run-tauri.sh

# O directamente
cd rpgmaker-launcher-tauri
cargo run
```

### Compilar para Producción
```bash
cd rpgmaker-launcher-tauri
cargo build --release

# El binario estará en:
# target/release/rpgmaker-launcher-tauri
```

### Ejecutar Pruebas
```bash
# Todas las pruebas
cargo test --workspace

# Solo pruebas de un módulo
cargo test --package rpgmaker-launcher-tauri --lib engine::decrypter

# Con output verbose
cargo test -- --nocapture
```

---

## 🎯 Próximos Pasos Inmediatos

1. **Implementar GameDetector en Rust**
   - Detección de motores de juegos
   - Búsqueda de portadas
   - Sistema de caché

2. **Implementar GameServer en Rust**
   - Servidor HTTP con Axum
   - Inyección de scripts
   - Soporte para saves

3. **Integrar Tauri Webview**
   - Reemplazar GTK WebKit
   - Soporte para fullscreen
   - Atajos de teclado

4. **Migrar Plugins Manager**
   - Lectura de plugins.js
   - Análisis de compatibilidad
   - Activar/desactivar plugins

---

## 📚 Recursos

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Axum Framework](https://docs.rs/axum)
- [Tokio Runtime](https://tokio.rs/)
- [Rayon - Parallel Processing](https://docs.rs/rayon)

---

## 🤝 Contribuir

La migración está abierta a contribuciones. Sigue el flujo:

1. Clonar el repositorio
2. Cambiar a la rama `feat/rust-migration-phase1`
3. Implementar los cambios
4. Ejecutar pruebas: `cargo test`
5. Crear Pull Request

---

**Nota:** Este documento se actualizará conforme avance la migración.
