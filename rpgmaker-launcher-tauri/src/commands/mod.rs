// ============================================================
//  RPG Maker Launcher - Tauri Commands
// ============================================================
// Comandos IPC expuestos al frontend TypeScript.
// Cada comando se ejecuta de forma asíncrona en el thread pool
// de Tokio para no bloquear la UI.
// ============================================================

pub mod decrypter_cmd;
pub mod save_cmd;
pub mod game_cmd;
pub mod config_cmd;
pub mod sync_cmd;
pub mod event_cmd;
pub mod plugins_cmd;
pub mod tools_cmd;
pub mod cover_cmd;

pub use decrypter_cmd::*;
pub use save_cmd::*;
pub use game_cmd::*;
pub use config_cmd::*;
pub use sync_cmd::*;
pub use event_cmd::*;
pub use plugins_cmd::*;
pub use tools_cmd::*;
pub use cover_cmd::*;
