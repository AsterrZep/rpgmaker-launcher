/// Resultado de sincronización
#[derive(Debug, Clone, serde::Serialize)]
pub struct SyncResult {
    pub game: String,
    pub count: usize,
    pub direction: String,
}