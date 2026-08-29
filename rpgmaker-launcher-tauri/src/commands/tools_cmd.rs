// ============================================================
//  RPG Maker Launcher - Tools Commands
// ============================================================
// Comandos IPC para herramientas: navegador de datos RPG Maker,
// gestión de mods, apertura de carpetas/URLs, estado y actualizaciones.
// ============================================================

use std::path::PathBuf;
use tauri::command;
use reqwest;

use crate::core::state::AppState;

/// Categorías de datos RPG Maker soportadas
const DATA_FILE_MAP: &[(&str, &str)] = &[
    ("Items", "Items.json"),
    ("Weapons", "Weapons.json"),
    ("Armors", "Armors.json"),
    ("Skills", "Skills.json"),
    ("Enemies", "Enemies.json"),
];

/// Elemento de datos de RPG Maker
#[derive(serde::Serialize)]
pub struct DataItem {
    pub id: u32,
    pub name: String,
    pub description: String,
    pub price: Option<u32>,
    pub atk: Option<u32>,
    pub def: Option<u32>,
    pub mp_cost: Option<u32>,
    pub hp: Option<u32>,
    pub exp: Option<u32>,
    pub gold: Option<u32>,
}

/// Resultado del navegador de datos
#[derive(serde::Serialize)]
pub struct DataResult {
    pub category: String,
    pub items: Vec<DataItem>,
    pub count: usize,
}

/// Resultado de setup mods
#[derive(serde::Serialize)]
pub struct ModsResult {
    pub ok: bool,
    pub mods_dir: String,
    pub created: bool,
    pub mods: Vec<String>,
}

/// Resultado de estado de la aplicación
#[derive(serde::Serialize)]
pub struct StatusResult {
    pub version: String,
    pub running: bool,
    pub active_game: Option<String>,
    pub port: Option<u16>,
    pub uptime_seconds: u64,
}

/// Resultado de verificación de actualización
#[derive(serde::Serialize)]
pub struct UpdateResult {
    pub update_available: bool,
    pub tag_name: String,
    pub current_version: String,
    pub url: String,
}

/// Obtiene datos de la base de datos de un juego RPG Maker
///
/// Lee archivos JSON de datos (Items, Weapons, Armors, Skills, Enemies)
/// soportando tanto formato JSON estándar como archivos binarios RPG Maker.
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
/// * `category` - Categoría de datos a leer
///
/// # Returns
/// Lista de elementos de la categoría solicitada
#[command]
pub async fn get_data(
    game_path: String,
    category: String,
    _state: tauri::State<'_, AppState>,
) -> Result<DataResult, String> {
    let path = PathBuf::from(&game_path);
    let data_dir = path.join("data");

    if !data_dir.exists() {
        return Err(format!(
            "Directorio de datos no encontrado: {}",
            data_dir.display()
        ));
    }

    // Encontrar el archivo correspondiente a la categoría
    let target_fn = DATA_FILE_MAP
        .iter()
        .find(|&&(cat, _)| cat == category)
        .map(|&(_, fn_)| fn_)
        .unwrap_or("Items.json");

    let base_name = target_fn.trim_end_matches(".json");

    // Buscar en múltiples formatos posibles
    let candidates = [
        data_dir.join(target_fn),
        data_dir.join(format!("{}.rpgmdata", base_name)),
        data_dir.join(format!("{}.json_", base_name)),
        data_dir.join(format!("{}.rndata", base_name)),
    ];

    let mut items = Vec::new();

    for candidate in &candidates {
        if !candidate.exists() {
            continue;
        }

        let result = tokio::task::spawn_blocking({
            let candidate = candidate.clone();
            let category = category.clone();
            move || read_data_file(&candidate, &category)
        })
        .await
        .map_err(|_| "Error en el thread pool".to_string())?;

        match result {
            Ok(parsed) => {
                items = parsed;
                break;
            }
            Err(e) => {
                log::warn!("Error leyendo {:?}: {}", candidate, e);
                continue;
            }
        }
    }

    let count = items.len();
    Ok(DataResult {
        category,
        items,
        count,
    })
}

/// Lee un archivo de datos RPG Maker y extrae los elementos
fn read_data_file(path: &std::path::Path, category: &str) -> Result<Vec<DataItem>, String> {
    use std::io::Read;

    let mut file = std::fs::File::open(path)
        .map_err(|e| format!("No se pudo abrir {}: {}", path.display(), e))?;

    let mut raw = Vec::new();
    file.read_to_end(&mut raw)
        .map_err(|e| format!("Error leyendo {}: {}", path.display(), e))?;

    // Saltar cabecera RPG Maker si existe (16 bytes)
    if raw.len() > 16 {
        let header = &raw[..16];
        if header.starts_with(b"RPGMV") || header.starts_with(b"RGGO") {
            raw = raw[16..].to_vec();
        }
    }

    let parsed: serde_json::Value = serde_json::from_slice(&raw)
        .map_err(|e| format!("Error parseando JSON: {}", e))?;

    let arr = parsed
        .as_array()
        .ok_or_else(|| "El archivo no contiene un array".to_string())?;

    let mut items = Vec::new();

    for (idx, entry) in arr.iter().enumerate() {
        // Saltar entradas nulas o sin nombre
        let obj = match entry.as_object() {
            Some(o) => o,
            None => continue,
        };

        let name = obj
            .get("name")
            .and_then(|n| n.as_str())
            .unwrap_or("");

        if name.is_empty() {
            continue;
        }

        let id = obj
            .get("id")
            .and_then(|i| i.as_u64())
            .unwrap_or(idx as u64) as u32;

        let description = obj
            .get("description")
            .and_then(|d| d.as_str())
            .unwrap_or("")
            .to_string();

        let params = obj.get("params").and_then(|p| p.as_array());

        let get_param = |i: usize| -> Option<u32> {
            params
                .as_ref()
                .and_then(|p| p.get(i))
                .and_then(|v| v.as_u64())
                .map(|v| v as u32)
        };

        let item = match category {
            "Items" | "Weapons" | "Armors" => DataItem {
                id,
                name: name.to_string(),
                description,
                price: obj.get("price").and_then(|p| p.as_u64()).map(|v| v as u32),
                atk: if category == "Weapons" { get_param(2) } else { None },
                def: if category == "Armors" { get_param(3) } else { None },
                mp_cost: None,
                hp: None,
                exp: None,
                gold: None,
            },
            "Skills" => DataItem {
                id,
                name: name.to_string(),
                description,
                price: None,
                atk: None,
                def: None,
                mp_cost: obj.get("mpCost").and_then(|m| m.as_u64()).map(|v| v as u32),
                hp: None,
                exp: None,
                gold: None,
            },
            "Enemies" => DataItem {
                id,
                name: name.to_string(),
                description,
                price: None,
                atk: None,
                def: None,
                mp_cost: None,
                hp: get_param(0),
                exp: obj.get("exp").and_then(|e| e.as_u64()).map(|v| v as u32),
                gold: obj.get("gold").and_then(|g| g.as_u64()).map(|v| v as u32),
            },
            _ => DataItem {
                id,
                name: name.to_string(),
                description,
                price: None,
                atk: None,
                def: None,
                mp_cost: None,
                hp: None,
                exp: None,
                gold: None,
            },
        };

        items.push(item);
    }

    Ok(items)
}

/// Configura la carpeta de mods para un juego
///
/// Crea la carpeta mods/ si no existe y genera un mod de ejemplo.
///
/// # Arguments
/// * `game_path` - Ruta al directorio del juego
///
/// # Returns
/// Información sobre la carpeta de mods creada
#[command]
pub async fn setup_mods(
    game_path: String,
    _state: tauri::State<'_, AppState>,
) -> Result<ModsResult, String> {
    let path = PathBuf::from(&game_path);

    if !path.exists() {
        return Err("El directorio del juego no existe".to_string());
    }

    let mods_dir = path.join("mods");
    let created = !mods_dir.exists();

    std::fs::create_dir_all(&mods_dir)
        .map_err(|e| format!("Error creando directorio mods: {}", e))?;

    if created || has_no_mods(&mods_dir) {
        let example_path = mods_dir.join("ejemplo.js");
        if !example_path.exists() {
            let example_content = r#"(function () {
    "use strict";
    document.addEventListener("keydown", function (ev) {
        if (ev.key === "F10") {
            ev.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
    });
})();"#;
            std::fs::write(&example_path, example_content)
                .map_err(|e| format!("Error creando mod ejemplo: {}", e))?;
        }
    }

    let mods: Vec<String> = tokio::task::spawn_blocking({
        let mods_dir_path = mods_dir.clone();
        move || {
            let mut files = Vec::new();
            if let Ok(entries) = std::fs::read_dir(&mods_dir_path) {
                for entry in entries.flatten() {
                    if let Some(name) = entry.file_name().to_str() {
                        if name.ends_with(".js") {
                            files.push(name.to_string());
                        }
                    }
                }
            }
            files.sort();
            files
        }
    })
    .await
    .map_err(|e| format!("Error listando mods: {}", e))?;

    Ok::<_, String>(ModsResult {
        ok: true,
        mods_dir: mods_dir.to_string_lossy().to_string(),
        created,
        mods,
    })
}

/// Verifica si un directorio de mods está vacío
fn has_no_mods(mods_dir: &std::path::Path) -> bool {
    std::fs::read_dir(mods_dir)
        .map(|mut entries| entries.next().is_none())
        .unwrap_or(true)
}

/// Abre una carpeta o URL en el explorador/navegador del sistema
///
/// # Arguments
/// * `target` - Ruta a carpeta o URL a abrir
///
/// # Returns
/// True si se abrió correctamente
#[command]
pub async fn open_target(target: String) -> Result<bool, String> {
    // Validar que sea una URL o una ruta segura
    if target.starts_with("http://") || target.starts_with("https://") {
        // Abrir URL
        #[cfg(target_os = "linux")]
        {
            std::process::Command::new("xdg-open")
                .arg(&target)
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn()
                .map_err(|e| format!("Error abriendo URL: {}", e))?;
        }
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("open")
                .arg(&target)
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn()
                .map_err(|e| format!("Error abriendo URL: {}", e))?;
        }
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("cmd")
                .args(["/C", "start", &target])
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn()
                .map_err(|e| format!("Error abriendo URL: {}", e))?;
        }
        return Ok(true);
    }

    // Es una carpeta - validar que sea segura
    let path = PathBuf::from(&target);
    if !path.exists() {
        return Err("La ruta no existe".to_string());
    }

    if !path.is_dir() {
        return Err("La ruta no es un directorio".to_string());
    }

    // Abrir carpeta
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| format!("Error abriendo carpeta: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| format!("Error abriendo carpeta: {}", e))?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| format!("Error abriendo carpeta: {}", e))?;
    }

    Ok(true)
}

/// Obtiene el estado actual de la aplicación
///
/// # Returns
/// Estado de la aplicación (versión, juego activo, puerto, etc.)
#[command]
pub async fn get_status(
    state: tauri::State<'_, AppState>,
) -> Result<StatusResult, String> {
    let session = state.get_session().await;

    Ok(StatusResult {
        version: env!("CARGO_PKG_VERSION").to_string(),
        running: session.running,
        active_game: session.game_name,
        port: session.port,
        uptime_seconds: session
            .start_time
            .map(|start| {
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
                    - start
            })
            .unwrap_or(0),
    })
}

/// Verifica si hay una actualización disponible desde GitHub
///
/// # Returns
/// Información sobre actualizaciones disponibles
#[command]
pub async fn check_update() -> Result<UpdateResult, String> {
    let client = reqwest::Client::new();
    let result = client
        .get("https://api.github.com/repos/AsterrZep/rpgmaker-launcher/releases/latest")
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "rpgmaker-launcher")
        .timeout(std::time::Duration::from_secs(8))
        .send()
        .await;

    match result {
        Ok(response) => {
            match response.json::<serde_json::Value>().await {
                Ok(data) => {
                    let tag = data.get("tag_name").and_then(|t| t.as_str()).unwrap_or("");
                    let current = env!("CARGO_PKG_VERSION");
                    let update_available = if tag.is_empty() {
                        false
                    } else {
                        let parse_version = |s: &str| -> Vec<u32> {
                            s.trim_start_matches('v')
                                .split('.')
                                .filter_map(|p| p.parse().ok())
                                .collect()
                        };
                        parse_version(tag) > parse_version(current)
                    };
                    Ok(UpdateResult {
                        update_available,
                        tag_name: tag.to_string(),
                        current_version: current.to_string(),
                        url: "https://github.com/AsterrZep/rpgmaker-launcher/releases".to_string(),
                    })
                }
                Err(_) => Err("Error parseando respuesta de actualización".to_string()),
            }
        }
        Err(_) => Ok(UpdateResult {
            update_available: false,
            tag_name: String::new(),
            current_version: env!("CARGO_PKG_VERSION").to_string(),
            url: "https://github.com/AsterrZep/rpgmaker-launcher/releases".to_string(),
        }),
    }
}
