// ============================================================
//  RPG Maker Launcher - Main Entry Point
// ============================================================
// Punto de entrada principal de la aplicación Tauri.
// Integra el backend Rust con el frontend TypeScript
// mediante comandos IPC.
// ============================================================

#![allow(dead_code)]

mod core;
mod engine;
mod commands;
mod services;

use std::fs::OpenOptions;
use std::io::Write;
use std::sync::Arc;
use std::path::PathBuf;

use crate::core::state::AppState;
use crate::services::events::EventsService;
use tauri::Manager;

/// Escribe una línea al archivo de diagnóstico
fn diag(msg: &str) {
    let log_path = log_file_path();
    if let Ok(mut f) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
    {
        let _ = writeln!(f, "[{}] {}", chrono::Local::now().format("%H:%M:%S%.3f"), msg);
    }
}

fn log_file_path() -> PathBuf {
    dirs()
        .map(|d| d.join("rpgmaker-launcher.log"))
        .unwrap_or_else(|| PathBuf::from("/tmp/rpgmaker-launcher.log"))
}

fn dirs() -> Option<PathBuf> {
    // Intentar XDG_STATE_HOME primero, luego fallback a /tmp
    if let Ok(state) = std::env::var("XDG_STATE_HOME") {
        let p = PathBuf::from(state).join("rpgmaker-launcher");
        let _ = std::fs::create_dir_all(&p);
        return Some(p);
    }
    if let Ok(home) = std::env::var("HOME") {
        let p = PathBuf::from(home).join(".local/state/rpgmaker-launcher");
        let _ = std::fs::create_dir_all(&p);
        return Some(p);
    }
    None
}

fn main() {
    // =====================================================
    // DIAGNÓSTICO: Información del sistema
    // =====================================================
    let _ = std::fs::remove_file(log_file_path()); // Limpiar log anterior
    diag("═══════════════════════════════════════════════");
    diag("RPG Maker Launcher - Diagnóstico de inicio");
    diag("═══════════════════════════════════════════════");

    // Info del sistema
    diag(&format!("Versión: {}", env!("CARGO_PKG_VERSION")));
    diag(&format!("Binary path: {:?}", std::env::current_exe().ok()));
    diag(&format!("CWD: {:?}", std::env::current_dir().ok()));
    diag(&format!("OS: {}", std::env::consts::OS));
    diag(&format!("Arch: {}", std::env::consts::ARCH));
    diag(&format!("RUST_LOG env: {:?}", std::env::var("RUST_LOG").ok()));

    // Verificar si WEBKIT_DISABLE_COMPOSITING_MODE está set (importante para Chrome OS)
    diag(&format!("WEBKIT_DISABLE_COMPOSITING_MODE: {:?}", std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").ok()));
    diag(&format!("WAYLAND_DISPLAY: {:?}", std::env::var("WAYLAND_DISPLAY").ok()));
    diag(&format!("DISPLAY: {:?}", std::env::var("DISPLAY").ok()));
    diag(&format!("XDG_SESSION_TYPE: {:?}", std::env::var("XDG_SESSION_TYPE").ok()));

    // Verificar librerías del sistema
    if let Ok(output) = std::process::Command::new("ldd")
        .arg(std::env::current_exe().unwrap_or_default())
        .output()
    {
        let libs = String::from_utf8_lossy(&output.stdout);
        let missing: Vec<&str> = libs.lines()
            .filter(|l| l.contains("not found"))
            .collect();
        if !missing.is_empty() {
            diag(&format!("⚠️  LIBRERÍAS FALTANTES: {:?}", missing));
        } else {
            diag("✅ Todas las librerías del sistema OK");
        }
    }

    // Verificar que el directorio de datos se pueda crear
    let data_dir = dirs().unwrap_or_else(|| PathBuf::from("/tmp"));
    diag(&format!("Data dir: {:?}", data_dir));

    // =====================================================
    // Logger normal (env_logger para stderr)
    // =====================================================
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("info")
    ).init();

    log::info!("RPG Maker Launcher v{} iniciando...", env!("CARGO_PKG_VERSION"));

    // Crear estado de la aplicación
    diag("Creando AppState...");
    let app_state = AppState::new();
    diag("✅ AppState creado");

    // Crear servicio de eventos
    let events_service = Arc::new(EventsService::new());
    diag("✅ EventsService creado");

    diag("Construyendo Tauri Builder...");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .manage(events_service)
        .invoke_handler(tauri::generate_handler![
            // Comandos de descifrado
            commands::decrypt_game_assets,
            commands::read_encryption_key,
            commands::has_encrypted_assets,
            // Comandos de saves
            commands::get_saves,
            commands::get_save_content,
            commands::update_save_content,
            commands::backup_save,
            // Comandos de juegos
            commands::get_games,
            commands::launch_game,
            commands::stop_game,
            commands::toggle_favorite,
            commands::extract_zips,
            commands::detect_game_engine,
            // Comandos de configuración
            commands::get_config,
            commands::update_config,
            commands::reset_config,
            commands::get_games_dir,
            commands::get_data_dir,
            // Comandos de sincronización
            commands::get_sync_status,
            commands::execute_sync,
            commands::backup_saves,
            // Comandos de eventos
            commands::emit_event,
            commands::get_event_history,
            commands::clear_event_history,
            // Comandos de plugins
            commands::get_plugins,
            commands::toggle_plugins,
            commands::restore_plugins,
            // Comandos de herramientas
            commands::get_data,
            commands::setup_mods,
            commands::open_target,
            commands::get_status,
            commands::check_update,
            // Comandos de portadas
            commands::get_cover_image,
            // Comandos de reescaneo
            commands::rescan_games,
            commands::install_zips,
        ])
        .setup(move |app| {
            diag("Tauri setup iniciado");

            // Verificar ventanas existentes
            diag(&format!("Ventanas existentes: {}", app.webview_windows().len()));

            // Crear ventana principal
            diag("Creando ventana principal con WebviewUrl::App(\"index.html\")...");
            let window = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("RPG Maker Launcher")
            .inner_size(1020.0, 660.0)
            .min_inner_size(760.0, 520.0)
            .resizable(true)
            .center()
            .build();

            match window {
                Ok(w) => {
                    diag(&format!("✅ Ventana creada: label={}", w.label()));
                    // Log del user-agent del webview
                    diag(&format!("  Inner size: {:?}", w.inner_size()));
                }
                Err(e) => {
                    diag(&format!("❌ Error creando ventana: {}", e));
                }
            }

            diag("Tauri setup completado");
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error al iniciar la aplicación Tauri")
        .run(move |_app_handle, event| {
            match &event {
                tauri::RunEvent::Ready => {
                    diag("🚀 Tauri RunEvent::Ready");
                }
                tauri::RunEvent::WindowEvent { label, event, .. } => {
                    diag(&format!("🪟 WindowEvent [{}]: {:?}", label, event));
                }
                tauri::RunEvent::Exit => {
                    diag("🚪 Aplicación cerrándose (RunEvent::Exit)");
                }
                tauri::RunEvent::ExitRequested { .. } => {
                    diag("🚪 ExitRequested");
                }
                _ => {
                    // Log otros eventos importantes
                    let ev_name = format!("{:?}", event);
                    if ev_name.contains("Error") || ev_name.contains("error") {
                        diag(&format!("⚠️  Evento: {}", ev_name));
                    }
                }
            }
        });
}
