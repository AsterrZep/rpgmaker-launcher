// ============================================================
//  RPG Maker Launcher - Services Module
// ============================================================
// Servicios externos:
// - sync: Sincronización de partidas guardadas
// - update: Verificación de actualizaciones
// - http: Cliente HTTP asíncrono
// - events: Sistema de eventos nativo
// - game_server: Servidor HTTP para juegos web
// ============================================================

pub mod sync;
pub mod update;
pub mod http;
pub mod events;
pub mod game_server;

// Modules exposed via crate paths
