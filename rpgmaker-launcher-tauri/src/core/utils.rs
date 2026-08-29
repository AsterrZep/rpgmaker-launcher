// ============================================================
//  RPG Maker Launcher - Shared Utilities
// ============================================================
// Funciones de utilidad compartidas entre módulos.
// Puerta de backend/utils.py a Rust.
// ============================================================

#[allow(dead_code)]
/// Convierte un nombre en un nombre seguro para archivos.
/// Reemplaza caracteres no alfanuméricos por guiones bajos,
/// limita a 60 caracteres.
pub fn safe_log_name(name: &str) -> String {
    let safe: String = name
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' || c == '.' {
                c
            } else {
                '_'
            }
        })
        .take(60)
        .collect();

    if safe.is_empty() {
        "juego".to_string()
    } else {
        safe
    }
}

#[allow(dead_code)]
/// Asegura que un directorio exista, creándolo si es necesario.
pub fn ensure_dir(path: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(path)
}

#[allow(dead_code)]
/// Elimina un archivo de forma segura, ignorando errores.
pub fn remove_file(path: &std::path::Path) -> bool {
    if path.is_file() {
        std::fs::remove_file(path).is_ok()
    } else {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_safe_log_name_normal() {
        assert_eq!(safe_log_name("My Game"), "My_Game");
    }

    #[test]
    fn test_safe_log_name_special_chars() {
        assert_eq!(safe_log_name("Game: V2! (Final)"), "Game__V2___Final_");
    }

    #[test]
    fn test_safe_log_name_empty() {
        assert_eq!(safe_log_name(""), "juego");
    }

    #[test]
    fn test_safe_log_name_long() {
        let long = "A".repeat(100);
        assert_eq!(safe_log_name(&long).len(), 60);
    }

    #[test]
    fn test_safe_log_name_unicode() {
        // Unicode alfanumérico se mantiene
        let result = safe_log_name("ゲームTest");
        assert!(result.contains("Test"));
    }
}
