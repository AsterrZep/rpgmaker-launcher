// ============================================================
//  RPG Maker Launcher - Game Detection Engine
// ============================================================
// Motor de detección de juegos RPG Maker en Rust.
// Reemplaza la lógica de detección de Python con una
// implementación nativa de alto rendimiento.
//
// Soporta detección de:
// - RPG Maker MZ/MV (Web games con index.html)
// - RPG Maker XP/VX/VX Ace (Archivos .rgss*)
// - RPG Maker 2000/2003 (RPG_RT.exe/ini)
// - Ren'Py (Scripts .py + directorio renpy/)
// - Juegos incompletos (System.json sin motor)
// ============================================================

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use walkdir::WalkDir;

use crate::core::error::AppResult;
use crate::core::models::game::GameInfo;
use crate::core::ports::game_port::GamePort;

/// Profundidad máxima de búsqueda en directorios
const MAX_DEPTH: usize = 5;

/// TTL del caché de detección (60 segundos)
const CACHE_TTL: Duration = Duration::from_secs(60);

/// Etiquetas de motores de juego
pub const ENGINE_LABELS: &[(&str, &str)] = &[
    ("MZ", "RPG Maker MZ"),
    ("MV", "RPG Maker MV"),
    ("web", "Web (MV/MZ)"),
    ("2000-2003", "RPG Maker 2000/2003"),
    ("renpy", "Ren'Py"),
    ("VXAce", "RPG Maker VX Ace"),
    ("VX", "RPG Maker VX"),
    ("XP", "RPG Maker XP"),
    ("incomplete", "Descarga incompleta"),
    ("renpy-incomplete", "Ren'Py sin parte Linux"),
];

/// Entrada del caché de detección
#[derive(Debug, Clone)]
struct CacheEntry {
    timestamp: Instant,
    root: Option<PathBuf>,
    engine: Option<String>,
}

/// Motor de detección de juegos
pub struct GameDetector {
    cache: Arc<RwLock<HashMap<PathBuf, CacheEntry>>>,
}

impl GameDetector {
    /// Crea un nuevo detector de juegos
    pub fn new() -> Self {
        Self {
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Detecta el motor de un juego
    ///
    /// # Arguments
    /// * `path` - Directorio raíz del juego
    ///
    /// # Returns
    /// Tupla (directorio_raíz, motor) o None si no se detecta
    pub async fn detect_engine(&self, path: &Path) -> Option<(PathBuf, String)> {
        // Verificar caché
        let cache_key = path.to_path_buf();
        {
            let cache = self.cache.read().await;
            if let Some(entry) = cache.get(&cache_key) {
                if entry.timestamp.elapsed() < CACHE_TTL {
                    return entry.root.as_ref().map(|r| {
                        (r.clone(), entry.engine.clone().unwrap_or_default())
                    });
                }
            }
        }

        // Detectar motor
        let result = self.detect_engine_uncached(path).await;

        // Actualizar caché
        {
            let mut cache = self.cache.write().await;
            cache.insert(cache_key, CacheEntry {
                timestamp: Instant::now(),
                root: result.as_ref().map(|(r, _)| r.clone()),
                engine: result.as_ref().map(|(_, e)| e.clone()),
            });
        }

        result
    }

    /// Detección sin caché
    async fn detect_engine_uncached(&self, path: &Path) -> Option<(PathBuf, String)> {
        let path = path.to_path_buf();

        // Ejecutar detección en thread pool bloqueante
        tokio::task::spawn_blocking(move || {
            Self::detect_engine_sync(&path)
        })
        .await
        .ok()
        .flatten()
    }

    /// Detección síncrona (para usar en thread pool)
    fn detect_engine_sync(path: &Path) -> Option<(PathBuf, String)> {
        let path_buf = path.to_path_buf();
        // 1. Buscar index.html (MV/MZ/Web)
        if let Some(root) = Self::find_file(path, "index.html", MAX_DEPTH) {
            if root.join("js").join("rmmz_core.js").exists() {
                return Some((root, "MZ".to_string()));
            }
            if root.join("js").join("rpg_core.js").exists() {
                return Some((root, "MV".to_string()));
            }
            return Some((root, "web".to_string()));
        }

        // 2. VX Ace, VX, XP
        for (file, engine) in &[
            ("Game.rgss3a", "VXAce"),
            ("Game.rgss2a", "VX"),
            ("Game.rgssad", "XP"),
        ] {
            if let Some(root) = Self::find_file(path, file, MAX_DEPTH) {
                return Some((root, engine.to_string()));
            }
        }

        // 3. RPG Maker 2000/2003
        for file in &["RPG_RT.exe", "RPG_RT.ini"] {
            if let Some(root) = Self::find_file(path, file, MAX_DEPTH) {
                return Some((root, "2000-2003".to_string()));
            }
        }

        // Buscar archivos .lmt (2000/2003)
        if let Some(root) = Self::find_glob(path, "*.lmt", MAX_DEPTH) {
            let parent = root.parent().unwrap_or(&root).to_path_buf();
            return Some((parent, "2000-2003".to_string()));
        }

        // 4. Ren'Py
        if let Some(_py) = Self::find_glob(&path_buf, "*.py", MAX_DEPTH) {
            let renpy_dir = path_buf.join("renpy");
            let game_dir = path_buf.join("game");
            if renpy_dir.exists() && game_dir.exists() {
                // Verificar librerías de Ren'Py
                if Self::renpy_lib_ok(&path_buf) {
                    return Some((path_buf, "renpy".to_string()));
                }
            }
        }

        // 5. VX Ace/VX/XP (archivos de scripts)
        for (file, engine) in &[
            ("Scripts.rvdata2", "VXAce"),
            ("Scripts.rvdata", "VX"),
            ("Scripts.rxdata", "XP"),
        ] {
            if let Some(root) = Self::find_file(path, file, MAX_DEPTH) {
                return Some((root, engine.to_string()));
            }
        }

        // 6. Incompletos
        if Self::find_file(&path_buf, "System.json", MAX_DEPTH).is_some() ||
           Self::find_file(&path_buf, "Map001.json", MAX_DEPTH).is_some() {
            return Some((path_buf.clone(), "incomplete".to_string()));
        }

        if Self::find_dir(&path_buf, "renpy", MAX_DEPTH).is_some() {
            return Some((path_buf, "renpy-incomplete".to_string()));
        }

        None
    }

    /// Busca un archivo por nombre en el árbol de directorios
    fn find_file(root: &Path, name: &str, max_depth: usize) -> Option<PathBuf> {
        for entry in WalkDir::new(root)
            .max_depth(max_depth)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.file_type().is_file() && entry.file_name() == name {
                return Some(entry.path().parent()?.to_path_buf());
            }
        }
        None
    }

    /// Busca archivos por patrón glob
    fn find_glob(root: &Path, pattern: &str, max_depth: usize) -> Option<PathBuf> {
        let pattern_parts: Vec<&str> = pattern.split('*').collect();
        if pattern_parts.len() != 2 {
            return None;
        }

        let prefix = pattern_parts[0];
        let suffix = pattern_parts[1];

        for entry in WalkDir::new(root)
            .max_depth(max_depth)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.file_type().is_file() {
                if let Some(name) = entry.file_name().to_str() {
                    if name.starts_with(prefix) && name.ends_with(suffix) {
                        return Some(entry.path().to_path_buf());
                    }
                }
            }
        }
        None
    }

    /// Busca un directorio por nombre
    fn find_dir(root: &Path, name: &str, max_depth: usize) -> Option<PathBuf> {
        for entry in WalkDir::new(root)
            .max_depth(max_depth)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.file_type().is_dir() && entry.file_name() == name {
                return Some(entry.path().to_path_buf());
            }
        }
        None
    }

    /// Verifica que Ren'Py tenga las librerías necesarias
    fn renpy_lib_ok(root: &Path) -> bool {
        let lib_dir = root.join("lib");
        for dir in &["linux-x86_64", "linux-i686", "py2-linux-x86_64", "py2-linux-i686"] {
            if lib_dir.join(dir).exists() {
                return true;
            }
        }
        false
    }

    /// Busca la imagen de portada de un juego
    pub async fn find_cover(&self, game_top: &Path, root: &Path) -> Option<PathBuf> {
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

        // Buscar capturas de Ren'Py
        if let Some(entries) = std::fs::read_dir(root).ok() {
            let mut shots: Vec<PathBuf> = entries
                .filter_map(|e| e.ok())
                .filter(|e| {
                    e.path().is_file() && 
                    e.file_name().to_str().map_or(false, |n| n.starts_with("screenshot") && n.ends_with(".png"))
                })
                .map(|e| e.path())
                .collect();
            
            shots.sort();
            if let Some(first) = shots.into_iter().next() {
                return Some(first);
            }
        }

        None
    }

    /// Obtiene la etiqueta del motor
    pub fn engine_label(engine: &str) -> String {
        ENGINE_LABELS
            .iter()
            .find(|&&(e, _)| e == engine)
            .map(|&(_, label)| label.to_string())
            .unwrap_or_else(|| engine.to_string())
    }

    /// Verifica si un motor es web (MV/MZ)
    pub fn is_web_engine(engine: &str) -> bool {
        matches!(engine, "MZ" | "MV" | "web")
    }

    /// Verifica si un juego está incompleto
    pub fn is_incomplete(engine: &str) -> bool {
        matches!(engine, "incomplete" | "renpy-incomplete")
    }

    /// Escanea todos los juegos en un directorio
    pub async fn scan_games(&self, games_dir: &Path) -> AppResult<Vec<GameInfo>> {
        let mut games = Vec::new();

        if !games_dir.exists() {
            return Ok(games);
        }

        let entries: Vec<_> = std::fs::read_dir(games_dir)?
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_dir())
            .collect();

        for entry in entries {
            let path = entry.path();
            let name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string();

            if let Some((root, engine)) = self.detect_engine(&path).await {
                let engine_label = Self::engine_label(&engine);
                let is_web = Self::is_web_engine(&engine);
                let is_incomplete = Self::is_incomplete(&engine);
                
                // Buscar portada
                let cover = self.find_cover(&path, &root).await;
                let has_cover = cover.is_some();
                
                // Verificar saves
                let saves_dir = root.join("save");
                let has_saves = saves_dir.exists() && 
                    std::fs::read_dir(&saves_dir)
                        .map(|mut d| d.next().is_some())
                        .unwrap_or(false);

                games.push(GameInfo {
                    name,
                    path: root,
                    engine,
                    engine_label,
                    is_web,
                    is_incomplete,
                    has_cover,
                    cover_url: None, // Se generará en el frontend
                    favorite: false,
                    seconds: 0,
                    last_played: None,
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

        Ok(games)
    }

    /// Limpia el caché de detección
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
    }

    /// Calcula un puerto estable (determinista) para un juego
    /// basado en el hash MD5 de su nombre.
    /// Esto garantiza que el mismo juego siempre use el mismo puerto,
    /// preservando los saves entre sesiones.
    pub fn stable_port(game_name: &str) -> u16 {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(game_name.as_bytes());
        let result = hasher.finalize();
        // Usar los primeros 2 bytes como puerto (rango 1024-65535)
        let hash_val = u16::from_be_bytes([result[0], result[1]]);
        (hash_val % 64000) + 1024
    }
}

impl Default for GameDetector {
    fn default() -> Self {
        Self::new()
    }
}

impl GamePort for GameDetector {
    async fn scan_games(&self, games_dir: &Path) -> AppResult<Vec<GameInfo>> {
        GameDetector::scan_games(self, games_dir).await
    }

    async fn detect_engine(&self, path: &Path) -> Option<(PathBuf, String)> {
        GameDetector::detect_engine(self, path).await
    }

    async fn find_cover(&self, game_top: &Path, root: &Path) -> Option<PathBuf> {
        GameDetector::find_cover(self, game_top, root).await
    }

    fn engine_label(&self, engine: &str) -> String {
        Self::engine_label(engine)
    }

    fn is_web_engine(&self, engine: &str) -> bool {
        Self::is_web_engine(engine)
    }

    fn is_incomplete(&self, engine: &str) -> bool {
        Self::is_incomplete(engine)
    }

    async fn clear_cache(&self) {
        GameDetector::clear_cache(self).await
    }

    fn stable_port(&self, game_name: &str) -> u16 {
        Self::stable_port(game_name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_engine_label() {
        assert_eq!(GameDetector::engine_label("MZ"), "RPG Maker MZ");
        assert_eq!(GameDetector::engine_label("MV"), "RPG Maker MV");
        assert_eq!(GameDetector::engine_label("XP"), "RPG Maker XP");
        assert_eq!(GameDetector::engine_label("unknown"), "unknown");
    }

    #[test]
    fn test_is_web_engine() {
        assert!(GameDetector::is_web_engine("MZ"));
        assert!(GameDetector::is_web_engine("MV"));
        assert!(GameDetector::is_web_engine("web"));
        assert!(!GameDetector::is_web_engine("XP"));
        assert!(!GameDetector::is_web_engine("VXAce"));
    }

    #[test]
    fn test_is_incomplete() {
        assert!(GameDetector::is_incomplete("incomplete"));
        assert!(GameDetector::is_incomplete("renpy-incomplete"));
        assert!(!GameDetector::is_incomplete("MZ"));
        assert!(!GameDetector::is_incomplete("XP"));
    }

    #[tokio::test]
    async fn test_detect_mz_game() {
        let dir = tempdir().unwrap();
        let game_dir = dir.path().join("TestGame");
        let js_dir = game_dir.join("js");
        
        std::fs::create_dir_all(&js_dir).unwrap();
        std::fs::write(js_dir.join("rmmz_core.js"), "").unwrap();
        std::fs::write(game_dir.join("index.html"), "").unwrap();

        let detector = GameDetector::new();
        let result = detector.detect_engine(&game_dir).await;

        assert!(result.is_some());
        let (root, engine) = result.unwrap();
        assert_eq!(engine, "MZ");
    }

    #[tokio::test]
    async fn test_detect_xp_game() {
        let dir = tempdir().unwrap();
        let game_dir = dir.path().join("TestGame");
        
        std::fs::create_dir_all(&game_dir).unwrap();
        std::fs::write(game_dir.join("Game.rgssad"), "").unwrap();

        let detector = GameDetector::new();
        let result = detector.detect_engine(&game_dir).await;

        assert!(result.is_some());
        let (root, engine) = result.unwrap();
        assert_eq!(engine, "XP");
    }

    #[tokio::test]
    async fn test_scan_games_empty_dir() {
        let dir = tempdir().unwrap();
        let detector = GameDetector::new();
        let games = detector.scan_games(dir.path()).await.unwrap();
        assert!(games.is_empty());
    }

    #[test]
    fn test_stable_port() {
        // El mismo nombre siempre produce el mismo puerto
        let port1 = GameDetector::stable_port("MyGame");
        let port2 = GameDetector::stable_port("MyGame");
        assert_eq!(port1, port2);
        
        // Diferentes nombres producen diferentes puertos (probablemente)
        let port3 = GameDetector::stable_port("OtherGame");
        // No hay garantía de que sean diferentes, pero es muy probable
        // Solo verificamos que el rango sea válido
        assert!(port1 >= 1024 && port1 <= 65023);
        assert!(port3 >= 1024 && port3 <= 65023);
    }
}
