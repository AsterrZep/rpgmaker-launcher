use std::path::PathBuf;

/// Formato de save detectado
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub enum SaveFormat {
    /// RPG Maker MV/MZ (JSON comprimido con zlib)
    MvMz,
    /// RPG Maker XP/VX/VX Ace (Ruby Marshal)
    RubyMarshal,
    /// Formato desconocido
    Unknown,
}

/// Información de un save
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SaveInfo {
    pub format: String,
    pub gold: u64,
    pub items_count: usize,
    pub weapons_count: usize,
    pub armors_count: usize,
    pub variables_count: usize,
    pub switches_count: usize,
    pub actors: Vec<ActorInfo>,
    pub size_bytes: u64,
    pub last_modified: Option<u64>,
}

/// Información de un actor
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ActorInfo {
    pub id: u32,
    pub name: String,
    pub level: u32,
    pub hp: u32,
    pub mp: u32,
}

/// Información de archivo de save
#[derive(Debug, Clone, serde::Serialize)]
pub struct SaveFileInfo {
    pub name: String,
    pub path: PathBuf,
    pub size_bytes: u64,
    pub size_kb: f64,
    pub last_modified: Option<u64>,
    pub format: SaveFormat,
}