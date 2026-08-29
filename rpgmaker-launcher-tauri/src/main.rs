// ============================================================
//  RPG Maker Launcher - Main Entry Point
// ============================================================
// Punto de entrada principal de la aplicación Tauri.
// Integra el backend Rust con el frontend TypeScript
// mediante comandos IPC.
// ============================================================

mod core;
mod engine;
mod commands;
mod services;

use std::sync::Arc;
use tauri::Manager;

use crate::core::state::AppState;
use crate::services::events::EventsService;

fn main() {
    // Inicializar logger
    env_logger::init();

    log::info!("RPG Maker Launcher v0.9.2 iniciando...");

    // Crear estado de la aplicación
    let app_state = AppState::new();
    
    // Crear servicio de eventos
    let events_service = Arc::new(EventsService::new());

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
        ])
        .setup(|app| {
            // Crear ventana principal
            let _window = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("RPG Maker Launcher")
            .inner_size(1020.0, 660.0)
            .min_inner_size(760.0, 520.0)
            .resizable(true)
            .center()
            .build()?;

            log::info!("Ventana principal creada");
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error al iniciar la aplicación Tauri")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                log::info!("Aplicación cerrándose");
                // Cleanup si es necesario
            }
        });
}
