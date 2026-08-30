// ============================================================
//  RPG Maker Launcher - Sync Commands
// ============================================================
// Comandos IPC para sincronización de partidas guardadas.
// ============================================================

use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::command;

use crate::core::config::ConfigManager;
use crate::core::state::AppState;

/// Estado de sincronización de un juego
#[derive(serde::Serialize)]
pub struct SyncStatus {
    pub destination: String,
    pub auto_sync: bool,
    pub games: Vec<GameSyncStatus>,
}

/// Estado de sincronización de un juego individual
#[derive(serde::Serialize)]
pub struct GameSyncStatus {
    pub name: String,
    pub local_saves: i32,
    pub dest_saves: i32,
}

/// Resultado de sincronización
#[derive(serde::Serialize)]
pub struct SyncResult {
    pub ok: bool,
    pub mode: String,
    pub results: Vec<GameSyncResult>,
}

/// Resultado de sincronización de un juego
#[derive(serde::Serialize)]
pub struct GameSyncResult {
    pub game: String,
    pub count: usize,
}

/// Obtiene el estado de sincronización
///
/// # Returns
/// Estado actual de sincronización
#[command]
pub async fn get_sync_status(
    state: tauri::State<'_, AppState>,
) -> Result<SyncStatus, String> {
    let (dest_folder, auto_sync) = state.config.get_sync_settings().await;
    let games = state.scan_games().await.map_err(|e| e.to_string())?;

    let mut game_statuses = Vec::new();

    for game in &games {
        let local_save_dir = game.path.join("save");
        let local_count = count_saves(&local_save_dir);

        let dest_save_dir = if !dest_folder.is_empty() {
            PathBuf::from(&dest_folder).join(&game.name).join("save")
        } else {
            PathBuf::new()
        };

        let dest_count = if !dest_folder.is_empty() {
            count_saves(&dest_save_dir)
        } else {
            -1
        };

        game_statuses.push(GameSyncStatus {
            name: game.name.clone(),
            local_saves: local_count,
            dest_saves: dest_count,
        });
    }

    Ok(SyncStatus {
        destination: dest_folder,
        auto_sync,
        games: game_statuses,
    })
}

/// Ejecuta sincronización (push o pull)
///
/// # Arguments
/// * `mode` - "push" o "pull"
/// * `folder` - Carpeta destino (opcional)
/// * `state` - Estado de la aplicación
///
/// # Returns
/// Resultado de la sincronización
#[command]
pub async fn execute_sync(
    mode: String,
    folder: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<SyncResult, String> {
    if mode != "push" && mode != "pull" {
        return Err("Modo inválido: usar 'push' o 'pull'".to_string());
    }

    let (dest_folder, _auto) = state.config.get_sync_settings().await;
    let dest_folder = folder.unwrap_or(dest_folder);

    if dest_folder.is_empty() {
        return Err("Carpeta destino no configurada".to_string());
    }

    let dest_path = PathBuf::from(&dest_folder);
    if !dest_path.exists() {
        return Err("La carpeta destino no existe".to_string());
    }

    let games = state.scan_games().await.map_err(|e| e.to_string())?;
    let game_dirs: Vec<(String, PathBuf)> = games
        .iter()
        .map(|g| (g.name.clone(), g.path.join("save")))
        .collect();

    let sync_results = state.sync_service.sync_all(&game_dirs, &mode)
        .map_err(|e| e.to_string())?;

    let results: Vec<GameSyncResult> = sync_results
        .iter()
        .map(|r| GameSyncResult {
            game: r.game.clone(),
            count: r.count,
        })
        .collect();

    log::info!("Sincronización completada: {} ({})", mode, results.len());
    
    Ok(SyncResult {
        ok: true,
        mode,
        results,
    })
}

/// Crea backup de saves de un juego
///
/// # Arguments
/// * `game_name` - Nombre del juego
/// * `game_path` - Ruta al directorio del juego
///
/// # Returns
/// Ruta del backup creado
#[command]
pub async fn backup_saves(
    game_name: String,
    game_path: String,
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let saves_dir = PathBuf::from(&game_path).join("save");

    if !saves_dir.exists() || count_saves(&saves_dir) == 0 {
        return Err("No hay saves para respaldar".to_string());
    }

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let backups_dir = ConfigManager::backups_dir();
    let backup_path = backups_dir
        .join(&game_name)
        .join(format!("snapshot-{}", timestamp));

    if let Err(e) = std::fs::create_dir_all(&backup_path) {
        return Err(format!("Error creando directorio de backup: {}", e));
    }

    // Copiar saves
    for entry in std::fs::read_dir(&saves_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let src = entry.path();
        if src.is_file() {
            let dst = backup_path.join(src.file_name().unwrap_or_default());
            if let Err(e) = std::fs::copy(&src, &dst) {
                log::error!("Error copiando {}: {}", src.display(), e);
            }
        }
    }

    let path_str = backup_path.to_string_lossy().to_string();
    log::info!("Backup creado: {}", path_str);
    Ok(path_str)
}

/// Cuenta el número de archivos de save en un directorio
fn count_saves(dir: &PathBuf) -> i32 {
    if !dir.exists() {
        return -1;
    }

    let mut count = 0;
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if entry.path().is_file() {
                count += 1;
            }
        }
    }
    count
}
