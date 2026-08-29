// ============================================================
//  RPG Maker Launcher - Cover Image Commands
// ============================================================
// Comando IPC para servir imágenes de portada de juegos.
// Devuelve los bytes de la imagen para que el frontend la muestre.
// ============================================================

use std::path::PathBuf;
use tauri::command;

use crate::core::state::AppState;
use crate::engine::detector::GameDetector;

/// Resultado de obtener imagen de portada
#[derive(serde::Serialize)]
pub struct CoverResult {
    pub found: bool,
    pub data: Option<Vec<u8>>,
    pub mime_type: String,
    pub game_name: String,
}

/// Obtiene la imagen de portada de un juego como bytes
///
/// Busca la imagen de portada en las ubicaciones estándar y
/// devuelve los bytes de la imagen junto con su tipo MIME.
///
/// # Arguments
/// * `game_name` - Nombre del juego
/// * `game_path` - Ruta al directorio del juego
///
/// # Returns
/// Bytes de la imagen de portada
#[command]
pub async fn get_cover_image(
    game_name: String,
    game_path: String,
    _state: tauri::State<'_, AppState>,
) -> Result<CoverResult, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    let result = tokio::task::spawn_blocking(move || {
        let detector = GameDetector::new();

        // Detectar root del juego
        let root = tokio::runtime::Handle::current()
            .block_on(detector.detect_engine(&path))
            .map(|(r, _)| r)
            .unwrap_or_else(|| path.clone());

        // Buscar portada
        let cover_path = tokio::runtime::Handle::current()
            .block_on(detector.find_cover(&path, &root));

        match cover_path {
            Some(cover) => {
                let data = std::fs::read(&cover)
                    .map_err(|e| format!("Error leyendo portada: {}", e))?;

                let mime_type = detect_mime_type(&cover);

                Ok(CoverResult {
                    found: true,
                    data: Some(data),
                    mime_type,
                    game_name,
                })
            }
            None => Ok(CoverResult {
                found: false,
                data: None,
                mime_type: String::new(),
                game_name,
            }),
        }
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    result
}

/// Detecta el tipo MIME de un archivo de imagen
fn detect_mime_type(path: &std::path::Path) -> String {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .as_deref()
    {
        Some("png") => "image/png".to_string(),
        Some("jpg") | Some("jpeg") => "image/jpeg".to_string(),
        Some("webp") => "image/webp".to_string(),
        Some("gif") => "image/gif".to_string(),
        _ => "image/png".to_string(),
    }
}
