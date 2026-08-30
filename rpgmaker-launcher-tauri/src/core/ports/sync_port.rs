use std::path::{Path, PathBuf};

use crate::core::error::AppResult;
use crate::core::models::sync::SyncResult;

pub trait SyncPort: Send + Sync {
    fn sync_game(&self, game_name: &str, local_saves_dir: &Path, mode: &str) -> AppResult<SyncResult>;
    fn sync_all(&self, games: &[(String, PathBuf)], mode: &str) -> AppResult<Vec<SyncResult>>;
    fn is_configured(&self) -> bool;
}