use std::path::{Path, PathBuf};

use crate::core::error::AppResult;
use crate::core::models::plugin::{PluginInfo, PluginsStatus};

pub trait PluginPort: Send + Sync {
    fn find_plugins_js(&self, root: &Path) -> Option<PathBuf>;
    fn load_plugins(&self, root: &Path) -> AppResult<(PathBuf, String, Vec<serde_json::Value>)>;
    fn save_plugins(&self, path: &Path, raw: &str, plugins: &[serde_json::Value]) -> AppResult<()>;
    fn analyze_plugin(&self, name: &str, root: &Path) -> PluginInfo;
    fn get_plugins_status(&self, root: &Path) -> AppResult<PluginsStatus>;
    fn toggle_plugins(&self, path: &Path, names: &[String], status: bool, all: bool) -> AppResult<Vec<String>>;
    fn restore_plugins(&self, root: &Path) -> AppResult<()>;
}