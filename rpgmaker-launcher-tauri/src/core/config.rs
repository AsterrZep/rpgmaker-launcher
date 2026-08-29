// ============================================================
//  RPG Maker Launcher - Configuration Management
// ============================================================
// Gestión atómica de configuración en formato JSON en las
// rutas del sistema operativo. Soporta guardado/lectura
// segura con backups automáticos.
// ============================================================

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::error::{AppError, AppResult};

/// Configuración por defecto de la aplicación
fn default_config() -> AppConfig {
    AppConfig {
        teclas: TeclasConfig {
            trucos: "F8".to_string(),
            recargar: "F5".to_string(),
            fps: "F9".to_string(),
            captura: "F12".to_string(),
            pantalla_completa: "F11".to_string(),
            salir_pantalla_completa: "Escape".to_string(),
            zoom_in: "Control+equal".to_string(),
            zoom_out: "Control+minus".to_string(),
            zoom_0: "Control+0".to_string(),
        },
        general: GeneralConfig {
            webkit: false,
            auto_delete_zip: false,
            lang: None,
            games_dir: None,
        },
        sync: None,
    }
}

/// Configuración de teclas
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeclasConfig {
    pub trucos: String,
    pub recargar: String,
    pub fps: String,
    pub captura: String,
    pub pantalla_completa: String,
    pub salir_pantalla_completa: String,
    pub zoom_in: String,
    pub zoom_out: String,
    pub zoom_0: String,
}

/// Configuración general
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralConfig {
    pub webkit: bool,
    pub auto_delete_zip: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lang: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub games_dir: Option<String>,
}

/// Configuración de sincronización
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
    #[serde(default)]
    pub auto: bool,
}

/// Configuración principal de la aplicación
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub teclas: TeclasConfig,
    pub general: GeneralConfig,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync: Option<SyncConfig>,
}

/// Gestor de configuración atómica
pub struct ConfigManager {
    config_path: PathBuf,
    config: Arc<RwLock<AppConfig>>,
}

impl ConfigManager {
    /// Crea un nuevo gestor de configuración
    pub fn new(data_dir: &PathBuf) -> Self {
        let config_path = data_dir.join("launcher-config.json");
        let config = Self::load_from_file(&config_path).unwrap_or_else(|_| default_config());

        Self {
            config_path,
            config: Arc::new(RwLock::new(config)),
        }
    }

    /// Carga configuración desde archivo
    fn load_from_file(path: &PathBuf) -> AppResult<AppConfig> {
        let content = fs::read_to_string(path)?;
        let config: AppConfig = serde_json::from_str(&content)?;
        Ok(config)
    }

    /// Guarda configuración a archivo de forma atómica
    pub async fn save(&self) -> AppResult<()> {
        let config = self.config.read().await;
        let content = serde_json::to_string_pretty(&config)?;

        // Guardar en archivo temporal y renombrar (atómico)
        let tmp_path = self.config_path.with_extension("json.tmp");
        fs::write(&tmp_path, content)?;
        fs::rename(&tmp_path, &self.config_path)?;

        Ok(())
    }

    /// Obtiene una copia de la configuración actual
    pub async fn get(&self) -> AppConfig {
        self.config.read().await.clone()
    }

    /// Actualiza la configuración
    pub async fn update(&self, new_config: AppConfig) -> AppResult<()> {
        let mut config = self.config.write().await;
        *config = new_config;
        drop(config);
        self.save().await
    }

    /// Obtiene la carpeta de juegos configurada
    pub async fn get_games_dir(&self) -> PathBuf {
        let config = self.config.read().await;
        if let Some(ref dir) = config.general.games_dir {
            if !dir.is_empty() {
                return PathBuf::from(dir);
            }
        }
        // Por defecto: DATA_DIR/games
        Self::data_dir().join("games")
    }

    /// Obtiene la configuración de sincronización
    pub async fn get_sync_settings(&self) -> (String, bool) {
        let config = self.config.read().await;
        
        // Formato nuevo: sync.folder/sync.auto
        if let Some(ref sync) = config.sync {
            return (
                sync.folder.clone().unwrap_or_default(),
                sync.auto,
            );
        }

        // Fallback: general.sync_dir/sync_auto (legacy)
        (
            String::new(),
            false,
        )
    }

    /// Obtiene el directorio de datos de la aplicación
    pub fn data_dir() -> PathBuf {
        if let Ok(dir) = std::env::var("RPGMAKER_DATA_DIR") {
            return PathBuf::from(dir);
        }

        if let Some(home) = std::env::var_os("HOME") {
            let dir = PathBuf::from(home).join(".local/share/rpgmaker-launcher");
            let _ = fs::create_dir_all(dir.join("games"));
            return dir;
        }

        // Fallback: directorio actual
        PathBuf::from(".")
    }

    /// Obtiene el directorio de backups
    pub fn backups_dir() -> PathBuf {
        Self::data_dir().join("backups")
    }

    /// Obtiene el directorio de logs
    pub fn logs_dir() -> PathBuf {
        Self::data_dir().join("logs")
    }
}

impl Clone for ConfigManager {
    fn clone(&self) -> Self {
        Self {
            config_path: self.config_path.clone(),
            config: Arc::clone(&self.config),
        }
    }
}
