// ============================================================
//  RPG Maker Launcher - Decrypter Commands
// ============================================================
// Comandos IPC para descifrado de assets de RPG Maker.
// Utiliza el motor de descifrado paralelo en Rust.
// ============================================================

use std::path::PathBuf;
use tauri::command;

use crate::core::state::AppState;
use crate::engine::decrypter::Decrypter;

/// Resultado del descifrado de assets
#[derive(serde::Serialize)]
pub struct DecryptResult {
    pub success_count: usize,
    pub failed_count: usize,
    pub total_files: usize,
    pub output_dir: String,
    pub log: String,
}

/// Descifra todos los assets de un juego
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
/// * `encryption_key` - Clave de encriptación en hexadecimal
///
/// # Returns
/// Resultado del descifrado con estadísticas
#[command]
pub async fn decrypt_game_assets(
    game_path: String,
    encryption_key: String,
    _state: tauri::State<'_, AppState>,
) -> Result<DecryptResult, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    // Crear descifrador
    let decrypter = Decrypter::new(&encryption_key)
        .map_err(|e| format!("Error al crear descifrador: {}", e))?;

    // Ejecutar descifrado en thread pool bloqueante
    let result = tokio::task::spawn_blocking(move || {
        decrypter.decrypt_directory(&path)
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok((success, failed, _files)) => Ok(DecryptResult {
            success_count: success,
            failed_count: failed,
            total_files: success + failed,
            output_dir: game_path,
            log: format!(
                "Descifrados: {}, Errores: {}, Total: {}",
                success,
                failed,
                success + failed
            ),
        }),
        Err(e) => Err(format!("Error durante el descifrado: {}", e)),
    }
}

/// Lee la clave de encriptación desde el archivo de proyecto del juego
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
///
/// # Returns
/// Clave hexadecimal si se encuentra
#[command]
pub async fn read_encryption_key(
    game_path: String,
) -> Result<Option<String>, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    let result = tokio::task::spawn_blocking(move || {
        Decrypter::read_key_from_project(&path)
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok(key) => Ok(key),
        Err(e) => Err(format!("Error al leer clave: {}", e)),
    }
}

/// Verifica si un directorio contiene assets cifrados
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
///
/// # Returns
/// True si contiene assets cifrados
#[command]
pub async fn has_encrypted_assets(
    game_path: String,
) -> Result<bool, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    let result = tokio::task::spawn_blocking(move || {
        Decrypter::has_encrypted_assets(&path)
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    Ok(result)
}
