// ============================================================
//  RPG Maker Launcher - Services Module
// ============================================================
// Servicios externos:
// - sync: Sincronización de partidas guardadas
// - update: Verificación de actualizaciones
// - http: Cliente HTTP asíncrono
// - events: Sistema de eventos nativo
// ============================================================

pub mod sync;
pub mod update;
pub mod http;
pub mod events;

pub use sync::SyncService;
pub use update::UpdateService;
pub use http::HttpClient;
pub use events::EventsService;
