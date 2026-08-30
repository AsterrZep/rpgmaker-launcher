// ============================================================
//  RPG Maker Launcher - Plugin Commands
// ============================================================
// Comandos IPC para gestión de plugins RPG Maker MZ/MV.
// Reemplaza las llamadas HTTP a backend/plugins.py con
// implementación nativa en Rust.
// ============================================================

use std::path::PathBuf;
use tauri::command;

use crate::core::models::plugin::PluginInfo;
use crate::core::ports::plugin_port::PluginPort;
use crate::core::state::AppState;

/// Resultado de obtener plugins
#[derive(serde::Serialize)]
pub struct PluginsResult {
    pub ok: bool,
    pub plugins: Vec<PluginInfo>,
    pub has_backup: bool,
}

/// Resultado de toggle plugins
#[derive(serde::Serialize)]
pub struct ToggleResult {
    pub ok: bool,
    pub modified: Vec<String>,
    pub message: String,
}

/// Resultado de restore plugins
#[derive(serde::Serialize)]
pub struct RestoreResult {
    pub ok: bool,
    pub message: String,
}

/// Obtiene la lista de plugins de un juego con análisis de compatibilidad
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
/// * `_state` - Estado de la aplicación
///
/// # Returns
/// Lista de plugins analizados
#[command]
pub async fn get_plugins(
    game_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<PluginsResult, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    let plugin_engine = state.plugin_engine.clone();
    let result = tokio::task::spawn_blocking(move || plugin_engine.get_plugins_status(&path))
        .await
        .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok(status) => Ok(PluginsResult {
            ok: true,
            plugins: status.plugins,
            has_backup: status.has_backup,
        }),
        Err(e) => Err(format!("Error al obtener plugins: {}", e)),
    }
}

/// Activa o desactiva plugins específicos o todos
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
/// * `names` - Lista de nombres de plugins a modificar
/// * `status` - True para activar, False para desactivar
/// * `all` - Si True, modifica todos los plugins
/// * `_state` - Estado de la aplicación
///
/// # Returns
/// Lista de plugins modificados
#[command]
pub async fn toggle_plugins(
    game_path: String,
    names: Vec<String>,
    status: bool,
    all: bool,
    state: tauri::State<'_, AppState>,
) -> Result<ToggleResult, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    let plugin_engine = state.plugin_engine.clone();
    let result = tokio::task::spawn_blocking(move || {
        plugin_engine.toggle_plugins(&path, &names, status, all)
    })
    .await
    .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok(modified) => {
            let count = modified.len();
            let action = if status { "activados" } else { "desactivados" };
            Ok(ToggleResult {
                ok: true,
                modified,
                message: format!("{} plugin(s) {}", count, action),
            })
        }
        Err(e) => Err(format!("Error al modificar plugins: {}", e)),
    }
}

/// Restaura plugins.js desde la copia de seguridad
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
/// * `_state` - Estado de la aplicación
///
/// # Returns
/// Resultado de la restauración
#[command]
pub async fn restore_plugins(
    game_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<RestoreResult, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    let plugin_engine = state.plugin_engine.clone();
    let result = tokio::task::spawn_blocking(move || plugin_engine.restore_plugins(&path))
        .await
        .map_err(|_| "Error en el thread pool".to_string())?;

    match result {
        Ok(()) => Ok(RestoreResult {
            ok: true,
            message: "plugins.js restaurado desde la copia original".to_string(),
        }),
        Err(e) => Err(format!("Error al restaurar plugins: {}", e)),
    }
}
