// ============================================================
//  RPG Maker Launcher - Engine Module
// ============================================================
// Módulos de motor para procesamiento intensivo:
// - decrypter: Descifrado paralelo de assets RPG Maker
// - save_editor: Edición de partidas guardadas
// - injector: Inyección de código en juegos NW.js
// - process: Gestión de procesos de juegos
// - detector: Detección de motores de juegos
// - plugins: Gestión de plugins RPG Maker MZ/MV
// ============================================================

pub mod decrypter;
pub mod save_editor;
pub mod injector;
pub mod process;
pub mod detector;
pub mod plugins;

// Modules exposed via crate paths
