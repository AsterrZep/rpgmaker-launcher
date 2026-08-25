use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

struct AppState {
    child: Mutex<Option<Child>>,
}

/// Candidatos del backend Python, en orden de prioridad:
/// 1. RPGMAKER_API_SCRIPT (override manual)
/// 2. Junto al binario: backend/rpgmaker_api.py o rpgmaker_api.py
/// 3. Recursos Tauri del .deb (/usr/lib/<nombre>/backend/...)
/// 4. Rutas de desarrollo (repo)
fn find_api_script() -> Option<PathBuf> {
    let mut cands: Vec<PathBuf> = Vec::new();

    if let Ok(custom) = std::env::var("RPGMAKER_API_SCRIPT") {
        cands.push(PathBuf::from(custom));
    }

    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            cands.push(dir.join("backend").join("rpgmaker_api.py"));
            cands.push(dir.join("rpgmaker_api.py"));
            // .deb: binario en /usr/bin, recursos en /usr/lib/<producto>
            if let Some(prefix) = dir.parent() {
                for name in ["RPG Maker Launcher", "rpg-maker-launcher", "com.rpgmaker.launcher"] {
                    cands.push(
                        prefix
                            .join("lib")
                            .join(name)
                            .join("backend")
                            .join("rpgmaker_api.py"),
                    );
                }
            }
        }
    }

    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    cands.push(manifest.join("..").join("rpgmaker_api.py"));
    cands.push(manifest.join("backend").join("rpgmaker_api.py"));

    if let Ok(cwd) = std::env::current_dir() {
        cands.push(cwd.join("rpgmaker_api.py"));
        cands.push(cwd.join("../rpgmaker_api.py"));
        cands.push(cwd.join("../../../rpgmaker_api.py"));
    }

    println!("Buscando backend en:");
    for c in &cands {
        println!("  - {}", c.display());
    }
    cands.into_iter().find(|p| p.exists())
}

/// Datos de usuario fuera del repo: ~/.local/share/rpgmaker-launcher
/// (respeta RPGMAKER_DATA_DIR si ya está definido; run-tauri.sh lo fija
/// al repo para desarrollo).
fn ensure_data_dir() {
    if std::env::var_os("RPGMAKER_DATA_DIR").is_some() {
        return;
    }
    if let Some(home) = std::env::var_os("HOME") {
        let dir = Path::new(&home).join(".local/share/rpgmaker-launcher");
        let _ = std::fs::create_dir_all(dir.join("games"));
        std::env::set_var("RPGMAKER_DATA_DIR", &dir);
        println!("Directorio de datos: {}", dir.display());
    }
}

fn start_python_server(api_path: &Path) -> Result<(Child, u16), String> {
    println!("Iniciando backend Python en {:?}", api_path);

    let mut child = Command::new("python3")
        .arg("-u")
        .arg(api_path)
        .arg("--port")
        .arg("0")
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("No se pudo iniciar el servidor Python: {}", e))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "No se pudo capturar stdout".to_string())?;

    let mut reader = BufReader::new(stdout);
    let mut line = String::new();
    reader
        .read_line(&mut line)
        .map_err(|e| format!("No se pudo leer el puerto: {}", e))?;

    let port: u16 = line
        .trim()
        .strip_prefix("RPG_MAKER_API_PORT=")
        .and_then(|p| p.parse().ok())
        .unwrap_or(0);

    if port == 0 {
        return Err("El backend no reportó un puerto válido".to_string());
    }

    println!("Backend Python escuchando en el puerto {}", port);
    Ok((child, port))
}

fn main() {
    ensure_data_dir();
    let api_script = find_api_script();
    let started = match api_script.as_deref() {
        Some(path) => start_python_server(path),
        None => Err("No se encontró rpgmaker_api.py".to_string()),
    };

    let (child, port) = match started {
        Ok(res) => (Some(res.0), res.1),
        Err(e) => {
            eprintln!("Aviso: no se pudo iniciar el servidor Python: {}", e);
            (None, 0)
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            child: Mutex::new(child),
        })
        .setup(move |app| {
            let mut builder = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App("index.html".into()),
            )
            .title("RPG Maker Launcher")
            .inner_size(1020.0, 660.0)
            .min_inner_size(760.0, 520.0)
            .resizable(true)
            .center();

            // Se ejecuta antes que cualquier script de la página: sin carreras.
            if port > 0 {
                builder = builder.initialization_script(&format!(
                    "window.__API_BASE__ = 'http://127.0.0.1:{}';",
                    port
                ));
            }

            builder.build()?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error al iniciar la aplicación Tauri")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<AppState>() {
                    if let Ok(mut lock) = state.child.lock() {
                        if let Some(mut child) = lock.take() {
                            let _ = child.kill();
                            let _ = child.wait();
                        }
                    }
                }
            }
        });
}
