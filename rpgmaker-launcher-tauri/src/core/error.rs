// ============================================================
//  RPG Maker Launcher - Error Handling
// ============================================================
// Enumeración unificada de errores para toda la aplicación.
// Implementa conversiones automáticas desde errores comunes.
// ============================================================

use thiserror::Error;

/// Errores principales de la aplicación
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Error de I/O: {0}")]
    Io(#[from] std::io::Error),

    #[error("Error de JSON: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Error de red: {0}")]
    Network(#[from] reqwest::Error),

    #[error("Error de compresión: {0}")]
    Compression(String),

    #[error("Error de encriptación: {0}")]
    Encryption(String),

    #[error("Error de desencriptación: {0}")]
    Decryption(String),

    #[error("Error de desencriptación: {0}")]
    DecryptionError(String),

    #[error("Clave de encriptación inválida: {0}")]
    InvalidEncryptionKey(String),

    #[error("Archivo de save inválido: {0}")]
    SaveParseError(String),

    #[error("Juego no encontrado: {0}")]
    GameNotFound(String),

    #[error("Motor del juego no soportado: {0}")]
    UnsupportedEngine(String),

    #[error("Plugin no encontrado: {0}")]
    PluginNotFound(String),

    #[error("Error de configuración: {0}")]
    ConfigError(String),

    #[error("Error de permisos: {0}")]
    PermissionError(String),

    #[error("Error de proceso: {0}")]
    ProcessError(String),

    #[error("Error de sincronización: {0}")]
    SyncError(String),

    #[error("Error de descifrado de assets: {0}")]
    AssetDecryptionError(String),

    #[error("Error de parseo de Ruby Marshal: {0}")]
    RubyMarshalError(String),

    #[error("Error de launcher: {0}")]
    LauncherError(String),

    #[error("Error de Tauri: {0}")]
    TauriError(String),

    #[error("Error desconocido: {0}")]
    Unknown(String),
}

// Implementar conversiones desde errores específicos
impl From<std::env::VarError> for AppError {
    fn from(err: std::env::VarError) -> Self {
        AppError::ConfigError(err.to_string())
    }
}

impl From<hex::FromHexError> for AppError {
    fn from(err: hex::FromHexError) -> Self {
        AppError::InvalidEncryptionKey(err.to_string())
    }
}

impl From<aes::cipher::InvalidLength> for AppError {
    fn from(err: aes::cipher::InvalidLength) -> Self {
        AppError::Encryption(err.to_string())
    }
}

impl From<flate2::DecompressError> for AppError {
    fn from(err: flate2::DecompressError) -> Self {
        AppError::Compression(err.to_string())
    }
}

impl From<flate2::CompressError> for AppError {
    fn from(err: flate2::CompressError) -> Self {
        AppError::Compression(err.to_string())
    }
}

impl From<base64::DecodeError> for AppError {
    fn from(err: base64::DecodeError) -> Self {
        AppError::SaveParseError(format!("Error de decodificación Base64: {}", err))
    }
}

impl From<std::string::FromUtf8Error> for AppError {
    fn from(err: std::string::FromUtf8Error) -> Self {
        AppError::SaveParseError(format!("Error de UTF-8: {}", err))
    }
}

// Implementar Serialize para enviar errores al frontend
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Tipo Result unificado para la aplicación
pub type AppResult<T> = Result<T, AppError>;
