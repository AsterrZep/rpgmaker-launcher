// ============================================================
//  RPG Maker Launcher - Event Commands
// ============================================================
// Comandos IPC para el sistema de eventos.
// ============================================================

use std::sync::Arc;
use tauri::command;

use crate::services::events::{EventsService, EventType, EventData};

/// Emite un evento
///
/// # Arguments
/// * `event_type` - Tipo de evento
/// * `data` - Datos del evento
/// * `events` - Servicio de eventos
///
/// # Returns
/// True si se emitió correctamente
#[command]
pub async fn emit_event(
    event_type: String,
    data: serde_json::Value,
    events: tauri::State<'_, Arc<EventsService>>,
) -> Result<bool, String> {
    let event_type = match event_type.as_str() {
        "extraction_progress" => EventType::ExtractionProgress,
        "server_started" => EventType::ServerStarted,
        "server_stopped" => EventType::ServerStopped,
        "sync_complete" => EventType::SyncComplete,
        "game_launched" => EventType::GameLaunched,
        _ => return Err(format!("Tipo de evento no válido: {}", event_type)),
    };

    match events.emit(event_type, data).await {
        Ok(()) => Ok(true),
        Err(e) => Err(format!("Error al emitir evento: {}", e)),
    }
}

/// Obtiene el historial de eventos
///
/// # Arguments
/// * `limit` - Número máximo de eventos a retornar
/// * `events` - Servicio de eventos
///
/// # Returns
/// Lista de eventos
#[command]
pub async fn get_event_history(
    limit: Option<usize>,
    events: tauri::State<'_, Arc<EventsService>>,
) -> Result<Vec<EventData>, String> {
    let limit = limit.unwrap_or(50);
    Ok(events.get_history(limit).await)
}

/// Limpia el historial de eventos
///
/// # Arguments
/// * `events` - Servicio de eventos
///
/// # Returns
/// True si se limpió correctamente
#[command]
pub async fn clear_event_history(
    events: tauri::State<'_, Arc<EventsService>>,
) -> Result<bool, String> {
    events.clear_history().await;
    Ok(true)
}

/// Registra un listener para un tipo de evento
///
/// # Arguments
/// * `event_type` - Tipo de evento
/// * `callback_id` - ID del callback
/// * `events` - Servicio de eventos
///
/// # Returns
/// True si se registró correctamente
#[command]
pub async fn on_event(
    event_type: String,
    callback_id: String,
    events: tauri::State<'_, Arc<EventsService>>,
) -> Result<bool, String> {
    let event_type = match event_type.as_str() {
        "extraction_progress" => EventType::ExtractionProgress,
        "server_started" => EventType::ServerStarted,
        "server_stopped" => EventType::ServerStopped,
        "sync_complete" => EventType::SyncComplete,
        "game_launched" => EventType::GameLaunched,
        _ => return Err(format!("Tipo de evento no válido: {}", event_type)),
    };

    events.on(event_type, callback_id).await;
    Ok(true)
}

/// Elimina un listener para un tipo de evento
///
/// # Arguments
/// * `event_type` - Tipo de evento
/// * `callback_id` - ID del callback
/// * `events` - Servicio de eventos
///
/// # Returns
/// True si se eliminó correctamente
#[command]
pub async fn off_event(
    event_type: String,
    callback_id: String,
    events: tauri::State<'_, Arc<EventsService>>,
) -> Result<bool, String> {
    let event_type = match event_type.as_str() {
        "extraction_progress" => EventType::ExtractionProgress,
        "server_started" => EventType::ServerStarted,
        "server_stopped" => EventType::ServerStopped,
        "sync_complete" => EventType::SyncComplete,
        "game_launched" => EventType::GameLaunched,
        _ => return Err(format!("Tipo de evento no válido: {}", event_type)),
    };

    events.off(event_type, &callback_id).await;
    Ok(true)
}
