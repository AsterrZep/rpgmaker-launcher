// ============================================================
//  RPG Maker Launcher - Sync Service
// ============================================================
// Servicio de sincronización de partidas guardadas.
// Soporta sincronización con carpetas locales (Dropbox,
// Syncthing, Nextcloud, USB, etc.)
// ============================================================

use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::core::error::{AppError, AppResult};

/// Servicio de sincronización
pub struct SyncService {
    dest_folder: PathBuf,
    auto_sync: bool,
}

impl SyncService {
    /// Crea un nuevo servicio de sincronización
    pub fn new(dest_folder: PathBuf, auto_sync: bool) -> Self {
        Self {
            dest_folder,
            auto_sync,
        }
    }

    /// Sincroniza saves de un juego (push o pull)
    pub fn sync_game(
        &self,
        game_name: &str,
        local_saves_dir: &Path,
        mode: &str,
    ) -> AppResult<SyncResult> {
        let dest_saves_dir = self.dest_folder.join(game_name).join("save");

        match mode {
            "push" => {
                let count = self.push_saves(local_saves_dir, &dest_saves_dir)?;
                Ok(SyncResult {
                    game: game_name.to_string(),
                    count,
                    direction: "push".to_string(),
                })
            }
            "pull" => {
                let count = self.pull_saves(local_saves_dir, &dest_saves_dir)?;
                Ok(SyncResult {
                    game: game_name.to_string(),
                    count,
                    direction: "pull".to_string(),
                })
            }
            _ => Err(AppError::SyncError(format!("Modo inválido: {}", mode))),
        }
    }

    /// Sincroniza todos los juegos
    pub fn sync_all(
        &self,
        games: &[(String, PathBuf)],
        mode: &str,
    ) -> AppResult<Vec<SyncResult>> {
        let mut results = Vec::new();

        for (game_name, saves_dir) in games {
            if !saves_dir.exists() {
                continue;
            }

            match self.sync_game(game_name, saves_dir, mode) {
                Ok(result) => results.push(result),
                Err(e) => {
                    log::error!("Error sincronizando {}: {}", game_name, e);
                }
            }
        }

        Ok(results)
    }

    /// Copia saves al destino (push)
    fn push_saves(&self, src: &Path, dst: &Path) -> AppResult<usize> {
        if !src.exists() {
            return Ok(0);
        }

        std::fs::create_dir_all(dst)?;
        let mut count = 0;

        for entry in std::fs::read_dir(src)? {
            let entry = entry?;
            let src_path = entry.path();

            if src_path.is_file() {
                let dst_path = dst.join(src_path.file_name().unwrap_or_default());
                if std::fs::copy(&src_path, &dst_path).is_ok() {
                    count += 1;
                }
            }
        }

        Ok(count)
    }

    /// Copia saves del destino al local (pull)
    fn pull_saves(&self, src: &Path, dst: &Path) -> AppResult<usize> {
        if !src.exists() {
            return Ok(0);
        }

        // Crear backup previo si hay saves locales
        if dst.exists() && self.count_saves(dst)? > 0 {
            self.create_pre_pull_backup(dst)?;
        }

        // Copiar desde destino a local
        self.push_saves(src, dst)
    }

    /// Cuenta el número de saves en un directorio
    fn count_saves(&self, dir: &Path) -> AppResult<usize> {
        if !dir.exists() {
            return Ok(0);
        }

        let mut count = 0;
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            if entry.path().is_file() {
                count += 1;
            }
        }

        Ok(count)
    }

    /// Crea backup antes de pull
    fn create_pre_pull_backup(&self, saves_dir: &Path) -> AppResult<PathBuf> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let parent = saves_dir.parent().unwrap_or(saves_dir);
        let dir_name = saves_dir
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("save");

        let backup_dir = parent.join(format!("{}-pre-pull-{}", dir_name, timestamp));
        std::fs::create_dir_all(&backup_dir)?;

        for entry in std::fs::read_dir(saves_dir)? {
            let entry = entry?;
            let src_path = entry.path();
            if src_path.is_file() {
                let dst_path = backup_dir.join(src_path.file_name().unwrap_or_default());
                let _ = std::fs::copy(&src_path, &dst_path);
            }
        }

        log::info!("Backup pre-pull creado: {:?}", backup_dir);
        Ok(backup_dir)
    }

    /// Verifica si la sincronización está configurada
    pub fn is_configured(&self) -> bool {
        !self.dest_folder.as_os_str().is_empty() && self.dest_folder.exists()
    }
}

/// Resultado de sincronización
#[derive(Debug, Clone, serde::Serialize)]
pub struct SyncResult {
    pub game: String,
    pub count: usize,
    pub direction: String,
}
