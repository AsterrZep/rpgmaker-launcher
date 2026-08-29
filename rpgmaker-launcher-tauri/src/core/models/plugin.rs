/// Categoría de compatibilidad de un plugin
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum PluginCategory {
    Ok,
    NwProtegido,
    Roto,
    SinFichero,
}

/// Información de un plugin analizado
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PluginInfo {
    pub name: String,
    pub status: bool,
    pub description: String,
    pub category: PluginCategory,
    pub motivos: Vec<String>,
}

/// Resultado de obtener el estado de los plugins
#[derive(Debug, Clone, serde::Serialize)]
pub struct PluginsStatus {
    pub path: String,
    pub plugins: Vec<PluginInfo>,
    pub has_backup: bool,
}