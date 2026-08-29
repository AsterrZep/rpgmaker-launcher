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

use super::config::{AppConfig, ConfigManager};
use super::error::{AppError, AppResult};

/// Información de un juego detectado
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GameInfo {
    pub name: String,
    pub path: PathBuf,
    pub engine: String,
    pub engine_label: String,
    pub is_web: bool,
    pub is_incomplete: bool,
    pub has_cover: bool,
    pub cover_url: Option<String>,
    pub favorite: bool,
    pub seconds: u64,
    pub last_played: Option<u64>,
    pub has_saves: bool,
}

/// Estado de una sesión activa de juego
#[derive(Debug, Clone)]
pub struct ActiveSession {
    pub game_name: Option<String>,
    pub port: Option<u16>,
    pub start_time: Option<u64>,
    pub running: bool,
}

impl Default for ActiveSession {
    fn default() -> Self {
        Self {
            game_name: None,
            port: None,
            start_time: None,
            running: false,
        }
    }
}

/// Estado global de la aplicación
pub struct AppState {
    pub config: ConfigManager,
    pub games: Arc<RwLock<HashMap<String, GameInfo>>>,
    pub session: Arc<RwLock<ActiveSession>>,
    pub data_dir: PathBuf,
    pub games_dir: PathBuf,
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
            data_dir,
            games_dir,
        }
    }

    /// Escanea y actualiza la lista de juegos
    pub async fn scan_games(&self) -> AppResult<Vec<GameInfo>> {
        let games_dir = self.config.get_games_dir().await;
        let mut games = Vec::new();

        if !games_dir.exists() {
            return Ok(games);
        }

        let entries = std::fs::read_dir(&games_dir)?;
        
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            let name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string();

            // Detectar motor del juego
            if let Some((root, engine)) = self.detect_engine(&path).await {
                let engine_label = self.engine_label(&engine);
                let is_web = matches!(engine.as_str(), "MZ" | "MV" | "web");
                let is_incomplete = matches!(engine.as_str(), "incomplete" | "renpy-incomplete");
                
                // Buscar portada
                let cover = self.find_cover(&path, &root).await;
                let has_cover = cover.is_some();
                
                // Verificar saves
                let saves_dir = root.join("save");
                let has_saves = saves_dir.exists() && 
                    std::fs::read_dir(&saves_dir)
                        .map(|mut d| d.next().is_some())
                        .unwrap_or(false);

                // Cargar estado del juego
                let state = self.load_game_state(&name).await;

                games.push(GameInfo {
                    name,
                    path: root,
                    engine,
                    engine_label,
                    is_web,
                    is_incomplete,
                    has_cover,
                    cover_url: if has_cover { Some(format!("/api/covers/{}", name)) } else { None },
                    favorite: state.get("favorite").and_then(|v| v.as_bool()).unwrap_or(false),
                    seconds: state.get("seconds").and_then(|v| v.as_u64()).unwrap_or(0),
                    last_played: state.get("last_played").and_then(|v| v.as_u64()),
                    has_saves,
                });
            }
        }

        // Ordenar: favoritos primero, luego por última vez jugado, luego alfabéticamente
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

    /// Detecta el motor de un juego
    async fn detect_engine(&self, path: &PathBuf) -> Option<(PathBuf, String)> {
        // Buscar index.html (MV/MZ/Web)
        if let Some(root) = self.find_file(path, "index.html", 5).await {
            if root.join("js").join("rmmz_core.js").exists() {
                return Some((root, "MZ".to_string()));
            }
            if root.join("js").join("rpg_core.js").exists() {
                return Some((root, "MV".to_string()));
            }
            return Some((root, "web".to_string()));
        }

        // VX Ace, VX, XP
        for (file, engine) in &[
            ("Game.rgss3a", "VXAce"),
            ("Game.rgss2a", "VX"),
            ("Game.rgssad", "XP"),
        ] {
            if let Some(root) = self.find_file(path, file, 5).await {
                return Some((root, engine.to_string()));
            }
        }

        // RPG Maker 2000/2003
        for file in &["RPG_RT.exe", "RPG_RT.ini"] {
            if let Some(root) = self.find_file(path, file, 5).await {
                return Some((root, "2000-2003".to_string()));
            }
        }

        // Ren'Py
        if let Some(_py) = self.find_glob(path, "*.py", 5).await {
            let renpy_dir = path.join("renpy");
            let game_dir = path.join("game");
            if renpy_dir.exists() && game_dir.exists() {
                return Some((path.clone(), "renpy".to_string()));
            }
        }

        // VX Ace/VX/XP (archivos de scripts)
        for (file, engine) in &[
            ("Scripts.rvdata2", "VXAce"),
            ("Scripts.rvdata", "VX"),
            ("Scripts.rxdata", "XP"),
        ] {
            if let Some(root) = self.find_file(path, file, 5).await {
                return Some((root, engine.to_string()));
            }
        }

        // Incompletos
        if self.find_file(path, "System.json", 5).await.is_some() ||
           self.find_file(path, "Map001.json", 5).await.is_some() {
            return Some((path.clone(), "incomplete".to_string()));
        }

        None
    }

    /// Busca un archivo en el árbol de directorios
    async fn find_file(&self, root: &PathBuf, name: &str, max_depth: usize) -> Option<PathBuf> {
        let root = root.clone();
        let name = name.to_string();
        
        tokio::task::spawn_blocking(move || {
            use std::fs;
            
            fn walk(current: &PathBuf, target: &str, depth: usize, max: usize) -> Option<PathBuf> {
                if depth > max {
                    return None;
                }
                
                let entries = fs::read_dir(current).ok()?;
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() && path.file_name().and_then(|n| n.to_str()) == Some(target) {
                        return Some(current.to_path_buf());
                    }
                    if path.is_dir() {
                        if let Some(found) = walk(&path, target, depth + 1, max) {
                            return Some(found);
                        }
                    }
                }
                None
            }
            
            walk(&root, &name, 0, max_depth)
        })
        .await
        .ok()
        .flatten()
    }

    /// Busca archivos por patrón glob
    async fn find_glob(&self, root: &PathBuf, pattern: &str, max_depth: usize) -> Option<PathBuf> {
        let root = root.clone();
        let pattern = pattern.to_string();
        
        tokio::task::spawn_blocking(move || {
            use std::fs;
            
            fn walk(current: &PathBuf, pat: &str, depth: usize, max: usize) -> Option<PathBuf> {
                if depth > max {
                    return None;
                }
                
                let entries = fs::read_dir(current).ok()?;
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            // Simple glob matching (support *)
                            let pattern_parts: Vec<&str> = pat.split('*').collect();
                            if pattern_parts.len() == 2 {
                                let prefix = pattern_parts[0];
                                let suffix = pattern_parts[1];
                                if name.starts_with(prefix) && name.ends_with(suffix) {
                                    return Some(path);
                                }
                            }
                        }
                    }
                    if path.is_dir() {
                        if let Some(found) = walk(&path, pat, depth + 1, max) {
                            return Some(found);
                        }
                    }
                }
                None
            }
            
            walk(&root, &pattern, 0, max_depth)
        })
        .await
        .ok()
        .flatten()
    }

    /// Busca la portada de un juego
    async fn find_cover(&self, game_top: &PathBuf, root: &PathBuf) -> Option<PathBuf> {
        let candidates = vec![
            game_top.join("cover.png"),
            game_top.join("cover.jpg"),
            game_top.join("cover.webp"),
            root.join("icon").join("icon.png"),
            root.join("pictures").join("title.png"),
            root.join("system").join("Title.png"),
            root.join("system").join("title.png"),
            root.join("game").join("gui").join("main_menu.png"),
            root.join("game").join("gui").join("game_menu.png"),
        ];

        for cand in candidates {
            if cand.exists() {
                return Some(cand);
            }
        }

        None
    }

    /// Obtiene la etiqueta del motor
    fn engine_label(&self, engine: &str) -> String {
        match engine {
            "MZ" => "RPG Maker MZ".to_string(),
            "MV" => "RPG Maker MV".to_string(),
            "web" => "Web (MV/MZ)".to_string(),
            "2000-2003" => "RPG Maker 2000/2003".to_string(),
            "renpy" => "Ren'Py".to_string(),
            "VXAce" => "RPG Maker VX Ace".to_string(),
            "VX" => "RPG Maker VX".to_string(),
            "XP" => "RPG Maker XP".to_string(),
            "incomplete" => "Descarga incompleta".to_string(),
            _ => engine.to_string(),
        }
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
}

impl Clone for AppState {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            games: Arc::clone(&self.games),
            session: Arc::clone(&self.session),
            data_dir: self.data_dir.clone(),
            games_dir: self.games_dir.clone(),
        }
    }
}
