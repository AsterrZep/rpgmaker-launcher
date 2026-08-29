// ============================================================
//  RPG Maker Launcher - Game Commands
// ============================================================
// Comandos IPC para lanzamiento y gestión de juegos.
// Utiliza el motor de detección nativo en Rust.
// ============================================================

use std::path::{Path, PathBuf};
use tauri::command;

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
        // Detener servidor anterior si existe
        let prev_server = state.get_server().await;
        if let Some(prev) = prev_server {
            log::info!("Deteniendo servidor anterior para '{}'", prev.game_name);
            state.set_server(None).await;
        }

        // Lanzar juego web con servidor HTTP Axum nativo
        let port = crate::engine::detector::GameDetector::stable_port(&game_name);
        
        let mut server = crate::services::game_server::GameServer::new(path.clone(), port);
        match server.start(&game_name).await {
            Ok(actual_port) => {
                log::info!(
                    "Servidor HTTP nativo iniciado para '{}' en puerto {}",
                    game_name,
                    actual_port
                );
                
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();
                
                // Guardar referencia al servidor activo
                let active_server = crate::core::state::ActiveServer {
                    game_name: game_name.clone(),
                    port: actual_port,
                    start_time: now,
                };
                state.set_server(Some(active_server)).await;
                
                // Actualizar sesión activa
                let session = crate::core::state::ActiveSession {
                    game_name: Some(game_name.clone()),
                    port: Some(actual_port),
                    start_time: Some(now),
                    running: true,
                };
                state.set_session(session).await;
                
                Ok(LaunchResult {
                    ok: true,
                    game: game_name,
                    engine: Some(engine),
                })
            }
            Err(e) => {
                log::error!("Error iniciando servidor HTTP: {}", e);
                Err(format!("Error al iniciar servidor HTTP: {}", e))
            }
        }
    } else {
        // Lanzar juego nativo
        let process_manager = crate::engine::process::ProcessManager::new();
        
        match process_manager
            .launch_native_game(&game_name, &path, &engine)
            .await
        {
            Ok(()) => {
                // Actualizar sesión activa
                let session = crate::core::state::ActiveSession {
                    game_name: Some(game_name.clone()),
                    port: None,
                    start_time: Some(
                        std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs(),
                    ),
                    running: true,
                };
                state.set_session(session).await;
                
                Ok(LaunchResult {
                    ok: true,
                    game: game_name,
                    engine: Some(engine),
                })
            }
            Err(e) => Err(format!("Error al lanzar juego: {}", e)),
        }
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

    // Limpiar servidor activo
    state.set_server(None).await;

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

/// Extrae archivos ZIP en la carpeta de juegos (100% nativo en Rust)
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

        // Extraer ZIP usando librería nativa zip de Rust
        let zip_path = path.clone();
        let extract_result = tokio::task::spawn_blocking(move || {
            extract_zip_native(&zip_path, &game_dir)
        })
        .await;

        match extract_result {
            Ok(Ok(())) => {
                extracted.push(game_name);
                if auto_delete {
                    let _ = std::fs::remove_file(&path);
                }
            }
            Ok(Err(e)) => {
                errors.push(format!("Error extrayendo {}: {}", path_str, e));
            }
            Err(e) => {
                errors.push(format!("Error en thread pool: {}", e));
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

/// Resultado de rescan
#[derive(serde::Serialize)]
pub struct RescanResult {
    pub extracted: Vec<String>,
    pub errors: Vec<String>,
    pub games: Vec<GameInfo>,
}

/// Resultado de instalar ZIPs
#[derive(serde::Serialize)]
pub struct InstallResult {
    pub copied: Vec<String>,
    pub skipped: Vec<String>,
    pub extracted: Vec<String>,
    pub games: Vec<GameInfo>,
}

/// Reescanea la carpeta de juegos y extrae ZIPs pendientes
///
/// # Arguments
/// * `auto_delete` - Eliminar ZIPs después de extraer
/// * `state` - Estado de la aplicación
///
/// # Returns
/// ZIPs extraídos, errores y lista actualizada de juegos
#[command]
pub async fn rescan_games(
    auto_delete: bool,
    state: tauri::State<'_, AppState>,
) -> Result<RescanResult, String> {
    let games_dir = state.config.get_games_dir().await;
    let mut extracted = Vec::new();
    let mut errors = Vec::new();

    // Buscar ZIPs en la carpeta de juegos
    if games_dir.exists() {
        let zip_files: Vec<PathBuf> = std::fs::read_dir(&games_dir)
            .map_err(|e| format!("Error leyendo directorio: {}", e))?
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.path().is_file()
                    && e.path()
                        .extension()
                        .map(|ext| ext.to_string_lossy().to_lowercase() == "zip")
                        .unwrap_or(false)
            })
            .map(|e| e.path())
            .collect();

        for zip_path in &zip_files {
            let game_name = zip_path
                .file_stem()
                .and_then(|n| n.to_str())
                .unwrap_or("juego")
                .to_string();

            let game_dir = games_dir.join(&game_name);

            // Crear directorio del juego
            if let Err(e) = std::fs::create_dir_all(&game_dir) {
                errors.push(format!("Error creando directorio {}: {}", game_name, e));
                continue;
            }

            // Extraer ZIP
            let zip_clone = zip_path.clone();
            let game_dir_clone = game_dir.clone();
            let extract_result = tokio::task::spawn_blocking(move || {
                extract_zip_native(&zip_clone, &game_dir_clone)
            })
            .await;

            match extract_result {
                Ok(Ok(())) => {
                    extracted.push(game_name);
                    if auto_delete {
                        let _ = std::fs::remove_file(zip_path);
                    }
                }
                Ok(Err(e)) => {
                    errors.push(format!("Error extrayendo {}: {}", zip_path.display(), e));
                }
                Err(e) => {
                    errors.push(format!("Error en thread pool: {}", e));
                }
            }
        }
    }

    // Obtener lista actualizada de juegos
    let games = state.scan_games().await.map_err(|e| e.to_string())?;

    Ok(RescanResult {
        extracted,
        errors,
        games,
    })
}

/// Copia y extrae ZIPs desde rutas locales a la carpeta de juegos
///
/// # Arguments
/// * `paths` - Lista de rutas a archivos ZIP
/// * `auto_delete` - Eliminar ZIPs después de extraer
/// * `state` - Estado de la aplicación
///
/// # Returns
/// ZIPs copiados, saltados, extraídos y lista de juegos
#[command]
pub async fn install_zips(
    paths: Vec<String>,
    auto_delete: bool,
    state: tauri::State<'_, AppState>,
) -> Result<InstallResult, String> {
    let games_dir = state.config.get_games_dir().await;
    let mut copied = Vec::new();
    let mut skipped = Vec::new();
    let mut extracted = Vec::new();
    let mut errors = Vec::new();

    // Copiar ZIPs a la carpeta de juegos
    for path_str in &paths {
        let path = PathBuf::from(path_str);

        if !path.exists() {
            skipped.push(format!("{}: no existe", path_str));
            continue;
        }

        if !path
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase() == "zip")
            .unwrap_or(false)
        {
            skipped.push(format!("{}: no es un ZIP", path_str));
            continue;
        }

        let game_name = path
            .file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("juego")
            .to_string();

        let dest = games_dir.join(format!("{}.zip", game_name));

        if let Err(e) = std::fs::create_dir_all(&games_dir) {
            skipped.push(format!("{}: error creando directorio: {}", path_str, e));
            continue;
        }

        match std::fs::copy(&path, &dest) {
            Ok(_) => {
                copied.push(dest.to_string_lossy().to_string());
            }
            Err(e) => {
                skipped.push(format!("{}: error copiando: {}", path_str, e));
            }
        }
    }

    // Extraer ZIPs copiados directamente
    for zip_path_str in &copied {
        let zip_path = PathBuf::from(zip_path_str);
        let game_name = zip_path
            .file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("juego")
            .to_string();

        let game_dir = games_dir.join(&game_name);
        if let Err(e) = std::fs::create_dir_all(&game_dir) {
            errors.push(format!("Error creando directorio {}: {}", game_name, e));
            continue;
        }

        let zip_clone = zip_path.clone();
        let game_dir_clone = game_dir.clone();
        let result = tokio::task::spawn_blocking(move || {
            extract_zip_native(&zip_clone, &game_dir_clone)
        })
        .await;

        match result {
            Ok(Ok(())) => {
                extracted.push(game_name);
                if auto_delete {
                    let _ = std::fs::remove_file(&zip_path);
                }
            }
            Ok(Err(e)) => {
                errors.push(format!("Error extrayendo {}: {}", zip_path.display(), e));
            }
            Err(e) => {
                errors.push(format!("Error en thread pool: {}", e));
            }
        }
    }

    // Obtener lista actualizada de juegos
    let games = state.scan_games().await.map_err(|e| e.to_string())?;

    Ok(InstallResult {
        copied,
        skipped,
        extracted,
        games,
    })
}

/// Extrae un archivo ZIP de forma nativa usando la librería `zip`
fn extract_zip_native(zip_path: &Path, dest_dir: &Path) -> Result<(), String> {
    use zip::ZipArchive;
    use std::io::Read;

    let file = std::fs::File::open(zip_path)
        .map_err(|e| format!("No se pudo abrir el ZIP: {}", e))?;

    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("ZIP inválido: {}", e))?;

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("Error leyendo entrada {}: {}", i, e))?;

        let out_path = dest_dir.join(entry.mangled_name());

        if entry.is_dir() {
            let _ = std::fs::create_dir_all(&out_path);
        } else {
            if let Some(parent) = out_path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }

            let mut out_file = std::fs::File::create(&out_path)
                .map_err(|e| format!("Error creando {}: {}", out_path.display(), e))?;

            let mut buf = Vec::new();
            entry
                .read_to_end(&mut buf)
                .map_err(|e| format!("Error leyendo {}: {}", entry.name(), e))?;

            std::io::Write::write_all(&mut out_file, &buf)
                .map_err(|e| format!("Error escribiendo {}: {}", out_path.display(), e))?;
        }
    }

    Ok(())
}
