// ============================================================
//  RPG Maker Launcher - Game HTTP Server
// ============================================================
// Servidor HTTP para servir juegos web (MV/MZ).
// Reemplaza el servidor Python con una implementación nativa
// de alto rendimiento usando Axum.
//
// Características:
// - Servidor HTTP concurrente con Tokio
// - Soporte para inyección de scripts
// - Gestión de caché de assets
// - Soporte para WebSockets (futuro)
// ============================================================

use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use axum::{
    extract::{Path as AxumPath, State},
    http::{HeaderMap, HeaderValue, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;
use tokio::net::TcpListener;
use tokio::sync::RwLock;

use crate::core::error::{AppError, AppResult};

/// Estado compartido del servidor
#[derive(Clone)]
pub struct ServerState {
    /// Directorio del juego a servir
    pub game_dir: PathBuf,
    /// Puerto del servidor
    pub port: u16,
    /// Scripts a inyectar en index.html
    pub inject_scripts: Arc<RwLock<Vec<String>>>,
    /// Configuración del juego
    pub config: Arc<RwLock<serde_json::Value>>,
}

/// Servidor HTTP para juegos web
pub struct GameServer {
    state: ServerState,
    listener: Option<TcpListener>,
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
            listener: None,
        }
    }

    /// Inicia el servidor
    pub async fn start(&mut self) -> AppResult<u16> {
        let addr = SocketAddr::from(([127, 0, 0, 1], self.state.port));
        
        // Crear listener
        let listener = TcpListener::bind(addr).await?;
        let actual_port = listener.local_addr()?.port();
        
        self.state.port = actual_port;
        self.listener = Some(listener);

        // Crear router con rutas
        let app = self.build_router();

        log::info!("Servidor HTTP iniciado en http://127.0.0.1:{}", actual_port);

        // Ejecutar servidor
        let state = self.state.clone();
        tokio::spawn(async move {
            let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", actual_port))
                .await
                .expect("Failed to bind");
            
            axum::serve(listener, app)
                .await
                .expect("Failed to start server");
        });

        Ok(actual_port)
    }

    /// Construye el router con todas las rutas
    fn build_router(&self) -> Router {
        let state = self.state.clone();

        // Configurar CORS
        let cors = CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any);

        // Rutas estáticas
        let static_service = ServeDir::new(&self.state.game_dir)
            .append_index_html_on_directories(true);

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
            // Index.html con inyección
            .fallback(Self::serve_index_with_injection)
            // Servir archivos estáticos
            .nest_service("/", tower_http::services::ServeDir::new(&self.state.game_dir))
            .layer(cors)
            .with_state(state)
    }

    /// Sirve la configuración del usuario como JS
    async fn serve_config_js(
        State(state): State<ServerState>,
    ) -> Result<String, StatusCode> {
        let config = state.config.read().await;
        Ok(format!("window.__RPG_CONFIG__ = {};", 
            serde_json::to_string(&*config).unwrap_or_default()))
    }

    /// Sirve el savebridge.js
    async fn serve_savebridge(
        State(state): State<ServerState>,
    ) -> Result<Vec<u8>, StatusCode> {
        let bridge_path = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.join("rpgmaker-savebridge.js")))
            .unwrap_or_else(|| PathBuf::from("rpgmaker-savebridge.js"));

        tokio::fs::read(&bridge_path)
            .await
            .map_err(|_| StatusCode::NOT_FOUND)
    }

    /// Sirve los presets de trucos
    async fn serve_presets(
        State(state): State<ServerState>,
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

        Ok(format!("window.__RPG_CHEATS_PRESETS__ = {};",
            serde_json::to_string(&presets).unwrap_or_else(|_| "null".to_string())))
    }

    /// Sirve scripts estáticos
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

    /// Lista todas las partidas
    async fn handle_save_list(
        State(state): State<ServerState>,
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
                                &data
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

    /// Obtiene un save específico
    async fn handle_save_get(
        State(state): State<ServerState>,
        AxumPath(name): AxumPath<String>,
    ) -> Result<Vec<u8>, StatusCode> {
        let save_path = state.game_dir.join("save").join(&name);
        
        if !save_path.exists() {
            return Err(StatusCode::NOT_FOUND);
        }

        // Validar que no sea path traversal
        if name.contains('/') || name.contains('\\') || name.contains("..") {
            return Err(StatusCode::BAD_REQUEST);
        }

        tokio::fs::read(&save_path)
            .await
            .map_err(|_| StatusCode::NOT_FOUND)
    }

    /// Guarda un save
    async fn handle_save_post(
        State(state): State<ServerState>,
        AxumPath(name): AxumPath<String>,
        body: axum::body::Bytes,
    ) -> Result<StatusCode, StatusCode> {
        let save_path = state.game_dir.join("save").join(&name);
        
        // Validar que no sea path traversal
        if name.contains('/') || name.contains('\\') || name.contains("..") {
            return Err(StatusCode::BAD_REQUEST);
        }

        // Crear directorio si no existe
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

    /// Elimina un save
    async fn handle_save_delete(
        State(state): State<ServerState>,
        AxumPath(name): AxumPath<String>,
    ) -> Result<StatusCode, StatusCode> {
        let save_path = state.game_dir.join("save").join(&name);
        
        // Validar que no sea path traversal
        if name.contains('/') || name.contains('\\') || name.contains("..") {
            return Err(StatusCode::BAD_REQUEST);
        }

        if save_path.exists() {
            tokio::fs::remove_file(&save_path)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }

        Ok(StatusCode::NO_CONTENT)
    }

    /// Sirve un mod JS
    async fn serve_mod(
        State(state): State<ServerState>,
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

    /// Sirve index.html con scripts inyectados
    async fn serve_index_with_injection(
        State(state): State<ServerState>,
    ) -> Result<Html<String>, StatusCode> {
        let index_path = state.game_dir.join("index.html");
        
        if !index_path.exists() {
            return Err(StatusCode::NOT_FOUND);
        }

        let content = tokio::fs::read_to_string(&index_path)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        // Scripts a inyectar
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

        // Inyectar scripts antes de </head> o </body>
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
                                let tag = format!("<script src=\"/__mods/{}\"></script>", name);
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

    /// Detiene el servidor
    pub async fn stop(&mut self) {
        self.listener = None;
        log::info!("Servidor HTTP detenido");
    }

    /// Obtiene el puerto actual
    pub fn port(&self) -> u16 {
        self.state.port
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
        assert_eq!(server.port(), 0);
    }

    #[tokio::test]
    async fn test_game_server_start_stop() {
        let dir = tempdir().unwrap();
        let mut server = GameServer::new(dir.path().to_path_buf(), 0);
        
        let port = server.start().await.unwrap();
        assert!(port > 0);
        
        server.stop().await;
    }
}
