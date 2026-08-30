use std::path::Path;

use crate::core::error::AppResult;
use crate::core::models::save::{SaveFileInfo, SaveFormat, SaveInfo};

pub trait SavePort: Send + Sync {
    fn detect_format(&self, path: &Path) -> SaveFormat;
    fn list_saves(&self, saves_dir: &Path) -> AppResult<Vec<SaveFileInfo>>;
    fn get_save_info(&self, path: &Path) -> AppResult<SaveInfo>;
    fn update_save(&self, path: &Path, updates: &serde_json::Value) -> AppResult<bool>;
    fn load_mv_mz_save(&self, path: &Path) -> AppResult<serde_json::Value>;
    fn save_mv_mz_save(&self, path: &Path, data: &serde_json::Value) -> AppResult<()>;
    fn load_ruby_marshal_save(&self, path: &Path) -> AppResult<Vec<u8>>;
}