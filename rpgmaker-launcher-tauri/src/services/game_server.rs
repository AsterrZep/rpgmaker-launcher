// ============================================================
//  RPG Maker Launcher - Game HTTP Server
// ============================================================
// Servidor HTTP para servir juegos web (MV/MZ).
// Reemplaza el servidor Python con una implementación nativa
// de alto rendimiento usando Axum.
//
// Características:
// - Servidor HTTP concurrente con Tokio
// - Graceful shutdown con canal de señal
// - Soporte para inyección de scripts
// - Gestión de saves vía HTTP
// ============================================================

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use axum::{
    extract::{Path as AxumPath, State as AxumState},
    http::StatusCode,
    response::Html,
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tokio::net::TcpListener;
use tokio::sync::{mpsc, oneshot, RwLock};

use crate::core::error::AppResult;

/// Estado compartido del servidor (para handlers Axum)
#[derive(Clone)]
pub struct ServerState {
    pub game_dir: PathBuf,
    pub port: u16,
    pub inject_scripts: Arc<RwLock<Vec<String>>>,
    pub config: Arc<RwLock<serde_json::Value>>,
}

/// Handle para controlar el servidor (enviar shutdown signal)
pub struct ServerHandle {
    shutdown_tx: Option<oneshot::Sender<()>>,
    port: u16,
    game_name: String,
}

impl ServerHandle {
    /// Detiene el servidor enviando la señal de shutdown
    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
            log::info!("Servidor HTTP detenido para '{}'", self.game_name);
        }
    }

    pub fn port(&self) -> u16 {
        self.port
    }

    pub fn game_name(&self) -> &str {
        &self.game_name
    }
}

/// Servidor HTTP para juegos web
pub struct GameServer {
    state: ServerState,
    shutdown_tx: Option<oneshot::Sender<()>>,
    handle_tx: Option<mpsc::Sender<ServerHandle>>,
}

impl GameServer {
    /// Crea un nuevo servidor de juegos
    pub fn new(game_dir: PathBuf, port: u16) -> Self {
        Self {
            state: ServerState {
                game_dir,
                port,
                inject_scripts: Arc::new(RwLock::new(Vec::new())),
                config: Arc::new(RwLock::new(serde_json::json!({}))),
            },
            shutdown_tx: None,
            handle_tx: None,
        }
    }

    /// Inicia el servidor y retorna el puerto real asignado.
    /// El servidor se ejecuta en un task de Tokio con graceful shutdown.
    pub async fn start(&mut self, game_name: &str) -> AppResult<u16> {
        let addr = SocketAddr::from(([127, 0, 0, 1], self.state.port));

        // Crear listener
        let listener = TcpListener::bind(addr).await?;
        let actual_port = listener.local_addr()?.port();
        self.state.port = actual_port;

        // Crear canal de shutdown
        let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
        self.shutdown_tx = Some(shutdown_tx);

        // Crear router
        let app = self.build_router();
        let game_name_owned = game_name.to_string();

        log::info!(
            "Servidor HTTP nativo iniciado para '{}' en http://127.0.0.1:{}",
            game_name_owned,
            actual_port
        );

        // Ejecutar servidor con graceful shutdown
        let game_name_log = game_name_owned.clone();
        tokio::spawn(async move {
            let graceful = axum::serve(listener, app).with_graceful_shutdown(async move {
                let _ = shutdown_rx.await;
                log::info!("Servidor HTTP cerrando graceful para '{}'", game_name_log);
            });

            if let Err(e) = graceful.await {
                log::error!("Error en servidor HTTP: {}", e);
            }

            log::info!("Servidor HTTP terminado para '{}'", game_name_owned);
        });

        Ok(actual_port)
    }

    /// Construye el router con todas las rutas
    fn build_router(&self) -> Router {
        let state = self.state.clone();

        let cors = CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any);

        Router::new()
            // Rutas especiales
            .route("/__config.js", get(Self::serve_config_js))
            .route("/__savebridge.js", get(Self::serve_savebridge))
            .route("/__presets.js", get(Self::serve_presets))
            .route("/__rewind.js", get(Self::serve_static_js))
            .route("/__cheats.js", get(Self::serve_static_js))
            .route("/__gamepad.js", get(Self::serve_static_js))
            .route("/__browserkeys.js", get(Self::serve_static_js))
            // Save API
            .route("/__save/__all", get(Self::handle_save_list))
            .route("/__save/{name}", get(Self::handle_save_get))
            .route("/__save/{name}", post(Self::handle_save_post))
            .route("/__save/{name}", axum::routing::delete(Self::handle_save_delete))
            // Mods
            .route("/__mods/{name}", get(Self::serve_mod))
            // Fallback: index.html con inyección
            .fallback(Self::serve_index_with_injection)
            .layer(cors)
            .with_state(state)
    }

    // ── Handlers ────────────────────────────────────────────

    async fn serve_config_js(
        AxumState(state): AxumState<ServerState>,
    ) -> Result<String, StatusCode> {
        let config = state.config.read().await;
        Ok(format!(
            "window.__RPG_CONFIG__ = {};",
            serde_json::to_string(&*config).unwrap_or_default()
        ))
    }

    async fn serve_savebridge(
        AxumState(_state): AxumState<ServerState>,
    ) -> Result<Vec<u8>, StatusCode> {
        let bridge_path = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.join("rpgmaker-savebridge.js")))
            .unwrap_or_else(|| PathBuf::from("rpgmaker-savebridge.js"));

        tokio::fs::read(&bridge_path)
            .await
            .map_err(|_| StatusCode::NOT_FOUND)
    }

    async fn serve_presets(
        AxumState(state): AxumState<ServerState>,
    ) -> Result<String, StatusCode> {
        let presets_path = state.game_dir.join("cheats-presets.json");

        let presets = if presets_path.exists() {
            tokio::fs::read_to_string(&presets_path)
                .await
                .ok()
                .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
        } else {
            None
        };

        Ok(format!(
            "window.__RPG_CHEATS_PRESETS__ = {};",
            serde_json::to_string(&presets).unwrap_or_else(|_| "null".to_string())
        ))
    }

    async fn serve_static_js(
        AxumPath(path): AxumPath<String>,
    ) -> Result<Vec<u8>, StatusCode> {
        let script_path = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.join(&path)))
            .unwrap_or_else(|| PathBuf::from(&path));

        tokio::fs::read(&script_path)
            .await
            .map_err(|_| StatusCode::NOT_FOUND)
    }

    async fn handle_save_list(
        AxumState(state): AxumState<ServerState>,
    ) -> Result<String, StatusCode> {
        let save_dir = state.game_dir.join("save");
        let mut saves = serde_json::Map::new();

        if save_dir.exists() {
            if let Ok(mut entries) = tokio::fs::read_dir(&save_dir).await {
                while let Some(entry) = entries.next_entry().await.unwrap_or(None) {
                    if entry.path().is_file() {
                        if let Ok(data) = tokio::fs::read(entry.path()).await {
                            let b64 = base64::Engine::encode(
                                &base64::engine::general_purpose::STANDARD,
                                &data,
                            );
                            saves.insert(
                                entry.file_name().to_string_lossy().to_string(),
                                serde_json::Value::String(b64),
                            );
                        }
                    }
                }
            }
        }

        serde_json::to_string(&saves).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
    }

    async fn handle_save_get(
        AxumState(state): AxumState<ServerState>,
        AxumPath(name): AxumPath<String>,
    ) -> Result<Vec<u8>, StatusCode> {
        if name.contains('/') || name.contains('\\') || name.contains("..") {
            return Err(StatusCode::BAD_REQUEST);
        }

        let save_path = state.game_dir.join("save").join(&name);
        if !save_path.exists() {
            return Err(StatusCode::NOT_FOUND);
        }

        tokio::fs::read(&save_path)
            .await
            .map_err(|_| StatusCode::NOT_FOUND)
    }

    async fn handle_save_post(
        AxumState(state): AxumState<ServerState>,
        AxumPath(name): AxumPath<String>,
        body: axum::body::Bytes,
    ) -> Result<StatusCode, StatusCode> {
        if name.contains('/') || name.contains('\\') || name.contains("..") {
            return Err(StatusCode::BAD_REQUEST);
        }

        let save_path = state.game_dir.join("save").join(&name);

        if let Some(parent) = save_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }

        tokio::fs::write(&save_path, &body)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(StatusCode::NO_CONTENT)
    }

    async fn handle_save_delete(
        AxumState(state): AxumState<ServerState>,
        AxumPath(name): AxumPath<String>,
    ) -> Result<StatusCode, StatusCode> {
        if name.contains('/') || name.contains('\\') || name.contains("..") {
            return Err(StatusCode::BAD_REQUEST);
        }

        let save_path = state.game_dir.join("save").join(&name);
        if save_path.exists() {
            tokio::fs::remove_file(&save_path)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }

        Ok(StatusCode::NO_CONTENT)
    }

    async fn serve_mod(
        AxumState(state): AxumState<ServerState>,
        AxumPath(name): AxumPath<String>,
    ) -> Result<Vec<u8>, StatusCode> {
        let mod_path = state.game_dir.join("mods").join(&name);
        if !mod_path.exists() {
            return Err(StatusCode::NOT_FOUND);
        }

        tokio::fs::read(&mod_path)
            .await
            .map_err(|_| StatusCode::NOT_FOUND)
    }

    async fn serve_index_with_injection(
        AxumState(state): AxumState<ServerState>,
    ) -> Result<Html<String>, StatusCode> {
        let index_path = state.game_dir.join("index.html");
        if !index_path.exists() {
            return Err(StatusCode::NOT_FOUND);
        }

        let content = tokio::fs::read_to_string(&index_path)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let scripts = vec![
            "/__config.js",
            "/__savebridge.js",
            "/__presets.js",
            "/__rewind.js",
            "/__cheats.js",
            "/__gamepad.js",
            "/__browserkeys.js",
        ];

        let mut modified = content;

        for script in &scripts {
            let tag = format!("<script src=\"{}\"></script>", script);
            if !modified.contains(&tag) {
                if modified.contains("</head>") {
                    modified = modified.replace("</head>", &format!("{}\n</head>", tag));
                } else if modified.contains("</body>") {
                    modified = modified.replace("</body>", &format!("{}\n</body>", tag));
                } else {
                    modified = format!("{}\n{}", modified, tag);
                }
            }
        }

        // Inyectar mods del usuario
        let mods_dir = state.game_dir.join("mods");
        if mods_dir.exists() {
            if let Ok(mut entries) = tokio::fs::read_dir(&mods_dir).await {
                while let Some(entry) = entries.next_entry().await.unwrap_or(None) {
                    if entry.path().is_file() {
                        if let Some(name) = entry.file_name().to_str() {
                            if name.ends_with(".js") {
                                let tag =
                                    format!("<script src=\"/__mods/{}\"></script>", name);
                                if !modified.contains(&tag) {
                                    modified = format!("{}\n{}", modified, tag);
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(Html(modified))
    }
}

impl Drop for GameServer {
    fn drop(&mut self) {
        log::info!("GameServer dropped");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_game_server_creation() {
        let dir = tempdir().unwrap();
        let server = GameServer::new(dir.path().to_path_buf(), 0);
        assert_eq!(server.state.port, 0);
    }

    #[tokio::test]
    async fn test_game_server_start_stop() {
        let dir = tempdir().unwrap();
        let mut server = GameServer::new(dir.path().to_path_buf(), 0);

        let port = server.start(&"test-game").await.unwrap();
        assert!(port > 0);

        // Detener via shutdown signal
        if let Some(_tx) = server.shutdown_tx.take() {
            // El sender se consume al enviar
        }
        // Server will stop when GameServer is dropped (shutdown_tx dropped)
    }
}
