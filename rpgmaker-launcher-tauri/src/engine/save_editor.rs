// ============================================================
//  RPG Maker Launcher - Save Editor Engine
// ============================================================
// Motor de edición de partidas guardadas para RPG Maker.
// Soporta dos formatos principales:
//
// 1. RPG Maker MV/MZ:
//    - Archivos JSON comprimidos con zlib (nivel 1 en MZ)
//    - Compresión LZ-String en algunos juegos
//
// 2. RPG Maker XP/VX/VX Ace:
//    - Archivos binarios serializados en formato Ruby Marshal (v4.8)
//
// Este módulo proporciona:
// - Lectura/escritura de saves MV/MZ
// - Parseo de Ruby Marshal para XP/VX/VX Ace
// - Copias de seguridad automáticas
// - Edición de campos específicos (oro, items, variables, switches)
// ============================================================

use flate2::read::ZlibDecoder;
use flate2::write::ZlibEncoder;
use flate2::Compression;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::core::error::{AppError, AppResult};

/// Formato de save detectado
#[derive(Debug, Clone, PartialEq)]
pub enum SaveFormat {
    /// RPG Maker MV/MZ (JSON comprimido con zlib)
    MvMz,
    /// RPG Maker XP/VX/VX Ace (Ruby Marshal)
    RubyMarshal,
    /// Formato desconocido
    Unknown,
}

/// Editor de partidas guardadas
pub struct SaveEditor {
    backups_dir: Option<PathBuf>,
}

impl SaveEditor {
    /// Crea un nuevo editor de saves
    pub fn new(backups_dir: Option<PathBuf>) -> Self {
        Self { backups_dir }
    }

    /// Detecta el formato de un archivo de save
    pub fn detect_format(path: &Path) -> SaveFormat {
        let mut file = match File::open(path) {
            Ok(f) => f,
            Err(_) => return SaveFormat::Unknown,
        };

        let mut header = [0u8; 16];
        if file.read_exact(&mut header).is_err() {
            return SaveFormat::Unknown;
        }

        // MV/MZ: intentar descomprimir con zlib
        if header[0] == 0x78 && (header[1] == 0x01 || header[1] == 0x9C || header[1] == 0xDA) {
            return SaveFormat::MvMz;
        }

        // Ruby Marshal: cabecera 4.8 (0x04 0x08)
        if header[0] == 4 && header[1] == 8 {
            return SaveFormat::RubyMarshal;
        }

        SaveFormat::Unknown
    }

    /// Lee un save de RPG Maker MV/MZ
    ///
    /// Los saves de MV/MZ son JSON comprimidos con zlib.
    /// El nivel de compresión es 1 en MZ.
    ///
    /// # Arguments
    /// * `path` - Ruta al archivo de save
    ///
    /// # Returns
    /// Objeto JSON del save
    pub fn load_mv_mz_save(&self, path: &Path) -> AppResult<serde_json::Value> {
        let mut file = File::open(path)?;
        let mut raw = Vec::new();
        file.read_to_end(&mut raw)?;

        // Intentar descomprimir con zlib
        let json_str = if raw.len() >= 2 && raw[0] == 0x78 {
            let mut decoder = ZlibDecoder::new(&raw[..]);
            let mut decompressed = String::new();
            decoder.read_to_string(&mut decompressed)?;
            decompressed
        } else {
            // Por si algún juego lo guardó sin comprimir
            String::from_utf8(raw)?
        };

        let data: serde_json::Value = serde_json::from_str(&json_str)?;
        Ok(data)
    }

    /// Guarda un save de RPG Maker MV/MZ
    ///
    /// Serializa el objeto JSON y lo comprime con zlib antes de escribir.
    ///
    /// # Arguments
    /// * `path` - Ruta donde guardar el save
    /// * `data` - Objeto JSON a serializar
    ///
    /// # Errors
    /// Retorna error si no se puede comprimir o escribir el archivo
    pub fn save_mv_mz_save(&self, path: &Path, data: &serde_json::Value) -> AppResult<()> {
        // Crear backup antes de sobrescribir
        if let Some(ref backups_dir) = self.backups_dir {
            if path.exists() {
                self.create_backup(path, backups_dir)?;
            }
        }

        // Serializar a JSON
        let json_str = serde_json::to_string(data)?;

        // Comprimir con zlib
        let mut encoder = ZlibEncoder::new(Vec::new(), Compression::fast());
        encoder.write_all(json_str.as_bytes())?;
        let compressed = encoder.finish()?;

        // Escribir de forma atómica
        let tmp_path = path.with_extension("tmp");
        {
            let mut file = File::create(&tmp_path)?;
            file.write_all(&compressed)?;
        }

        fs::rename(&tmp_path, path)?;
        Ok(())
    }

    /// Lee un save de RPG Maker XP/VX/VX Ace (Ruby Marshal)
    ///
    /// NOTA: Esta función devuelve los datos en bruto.
    /// Para una implementación completa, se necesita una librería
    /// de parseo de Ruby Marshal.
    ///
    /// # Arguments
    /// * `path` - Ruta al archivo de save
    ///
    /// # Returns
    /// Datos binarios del save (requiere parseo adicional)
    pub fn load_ruby_marshal_save(&self, path: &Path) -> AppResult<Vec<u8>> {
        let mut file = File::open(path)?;
        let mut data = Vec::new();
        file.read_to_end(&mut data)?;

        // Verificar cabecera Ruby Marshal 4.8
        if data.len() < 2 || data[0] != 4 || data[1] != 8 {
            return Err(AppError::RubyMarshalError(
                "Cabecera Ruby Marshal 4.8 no encontrada".into(),
            ));
        }

        // TODO: Implementar parseo completo de Ruby Marshal
        // Por ahora, devolver los datos en bruto
        Ok(data)
    }

    /// Obtiene información detallada de un save
    ///
    /// # Arguments
    /// * `path` - Ruta al archivo de save
    ///
    /// # Returns
    /// Información del save (resumen, oro, items, etc.)
    pub fn get_save_info(&self, path: &Path) -> AppResult<SaveInfo> {
        let format = Self::detect_format(path);

        match format {
            SaveFormat::MvMz => {
                let data = self.load_mv_mz_save(path)?;
                Ok(self.parse_mv_mz_info(&data))
            }
            SaveFormat::RubyMarshal => {
                // Por ahora, devolver información básica
                let metadata = fs::metadata(path)?;
                Ok(SaveInfo {
                    format: "Ruby Marshal".to_string(),
                    gold: 0,
                    items_count: 0,
                    weapons_count: 0,
                    armors_count: 0,
                    variables_count: 0,
                    switches_count: 0,
                    actors: Vec::new(),
                    size_bytes: metadata.len(),
                    last_modified: metadata
                        .modified()
                        .ok()
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs()),
                })
            }
            SaveFormat::Unknown => Err(AppError::SaveParseError(
                "Formato de save no reconocido".into(),
            )),
        }
    }

    /// Parsea la información de un save MV/MZ
    fn parse_mv_mz_info(&self, data: &serde_json::Value) -> SaveInfo {
        let party = data.get("party").cloned().unwrap_or(serde_json::json!({}));
        let gold = party.get("_gold").and_then(|g| g.as_u64()).unwrap_or(0);

        // Items
        let items = party.get("_items").cloned().unwrap_or(serde_json::json!({}));
        let items_count = items
            .as_object()
            .map(|m| m.values().filter(|v| v.as_u64().unwrap_or(0) > 0).count())
            .unwrap_or(0);

        // Weapons
        let weapons = party.get("_weapons").cloned().unwrap_or(serde_json::json!({}));
        let weapons_count = weapons
            .as_object()
            .map(|m| m.values().filter(|v| v.as_u64().unwrap_or(0) > 0).count())
            .unwrap_or(0);

        // Armors
        let armors = party.get("_armors").cloned().unwrap_or(serde_json::json!({}));
        let armors_count = armors
            .as_object()
            .map(|m| m.values().filter(|v| v.as_u64().unwrap_or(0) > 0).count())
            .unwrap_or(0);

        // Variables
        let variables = data
            .get("variables")
            .and_then(|v| v.get("_data"))
            .cloned()
            .unwrap_or(serde_json::json!([]));
        let variables_count = variables
            .as_array()
            .map(|a| a.iter().filter(|v| !v.is_null() && *v != &serde_json::json!(0)).count())
            .unwrap_or(0);

        // Switches
        let switches = data
            .get("switches")
            .and_then(|v| v.get("_data"))
            .cloned()
            .unwrap_or(serde_json::json!([]));
        let switches_count = switches
            .as_array()
            .map(|a| a.iter().filter(|s| s.as_bool().unwrap_or(false)).count())
            .unwrap_or(0);

        // Actors
        let actors_raw = data
            .get("actors")
            .and_then(|a| a.get("_data"))
            .cloned()
            .unwrap_or(serde_json::json!([]));
        let actors: Vec<ActorInfo> = actors_raw
            .as_array()
            .map(|a| {
                a.iter()
                    .enumerate()
                    .filter_map(|(idx, actor)| {
                        if let Some(name) = actor.get("_name").and_then(|n| n.as_str()) {
                            if !name.is_empty() {
                                return Some(ActorInfo {
                                    id: actor
                                        .get("_actorId")
                                        .and_then(|i| i.as_u64())
                                        .unwrap_or(idx as u64) as u32,
                                    name: name.to_string(),
                                    level: actor.get("_level").and_then(|l| l.as_u64()).unwrap_or(1) as u32,
                                    hp: actor.get("_hp").and_then(|h| h.as_u64()).unwrap_or(0) as u32,
                                    mp: actor.get("_mp").and_then(|m| m.as_u64()).unwrap_or(0) as u32,
                                });
                            }
                        }
                        None
                    })
                    .collect()
            })
            .unwrap_or_default();

        SaveInfo {
            format: "MV/MZ".to_string(),
            gold,
            items_count,
            weapons_count,
            armors_count,
            variables_count,
            switches_count,
            actors,
            size_bytes: 0, // Se establecerá externamente
            last_modified: None,
        }
    }

    /// Actualiza campos específicos de un save MV/MZ
    ///
    /// # Arguments
    /// * `path` - Ruta al archivo de save
    /// * `updates` - Mapa de actualizaciones a aplicar
    ///
    /// # Returns
    /// True si se actualizó correctamente
    pub fn update_save(
        &self,
        path: &Path,
        updates: &serde_json::Value,
    ) -> AppResult<bool> {
        let mut data = self.load_mv_mz_save(path)?;

        // Aplicar oro
        if let Some(gold) = updates.get("gold") {
            data.entry("party")
                .or_insert_with(|| serde_json::json!({}))
                .as_object_mut()
                .unwrap()
                .insert("_gold".to_string(), gold.clone());
        }

        // Aplicar items
        if let Some(items) = updates.get("items") {
            if let Some(party) = data.get_mut("party") {
                party
                    .as_object_mut()
                    .unwrap()
                    .insert("_items".to_string(), items.clone());
            }
        }

        // Aplicar weapons
        if let Some(weapons) = updates.get("weapons") {
            if let Some(party) = data.get_mut("party") {
                party
                    .as_object_mut()
                    .unwrap()
                    .insert("_weapons".to_string(), weapons.clone());
            }
        }

        // Aplicar armors
        if let Some(armors) = updates.get("armors") {
            if let Some(party) = data.get_mut("party") {
                party
                    .as_object_mut()
                    .unwrap()
                    .insert("_armors".to_string(), armors.clone());
            }
        }

        // Aplicar variables
        if let Some(variables) = updates.get("variables") {
            if let Some(vars_obj) = data.get_mut("variables") {
                if let Some(data_arr) = vars_obj.get_mut("_data") {
                    if let (Some(arr), Some(obj)) = (data_arr.as_array_mut(), variables.as_object()) {
                        for (key, value) in obj {
                            if let Ok(idx) = key.parse::<usize>() {
                                while arr.len() <= idx {
                                    arr.push(serde_json::json!(0));
                                }
                                arr[idx] = value.clone();
                            }
                        }
                    }
                }
            }
        }

        // Aplicar switches
        if let Some(switches) = updates.get("switches") {
            if let Some(sw_obj) = data.get_mut("switches") {
                if let Some(data_arr) = sw_obj.get_mut("_data") {
                    if let (Some(arr), Some(obj)) = (data_arr.as_array_mut(), switches.as_object()) {
                        for (key, value) in obj {
                            if let Ok(idx) = key.parse::<usize>() {
                                while arr.len() <= idx {
                                    arr.push(serde_json::json!(false));
                                }
                                arr[idx] = value.clone();
                            }
                        }
                    }
                }
            }
        }

        self.save_mv_mz_save(path, &data)?;
        Ok(true)
    }

    /// Crea una copia de seguridad de un save
    ///
    /// # Arguments
    /// * `path` - Ruta al archivo de save
    /// * `backups_dir` - Directorio de backups
    ///
    /// # Returns
    /// Ruta del backup creado
    fn create_backup(&self, path: &Path, backups_dir: &Path) -> AppResult<PathBuf> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let game_name = path
            .parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.file_name())
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");

        let backup_dir = backups_dir
            .join(game_name)
            .join(format!("save-edit-{}", timestamp));

        fs::create_dir_all(&backup_dir)?;

        let backup_path = backup_dir.join(path.file_name().unwrap_or_default());
        fs::copy(path, &backup_path)?;

        log::info!("Backup creado: {:?}", backup_path);
        Ok(backup_path)
    }

    /// Obtiene la lista de saves en un directorio
    pub fn list_saves(saves_dir: &Path) -> AppResult<Vec<SaveFileInfo>> {
        let mut saves = Vec::new();

        if !saves_dir.exists() {
            return Ok(saves);
        }

        for entry in fs::read_dir(saves_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                let metadata = fs::metadata(&path)?;
                let format = Self::detect_format(&path);

                saves.push(SaveFileInfo {
                    name: path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    path,
                    size_bytes: metadata.len(),
                    size_kb: metadata.len() as f64 / 1024.0,
                    last_modified: metadata
                        .modified()
                        .ok()
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs()),
                    format,
                });
            }
        }

        // Ordenar por última modificación (más reciente primero)
        saves.sort_by(|a, b| b.last_modified.unwrap_or(0).cmp(&a.last_modified.unwrap_or(0)));

        Ok(saves)
    }
}

/// Información de un save
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SaveInfo {
    pub format: String,
    pub gold: u64,
    pub items_count: usize,
    pub weapons_count: usize,
    pub armors_count: usize,
    pub variables_count: usize,
    pub switches_count: usize,
    pub actors: Vec<ActorInfo>,
    pub size_bytes: u64,
    pub last_modified: Option<u64>,
}

/// Información de un actor
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ActorInfo {
    pub id: u32,
    pub name: String,
    pub level: u32,
    pub hp: u32,
    pub mp: u32,
}

/// Información de archivo de save
#[derive(Debug, Clone, serde::Serialize)]
pub struct SaveFileInfo {
    pub name: String,
    pub path: PathBuf,
    pub size_bytes: u64,
    pub size_kb: f64,
    pub last_modified: Option<u64>,
    pub format: SaveFormat,
}

impl serde::Serialize for SaveFormat {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = match self {
            SaveFormat::MvMz => "MvMz",
            SaveFormat::RubyMarshal => "RubyMarshal",
            SaveFormat::Unknown => "Unknown",
        };
        serializer.serialize_str(s)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn create_test_mv_save() -> Vec<u8> {
        let data = serde_json::json!({
            "party": {
                "_gold": 12345,
                "_items": {"1": 5, "2": 3},
                "_weapons": {"1": 1},
                "_armors": {"1": 2}
            },
            "variables": {
                "_data": [null, 100, 200, null, true]
            },
            "switches": {
                "_data": [null, true, false, true]
            },
            "actors": {
                "_data": [
                    null,
                    {"_actorId": 1, "_name": "Hero", "_level": 10, "_hp": 100, "_mp": 50},
                    {"_actorId": 2, "_name": "Mage", "_level": 8, "_hp": 80, "_mp": 100}
                ]
            }
        });

        let json_str = serde_json::to_string(&data).unwrap();
        let mut encoder = ZlibEncoder::new(Vec::new(), Compression::fast());
        encoder.write_all(json_str.as_bytes()).unwrap();
        encoder.finish().unwrap()
    }

    #[test]
    fn test_detect_format() {
        let mut temp = tempfile::tempfile().unwrap();
        let data = create_test_mv_save();
        temp.write_all(&data).unwrap();

        let path = temp.into_temp_path();
        let format = SaveEditor::detect_format(&path);
        assert_eq!(format, SaveFormat::MvMz);
    }

    #[test]
    fn test_load_mv_mz_save() {
        let mut temp = tempfile::tempfile().unwrap();
        let data = create_test_mv_save();
        temp.write_all(&data).unwrap();

        let path = temp.into_temp_path();
        let editor = SaveEditor::new(None);
        let save_data = editor.load_mv_mz_save(&path).unwrap();

        assert_eq!(save_data["party"]["_gold"], 12345);
    }

    #[test]
    fn test_get_save_info() {
        let mut temp = tempfile::tempfile().unwrap();
        let data = create_test_mv_save();
        temp.write_all(&data).unwrap();

        let path = temp.into_temp_path();
        let editor = SaveEditor::new(None);
        let info = editor.get_save_info(&path).unwrap();

        assert_eq!(info.gold, 12345);
        assert_eq!(info.items_count, 2);
        assert_eq!(info.actors.len(), 2);
    }
}
