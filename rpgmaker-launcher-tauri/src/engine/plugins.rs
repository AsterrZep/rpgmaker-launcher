// ============================================================
//  RPG Maker Launcher - Plugin Manager
// ============================================================
// Gestor de plugins para juegos RPG Maker MZ/MV.
// Analiza compatibilidad con WebKit (detecta APIs nw.js),
// permite activar/desactivar plugins, y crea backups.
//
// Puerta directa de backend/plugins.py a Rust nativo.
// ============================================================

use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};

use crate::core::error::{AppError, AppResult};
use crate::core::models::plugin::{PluginCategory, PluginInfo, PluginsStatus};

// ── Patrones de API nw.js ──────────────────────────────────
// Si un plugin usa alguno de estos, puede fallar en WebKit.

const NW_TOKENS: &[(&str, &str)] = &[
    (r"require\s*\(", "require()"),
    (r"\bprocess\.", "process."),
    (r"\bnw\.", "nw."),
    (r"child_process", "child_process"),
    (r"\bfs\.", "fs."),
    (r"\bpath\.", "path."),
];

// Guardas: si el plugin contiene alguna, el uso de nw.js
// suele estar protegido y no rompe en el navegador.
const GUARDS: &[&str] = &[
    "Utils.isNwjs",
    "isNwjs",
    "typeof require",
    "typeof nw",
    "require.main",
    "window.require",
    "nw&&",
    "nw &&",
    "process&&",
    "process &&",
];

// ── Funciones de parsing de plugins.js ─────────────────────

/// Convierte comillas simples a dobles (JSON-safe).
/// Respeta escapes y cadenas ya en comillas dobles.
fn convert_single_quotes(raw: &str) -> String {
    let chars: Vec<char> = raw.chars().collect();
    let n = chars.len();
    let mut out = String::with_capacity(n);
    let mut i = 0;
    let mut in_dq = false;

    while i < n {
        let c = chars[i];
        if in_dq {
            out.push(c);
            if c == '\\' && i + 1 < n {
                out.push(chars[i + 1]);
                i += 2;
                continue;
            }
            if c == '"' {
                in_dq = false;
            }
            i += 1;
            continue;
        }
        if c == '"' {
            in_dq = true;
            out.push(c);
            i += 1;
            continue;
        }
        if c == '\'' {
            let mut buf = String::new();
            let mut j = i + 1;
            while j < n {
                if chars[j] == '\\' && j + 1 < n {
                    buf.push(chars[j]);
                    buf.push(chars[j + 1]);
                    j += 2;
                    continue;
                }
                if chars[j] == '\'' {
                    break;
                }
                buf.push(chars[j]);
                j += 1;
            }
            if j < n {
                // Convertir a JSON string (con dobles comillas)
                out.push('"');
                for ch in buf.chars() {
                    match ch {
                        '"' => out.push_str("\\\""),
                        '\\' => out.push_str("\\\\"),
                        '\n' => out.push_str("\\n"),
                        '\r' => out.push_str("\\r"),
                        '\t' => out.push_str("\\t"),
                        _ => out.push(ch),
                    }
                }
                out.push('"');
                i = j + 1;
                continue;
            }
            out.push(c);
            i += 1;
            continue;
        }
        out.push(c);
        i += 1;
    }
    out
}

/// Normaliza plugins.js (JS suelto) a JSON válido.
fn normalize_plugins_js(raw: &str) -> String {
    // 1) Comillas simples → dobles
    let mut result = convert_single_quotes(raw);

    // 2) Eliminar comas finales antes de ] o }
    let re_trailing_comma = Regex::new(r",\s*([}\]])").unwrap();
    result = re_trailing_comma.replace_all(&result, "$1").to_string();

    // 3) Claves sin comillas → con comillas (soporta unicode/japonés)
    // Patrón: [,{] seguido de whitespace, luego un identificador sin comillas, luego :
    let re_unquoted_key = Regex::new(r"([,{]\s*)([^\s\x22'`:{}\[\],]+)\s*:").unwrap();
    result = re_unquoted_key
        .replace_all(&result, |caps: &regex::Captures| {
            format!("{}\"{}\":", &caps[1], &caps[2])
        })
        .to_string();

    result
}

/// Elimina comentarios JS (aproximado).
fn strip_comments(src: &str) -> String {
    let re_block = Regex::new(r"/\*.*?\*/").unwrap();
    let re_line = Regex::new(r"//[^\n]*").unwrap();
    let result = re_block.replace_all(src, " ");
    re_line.replace_all(&result, " ").to_string()
}

// ── Funciones públicas ─────────────────────────────────────

/// Busca plugins.js en el directorio del juego.
pub fn find_plugins_js(root: &Path) -> Option<PathBuf> {
    // Buscar en js/plugins.js directamente
    let direct = root.join("js").join("plugins.js");
    if direct.is_file() {
        return Some(direct);
    }

    // Búsqueda recursiva limitada (profundidad 3)
    fn walk(current: &Path, target: &str, depth: usize, max: usize) -> Option<PathBuf> {
        if depth > max {
            return None;
        }
        let entries = fs::read_dir(current).ok()?;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(found) = walk(&path, target, depth + 1, max) {
                    return Some(found);
                }
            } else if path.is_file() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name == target {
                        // Verificar que esté en un directorio "js"
                        if let Some(parent) = path.parent() {
                            if parent.file_name().and_then(|n| n.to_str()) == Some("js") {
                                return Some(path);
                            }
                        }
                    }
                }
            }
        }
        None
    }

    walk(root, "plugins.js", 0, 3)
}

/// Carga y parsea plugins.js, devolviendo la lista de plugins.
pub fn load_plugins(root: &Path) -> AppResult<(PathBuf, String, Vec<serde_json::Value>)> {
    let path = find_plugins_js(root).ok_or_else(|| {
        AppError::PluginNotFound(format!("No se encontró js/plugins.js en: {}", root.display()))
    })?;

    let raw = fs::read_to_string(&path)
        .map_err(|e| AppError::PluginNotFound(format!("Error leyendo plugins.js: {}", e)))?;

    // Extraer el array JSON (busca el primer [ ... ], incluyendo saltos de línea)
    let re_array = Regex::new(r"(?s)\[.*\]").map_err(|e| {
        AppError::PluginNotFound(format!("Error en regex: {}", e))
    })?;

    let m = re_array
        .find(&raw)
        .ok_or_else(|| {
            AppError::PluginNotFound("No se pudo interpretar plugins.js (formato raro)".into())
        })?;

    let normalized = normalize_plugins_js(m.as_str());

    let plugins: Vec<serde_json::Value> = serde_json::from_str(&normalized).map_err(|e| {
        AppError::PluginNotFound(format!("Error al interpretar plugins.js: {}", e))
    })?;

    Ok((path, raw, plugins))
}

/// Guarda los plugins modificados en plugins.js.
/// Crea backup en la primera modificación.
pub fn save_plugins(path: &Path, raw: &str, plugins: &[serde_json::Value]) -> AppResult<()> {
    let bak = path.with_extension("js.bak");
    if !bak.exists() {
        fs::copy(path, &bak)?;
    }

    let re_array = Regex::new(r"(?s)\[.*\]").map_err(|e| {
        AppError::PluginNotFound(format!("Error en regex: {}", e))
    })?;

    let m = re_array.find(raw).ok_or_else(|| {
        AppError::PluginNotFound("No se encontró el array en plugins.js".into())
    })?;

    let new_json = serde_json::to_string(plugins)
        .map_err(|e| AppError::PluginNotFound(format!("Error serializando: {}", e)))?;

    let new_content = format!("{}{}{}", &raw[..m.start()], new_json, &raw[m.end()..]);
    fs::write(path, new_content)?;

    Ok(())
}

/// Analiza un plugin para detectar compatibilidad con WebKit.
pub fn analyze_plugin(name: &str, root: &Path) -> PluginInfo {
    let plugin_file = root.join("js").join("plugins").join(format!("{}.js", name));

    if !plugin_file.is_file() {
        return PluginInfo {
            name: name.to_string(),
            status: false,
            description: String::new(),
            category: PluginCategory::SinFichero,
            motivos: vec![format!("no existe plugins/{}.js", name)],
        };
    }

    let src = fs::read_to_string(&plugin_file)
        .map(|s| strip_comments(&s))
        .unwrap_or_default();

    // Detectar tokens nw.js
    let mut tokens = Vec::new();
    for (pat, label) in NW_TOKENS {
        if let Ok(re) = Regex::new(pat) {
            if re.is_match(&src) {
                tokens.push(label.to_string());
            }
        }
    }

    if tokens.is_empty() {
        return PluginInfo {
            name: name.to_string(),
            status: false,
            description: String::new(),
            category: PluginCategory::Ok,
            motivos: Vec::new(),
        };
    }

    // Verificar si tiene guardas
    let guarded = GUARDS.iter().any(|g| src.contains(g));

    if guarded {
        return PluginInfo {
            name: name.to_string(),
            status: false,
            description: String::new(),
            category: PluginCategory::NwProtegido,
            motivos: tokens,
        };
    }

    PluginInfo {
        name: name.to_string(),
        status: false,
        description: String::new(),
        category: PluginCategory::Roto,
        motivos: tokens,
    }
}

/// Obtiene el estado completo de los plugins de un juego.
pub fn get_plugins_status(root: &Path) -> AppResult<PluginsStatus> {
    let (path, _raw, plugins) = load_plugins(root)?;

    let mut analyzed = Vec::new();

    for p in &plugins {
        let pname = p.get("name").and_then(|n| n.as_str()).unwrap_or("");
        let description = p
            .get("description")
            .and_then(|d| d.as_str())
            .unwrap_or("")
            .to_string();
        let status = p.get("status").and_then(|s| s.as_bool()).unwrap_or(false);

        let mut info = analyze_plugin(pname, root);
        info.status = status;
        info.description = description;
        analyzed.push(info);
    }

    let has_bak = path.with_extension("js.bak").exists();

    Ok(PluginsStatus {
        path: path.to_string_lossy().to_string(),
        plugins: analyzed,
        has_backup: has_bak,
    })
}

/// Activa o desactiva plugins específicos o todos.
pub fn toggle_plugins(
    root: &Path,
    names: &[String],
    status: bool,
    all_plugins: bool,
) -> AppResult<Vec<String>> {
    let (path, raw, mut plugins) = load_plugins(root)?;

    let all_names: Vec<String> = plugins
        .iter()
        .filter_map(|p| p.get("name").and_then(|n| n.as_str()).map(String::from))
        .collect();

    let targets: Vec<String> = if all_plugins {
        all_names.clone()
    } else {
        for n in names {
            if !all_names.contains(n) {
                return Err(AppError::PluginNotFound(format!(
                    "Plugin no encontrado: {}",
                    n
                )));
            }
        }
        names.to_vec()
    };

    let mut modified = Vec::new();
    for p in plugins.iter_mut() {
        let should_modify = p.get("name")
            .and_then(|n| n.as_str())
            .map(|pname| targets.contains(&pname.to_string()))
            .unwrap_or(false);
        
        if should_modify {
            let current = p.get("status").and_then(|s| s.as_bool()).unwrap_or(false);
            if current != status {
                if let Some(obj) = p.as_object_mut() {
                    obj.insert("status".to_string(), serde_json::Value::Bool(status));
                }
                if let Some(pname) = p.get("name").and_then(|n| n.as_str()) {
                    modified.push(pname.to_string());
                }
            }
        }
    }

    if !modified.is_empty() {
        save_plugins(&path, &raw, &plugins)?;
    }

    Ok(modified)
}

/// Restaura plugins.js desde la copia de seguridad (.bak).
pub fn restore_plugins(root: &Path) -> AppResult<()> {
    let (path, _, _) = load_plugins(root)?;
    let bak = path.with_extension("js.bak");

    if !bak.exists() {
        return Err(AppError::PluginNotFound(format!(
            "No hay copia de seguridad en {}",
            bak.display()
        )));
    }

    fs::copy(&bak, &path)?;
    log::info!("plugins.js restaurado desde la copia original");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn create_test_game(dir: &Path) {
        let js_dir = dir.join("js").join("plugins");
        fs::create_dir_all(&js_dir).unwrap();

        // Crear plugins.js de prueba
        let plugins_js = r#"[
  {"name":"TestPlugin","status":true,"description":"Test"},
  {"name":"BrokenPlugin","status":true}
]"#;
        fs::write(dir.join("js").join("plugins.js"), plugins_js).unwrap();

        // Crear archivos de plugin
        fs::write(js_dir.join("TestPlugin.js"), "console.log('ok');").unwrap();
        fs::write(
            js_dir.join("BrokenPlugin.js"),
            "var fs = require('fs'); process.exit();",
        )
        .unwrap();
    }

    #[test]
    fn test_find_plugins_js() {
        let dir = tempdir().unwrap();
        create_test_game(dir.path());

        let result = find_plugins_js(dir.path());
        assert!(result.is_some());
        assert!(result.unwrap().ends_with("plugins.js"));
    }

    #[test]
    fn test_analyze_ok_plugin() {
        let dir = tempdir().unwrap();
        create_test_game(dir.path());

        let info = analyze_plugin("TestPlugin", dir.path());
        assert_eq!(info.category, PluginCategory::Ok);
        assert!(info.motivos.is_empty());
    }

    #[test]
    fn test_analyze_broken_plugin() {
        let dir = tempdir().unwrap();
        create_test_game(dir.path());

        let info = analyze_plugin("BrokenPlugin", dir.path());
        assert_eq!(info.category, PluginCategory::Roto);
        assert!(!info.motivos.is_empty());
    }

    #[test]
    fn test_analyze_missing_plugin() {
        let dir = tempdir().unwrap();
        create_test_game(dir.path());

        let info = analyze_plugin("NonExistent", dir.path());
        assert_eq!(info.category, PluginCategory::SinFichero);
    }

    #[test]
    fn test_get_plugins_status() {
        let dir = tempdir().unwrap();
        create_test_game(dir.path());

        let status = get_plugins_status(dir.path()).unwrap();
        assert_eq!(status.plugins.len(), 2);
        assert!(!status.has_backup);
    }

    #[test]
    fn test_toggle_plugin() {
        let dir = tempdir().unwrap();
        create_test_game(dir.path());

        let modified = toggle_plugins(dir.path(), &["TestPlugin".to_string()], false, false).unwrap();
        assert_eq!(modified.len(), 1);
        assert_eq!(modified[0], "TestPlugin");

        // Verificar que se desactivó
        let status = get_plugins_status(dir.path()).unwrap();
        let test = status.plugins.iter().find(|p| p.name == "TestPlugin").unwrap();
        assert!(!test.status);

        // Verificar que se creó backup
        assert!(status.has_backup);
    }

    #[test]
    fn test_convert_single_quotes() {
        let input = "{'key': 'value'}";
        let output = convert_single_quotes(input);
        assert!(output.contains("\"key\""));
        assert!(output.contains("\"value\""));
    }

    #[test]
    fn test_strip_comments() {
        let input = "var x = 1; // comment\nvar y = 2; /* block */";
        let output = strip_comments(input);
        assert!(!output.contains("// comment"));
        assert!(!output.contains("/* block */"));
    }
}
