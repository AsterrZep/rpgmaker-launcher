// ============================================================
//  RPG Maker Launcher - Events Service
// ============================================================
// Servicio de eventos para comunicación entre backend y frontend.
// Reemplaza el SSE (Server-Sent Events) con un sistema de eventos
// nativo de Tauri.
// ============================================================

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};

use crate::core::error::AppResult;

/// Tipo de evento
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum EventType {
    ExtractionProgress,
    ServerStarted,
    ServerStopped,
    SyncComplete,
    GameLaunched,
}

/// Datos de un evento
#[derive(Debug, Clone, Serialize)]
pub struct EventData {
    pub event_type: EventType,
    pub data: serde_json::Value,
}

/// Servicio de eventos
pub struct EventsService {
    listeners: Arc<RwLock<HashMap<EventType, Vec<String>>>>,
    event_history: Arc<RwLock<Vec<EventData>>>,
}

impl EventsService {
    /// Crea un nuevo servicio de eventos
    pub fn new() -> Self {
        Self {
            listeners: Arc::new(RwLock::new(HashMap::new())),
            event_history: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Emite un evento
    pub async fn emit(&self, event_type: EventType, data: serde_json::Value) -> AppResult<()> {
        let event = EventData {
            event_type: event_type.clone(),
            data,
        };

        // Guardar en historial
        let mut history = self.event_history.write().await;
        history.push(event.clone());
        
        // Mantener solo los últimos 100 eventos
        if history.len() > 100 {
            history.remove(0);
        }

        log::debug!("Evento emitido: {:?}", event_type);
        Ok(())
    }

    /// Registra un listener para un tipo de evento
    pub async fn on(&self, event_type: EventType, callback_id: String) {
        let mut listeners = self.listeners.write().await;
        listeners
            .entry(event_type)
            .or_insert_with(Vec::new)
            .push(callback_id);
    }

    /// Elimina un listener
    pub async fn off(&self, event_type: EventType, callback_id: &str) {
        let mut listeners = self.listeners.write().await;
        if let Some(callbacks) = listeners.get_mut(&event_type) {
            callbacks.retain(|id| id != callback_id);
        }
    }

    /// Obtiene el historial de eventos
    pub async fn get_history(&self, limit: usize) -> Vec<EventData> {
        let history = self.event_history.read().await;
        history.iter().rev().take(limit).cloned().collect()
    }

    /// Limpia el historial de eventos
    pub async fn clear_history(&self) {
        let mut history = self.event_history.write().await;
        history.clear();
    }
}

impl Default for EventsService {
    fn default() -> Self {
        Self::new()
    }
}

/// Eventos de extracción
#[derive(Debug, Clone, Serialize)]
pub struct ExtractionProgressData {
    pub current: usize,
    pub total: usize,
    pub filename: String,
    pub game: String,
}

/// Eventos de servidor
#[derive(Debug, Clone, Serialize)]
pub struct ServerStartedData {
    pub game: String,
    pub port: u16,
    pub webkit: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ServerStoppedData {
    pub game: Option<String>,
    pub seconds_added: u64,
    pub total_seconds: u64,
}

/// Eventos de sincronización
#[derive(Debug, Clone, Serialize)]
pub struct SyncCompleteData {
    pub game: String,
    pub direction: String,
}

/// Eventos de juego
#[derive(Debug, Clone, Serialize)]
pub struct GameLaunchedData {
    pub game: String,
    pub engine: String,
}
