// ============================================================
//  RPG Maker Launcher - Save Editor Commands
// ============================================================
// Comandos IPC para edición de partidas guardadas.
// Soporta saves de RPG Maker MV/MZ y XP/VX/VX Ace.
// ============================================================

use std::path::PathBuf;
use tauri::command;

use crate::core::config::ConfigManager;
use crate::core::state::AppState;
use crate::engine::save_editor::{SaveEditor, SaveInfo, SaveFileInfo};

/// Lista de saves de un juego
#[derive(serde::Serialize)]
pub struct SavesList {
    pub saves: Vec<SaveFileInfo>,
    pub saves_dir: String,
    pub count: usize,
}

/// Obtiene la lista de saves de un juego
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
///
/// # Returns
/// Lista de archivos de save
#[command]
pub async fn get_saves(
    game_path: String,
    _state: tauri::State<'_, AppState>,
) -> Result<SavesList, String> {
    let path = PathBuf::from(&game_path);
    let saves_dir = path.join("save");

    let result = tokio::task::spawn_blocking(move || {
        SaveEditor::list_saves(&saves_dir)
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok(saves) => Ok(SavesList {
            count: saves.len(),
            saves_dir: saves_dir.to_string_lossy().to_string(),
            saves,
        }),
        Err(e) => Err(format!("Error al listar saves: {}", e)),
    }
}

/// Obtiene el contenido de un save
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
/// * `save_name` - Nombre del archivo de save
///
/// # Returns
/// Información detallada del save
#[command]
pub async fn get_save_content(
    game_path: String,
    save_name: String,
    _state: tauri::State<'_, AppState>,
) -> Result<SaveInfo, String> {
    let path = PathBuf::from(&game_path).join("save").join(&save_name);

    if !path.exists() {
        return Err("El archivo de save no existe".to_string());
    }

    let result = tokio::task::spawn_blocking(move || {
        let editor = SaveEditor::new(None);
        editor.get_save_info(&path)
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok(info) => Ok(info),
        Err(e) => Err(format!("Error al leer save: {}", e)),
    }
}

/// Actualiza el contenido de un save
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
/// * `save_name` - Nombre del archivo de save
/// * `updates` - Mapa de actualizaciones a aplicar
///
/// # Returns
/// True si se actualizó correctamente
#[command]
pub async fn update_save_content(
    game_path: String,
    save_name: String,
    updates: serde_json::Value,
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    let path = PathBuf::from(&game_path).join("save").join(&save_name);

    if !path.exists() {
        return Err("El archivo de save no existe".to_string());
    }

    // Obtener directorio de backups
    let backups_dir = ConfigManager::backups_dir();

    let result = tokio::task::spawn_blocking(move || {
        let editor = SaveEditor::new(Some(backups_dir));
        editor.update_save(&path, &updates)
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok(true) => {
            log::info!("Save actualizado: {}", save_name);
            Ok(true)
        }
        Ok(false) => Err("No se pudo actualizar el save".to_string()),
        Err(e) => Err(format!("Error al actualizar save: {}", e)),
    }
}

/// Crea un backup de un save
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
/// * `save_name` - Nombre del archivo de save
///
/// # Returns
/// Ruta del backup creado
#[command]
pub async fn backup_save(
    game_path: String,
    save_name: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let path = PathBuf::from(&game_path).join("save").join(&save_name);

    if !path.exists() {
        return Err("El archivo de save no existe".to_string());
    }

    let backups_dir = ConfigManager::backups_dir();

    let result = tokio::task::spawn_blocking(move || {
        let editor = SaveEditor::new(Some(backups_dir.clone()));
        editor.create_backup(&path, &backups_dir)
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok(backup_path) => {
            let path_str = backup_path.to_string_lossy().to_string();
            log::info!("Backup creado: {}", path_str);
            Ok(path_str)
        }
        Err(e) => Err(format!("Error al crear backup: {}", e)),
    }
}
