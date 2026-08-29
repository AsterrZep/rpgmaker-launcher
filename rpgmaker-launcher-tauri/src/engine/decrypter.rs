// ============================================================
//  RPG Maker Launcher - Parallel Asset Decrypter
// ============================================================
// Motor de descifrado paralelo para assets de RPG Maker MV/MZ.
// Utiliza Rayon para procesamiento multinúcleo y soporta:
// - Imágenes: .rpgmvp, .png_ → .png
// - Audio: .rpgmvm, .m4a_ → .m4a
// - Audio: .rpgmvo, .ogg_ → .ogg
//
// Los archivos cifrados de RPG Maker MV/MZ tienen una cabecera
// de 16 bytes con la firma "RPGMV" seguida de bytes de control.
// Los primeros 16 bytes del cuerpo se descifran con XOR usando
// la clave de encriptación del juego.
// ============================================================

use rayon::prelude::*;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::core::error::{AppError, AppResult};

/// Longitud de la cabecera de archivos cifrados RPG Maker MV/MZ
const HEADER_LEN: usize = 16;

/// Firma de cabecera de RPG Maker MV
/// RPGMV\x00\x00\x00\x00\x03\x01\x00\x00\x00\x00\x00
const HEADER_SIGNATURE: &[u8; HEADER_LEN] = b"RPGMV\x00\x00\x00\x00\x03\x01\x00\x00\x00\x00\x00";

/// Extensiones de archivos cifrados y sus equivalentes descifrados
const ENCRYPTED_EXTENSIONS: &[(&str, &str)] = &[
    ("rpgmvp", "png"),
    ("rpgmvm", "m4a"),
    ("rpgmvo", "ogg"),
    ("png_", "png"),
    ("m4a_", "m4a"),
    ("ogg_", "ogg"),
];

/// Motor de descifrado paralelo
pub struct Decrypter {
    key: Vec<u8>,
}

impl Decrypter {
    /// Crea un nuevo descifrador con la clave especificada
    ///
    /// # Arguments
    /// * `key_hex` - Clave de encriptación en formato hexadecimal
    ///
    /// # Errors
    /// Retorna error si la clave hex no es válida
    pub fn new(key_hex: &str) -> AppResult<Self> {
        let key = hex::decode(key_hex)
            .map_err(|_| AppError::InvalidEncryptionKey("Clave hex inválida".into()))?;

        if key.is_empty() {
            return Err(AppError::InvalidEncryptionKey(
                "La clave no puede estar vacía".into(),
            ));
        }

        Ok(Self { key })
    }

    /// Descifra un búfer en memoria aplicando la máscara XOR
    ///
    /// # Arguments
    /// * `data` - Datos cifrados del archivo
    ///
    /// # Returns
    /// Datos descifrados
    ///
    /// # Errors
    /// Retorna error si el archivo es demasiado pequeño o no tiene cabecera válida
    pub fn decrypt_buffer(&self, mut data: Vec<u8>) -> AppResult<Vec<u8>> {
        // Verificar tamaño mínimo
        if data.len() < HEADER_LEN {
            return Err(AppError::DecryptionError(
                "Archivo demasiado pequeño para ser un asset RPG Maker".into(),
            ));
        }

        // Verificar la firma de cabecera
        if &data[0..HEADER_LEN] != HEADER_SIGNATURE {
            return Err(AppError::DecryptionError(
                "Cabecera RPG Maker no detectada".into(),
            ));
        }

        // Remover la cabecera de 16 bytes
        let mut body = data.split_off(HEADER_LEN);

        // Aplicar máscara XOR con la clave en los primeros 16 bytes del cuerpo
        let key_len = self.key.len();
        for i in 0..HEADER_LEN.min(body.len()) {
            body[i] ^= self.key[i % key_len];
        }

        Ok(body)
    }

    /// Descifra un archivo individual
    ///
    /// # Arguments
    /// * `input_path` - Ruta al archivo cifrado
    /// * `output_path` - Ruta donde guardar el archivo descifrado
    ///
    /// # Errors
    /// Retorna error si no se puede leer/escribir el archivo
    pub fn decrypt_file(&self, input_path: &Path, output_path: &Path) -> AppResult<()> {
        let mut file = File::open(input_path)?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;

        let decrypted = self.decrypt_buffer(buffer)?;

        // Crear directorio padre si no existe
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let mut out_file = File::create(output_path)?;
        out_file.write_all(&decrypted)?;

        Ok(())
    }

    /// Descifra en paralelo un lote completo de archivos usando Rayon
    ///
    /// # Arguments
    /// * `files` - Lista de tuplas (ruta_entrada, ruta_salida)
    ///
    /// # Returns
    /// Lista de resultados (éxito o error) para cada archivo
    pub fn decrypt_batch(&self, files: Vec<(PathBuf, PathBuf)>) -> Vec<AppResult<PathBuf>> {
        let decrypter = Arc::new(self.clone());

        files
            .into_par_iter()
            .map(|(input, output)| {
                decrypter.decrypt_file(&input, &output)?;
                Ok(output)
            })
            .collect()
    }

    /// Descifra todos los assets en un directorio
    ///
    /// # Arguments
    /// * `directory` - Directorio raíz del juego
    ///
    /// # Returns
    /// Tupla (éxito, fallos, archivos descifrados)
    pub fn decrypt_directory(&self, directory: &Path) -> AppResult<(usize, usize, Vec<PathBuf>)> {
        // Escanear archivos cifrados
        let encrypted_files = self.scan_encrypted_files(directory)?;

        if encrypted_files.is_empty() {
            return Ok((0, 0, Vec::new()));
        }

        // Preparar pares de entrada/salida
        let files_to_decrypt: Vec<(PathBuf, PathBuf)> = encrypted_files
            .iter()
            .map(|(input, _ext)| {
                let output = self.get_output_path(input, directory);
                (input.clone(), output)
            })
            .collect();

        // Descifrar en paralelo
        let results = self.decrypt_batch(files_to_decrypt);

        // Contar éxitos y fallos
        let mut success = 0;
        let mut failed = 0;
        let mut decrypted_files = Vec::new();

        for result in results {
            match result {
                Ok(path) => {
                    success += 1;
                    decrypted_files.push(path);
                }
                Err(e) => {
                    failed += 1;
                    log::error!("Error descifrando: {}", e);
                }
            }
        }

        // Eliminar archivos cifrados originales
        for (input, _) in &encrypted_files {
            let output = self.get_output_path(input, directory);
            if output.exists() && input != &output {
                let _ = fs::remove_file(input);
            }
        }

        Ok((success, failed, decrypted_files))
    }

    /// Escanea un directorio buscando archivos cifrados
    ///
    /// # Arguments
    /// * `directory` - Directorio a escanear
    ///
    /// # Returns
    /// Lista de tuplas (ruta_original, extensión_destino)
    fn scan_encrypted_files(&self, directory: &Path) -> AppResult<Vec<(PathBuf, String)>> {
        let mut encrypted = Vec::new();

        for entry in fs::read_dir(directory)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                // Recursión en subdirectorios (limitada)
                if let Ok(sub_files) = self.scan_encrypted_files(&path) {
                    encrypted.extend(sub_files);
                }
            } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                for &(enc_ext, dec_ext) in ENCRYPTED_EXTENSIONS {
                    if ext_lower == enc_ext {
                        encrypted.push((path, dec_ext.to_string()));
                        break;
                    }
                }
            }
        }

        Ok(encrypted)
    }

    /// Obtiene la ruta de salida para un archivo descifrado
    fn get_output_path(&self, input: &Path, _directory: &Path) -> PathBuf {
        let stem = input.file_stem().unwrap_or_default();
        let ext = input
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        // Determinar extensión destino
        let new_ext = ENCRYPTED_EXTENSIONS
            .iter()
            .find(|&&(enc_ext, _)| ext == enc_ext)
            .map(|&(_, dec_ext)| dec_ext)
            .unwrap_or(&ext);

        input.with_file_name(format!("{}.{}", stem.to_string_lossy(), new_ext))
    }

    /// Lee la clave de encriptación desde el archivo de proyecto
    ///
    /// # Arguments
    /// * `game_dir` - Directorio del juego
    ///
    /// # Returns
    /// Clave hexadecimal si se encuentra
    pub fn read_key_from_project(game_dir: &Path) -> AppResult<Option<String>> {
        // Buscar rpg_project.json en varias ubicaciones posibles
        let candidates = vec![
            game_dir.join("www").join("rpg_project.json"),
            game_dir.join("rpg_project.json"),
        ];

        for path in candidates {
            if path.exists() {
                let content = fs::read_to_string(&path)?;
                let project: serde_json::Value = serde_json::from_str(&content)?;

                if let Some(key) = project.get("encryptionKey").and_then(|k| k.as_str()) {
                    if !key.is_empty() {
                        return Ok(Some(key.to_string()));
                    }
                }
            }
        }

        Ok(None)
    }

    /// Verifica si un directorio contiene assets cifrados
    pub fn has_encrypted_assets(directory: &Path) -> bool {
        if let Ok(files) = Self::scan_encrypted_files_static(directory) {
            !files.is_empty()
        } else {
            false
        }
    }

    /// Versión estática de scan_encrypted_files para verificación rápida
    fn scan_encrypted_files_static(directory: &Path) -> AppResult<Vec<(PathBuf, String)>> {
        let mut encrypted = Vec::new();

        for entry in fs::read_dir(directory)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    for &(enc_ext, dec_ext) in ENCRYPTED_EXTENSIONS {
                        if ext_lower == enc_ext {
                            encrypted.push((path, dec_ext.to_string()));
                            break;
                        }
                    }
                }
            }
        }

        Ok(encrypted)
    }
}

impl Clone for Decrypter {
    fn clone(&self) -> Self {
        Self {
            key: self.key.clone(),
        }
    }
}

/// Resultado del descifrado de un lote
#[derive(Debug, Clone, serde::Serialize)]
pub struct DecryptResult {
    pub success_count: usize,
    pub failed_count: usize,
    pub total_files: usize,
    pub decrypted_files: Vec<String>,
}

impl DecryptResult {
    pub fn new() -> Self {
        Self {
            success_count: 0,
            failed_count: 0,
            total_files: 0,
            decrypted_files: Vec::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn create_test_key() -> String {
        // Clave de prueba: "0123456789abcdef" en hex
        "30313233343536373839616263646566".to_string()
    }

    fn create_test_encrypted_data() -> Vec<u8> {
        let key = hex::decode(create_test_key()).unwrap();
        let mut data = Vec::new();
        
        // Cabecera RPG Maker MV
        data.extend_from_slice(HEADER_SIGNATURE);
        
        // Cuerpo con XOR aplicado
        let body = vec![0u8; 32];
        for i in 0..16 {
            data.push(body[i] ^ key[i % key.len()]);
        }
        data.extend_from_slice(&body[16..]);
        
        data
    }

    #[test]
    fn test_decrypt_buffer() {
        let key = create_test_key();
        let decrypter = Decrypter::new(&key).unwrap();
        let encrypted = create_test_encrypted_data();
        
        let decrypted = decrypter.decrypt_buffer(encrypted).unwrap();
        assert_eq!(decrypted.len(), 32);
    }

    #[test]
    fn test_invalid_key() {
        let result = Decrypter::new("invalid_hex");
        assert!(result.is_err());
    }

    #[test]
    fn test_empty_key() {
        let result = Decrypter::new("");
        assert!(result.is_err());
    }

    #[test]
    fn test_header_signature() {
        assert_eq!(HEADER_SIGNATURE.len(), HEADER_LEN);
        assert!(HEADER_SIGNATURE.starts_with(b"RPGMV"));
    }
}
