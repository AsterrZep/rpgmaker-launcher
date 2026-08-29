// ============================================================
//  RPG Maker Launcher - HTTP Client Service
// ============================================================
// Cliente HTTP asíncrono para operaciones de red.
// Utiliza reqwest para requests HTTP/HTTPS.
// ============================================================

use reqwest::Client;
use std::time::Duration;

use crate::core::error::{AppError, AppResult};

/// Cliente HTTP asíncrono
pub struct HttpClient {
    client: Client,
}

impl HttpClient {
    /// Crea un nuevo cliente HTTP
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .user_agent("rpgmaker-launcher/0.9.2")
            .build()
            .expect("Error al crear cliente HTTP");

        Self { client }
    }

    /// Realiza un GET request
    pub async fn get(&self, url: &str) -> AppResult<String> {
        let response = self.client.get(url).send().await?;
        
        if !response.status().is_success() {
            return Err(AppError::Network(response.error_for_status().unwrap_err()));
        }

        let text = response.text().await?;
        Ok(text)
    }

    /// Realiza un GET request y retorna JSON
    pub async fn get_json<T: serde::de::DeserializeOwned>(&self, url: &str) -> AppResult<T> {
        let response = self.client.get(url).send().await?;
        
        if !response.status().is_success() {
            return Err(AppError::Network(response.error_for_status().unwrap_err()));
        }

        let json = response.json().await?;
        Ok(json)
    }

    /// Realiza un POST request con JSON
    pub async fn post_json<T: serde::de::DeserializeOwned, B: serde::Serialize>(
        &self,
        url: &str,
        body: &B,
    ) -> AppResult<T> {
        let response = self.client
            .post(url)
            .json(body)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(AppError::Network(response.error_for_status().unwrap_err()));
        }

        let json = response.json().await?;
        Ok(json)
    }

    /// Descarga un archivo
    pub async fn download(&self, url: &str, dest: &std::path::Path) -> AppResult<()> {
        let response = self.client.get(url).send().await?;

        if !response.status().is_success() {
            return Err(AppError::Network(response.error_for_status().unwrap_err()));
        }

        let mut file = std::fs::File::create(dest)?;
        let mut content = response;
        
        // Streaming de la respuesta
        while let Some(chunk) = content.chunk().await? {
            std::io::Write::write_all(&mut file, &chunk)?;
        }

        Ok(())
    }
}

impl Default for HttpClient {
    fn default() -> Self {
        Self::new()
    }
}
