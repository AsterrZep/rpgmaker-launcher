/// Estado de una sesión activa de juego
#[derive(Debug, Clone, Default)]
pub struct ActiveSession {
    pub game_name: Option<String>,
    pub port: Option<u16>,
    pub start_time: Option<u64>,
    pub running: bool,
}

/// Estado del servidor HTTP activo (para juegos web)
#[derive(Debug, Clone)]
pub struct ActiveServer {
    pub game_name: String,
    pub port: u16,
    pub start_time: u64,
}

/// Estado del proceso
#[derive(Debug, Clone, serde::Serialize)]
pub struct ProcessStatus {
    pub game_name: Option<String>,
    pub running: bool,
    pub elapsed_seconds: Option<u64>,
}