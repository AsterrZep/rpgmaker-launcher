use std::path::{Path, PathBuf};

use crate::core::error::AppResult;
use crate::core::models::game::GameInfo;

pub trait GamePort: Send + Sync {
    async fn scan_games(&self, games_dir: &Path) -> AppResult<Vec<GameInfo>>;
    async fn detect_engine(&self, path: &Path) -> Option<(PathBuf, String)>;
    async fn find_cover(&self, game_top: &Path, root: &Path) -> Option<PathBuf>;
    fn engine_label(&self, engine: &str) -> String;
    fn is_web_engine(&self, engine: &str) -> bool;
    fn is_incomplete(&self, engine: &str) -> bool;
    async fn clear_cache(&self);
    fn stable_port(&self, game_name: &str) -> u16;
}