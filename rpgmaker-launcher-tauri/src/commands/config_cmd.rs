// ============================================================
//  RPG Maker Launcher - Configuration Commands
// ============================================================
// Comandos IPC para gestión de configuración.
// ============================================================

use tauri::command;

use crate::core::config::{AppConfig, ConfigManager};
use crate::core::state::AppState;

/// Resultado de obtener configuración
#[derive(serde::Serialize)]
pub struct ConfigResult {
    pub ok: bool,
    pub config: AppConfig,
}

/// Obtiene la configuración actual
///
/// # Returns
/// Configuración de la aplicación
#[command]
pub async fn get_config(
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    Ok(state.config.get().await)
}

/// Actualiza la configuración
///
/// # Arguments
/// * `config` - Nueva configuración
/// * `state` - Estado de la aplicación
///
/// # Returns
/// Resultado de la operación
#[command]
pub async fn update_config(
    config: AppConfig,
    state: tauri::State<'_, AppState>,
) -> Result<ConfigResult, String> {
    match state.config.update(config.clone()).await {
        Ok(()) => Ok(ConfigResult {
            ok: true,
            config,
        }),
        Err(e) => Err(format!("Error al guardar configuración: {}", e)),
    }
}

/// Restablece la configuración a valores por defecto
///
/// # Returns
/// Configuración por defecto
#[command]
pub async fn reset_config(
    state: tauri::State<'_, AppState>,
) -> Result<ConfigResult, String> {
    let default_config = AppConfig::default();
    
    match state.config.update(default_config.clone()).await {
        Ok(()) => Ok(ConfigResult {
            ok: true,
            config: default_config,
        }),
        Err(e) => Err(format!("Error al restablecer configuración: {}", e)),
    }
}

/// Obtiene la carpeta de juegos configurada
///
/// # Returns
/// Ruta a la carpeta de juegos
#[command]
pub async fn get_games_dir(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let dir = state.config.get_games_dir().await;
    Ok(dir.to_string_lossy().to_string())
}

/// Obtiene el directorio de datos de la aplicación
///
/// # Returns
/// Ruta al directorio de datos
#[command]
pub async fn get_data_dir(
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok(ConfigManager::data_dir().to_string_lossy().to_string())
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            teclas: crate::core::config::TeclasConfig {
                trucos: "F8".to_string(),
                recargar: "F5".to_string(),
                fps: "F9".to_string(),
                captura: "F12".to_string(),
                pantalla_completa: "F11".to_string(),
                salir_pantalla_completa: "Escape".to_string(),
                zoom_in: "Control+equal".to_string(),
                zoom_out: "Control+minus".to_string(),
                zoom_0: "Control+0".to_string(),
            },
            general: crate::core::config::GeneralConfig {
                webkit: false,
                auto_delete_zip: false,
                lang: None,
                games_dir: None,
            },
            sync: None,
        }
    }
}
