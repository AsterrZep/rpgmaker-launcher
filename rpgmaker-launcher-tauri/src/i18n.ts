export type Lang = 'es' | 'en';

export const translations = {
  es: {
    appTitle: "RPG Maker Launcher",
    subtitle: "Lanzador de juegos de RPG Maker & Ren'Py",
    library: "Mi Biblioteca",
    gamesInstalled: "juegos instalados",
    lastSync: "Última sincronización",
    searchPlaceholder: "Buscar juegos...",
    filter: "Filtrar",
    emptyLibrary: "No hay juegos todavía.\nColoca los archivos .zip junto al lanzador y pulsa Actualizar.",
    dragDropZip: "¡Suelta los archivos .zip aquí para añadirlos!",
    
    // Nav & Actions
    navPlay: "Biblioteca",
    navPlugins: "Plugins",
    navSaves: "Partidas",
    navData: "Datos",
    navMods: "Mods",
    navSync: "Sync",
    navDecrypt: "Descifrar",
    navShortcuts: "Atajos",
    navQuit: "Salir",

    btnPlay: "Jugar",
    btnStopServer: "Detener servidor",
    btnRefresh: "Actualizar",
    btnSave: "Guardar Cambios",
    btnCancel: "Cancelar",
    btnClose: "Cerrar",
    btnBackup: "Copia de seguridad",
    btnRestore: "Restaurar",
    btnExport: "Exportar",
    btnDelete: "Borrar",
    btnEnableAll: "Todo ON",
    btnDisableAll: "Todo OFF",
    btnPush: "Enviar al destino →",
    btnPull: "← Traer del destino",
    btnChangeFolder: "Cambiar...",

    // Header toggles & update
    toggleWebKit: "WebKit",
    toggleDelZip: "Borrar .zip",
    toggleWebKitTip: "Usar el visor WebKit (más ligero) en vez del navegador",
    toggleDelZipTip: "Eliminar el .zip tras extraerlo",
    updateChipTip: "Nueva versión disponible. Clic para ver las releases.",
    modsReadyToast: "Carpeta de mods lista y abierta. Cada .js se inyecta al arrancar; recarga con F5.",
    quitTip: "Cerrar el lanzador",

    // Cards
    playedHours: "jugado",
    playedNow: "Jugado ahora",
    playedMin: "Jugado hace %d min",
    playedHoursAgo: "Jugado hace %d h",
    playedDaysAgo: "Jugado hace %d d",
    neverPlayed: "Sin jugar aún",
    incompleteBadge: "Incompleto",
    incompleteNotice: "Descarga incompleta (faltan archivos)",
    
    // Status Bar
    serverActive: "Servidor activo:",
    serverPort: "Puerto",
    serverStopped: "Servidor detenido",
    runtimeReady: "RPG Maker Engine Runtime v0.8.0",

    // Modals
    pluginsTitle: "Plugins",
    pluginsDesc: "Gestión y análisis de compatibilidad de scripts WebKit/nw.js",
    savesTitle: "Gestor de Partidas",
    savesDesc: "Copias de seguridad, restauración y edición de partidas",
    saveEditorTitle: "Editor de Partidas",
    saveEditorWarning: "⚠ Cierra el juego antes de editar: si está abierto, su autoguardado puede sobrescribir tus cambios.",
    saveEditorGold: "Oro del Grupo",
    saveEditorItems: "Objetos",
    saveEditorVariables: "Variables",
    saveEditorSwitches: "Interruptores (Switches)",
    saveEditorGeneral: "General",
    dataTitle: "Navegador de Base de Datos",
    syncTitle: "Sincronización de Partidas",
    syncDestFolder: "Carpeta de destino:",
    syncAutoToggle: "Sincronizar automáticamente al cerrar una partida",
    decryptTitle: "Herramienta de Descifrado",
    decryptNotice: "Descifra archivos .rgssad/.rgss2a/.rgss3a o assets cifrados de RPG Maker MV/MZ.",
    shortcutsTitle: "Atajos de Teclado y Preferencias",
    
    // Toasts
    toastServerStarted: "Servidor iniciado en puerto %d",
    toastServerStopped: "Servidor detenido (%d seg jugados)",
    toastSaved: "Partida guardada con éxito",
    toastSyncDone: "Sincronización completada",
    toastBackupDone: "Copia de seguridad creada",
  },
  en: {
    appTitle: "RPG Maker Launcher",
    subtitle: "RPG Maker & Ren'Py Game Launcher",
    library: "My Library",
    gamesInstalled: "installed games",
    lastSync: "Last sync",
    searchPlaceholder: "Search games...",
    filter: "Filter",
    emptyLibrary: "No games yet.\nPlace .zip files next to the launcher and click Refresh.",
    dragDropZip: "Drop .zip files here to add them!",
    
    // Nav & Actions
    navPlay: "Library",
    navPlugins: "Plugins",
    navSaves: "Saves",
    navData: "Data",
    navMods: "Mods",
    navSync: "Sync",
    navDecrypt: "Decrypt",
    navShortcuts: "Shortcuts",
    navQuit: "Quit",

    btnPlay: "Play",
    btnStopServer: "Stop Server",
    btnRefresh: "Refresh",
    btnSave: "Save Changes",
    btnCancel: "Cancel",
    btnClose: "Close",
    btnBackup: "Backup",
    btnRestore: "Restore",
    btnExport: "Export",
    btnDelete: "Delete",
    btnEnableAll: "All ON",
    btnDisableAll: "All OFF",
    btnPush: "Push to Destination →",
    btnPull: "← Pull from Destination",
    btnChangeFolder: "Change...",

    // Header toggles & update
    toggleWebKit: "WebKit",
    toggleDelZip: "Delete .zip",
    toggleWebKitTip: "Use the WebKit viewer (lighter) instead of the browser",
    toggleDelZipTip: "Delete the .zip after extracting",
    updateChipTip: "New version available. Click to view releases.",
    modsReadyToast: "Mods folder ready and opened. Every .js is injected on launch; reload with F5.",
    quitTip: "Close the launcher",

    // Cards
    playedHours: "played",
    playedNow: "Played just now",
    playedMin: "Played %d min ago",
    playedHoursAgo: "Played %d h ago",
    playedDaysAgo: "Played %d d ago",
    neverPlayed: "Not played yet",
    incompleteBadge: "Incomplete",
    incompleteNotice: "Incomplete download (missing files)",

    // Status Bar
    serverActive: "Active Server:",
    serverPort: "Port",
    serverStopped: "Server stopped",
    runtimeReady: "RPG Maker Engine Runtime v0.8.0",

    // Modals
    pluginsTitle: "Plugins",
    pluginsDesc: "Manage and analyze WebKit / nw.js compatibility",
    savesTitle: "Save Manager",
    savesDesc: "Backups, snapshots, and save editing",
    saveEditorTitle: "Save Editor",
    saveEditorWarning: "⚠ Close the game before editing: autosaves might overwrite your changes.",
    saveEditorGold: "Party Gold",
    saveEditorItems: "Items",
    saveEditorVariables: "Variables",
    saveEditorSwitches: "Switches",
    saveEditorGeneral: "General",
    dataTitle: "Database Browser",
    syncTitle: "Save Sync",
    syncDestFolder: "Destination folder:",
    syncAutoToggle: "Automatically sync saves when closing a game",
    decryptTitle: "Decryption Tool",
    decryptNotice: "Decrypts .rgssad/.rgss2a/.rgss3a and RPG Maker MV/MZ encrypted assets.",
    shortcutsTitle: "Shortcuts & Preferences",

    // Toasts
    toastServerStarted: "Server started on port %d",
    toastServerStopped: "Server stopped (%d sec played)",
    toastSaved: "Save file updated successfully",
    toastSyncDone: "Sync completed",
    toastBackupDone: "Backup created",
  }
};

let currentLang: Lang = 'es';

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
  document.documentElement.lang = lang;
}

export function t(key: keyof typeof translations.es, ...args: (string | number)[]): string {
  const dict = translations[currentLang] || translations.es;
  let text = dict[key] || translations.es[key] || key;
  if (args.length > 0) {
    args.forEach(arg => {
      text = text.replace(/%[ds]/, String(arg));
    });
  }
  return text;
}
