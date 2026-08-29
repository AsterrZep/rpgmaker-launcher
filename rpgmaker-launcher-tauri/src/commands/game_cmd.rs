// ============================================================
//  RPG Maker Launcher - Game Commands
// ============================================================
// Comandos IPC para lanzamiento y gestión de juegos.
// Utiliza el motor de detección nativo en Rust.
// ============================================================

use std::path::PathBuf;
use tauri::command;

use crate::core::config::ConfigManager;
use crate::core::state::{AppState, GameInfo};
use crate::engine::detector::GameDetector;

/// Resultado del escaneo de juegos
#[derive(serde::Serialize)]
pub struct ScanResult {
    pub games: Vec<GameInfo>,
    pub total: usize,
}

/// Escanea y retorna la lista de juegos instalados
///
/// # Arguments
/// * `state` - Estado de la aplicación
///
/// # Returns
/// Lista de juegos detectados
#[command]
pub async fn get_games(
    state: tauri::State<'_, AppState>,
) -> Result<ScanResult, String> {
    let games_dir = state.config.get_games_dir().await;
    let detector = GameDetector::new();
    
    let result = detector.scan_games(&games_dir).await;

    match result {
        Ok(games) => {
            let total = games.len();
            Ok(ScanResult { games, total })
        }
        Err(e) => Err(format!("Error al escanear juegos: {}", e)),
    }
}

/// Lanza un juego
///
/// # Arguments
/// * `game_name` - Nombre del juego
/// * `game_path` - Ruta al directorio del juego
/// * `engine` - Motor del juego
/// * `state` - Estado de la aplicación
///
/// # Returns
/// Información del lanzamiento
#[command]
pub async fn launch_game(
    game_name: String,
    game_path: String,
    engine: String,
    state: tauri::State<'_, AppState>,
) -> Result<LaunchResult, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    // Verificar si es un juego web
    let is_web = crate::engine::detector::GameDetector::is_web_engine(&engine);

    if is_web {
        // Para juegos web, necesitamos iniciar un servidor HTTP
        // Por ahora, usar el servidor Python existente
        return Err("Lanzamiento de juegos web aún no implementado en Rust".to_string());
    }

    // Lanzar juego nativo
    let process_manager = crate::engine::process::ProcessManager::new();
    
    match process_manager
        .launch_native_game(&game_name, &path, &engine)
        .await
    {
        Ok(()) => Ok(LaunchResult {
            ok: true,
            game: game_name,
            engine: Some(engine),
        }),
        Err(e) => Err(format!("Error al lanzar juego: {}", e)),
    }
}

/// Detiene el juego activo
///
/// # Returns
/// Información del juego detenido
#[command]
pub async fn stop_game(
    state: tauri::State<'_, AppState>,
) -> Result<StopResult, String> {
    // Obtener sesión actual
    let session = state.get_session().await;

    if !session.running {
        return Ok(StopResult {
            ok: true,
            game: None,
            seconds_added: 0,
            total_seconds: 0,
        });
    }

    // Actualizar tiempo de juego
    if let Some(ref game_name) = session.game_name {
        if let Some(start_time) = session.start_time {
            let elapsed = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs()
                - start_time;

            let _ = state.update_play_time(game_name, elapsed).await;
        }
    }

    // Limpiar sesión
    let new_session = crate::core::state::ActiveSession::default();
    state.set_session(new_session).await;

    Ok(StopResult {
        ok: true,
        game: session.game_name,
        seconds_added: 0,
        total_seconds: 0,
    })
}

/// Alterna el estado de favorito de un juego
///
/// # Arguments
/// * `game_name` - Nombre del juego
/// * `state` - Estado de la aplicación
///
/// # Returns
/// Nuevo estado de favorito
#[command]
pub async fn toggle_favorite(
    game_name: String,
    state: tauri::State<'_, AppState>,
) -> Result<FavoriteResult, String> {
    match state.toggle_favorite(&game_name).await {
        Ok(new_fav) => Ok(FavoriteResult {
            ok: true,
            name: game_name,
            favorite: new_fav,
        }),
        Err(e) => Err(format!("Error al cambiar favorito: {}", e)),
    }
}

/// Extrae archivos ZIP en la carpeta de juegos
///
/// # Arguments
/// * `paths` - Lista de rutas a archivos ZIP
/// * `auto_delete` - Eliminar ZIPs después de extraer
/// * `state` - Estado de la aplicación
///
/// # Returns
/// Resultado de la extracción
#[command]
pub async fn extract_zips(
    paths: Vec<String>,
    auto_delete: bool,
    state: tauri::State<'_, AppState>,
) -> Result<ExtractResult, String> {
    let games_dir = state.config.get_games_dir().await;
    let mut extracted = Vec::new();
    let mut errors = Vec::new();

    for path_str in paths {
        let path = PathBuf::from(&path_str);

        if !path.exists() {
            errors.push(format!("No existe: {}", path_str));
            continue;
        }

        if !path.extension().map_or(false, |e| e.to_string_lossy().to_lowercase() == "zip") {
            errors.push(format!("No es un ZIP: {}", path_str));
            continue;
        }

        // Obtener nombre del juego
        let game_name = path
            .file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("juego")
            .to_string();

        // Crear directorio del juego
        let game_dir = games_dir.join(&game_name);
        if let Err(e) = std::fs::create_dir_all(&game_dir) {
            errors.push(format!("Error creando directorio: {}", e));
            continue;
        }

        // Extraer ZIP
        let output = std::process::Command::new("unzip")
            .arg("-o")
            .arg("-q")
            .arg(&path)
            .arg("-d")
            .arg(&game_dir)
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    extracted.push(game_name);
                    
                    // Eliminar ZIP si se pidió
                    if auto_delete {
                        let _ = std::fs::remove_file(&path);
                    }
                } else {
                    errors.push(format!("Error extrayendo {}", path_str));
                }
            }
            Err(e) => {
                errors.push(format!("Error ejecutando unzip: {}", e));
            }
        }
    }

    Ok(ExtractResult {
        extracted,
        errors,
    })
}

/// Detecta el motor de un juego específico
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
///
/// # Returns
/// Información del motor detectado
#[command]
pub async fn detect_game_engine(
    game_path: String,
) -> Result<DetectResult, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    let detector = GameDetector::new();
    
    match detector.detect_engine(&path).await {
        Some((root, engine)) => {
            let engine_label = GameDetector::engine_label(&engine);
            let is_web = GameDetector::is_web_engine(&engine);
            let is_incomplete = GameDetector::is_incomplete(&engine);
            
            Ok(DetectResult {
                ok: true,
                root: root.to_string_lossy().to_string(),
                engine,
                engine_label,
                is_web,
                is_incomplete,
            })
        }
        None => Ok(DetectResult {
            ok: false,
            root: game_path,
            engine: String::new(),
            engine_label: String::new(),
            is_web: false,
            is_incomplete: false,
        }),
    }
}

/// Resultado del lanzamiento de un juego
#[derive(serde::Serialize)]
pub struct LaunchResult {
    pub ok: bool,
    pub game: String,
    pub engine: Option<String>,
}

/// Resultado de detener un juego
#[derive(serde::Serialize)]
pub struct StopResult {
    pub ok: bool,
    pub game: Option<String>,
    pub seconds_added: u64,
    pub total_seconds: u64,
}

/// Resultado de cambiar favorito
#[derive(serde::Serialize)]
pub struct FavoriteResult {
    pub ok: bool,
    pub name: String,
    pub favorite: bool,
}

/// Resultado de extraer ZIPs
#[derive(serde::Serialize)]
pub struct ExtractResult {
    pub extracted: Vec<String>,
    pub errors: Vec<String>,
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
