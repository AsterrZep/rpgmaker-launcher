// ============================================================
//  RPG Maker Launcher - Update Service
// ============================================================
// Servicio de verificación de actualizaciones desde GitHub.
// ============================================================

use crate::core::error::{AppError, AppResult};

const REPO_LATEST_API: &str = "https://api.github.com/repos/AsterrZep/rpgmaker-launcher/releases/latest";
const REPO_RELEASES_URL: &str = "https://github.com/AsterrZep/rpgmaker-launcher/releases";

/// Servicio de actualizaciones
pub struct UpdateService {
    current_version: String,
}

impl UpdateService {
    /// Crea un nuevo servicio de actualizaciones
    pub fn new(current_version: &str) -> Self {
        Self {
            current_version: current_version.to_string(),
        }
    }

    /// Verifica si hay una actualización disponible
    pub async fn check_update(&self) -> AppResult<UpdateInfo> {
        let client = reqwest::Client::new();
        
        let response = client
            .get(REPO_LATEST_API)
            .header("Accept", "application/vnd.github+json")
            .header("User-Agent", "rpgmaker-launcher")
            .timeout(std::time::Duration::from_secs(8))
            .send()
            .await?;

        let data: serde_json::Value = response.json().await?;

        let tag = data
            .get("tag_name")
            .and_then(|t| t.as_str())
            .unwrap_or("");

        let update_available = if tag.is_empty() {
            false
        } else {
            self.version_newer(tag)
        };

        Ok(UpdateInfo {
            update_available,
            tag_name: tag.to_string(),
            current_version: self.current_version.clone(),
            url: REPO_RELEASES_URL.to_string(),
        })
    }

    /// Compara versiones semánticas
    fn version_newer(&self, tag: &str) -> bool {
        let parse_version = |s: &str| -> Vec<u32> {
            s.trim_start_matches('v')
                .split('.')
                .filter_map(|p| p.parse().ok())
                .collect()
        };

        let tag_parts = parse_version(tag);
        let current_parts = parse_version(&self.current_version);

        tag_parts > current_parts
    }
}

/// Información de actualización
#[derive(Debug, Clone, serde::Serialize)]
pub struct UpdateInfo {
    pub update_available: bool,
    pub tag_name: String,
    pub current_version: String,
    pub url: String,
}
