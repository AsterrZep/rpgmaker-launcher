// ============================================================
//  RPG Maker Launcher - Process Manager
// ============================================================
// Gestión de procesos de juegos: lanzamiento, monitoreo,
// y limpieza de procesos huérfanos.
// ============================================================

use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Mutex;

use crate::core::error::{AppError, AppResult};
use crate::core::models::session::ProcessStatus;

/// Gestor de procesos de juegos
pub struct ProcessManager {
    active_process: Arc<Mutex<Option<Child>>>,
    start_time: Arc<Mutex<Option<Instant>>>,
    game_name: Arc<Mutex<Option<String>>>,
}

impl ProcessManager {
    /// Crea un nuevo gestor de procesos
    pub fn new() -> Self {
        Self {
            active_process: Arc::new(Mutex::new(None)),
            start_time: Arc::new(Mutex::new(None)),
            game_name: Arc::new(Mutex::new(None)),
        }
    }

    /// Lanza un juego web (MV/MZ) con servidor HTTP
    pub async fn launch_web_game(
        &self,
        game_name: &str,
        _game_dir: &PathBuf,
        port: u16,
    ) -> AppResult<()> {
        // Detener proceso activo anterior
        self.stop_active_process().await?;

        // NOTA: El servidor HTTP ahora se ejecuta via Axum en game_server.rs
        // Esta función se mantiene por compatibilidad pero el servidor real
        // se inicia desde game_cmd.rs usando GameServer::start()
        log::warn!(
            "launch_web_game() está obsoleto. Usa GameServer en game_server.rs"
        );

        // Guardar información del proceso activo
        let mut start = self.start_time.lock().await;
        *start = Some(Instant::now());

        let mut name = self.game_name.lock().await;
        *name = Some(game_name.to_string());

        log::info!("Juego web lanzado: {} en puerto {} (usando Axum nativo)", game_name, port);
        Ok(())
    }

    /// Lanza un juego nativo (XP/VX/VX Ace/2000-2003)
    pub async fn launch_native_game(
        &self,
        game_name: &str,
        game_dir: &PathBuf,
        engine: &str,
    ) -> AppResult<()> {
        // Detener proceso activo anterior
        self.stop_active_process().await?;

        let mut cmd = match engine {
            "2000-2003" => {
                let mut c = Command::new("easyrpg-player");
                c.arg(game_dir);
                c
            }
            "renpy" => {
                // Buscar script de lanzamiento de Ren'Py
                let sh = self.find_renpy_launcher(game_dir)?;
                Command::new(sh)
            }
            "VXAce" | "VX" | "XP" => {
                // Buscar mkxp-z
                let mkxpz = self.find_mkxpz()?;
                let mut c = Command::new(mkxpz);
                c.current_dir(game_dir);
                c.env("SRCDIR", game_dir);
                c
            }
            _ => return Err(AppError::UnsupportedEngine(engine.to_string())),
        };

        let child = cmd
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| AppError::ProcessError(format!("No se pudo lanzar juego: {}", e)))?;

        // Guardar información del proceso activo
        let mut active = self.active_process.lock().await;
        *active = Some(child);

        let mut start = self.start_time.lock().await;
        *start = Some(Instant::now());

        let mut name = self.game_name.lock().await;
        *name = Some(game_name.to_string());

        log::info!("Juego nativo lanzado: {} [{}]", game_name, engine);
        Ok(())
    }

    /// Detiene el proceso activo
    pub async fn stop_active_process(&self) -> AppResult<(Option<String>, Option<u64>)> {
        let mut active = self.active_process.lock().await;
        let mut start = self.start_time.lock().await;
        let mut name = self.game_name.lock().await;

        if let Some(mut child) = active.take() {
            let elapsed = start.take().map(|s| s.elapsed().as_secs());
            let game_name = name.take();

            // Intentar terminate gracefully
            let _ = child.kill();

            // Esperar a que termine
            let _ = child.wait();

            log::info!(
                "Proceso detenido: {:?} ({} segundos)",
                game_name,
                elapsed.unwrap_or(0)
            );

            return Ok((game_name, elapsed));
        }

        Ok((None, None))
    }

    /// Obtiene el estado del proceso activo
    pub async fn get_status(&self) -> ProcessStatus {
        let mut active = self.active_process.lock().await;
        let start = self.start_time.lock().await;
        let name = self.game_name.lock().await;

        if let Some(ref mut child) = *active {
            let running = child.try_wait().ok().flatten().is_none();
            let elapsed = start.map(|s| s.elapsed().as_secs());

            ProcessStatus {
                game_name: name.clone(),
                running,
                elapsed_seconds: elapsed,
            }
        } else {
            ProcessStatus {
                game_name: None,
                running: false,
                elapsed_seconds: None,
            }
        }
    }

    /// Busca el script de lanzamiento de Ren'Py
    fn find_renpy_launcher(&self, game_dir: &PathBuf) -> AppResult<PathBuf> {
        // Buscar .sh junto al .py principal
        for entry in std::fs::read_dir(game_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.ends_with(".sh") {
                        return Ok(path);
                    }
                }
            }
        }

        Err(AppError::LauncherError(
            "No se encontró script de lanzamiento de Ren'Py".into(),
        ))
    }

    /// Busca el runtime mkxp-z
    fn find_mkxpz(&self) -> AppResult<PathBuf> {
        let candidates = vec![
            std::env::current_exe()?
                .parent()
                .and_then(|p| p.parent())
                .map(|p| p.join("runtimes").join("mkxp-z"))
                .unwrap_or_default(),
            PathBuf::from("runtimes/mkxp-z"),
            PathBuf::from("/usr/bin/mkxp-z"),
        ];

        for candidate in candidates {
            if candidate.exists() && candidate.is_file() {
                return Ok(candidate);
            }
        }

        Err(AppError::LauncherError(
            "Runtime mkxp-z no encontrado".into(),
        ))
    }

    /// Calcula el tiempo de juego total para un juego
    pub async fn calculate_play_time(&self, game_name: &str, state_file: &PathBuf) -> u64 {
        let mut total = 0u64;

        // Cargar tiempo previo del estado
        if let Ok(content) = std::fs::read_to_string(state_file) {
            if let Ok(state) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(games) = state.get("games") {
                    if let Some(game) = games.get(game_name) {
                        total = game
                            .get("seconds")
                            .and_then(|s| s.as_u64())
                            .unwrap_or(0);
                    }
                }
            }
        }

        // Agregar tiempo de la sesión actual
        let start = self.start_time.lock().await;
        if let Some(start_time) = *start {
            total += start_time.elapsed().as_secs();
        }

        total
    }
}

impl Default for ProcessManager {
    fn default() -> Self {
        Self::new()
    }
}
