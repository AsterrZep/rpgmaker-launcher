use std::path::PathBuf;

use crate::core::error::AppResult;
use crate::core::models::session::ProcessStatus;

pub trait ProcessPort: Send + Sync {
    async fn launch_web_game(&self, game_name: &str, game_dir: &PathBuf, port: u16) -> AppResult<()>;
    async fn launch_native_game(&self, game_name: &str, game_dir: &PathBuf, engine: &str) -> AppResult<()>;
    async fn stop_active_process(&self) -> AppResult<(Option<String>, Option<u64>)>;
    async fn get_status(&self) -> ProcessStatus;
    async fn calculate_play_time(&self, game_name: &str, state_file: &PathBuf) -> u64;
}