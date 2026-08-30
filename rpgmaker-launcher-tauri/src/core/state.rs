// ============================================================
//  RPG Maker Launcher - Application State
// ============================================================
// Estado global asíncrono de la aplicación, compartido de
// forma segura entre los comandos Tauri.
// ============================================================

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::config::ConfigManager;
use super::error::AppResult;
use super::models::game::GameInfo;
use super::models::session::{ActiveSession, ActiveServer};

use crate::engine::detector::GameDetector;
use crate::engine::plugins::PluginEngine;
use crate::engine::process::ProcessManager;
use crate::engine::save_editor::SaveEditor;

/// Estado global de la aplicación
pub struct AppState {
    pub config: ConfigManager,
    pub games: Arc<RwLock<HashMap<String, GameInfo>>>,
    pub session: Arc<RwLock<ActiveSession>>,
    pub server: Arc<RwLock<Option<ActiveServer>>>,
    pub data_dir: PathBuf,
    pub games_dir: PathBuf,
    pub game_detector: Arc<GameDetector>,
    pub save_editor: Arc<SaveEditor>,
    pub plugin_engine: Arc<PluginEngine>,
    pub process_manager: Arc<ProcessManager>,
}

impl AppState {
    /// Crea un nuevo estado de aplicación
    pub fn new() -> Self {
        let data_dir = ConfigManager::data_dir();
        let config = ConfigManager::new(&data_dir);
        let games_dir = data_dir.join("games");

        // Asegurar que existan los directorios necesarios
        let _ = std::fs::create_dir_all(&games_dir);
        let _ = std::fs::create_dir_all(data_dir.join("backups"));
        let _ = std::fs::create_dir_all(data_dir.join("logs"));
        let _ = std::fs::create_dir_all(data_dir.join("zooms"));
        let _ = std::fs::create_dir_all(data_dir.join("screenshots"));

        Self {
            config,
            games: Arc::new(RwLock::new(HashMap::new())),
            session: Arc::new(RwLock::new(ActiveSession::default())),
            server: Arc::new(RwLock::new(None)),
            data_dir,
            games_dir,
            game_detector: Arc::new(GameDetector::new()),
            save_editor: Arc::new(SaveEditor::new(None)),
            plugin_engine: Arc::new(PluginEngine::new()),
            process_manager: Arc::new(ProcessManager::new()),
        }
    }

    /// Escanea y actualiza la lista de juegos
    /// Delega la detección a GameDetector y enriquece con estado
    /// (favoritos, tiempo de juego, etc.)
    pub async fn scan_games(&self) -> AppResult<Vec<GameInfo>> {
        let games_dir = self.config.get_games_dir().await;
        
        // Usar GameDetector para la detección base (eliminando duplicación)
        let mut games = self.game_detector.scan_games(&games_dir).await?;

        // Enriquecer con estado guardado (favoritos, tiempo, etc.)
        for game in &mut games {
            let state = self.load_game_state(&game.name).await;
            game.favorite = state.get("favorite").and_then(|v| v.as_bool()).unwrap_or(false);
            game.seconds = state.get("seconds").and_then(|v| v.as_u64()).unwrap_or(0);
            game.last_played = state.get("last_played").and_then(|v| v.as_u64());
            
            // Generar URL de portada
            if game.has_cover {
                game.cover_url = Some(format!("/api/covers/{}", game.name));
            }
        }

        // Re-ordenar con favoritos y tiempo de juego
        games.sort_by(|a, b| {
            if a.is_incomplete != b.is_incomplete {
                return b.is_incomplete.cmp(&a.is_incomplete);
            }
            if a.favorite != b.favorite {
                return b.favorite.cmp(&a.favorite);
            }
            if a.last_played != b.last_played {
                return b.last_played.unwrap_or(0).cmp(&a.last_played.unwrap_or(0));
            }
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        });

        // Actualizar caché
        let mut cache = self.games.write().await;
        for game in &games {
            cache.insert(game.name.clone(), game.clone());
        }

        Ok(games)
    }

    /// Carga el estado de un juego
    async fn load_game_state(&self, game_name: &str) -> serde_json::Value {
        let state_file = self.data_dir.join("launcher-state.json");
        if !state_file.exists() {
            return serde_json::Value::Null;
        }

        let content = match tokio::fs::read_to_string(&state_file).await {
            Ok(c) => c,
            Err(_) => return serde_json::Value::Null,
        };

        let state: serde_json::Value = match serde_json::from_str(&content) {
            Ok(s) => s,
            Err(_) => return serde_json::Value::Null,
        };

        state
            .get("games")
            .and_then(|games| games.get(game_name))
            .cloned()
            .unwrap_or(serde_json::Value::Null)
    }

    /// Guarda el estado de un juego
    async fn save_game_state(&self, game_name: &str, updates: serde_json::Value) -> AppResult<()> {
        let state_file = self.data_dir.join("launcher-state.json");
        
        let mut state: serde_json::Value = if state_file.exists() {
            let content = tokio::fs::read_to_string(&state_file).await?;
            serde_json::from_str(&content).unwrap_or_else(|_| {
                serde_json::json!({"games": {}})
            })
        } else {
            serde_json::json!({"games": {}})
        };

        // Actualizar estado del juego
        if let Some(games) = state.get_mut("games") {
            let game_state = games.get(game_name).cloned().unwrap_or(serde_json::json!({}));
            let mut new_game_state = game_state;
            
            // Fusionar actualizaciones
            if let (Some(obj), Some(updates)) = (new_game_state.as_object_mut(), updates.as_object()) {
                for (key, value) in updates {
                    obj.insert(key.clone(), value.clone());
                }
            }
            
            games[game_name] = new_game_state;
        }

        // Guardar de forma atómica
        let content = serde_json::to_string_pretty(&state)?;
        let tmp_path = state_file.with_extension("json.tmp");
        tokio::fs::write(&tmp_path, &content).await?;
        tokio::fs::rename(&tmp_path, &state_file).await?;

        Ok(())
    }

    /// Actualiza el tiempo de juego de un juego
    pub async fn update_play_time(&self, game_name: &str, seconds: u64) -> AppResult<()> {
        let current_state = self.load_game_state(game_name).await;
        let current_seconds = current_state.get("seconds").and_then(|v| v.as_u64()).unwrap_or(0);
        
        let updates = serde_json::json!({
            "seconds": current_seconds + seconds,
            "last_played": std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs()
        });

        self.save_game_state(game_name, updates).await
    }

    /// Alterna el estado de favorito de un juego
    pub async fn toggle_favorite(&self, game_name: &str) -> AppResult<bool> {
        let current_state = self.load_game_state(game_name).await;
        let current_fav = current_state.get("favorite").and_then(|v| v.as_bool()).unwrap_or(false);
        let new_fav = !current_fav;

        let updates = serde_json::json!({
            "favorite": new_fav
        });

        self.save_game_state(game_name, updates).await?;
        
        // Actualizar caché
        let mut cache = self.games.write().await;
        if let Some(game) = cache.get_mut(game_name) {
            game.favorite = new_fav;
        }

        Ok(new_fav)
    }

    /// Obtiene la sesión activa
    pub async fn get_session(&self) -> ActiveSession {
        self.session.read().await.clone()
    }

    /// Actualiza la sesión activa
    pub async fn set_session(&self, session: ActiveSession) {
        let mut current = self.session.write().await;
        *current = session;
    }

    /// Obtiene el servidor HTTP activo
    pub async fn get_server(&self) -> Option<ActiveServer> {
        self.server.read().await.clone()
    }

    /// Establece el servidor HTTP activo
    pub async fn set_server(&self, server: Option<ActiveServer>) {
        let mut current = self.server.write().await;
        *current = server;
    }
}

impl Clone for AppState {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            games: Arc::clone(&self.games),
            session: Arc::clone(&self.session),
            server: Arc::clone(&self.server),
            data_dir: self.data_dir.clone(),
            games_dir: self.games_dir.clone(),
            game_detector: Arc::clone(&self.game_detector),
            save_editor: Arc::clone(&self.save_editor),
            plugin_engine: Arc::clone(&self.plugin_engine),
            process_manager: Arc::clone(&self.process_manager),
        }
    }
}
