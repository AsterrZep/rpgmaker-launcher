// ============================================================
//  RPG Maker Launcher - Code Injection Engine
// ============================================================
// Motor de inyección de código para juegos basados en NW.js
// (RPG Maker MV/MZ). Permite inyectar scripts JavaScript
// sin modificar permanentemente la instalación del juego.
//
// El motor modifica dinámicamente el manifest package.json
// antes de ejecutar el binario, y restaura la configuración
// original tras cerrar el proceso.
// ============================================================

use std::fs;
use std::path::{Path, PathBuf};
use serde_json::{json, Value};

use crate::core::error::{AppError, AppResult};

/// Motor de inyección de código
pub struct InjectionEngine;

impl InjectionEngine {
    /// Prepara un juego NW.js para ejecución con scripts inyectados
    ///
    /// # Arguments
    /// * `game_dir` - Directorio del juego
    /// * `scripts_to_inject` - Lista de nombres de scripts a inyectar
    ///
    /// # Returns
    /// Ok(()) si se preparó correctamente
    pub fn prepare_nwjs_game(
        game_dir: &Path,
        scripts_to_inject: &[String],
    ) -> AppResult<()> {
        let package_json_path = game_dir.join("package.json");

        if !package_json_path.exists() {
            return Err(AppError::LauncherError(
                "package.json de NW.js no encontrado".into(),
            ));
        }

        // Leer manifest actual
        let content = fs::read_to_string(&package_json_path)?;
        let mut manifest: Value = serde_json::from_str(&content)?;

        // Crear código de inyección
        let mut inject_code = String::new();
        for script in scripts_to_inject {
            inject_code.push_str(&format!("require('./scripts/{}');", script));
        }

        // Guardar respaldo temporal
        let backup_path = game_dir.join("package.json.bak");
        fs::copy(&package_json_path, &backup_path)?;

        // Modificar manifest
        manifest["inject-js-code"] = json!(inject_code);

        // Guardar manifest modificado
        let new_content = serde_json::to_string_pretty(&manifest)?;
        fs::write(&package_json_path, new_content)?;

        log::info!("Scripts inyectados en {:?}", game_dir);
        Ok(())
    }

    /// Restaura la configuración original del juego
    ///
    /// # Arguments
    /// * `game_dir` - Directorio del juego
    pub fn cleanup_nwjs_game(game_dir: &Path) {
        let backup = game_dir.join("package.json.bak");
        let target = game_dir.join("package.json");

        if backup.exists() {
            let _ = fs::rename(backup, target);
            log::info!("Configuración restaurada en {:?}", game_dir);
        }
    }

    /// Inyecta un script específico en el HTML del juego
    ///
    /// # Arguments
    /// * `game_dir` - Directorio del juego
    /// * `script_name` - Nombre del script a inyectar
    ///
    /// # Returns
    /// Ok(true) si se inyectó, Ok(false) si ya existía
    pub fn inject_script_tag(
        game_dir: &Path,
        script_name: &str,
    ) -> AppResult<bool> {
        let index_path = game_dir.join("index.html");
        if !index_path.exists() {
            return Err(AppError::LauncherError(
                "index.html no encontrado".into(),
            ));
        }

        let content = fs::read_to_string(&index_path)?;
        let script_tag = format!("<script src=\"/__mods/{}\"></script>", script_name);

        if content.contains(&script_tag) {
            return Ok(false);
        }

        // Insertar antes de </head> o </body>
        let new_content = if content.contains("</head>") {
            content.replace("</head>", &format!("{}\n</head>", script_tag))
        } else if content.contains("</body>") {
            content.replace("</body>", &format!("{}\n</body>", script_tag))
        } else {
            format!("{}\n{}", content, script_tag)
        };

        fs::write(&index_path, new_content)?;
        Ok(true)
    }

    /// Elimina un script inyectado del HTML
    ///
    /// # Arguments
    /// * `game_dir` - Directorio del juego
    /// * `script_name` - Nombre del script a eliminar
    ///
    /// # Returns
    /// Ok(true) si se eliminó, Ok(false) si no existía
    pub fn remove_script_tag(
        game_dir: &Path,
        script_name: &str,
    ) -> AppResult<bool> {
        let index_path = game_dir.join("index.html");
        if !index_path.exists() {
            return Ok(false);
        }

        let content = fs::read_to_string(&index_path)?;
        let script_tag = format!("<script src=\"/__mods/{}\"></script>", script_name);

        if !content.contains(&script_tag) {
            return Ok(false);
        }

        let new_content = content.replace(&script_tag, "");
        fs::write(&index_path, new_content)?;
        Ok(true)
    }

    /// Obtiene la lista de mods disponibles para un juego
    ///
    /// # Arguments
    /// * `game_dir` - Directorio del juego
    ///
    /// # Returns
    /// Lista de nombres de scripts mods
    pub fn list_available_mods(game_dir: &Path) -> AppResult<Vec<String>> {
        let mods_dir = game_dir.join("mods");
        let mut mods = Vec::new();

        if !mods_dir.exists() {
            return Ok(mods);
        }

        for entry in fs::read_dir(&mods_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.ends_with(".js") {
                        mods.push(name.to_string());
                    }
                }
            }
        }

        mods.sort();
        Ok(mods)
    }

    /// Crea un mod de ejemplo para un juego
    ///
    /// # Arguments
    /// * `game_dir` - Directorio del juego
    ///
    /// # Returns
    /// Ruta del mod creado
    pub fn create_example_mod(game_dir: &Path) -> AppResult<PathBuf> {
        let mods_dir = game_dir.join("mods");
        fs::create_dir_all(&mods_dir)?;

        let example_path = mods_dir.join("ejemplo.js");
        let example_content = r#"// ============================================================
//  Mod de ejemplo para RPG Maker Launcher
//
//  Todos los .js de esta carpeta se inyectan automaticamente en
//  el juego al arrancar (despues de los scripts base y antes de
//  que empiece la partida). Borra o renombra este archivo para
//  desactivar el ejemplo.
// ============================================================

(function () {
    "use strict";

    // Ejemplo 1: F10 alterna pantalla completa
    document.addEventListener("keydown", function (ev) {
        if (ev.key === "F10") {
            ev.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
    });

    // Ejemplo 2: log en consola cuando el juego esta listo
    var timer = setInterval(function () {
        if (typeof window.$gameParty !== "undefined" && window.$gameParty) {
            clearInterval(timer);
            console.log("[mod ejemplo] juego cargado; oro:", window.$gameParty._gold);
        }
    }, 700);
})();
"#;

        fs::write(&example_path, example_content)?;
        log::info!("Mod de ejemplo creado en {:?}", example_path);
        Ok(example_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_prepare_nwjs_game() {
        let dir = tempdir().unwrap();
        let game_dir = dir.path();

        // Crear package.json de prueba
        let package_json = json!({
            "name": "test-game",
            "main": "index.html"
        });
        fs::write(
            game_dir.join("package.json"),
            serde_json::to_string_pretty(&package_json).unwrap(),
        )
        .unwrap();

        // Inyectar scripts
        let scripts = vec!["trucos.js".to_string(), "gamepad.js".to_string()];
        let result = InjectionEngine::prepare_nwjs_game(game_dir, &scripts);

        assert!(result.is_ok());

        // Verificar que se creó el respaldo
        assert!(game_dir.join("package.json.bak").exists());

        // Verificar que se modificó el manifest
        let content = fs::read_to_string(game_dir.join("package.json")).unwrap();
        let manifest: Value = serde_json::from_str(&content).unwrap();
        assert!(manifest.get("inject-js-code").is_some());
    }

    #[test]
    fn test_cleanup_nwjs_game() {
        let dir = tempdir().unwrap();
        let game_dir = dir.path();

        // Crear package.json original
        let package_json = json!({
            "name": "test-game",
            "main": "index.html"
        });
        let original_content = serde_json::to_string_pretty(&package_json).unwrap();
        fs::write(game_dir.join("package.json"), &original_content).unwrap();

        // Crear respaldo
        fs::copy(
            game_dir.join("package.json"),
            game_dir.join("package.json.bak"),
        )
        .unwrap();

        // Modificar package.json
        let mut modified = package_json.clone();
        modified["inject-js-code"] = json!("require('./test.js');");
        fs::write(
            game_dir.join("package.json"),
            serde_json::to_string_pretty(&modified).unwrap(),
        )
        .unwrap();

        // Restaurar
        InjectionEngine::cleanup_nwjs_game(game_dir);

        // Verificar restauración
        let restored = fs::read_to_string(game_dir.join("package.json")).unwrap();
        assert_eq!(restored, original_content);
    }
}
