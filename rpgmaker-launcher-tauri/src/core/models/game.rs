use std::path::PathBuf;

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

/// Resultado del escaneo de juegos
#[derive(serde::Serialize)]
pub struct ScanResult {
    pub games: Vec<GameInfo>,
    pub total: usize,
}

/// Resultado de detección de motor
#[derive(serde::Serialize)]
pub struct DetectResult {
    pub ok: bool,
    pub root: String,
    pub engine: String,
    pub engine_label: String,
    pub is_web: bool,
    pub is_incomplete: bool,
}