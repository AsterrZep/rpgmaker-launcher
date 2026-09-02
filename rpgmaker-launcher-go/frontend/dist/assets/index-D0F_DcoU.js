var k=Object.defineProperty;var C=(l,e,t)=>e in l?k(l,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):l[e]=t;var p=(l,e,t)=>C(l,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const d of s.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();function L(l,e){return window.go.main.App.BackupSave(l,e)}function T(){return window.go.main.App.CheckUpdate()}function D(l,e){return window.go.main.App.DecryptGameAssets(l,e)}function G(l,e){return window.go.main.App.ExecuteSync(l,e)}function P(){return window.go.main.App.GetConfig()}function j(l,e){return window.go.main.App.GetData(l,e)}function q(l){return window.go.main.App.GetEventHistory(l)}function M(){return window.go.main.App.GetGames()}function A(l){return window.go.main.App.GetPlugins(l)}function _(l,e){return window.go.main.App.GetSaveContent(l,e)}function z(l){return window.go.main.App.GetSaves(l)}function S(){return window.go.main.App.GetStatus()}function O(){return window.go.main.App.GetSyncStatus()}function R(l,e){return window.go.main.App.InstallZips(l,e)}function B(l,e,t){return window.go.main.App.LaunchGame(l,e,t)}function F(l){return window.go.main.App.OpenTarget(l)}function H(l){return window.go.main.App.ReadEncryptionKey(l)}function N(){return window.go.main.App.RescanGames()}function I(l){return window.go.main.App.RestorePlugins(l)}function U(l){return window.go.main.App.SetupMods(l)}function W(){return window.go.main.App.StopGame()}function Z(l){return window.go.main.App.ToggleFavorite(l)}function V(l,e,t,a){return window.go.main.App.TogglePlugins(l,e,t,a)}function K(l){return window.go.main.App.UpdateConfig(l)}function Q(l,e,t){return window.go.main.App.UpdateSaveContent(l,e,t)}class J{async getStatus(){return S()}async getVersion(){return(await S()).version||"1.0.0-go"}async getGames(){const e=await M();return{games:e.games||[],total:e.total||0}}async rescan(e=!1){return N()}async installZips(e,t=!1){return R(e,t)}async toggleFavorite(e,t){return Z(e)}async launchGame(e,t="webkit"){return B(e,"","")}async stopServer(){return W()}async getPlugins(e){return A(e)}async togglePlugins(e,t){return t.action==="restore"?I(e):V(e,t.names||[],t.status??!0,t.all??!1)}async getSaves(e){return z(e)}async getSaveContent(e,t){return _(e,t)}async saveSaveContent(e,t,a){const r=await Q(e,t,a);return{ok:r,message:r?"Partida guardada":"Error al guardar"}}async backupSaves(e){return{ok:!0,backup_path:await L(e,""),timestamp:new Date().toISOString()}}async getData(e,t){return j(e,t)}async getSyncStatus(){return O()}async executeSync(e,t){return G(e,t||"")}async decrypt(e,t=!1){const a=await H(e);if(!a)throw new Error("No se encontró clave de encriptación");const r=await D(e,a);return{ok:!0,output_dir:e,log:JSON.stringify(r)}}async setupMods(e){return U(e)}async openTarget(e){return{ok:await F(e)}}async checkUpdate(){return T()}async getConfig(){return P()}async updateConfig(e){const t=await K(e);return{ok:(t==null?void 0:t.ok)??!0,config:(t==null?void 0:t.config)??e}}listenEvents(e){const t=window;if(t.runtime)return t.runtime.EventsOn("extraction_progress",d=>{var n;return(n=e.onProgress)==null?void 0:n.call(e,d)}),t.runtime.EventsOn("server_started",d=>{var n;return(n=e.onServerStarted)==null?void 0:n.call(e,d)}),t.runtime.EventsOn("server_stopped",d=>{var n;return(n=e.onServerStopped)==null?void 0:n.call(e,d)}),t.runtime.EventsOn("sync_complete",d=>{var n;return(n=e.onSyncComplete)==null?void 0:n.call(e,d)}),t.runtime.EventsOn("game_launched",d=>{var n;return(n=e.onGameLaunched)==null?void 0:n.call(e,d)}),()=>{t.runtime.EventsOff("extraction_progress"),t.runtime.EventsOff("server_started"),t.runtime.EventsOff("server_stopped"),t.runtime.EventsOff("sync_complete"),t.runtime.EventsOff("game_launched")};let a=!0,r=0;return(async()=>{var d,n,c,o,m;for(;a;){try{const h=await q(10);if(h&&h.length>r){for(const g of h.slice(r)){const x=g.event||g.event_type,f=g.data||{};switch(x){case"extraction_progress":(d=e.onProgress)==null||d.call(e,f);break;case"server_started":(n=e.onServerStarted)==null||n.call(e,f);break;case"server_stopped":(c=e.onServerStopped)==null||c.call(e,f);break;case"sync_complete":(o=e.onSyncComplete)==null||o.call(e,f);break;case"game_launched":(m=e.onGameLaunched)==null||m.call(e,f);break}}r=h.length}}catch{}await new Promise(h=>setTimeout(h,2e3))}})(),()=>{a=!1}}}const b=new J,X=Object.freeze(Object.defineProperty({__proto__:null,api:b},Symbol.toStringTag,{value:"Module"})),y={es:{appTitle:"RPG Maker Launcher",subtitle:"Lanzador de juegos de RPG Maker & Ren'Py",library:"Mi Biblioteca",gamesInstalled:"juegos instalados",lastSync:"Última sincronización",searchPlaceholder:"Buscar juegos...",filter:"Filtrar",emptyLibrary:`No hay juegos todavía.
Coloca los archivos .zip junto al lanzador y pulsa Actualizar.`,dragDropZip:"¡Suelta los archivos .zip aquí para añadirlos!",navPlay:"Biblioteca",navPlugins:"Plugins",navSaves:"Partidas",navData:"Datos",navMods:"Mods",navSync:"Sync",navDecrypt:"Descifrar",navShortcuts:"Atajos",navQuit:"Salir",navSettings:"Configuración",btnPlay:"Jugar",btnStopServer:"Detener servidor",btnRefresh:"Actualizar",btnSave:"Guardar Cambios",btnCancel:"Cancelar",btnClose:"Cerrar",btnBackup:"Copia de seguridad",btnRestore:"Restaurar",btnExport:"Exportar",btnDelete:"Borrar",btnEnableAll:"Todo ON",btnDisableAll:"Todo OFF",btnPush:"Enviar al destino →",btnPull:"← Traer del destino",btnChangeFolder:"Cambiar...",btnOpenFolder:"Abrir carpeta",toggleWebKit:"WebKit",toggleDelZip:"Borrar .zip",toggleWebKitTip:"Usar el visor WebKit (más ligero) en vez del navegador",toggleDelZipTip:"Eliminar el .zip tras extraerlo",updateChipTip:"Nueva versión disponible. Clic para ver las releases.",modsReadyToast:"Carpeta de mods lista y abierta. Cada .js se inyecta al arrancar; recarga con F5.",quitTip:"Cerrar el lanzador",settingsTitle:"Configuración",settingsDesc:"Elige la carpeta donde se guardarán los juegos y archivos .zip.",settingsGamesFolder:"Carpeta de juegos:",settingsDefaultFolder:"Por defecto: %s",playedHours:"jugado",playedNow:"Jugado ahora",playedMin:"Jugado hace %d min",playedHoursAgo:"Jugado hace %d h",playedDaysAgo:"Jugado hace %d d",neverPlayed:"Sin jugar aún",incompleteBadge:"Incompleto",incompleteNotice:"Descarga incompleta (faltan archivos)",serverActive:"Servidor activo:",serverPort:"Puerto",serverStopped:"Servidor detenido",runtimeReady:"RPG Maker Engine Runtime v{version}",pluginsTitle:"Plugins",pluginsDesc:"Gestión y análisis de compatibilidad de scripts WebKit/nw.js",savesTitle:"Gestor de Partidas",savesDesc:"Copias de seguridad, restauración y edición de partidas",saveEditorTitle:"Editor de Partidas",saveEditorWarning:"⚠ Cierra el juego antes de editar: si está abierto, su autoguardado puede sobrescribir tus cambios.",saveEditorGold:"Oro del Grupo",saveEditorItems:"Objetos",saveEditorVariables:"Variables",saveEditorSwitches:"Interruptores (Switches)",saveEditorGeneral:"General",dataTitle:"Navegador de Base de Datos",syncTitle:"Sincronización de Partidas",syncDestFolder:"Carpeta de destino:",syncAutoToggle:"Sincronizar automáticamente al cerrar una partida",decryptTitle:"Herramienta de Descifrado",decryptNotice:"Descifra archivos .rgssad/.rgss2a/.rgss3a o assets cifrados de RPG Maker MV/MZ.",shortcutsTitle:"Atajos de Teclado y Preferencias",toastServerStarted:"Servidor iniciado en puerto %d",toastServerStopped:"Servidor detenido (%d seg jugados)",toastSaved:"Partida guardada con éxito",toastSyncDone:"Sincronización completada",toastBackupDone:"Copia de seguridad creada"},en:{appTitle:"RPG Maker Launcher",subtitle:"RPG Maker & Ren'Py Game Launcher",library:"My Library",gamesInstalled:"installed games",lastSync:"Last sync",searchPlaceholder:"Search games...",filter:"Filter",emptyLibrary:`No games yet.
Place .zip files next to the launcher and click Refresh.`,dragDropZip:"Drop .zip files here to add them!",navPlay:"Library",navPlugins:"Plugins",navSaves:"Saves",navData:"Data",navMods:"Mods",navSync:"Sync",navDecrypt:"Decrypt",navShortcuts:"Shortcuts",navQuit:"Quit",navSettings:"Settings",btnPlay:"Play",btnStopServer:"Stop Server",btnRefresh:"Refresh",btnSave:"Save Changes",btnCancel:"Cancel",btnClose:"Close",btnBackup:"Backup",btnRestore:"Restore",btnExport:"Export",btnDelete:"Delete",btnEnableAll:"All ON",btnDisableAll:"All OFF",btnPush:"Push to Destination →",btnPull:"← Pull from Destination",btnChangeFolder:"Change...",btnOpenFolder:"Open Folder",toggleWebKit:"WebKit",toggleDelZip:"Delete .zip",toggleWebKitTip:"Use the WebKit viewer (lighter) instead of the browser",toggleDelZipTip:"Delete the .zip after extracting",updateChipTip:"New version available. Click to view releases.",modsReadyToast:"Mods folder ready and opened. Every .js is injected on launch; reload with F5.",quitTip:"Close the launcher",settingsTitle:"Settings",settingsDesc:"Choose the folder where games and .zip files will be stored.",settingsGamesFolder:"Games folder:",settingsDefaultFolder:"Default: %s",playedHours:"played",playedNow:"Played just now",playedMin:"Played %d min ago",playedHoursAgo:"Played %d h ago",playedDaysAgo:"Played %d d ago",neverPlayed:"Not played yet",incompleteBadge:"Incomplete",incompleteNotice:"Incomplete download (missing files)",serverActive:"Active Server:",serverPort:"Port",serverStopped:"Server stopped",runtimeReady:"RPG Maker Engine Runtime v{version}",pluginsTitle:"Plugins",pluginsDesc:"Manage and analyze WebKit / nw.js compatibility",savesTitle:"Save Manager",savesDesc:"Backups, snapshots, and save editing",saveEditorTitle:"Save Editor",saveEditorWarning:"⚠ Close the game before editing: autosaves might overwrite your changes.",saveEditorGold:"Party Gold",saveEditorItems:"Items",saveEditorVariables:"Variables",saveEditorSwitches:"Switches",saveEditorGeneral:"General",dataTitle:"Database Browser",syncTitle:"Save Sync",syncDestFolder:"Destination folder:",syncAutoToggle:"Automatically sync saves when closing a game",decryptTitle:"Decryption Tool",decryptNotice:"Decrypts .rgssad/.rgss2a/.rgss3a and RPG Maker MV/MZ encrypted assets.",shortcutsTitle:"Shortcuts & Preferences",toastServerStarted:"Server started on port %d",toastServerStopped:"Server stopped (%d sec played)",toastSaved:"Save file updated successfully",toastSyncDone:"Sync completed",toastBackupDone:"Backup created"}};let w="es";function E(){return w}function v(l){w=l,document.documentElement.lang=l}function i(l,...e){let a=(y[w]||y.es)[l]||y.es[l]||l;return e.length>0&&e.forEach(r=>{a=a.replace(/%[ds]/,String(r))}),a}class Y{constructor(e){p(this,"activeTab","library");p(this,"callbacks");this.callbacks=e}setActiveTab(e){this.activeTab=e,this.render()}render(){const e=document.createElement("aside");return e.className="fixed left-0 top-0 h-full w-60 bg-surface-container-lowest z-30 flex flex-col border-r border-border select-none",e.innerHTML=`
      <div class="p-4 mb-2 flex items-center gap-3 border-b border-border/50">
        <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border border-primary/30">
          🎮
        </div>
        <div>
          <span class="font-bold text-headline-md tracking-tight text-text-primary block leading-none">RPG Maker</span>
          <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Launcher</span>
        </div>
      </div>

      <nav class="flex-1 px-3 space-y-1">
        <a data-tab="library" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="library"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[20px]">sports_esports</span>
          <span>${i("navPlay")}</span>
        </a>

        <div class="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-text-faint">
          Herramientas
        </div>

        <a data-tab="plugins" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="plugins"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">extension</span>
          <span>${i("navPlugins")}</span>
        </a>

        <a data-tab="saves" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="saves"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">save</span>
          <span>${i("navSaves")}</span>
        </a>

        <a data-tab="data" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="data"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">database</span>
          <span>${i("navData")}</span>
        </a>

        <a data-tab="sync" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="sync"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">sync</span>
          <span>${i("navSync")}</span>
        </a>

        <a data-tab="decrypt" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="decrypt"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">lock_open</span>
          <span>${i("navDecrypt")}</span>
        </a>
      </nav>

      <div class="p-3 border-t border-border/50">
        <a data-tab="shortcuts" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer text-text-muted hover:bg-surface-container-high hover:text-on-surface">
          <span class="material-symbols-outlined text-[18px]">settings</span>
          <span>${i("shortcutsTitle")}</span>
        </a>
      </div>
    `,e.querySelectorAll(".sidebar-item").forEach(t=>{t.addEventListener("click",a=>{const r=a.currentTarget.dataset.tab;r&&this.callbacks.onNav(r)})}),e}}class ee{constructor(e,t,a){p(this,"callbacks");p(this,"webkit",!0);p(this,"autoDeleteZip",!1);p(this,"version","0.0.0");this.callbacks=e,this.webkit=t,this.autoDeleteZip=a,this.loadVersion()}async loadVersion(){try{this.version=await b.getVersion(),this.updateVersionDisplay()}catch{this.version="0.0.0",this.updateVersionDisplay()}}updateVersionDisplay(){const e=document.querySelector("#app-version");e&&(e.textContent=`v${this.version}`)}setVersion(e){this.version=e,this.updateVersionDisplay()}setUpdateTag(e){const t=document.querySelector("#update-chip");!t||!e||(t.classList.remove("hidden"),t.querySelector("#update-tag").textContent=`↓ ${e}`)}toggle(e,t,a,r){return`
      <label class="hidden sm:flex items-center gap-1.5 cursor-pointer select-none" title="${r}">
        <input type="checkbox" id="${e}" class="peer sr-only" ${t?"checked":""} />
        <span class="relative w-8 h-[18px] rounded-full bg-surface-container-high border border-border peer-checked:bg-primary transition-colors
                     after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-[12px] after:h-[12px] after:rounded-full
                     after:bg-text-muted peer-checked:after:bg-on-primary peer-checked:after:translate-x-[14px] after:transition-transform"></span>
        <span class="text-label-md text-text-muted">${a}</span>
      </label>
    `}render(){var d,n,c,o,m;const e=document.createElement("header");e.className="h-14 shrink-0 bg-surface border-b border-border flex items-center justify-between gap-3 px-6 select-none";const t=E();e.innerHTML=`
      <div class="flex items-center gap-3 shrink-0">
        <span class="font-bold text-headline-md text-primary tracking-tight">RPG Maker Launcher</span>
        <div class="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-primary text-label-sm font-semibold" id="app-version">
          v${this.version}
        </div>
        <button id="update-chip" class="hidden items-center gap-1 bg-primary hover:bg-accent-hover text-on-primary px-2.5 py-1 rounded-lg text-label-md font-bold shadow-md transition-colors">
          <span class="material-symbols-outlined text-[16px]">download</span>
          <span id="update-tag"></span>
        </button>
      </div>

      <div class="flex-1 max-w-md mx-2 min-w-[120px]">
        <div class="relative flex items-center">
          <span class="material-symbols-outlined absolute left-3 text-text-faint text-[18px]">search</span>
          <input
            id="search-input"
            class="w-full bg-surface-container border border-border rounded-lg py-1.5 pl-9 pr-3 text-body-md text-on-surface placeholder:text-text-faint focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors"
            placeholder="${i("searchPlaceholder")}"
            type="text"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        ${this.toggle("toggle-webkit",this.webkit,i("toggleWebKit"),i("toggleWebKitTip"))}
        ${this.toggle("toggle-del-zip",this.autoDeleteZip,i("toggleDelZip"),i("toggleDelZipTip"))}

        <button id="btn-refresh-zips" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-3 py-1.5 rounded-lg border border-border text-on-surface text-label-md font-medium transition-colors" title="${i("btnRefresh")}">
          <span class="material-symbols-outlined text-[16px] text-primary">refresh</span>
          <span>${i("btnRefresh")}</span>
        </button>

        <button id="btn-settings" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg border border-border text-on-surface text-label-md font-semibold transition-colors cursor-pointer" title="${i("navSettings")}">
          <span class="material-symbols-outlined text-[16px] text-text-muted">settings</span>
          <span>${i("navSettings")}</span>
        </button>

        <button id="btn-lang" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg border border-border text-on-surface text-label-md font-semibold transition-colors cursor-pointer" title="ES / EN">
          <span class="material-symbols-outlined text-[16px] text-text-muted">translate</span>
          <span>${t.toUpperCase()}</span>
        </button>
      </div>
    `;const a=e.querySelector("#search-input");let r;a==null||a.addEventListener("input",h=>{const g=h.target.value;window.clearTimeout(r),r=window.setTimeout(()=>{this.callbacks.onSearch(g)},150)}),(d=e.querySelector("#btn-refresh-zips"))==null||d.addEventListener("click",()=>{this.callbacks.onRefresh()}),(n=e.querySelector("#btn-lang"))==null||n.addEventListener("click",()=>{const h=E()==="es"?"en":"es";v(h),this.callbacks.onLanguageChange(h)}),(c=e.querySelector("#btn-settings"))==null||c.addEventListener("click",()=>{this.callbacks.onSettingsClick()}),(o=e.querySelector("#toggle-webkit"))==null||o.addEventListener("change",h=>{this.webkit=h.target.checked,this.callbacks.onToggleWebKit(this.webkit)}),(m=e.querySelector("#toggle-del-zip"))==null||m.addEventListener("change",h=>{this.autoDeleteZip=h.target.checked,this.callbacks.onToggleDelZip(this.autoDeleteZip)});const s=e.querySelector("#update-chip");return s==null||s.addEventListener("click",()=>this.callbacks.onUpdateClick()),e}}class te{constructor(e,t,a){p(this,"game");p(this,"isSelected");p(this,"callbacks");p(this,"_el",null);this.game=e,this.isSelected=t,this.callbacks=a}formatLastPlayed(e){if(!e)return i("neverPlayed");const t=Date.now()/1e3-e;return t<60?i("playedNow"):t<3600?i("playedMin",Math.floor(t/60)):t<86400?i("playedHoursAgo",Math.floor(t/3600)):t<7*86400?i("playedDaysAgo",Math.floor(t/86400)):new Date(e*1e3).toLocaleDateString()}formatHours(e){const t=Math.floor(e/3600),a=Math.floor(e%3600/60);return t>0&&a>0?`${t}h ${a}m`:t>0?`${t}h`:a>0?`${a}m`:"0m"}getEngineBadgeClass(e){switch(e){case"MZ":return"bg-accent-soft text-primary";case"MV":return"bg-secondary-container text-on-secondary-container";case"XP":case"VX":case"VXAce":return"bg-surface-variant text-text-muted";case"renpy":return"bg-status-success/20 text-status-success";default:return"bg-surface-variant text-text-muted"}}render(){const e=document.createElement("div");this.game.is_incomplete,this.applySelectionClass(e);const t=`<div class="w-full h-full flex items-center justify-center bg-surface-container-high text-primary font-black text-3xl select-none">${this.game.name.charAt(0).toUpperCase()}</div>`;e.innerHTML=`
      <!-- Favorite Star Badge -->
      <button class="btn-favorite absolute top-2 right-2 z-10 w-6 h-6 bg-surface-container-lowest hover:bg-surface-container-highest rounded-full flex items-center justify-center shadow-md transition-colors" title="Favorito">
        <span class="material-symbols-outlined text-[15px] ${this.game.favorite?"text-status-warning":"text-text-faint hover:text-status-warning"}" style="${this.game.favorite?"font-variation-settings: 'FILL' 1;":""}">star</span>
      </button>

      <!-- Cover -->
      <div class="w-[150px] h-[104px] mx-auto rounded-lg overflow-hidden shadow-sm mb-2 bg-surface-variant relative shrink-0">
        ${t}
        <div class="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-center pb-2">
          <span class="material-symbols-outlined text-primary text-[24px]">play_circle</span>
        </div>
      </div>

      <!-- Info -->
      <div class="flex-1 flex flex-col min-w-0 justify-between">
        <div>
          <h3 class="text-[13px] font-bold text-on-surface truncate leading-tight group-hover:text-primary transition-colors" title="${this.game.name}">
            ${this.game.name}
          </h3>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="px-1.5 py-[1px] rounded text-[9px] font-bold uppercase tracking-wider ${this.getEngineBadgeClass(this.game.engine)}">
              ${this.game.engine}
            </span>
            <span class="text-[10px] text-text-faint truncate">
              ${this.formatHours(this.game.seconds)}
            </span>
          </div>
        </div>

        <div class="text-[10px] text-text-muted flex items-center gap-1.5 truncate mt-1">
          <span class="w-1.5 h-1.5 rounded-full ${this.game.last_played?"bg-status-success":"bg-surface-variant"} shrink-0"></span>
          <span class="truncate">${this.formatLastPlayed(this.game.last_played)}</span>
        </div>
      </div>
    `,e.addEventListener("click",()=>{this.callbacks.onSelect(this.game)}),e.addEventListener("dblclick",()=>{this.game.is_incomplete||this.callbacks.onLaunch(this.game)});const a=e.querySelector(".btn-favorite");return a==null||a.addEventListener("click",r=>{r.stopPropagation(),this.callbacks.onFavorite(this.game,r)}),e}applySelectionClass(e){const t=e||this._el;if(!t)return;this._el=t;const a=this.game.is_incomplete;t.className=`group relative flex flex-col h-[218px] w-[178px] p-3 rounded-xl transition duration-200 select-none cursor-pointer border ${this.isSelected?"bg-card-selected border-primary ring-1 ring-primary/50 shadow-lg shadow-primary/10":"bg-surface-container hover:bg-card-hover border-border hover:border-primary/40 hover:-translate-y-0.5 shadow-md"} ${a?"opacity-60 grayscale hover:grayscale-0":""}`}setSelected(e){this.isSelected=e,this.applySelectionClass()}}class re{constructor(e){p(this,"selectedGame",null);p(this,"isServerRunning",!1);p(this,"callbacks");this.callbacks=e}update(e,t){this.selectedGame=e,this.isServerRunning=t,this.render()}render(){var r,s,d,n,c,o,m,h,g,x;const e=document.createElement("div");e.className="w-full shrink-0 bg-surface-container-highest/95 border-t border-border px-6 py-2.5 flex items-center justify-between select-none shadow-2xl";const t=this.selectedGame&&!this.selectedGame.is_incomplete,a=this.selectedGame&&this.selectedGame.is_web;return e.innerHTML=`
      <div class="flex items-center gap-2">
        <!-- Play Button -->
        <button
          id="btn-play"
          class="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-headline-md transition shadow-md ${t?"bg-primary hover:bg-accent-hover text-on-primary cursor-pointer hover:shadow-primary/20 hover:scale-[1.02]":"bg-surface-variant text-text-faint cursor-not-allowed opacity-60"}"
          ${t?"":"disabled"}
        >
          <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
          <span>${i("btnPlay")}</span>
        </button>

        <div class="w-px h-6 bg-border mx-2"></div>

        <!-- Tool Buttons -->
        <button
          id="btn-plugins"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${a?"bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50":"bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50"}"
          ${a?"":"disabled"}
          title="${a?"Gestor de plugins":"Solo disponible para juegos MZ/MV"}"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">extension</span>
          <span>${i("navPlugins")}</span>
        </button>

        <button
          id="btn-saves"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${this.selectedGame?"bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50":"bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50"}"
          ${this.selectedGame?"":"disabled"}
          title="Gestor de partidas guardadas"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">save</span>
          <span>${i("navSaves")}</span>
        </button>

        <button
          id="btn-data"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${a?"bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50":"bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50"}"
          ${a?"":"disabled"}
          title="Navegador de base de datos"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">database</span>
          <span>${i("navData")}</span>
        </button>

        <button
          id="btn-mods"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${a?"bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50":"bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50"}"
          ${a?"":"disabled"}
          title="${a?"Carpeta de mods del juego":"Solo disponible para juegos MZ/MV"}"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">code_blocks</span>
          <span>${i("navMods")}</span>
        </button>

        <button
          id="btn-sync"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold bg-surface hover:bg-surface-container-low text-text-primary border border-border/60 hover:border-primary/50 transition-colors"
          title="Sincronización de partidas"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">sync</span>
          <span>${i("navSync")}</span>
        </button>

        <button
          id="btn-decrypt"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold bg-surface hover:bg-surface-container-low text-text-primary border border-border/60 hover:border-primary/50 transition-colors"
          title="Herramienta de descifrado"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">lock_open</span>
          <span>${i("navDecrypt")}</span>
        </button>
      </div>

      <!-- Right Group: Stop Server & Settings -->
      <div class="flex items-center gap-2">
        <button
          id="btn-stop-server"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition ${this.isServerRunning?"bg-error-container hover:bg-status-error text-on-error-container hover:text-white cursor-pointer shadow-sm":"bg-surface/30 text-text-faint border border-border/30 cursor-not-allowed opacity-40"}"
          ${this.isServerRunning?"":"disabled"}
        >
          <span class="material-symbols-outlined text-[16px]">stop_circle</span>
          <span>${i("btnStopServer")}</span>
        </button>

        <button
          id="btn-shortcuts"
          class="p-2 rounded-lg bg-surface hover:bg-surface-container-low text-text-muted hover:text-on-surface border border-border/60 transition-colors"
          title="${i("shortcutsTitle")}"
        >
          <span class="material-symbols-outlined text-[18px]">keyboard</span>
        </button>

        <button
          id="btn-quit"
          class="p-2 rounded-lg bg-surface hover:bg-error-container text-text-muted hover:text-status-error border border-border/60 transition-colors"
          title="${i("quitTip")}"
        >
          <span class="material-symbols-outlined text-[18px]">power_settings_new</span>
        </button>
      </div>
    `,(r=e.querySelector("#btn-play"))==null||r.addEventListener("click",()=>this.callbacks.onPlay()),(s=e.querySelector("#btn-plugins"))==null||s.addEventListener("click",()=>this.callbacks.onPlugins()),(d=e.querySelector("#btn-saves"))==null||d.addEventListener("click",()=>this.callbacks.onSaves()),(n=e.querySelector("#btn-data"))==null||n.addEventListener("click",()=>this.callbacks.onData()),(c=e.querySelector("#btn-mods"))==null||c.addEventListener("click",()=>this.callbacks.onMods()),(o=e.querySelector("#btn-sync"))==null||o.addEventListener("click",()=>this.callbacks.onSync()),(m=e.querySelector("#btn-decrypt"))==null||m.addEventListener("click",()=>this.callbacks.onDecrypt()),(h=e.querySelector("#btn-stop-server"))==null||h.addEventListener("click",()=>this.callbacks.onStopServer()),(g=e.querySelector("#btn-shortcuts"))==null||g.addEventListener("click",()=>this.callbacks.onShortcuts()),(x=e.querySelector("#btn-quit"))==null||x.addEventListener("click",()=>this.callbacks.onQuit()),e}}class ae{constructor(){p(this,"activeGame",null);p(this,"activePort",null);p(this,"version","0.0.0")}setVersion(e){this.version=e,this.render()}update(e,t){this.activeGame=e,this.activePort=t,this.render()}render(){const e=document.createElement("footer");e.className="h-7 shrink-0 w-full bg-surface-container-lowest border-t border-border flex items-center justify-between px-6 select-none text-[11px]";const t=se(this.activeGame&&this.activePort);return e.innerHTML=`
      <div class="flex items-center gap-2">
        <span class="flex h-2 w-2 rounded-full ${t?"bg-status-success animate-pulse-fast":"bg-surface-variant"}"></span>
        <span class="text-text-muted">
          ${t?`<span class="text-text-faint">${i("serverActive")}</span> <span class="font-semibold text-primary">${this.activeGame}</span> <span class="text-text-faint">(${i("serverPort")} ${this.activePort})</span>`:`<span class="text-text-faint">${i("serverStopped")}</span>`}
        </span>
      </div>
      <div class="text-text-faint font-medium">
        ${i("runtimeReady").replace("{version}",this.version)}
      </div>
    `,e}}function se(l){return!!l}class ne{constructor(){p(this,"container");this.container=document.createElement("div"),this.container.className="fixed bottom-12 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none",document.body.appendChild(this.container)}show(e,t="info",a=3500){const r=document.createElement("div");r.className=`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-body-md transition duration-300 translate-y-2 opacity-0 ${t==="success"?"bg-surface-container-high border-status-success/40 text-on-surface":t==="error"?"bg-surface-container-high border-status-error/40 text-on-surface":t==="warning"?"bg-surface-container-high border-status-warning/40 text-on-surface":"bg-surface-container-high border-border text-on-surface"}`;const s={info:"info",success:"check_circle",warning:"warning",error:"error"},d={info:"text-primary",success:"text-status-success",warning:"text-status-warning",error:"text-status-error"};r.innerHTML=`
      <span class="material-symbols-outlined text-[20px] ${d[t]}">${s[t]}</span>
      <span class="flex-1 font-medium">${e}</span>
    `,this.container.appendChild(r),requestAnimationFrame(()=>{r.classList.remove("translate-y-2","opacity-0")}),setTimeout(()=>{r.classList.add("opacity-0","translate-y-2"),setTimeout(()=>r.remove(),300)},a)}}const u=new ne;class oe{constructor(e){p(this,"game");p(this,"plugins",[]);p(this,"hasBackup",!1);p(this,"modalEl",null);this.game=e}async open(){var e,t,a;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[680px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-container-low shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-primary text-[24px]">extension</span>
            <div>
              <h2 class="font-bold text-headline-md text-text-primary">Plugins · ${this.game.name}</h2>
              <p class="text-[11px] text-text-muted">Compatibilidad y rendimiento en WebKit</p>
            </div>
          </div>
          <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Table Content -->
        <div class="flex-1 overflow-y-auto px-6 py-3 custom-scrollbar" id="plugins-table-container">
          <div class="flex items-center justify-center h-full text-text-muted">Cargando plugins...</div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <button id="btn-toggle-all-on" class="px-2.5 py-1 rounded bg-surface hover:bg-surface-container-high text-text-primary text-[11px] font-semibold border border-border transition-colors">
              ${i("btnEnableAll")}
            </button>
            <button id="btn-toggle-all-off" class="px-2.5 py-1 rounded bg-surface hover:bg-surface-container-high text-text-primary text-[11px] font-semibold border border-border transition-colors">
              ${i("btnDisableAll")}
            </button>
            <button id="btn-restore-plugins" class="px-2.5 py-1 rounded bg-surface hover:bg-surface-container-high text-status-warning text-[11px] font-semibold border border-border transition-colors">
              ${i("btnRestore")}
            </button>
          </div>

          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${i("btnClose")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(r=>{r.addEventListener("click",()=>this.close())}),(e=this.modalEl.querySelector("#btn-toggle-all-on"))==null||e.addEventListener("click",()=>this.toggleAll(!0)),(t=this.modalEl.querySelector("#btn-toggle-all-off"))==null||t.addEventListener("click",()=>this.toggleAll(!1)),(a=this.modalEl.querySelector("#btn-restore-plugins"))==null||a.addEventListener("click",()=>this.restoreOriginal()),await this.loadData()}async loadData(){var e;try{const t=await b.getPlugins(this.game.name);this.plugins=t.plugins,this.hasBackup=t.has_backup,this.renderTable()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#plugins-table-container");a&&(a.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar plugins: ${t.message}</div>`)}}renderTable(){var a;const e=(a=this.modalEl)==null?void 0:a.querySelector("#plugins-table-container");if(!e)return;if(this.plugins.length===0){e.innerHTML='<div class="p-6 text-center text-text-muted">No se encontraron plugins en este juego.</div>';return}const t=this.plugins.map((r,s)=>{let d="bg-status-success/15 text-status-success",n="OK";return r.category==="nw_protegido"||r.category==="nw-protegido"?(d="bg-status-warning/15 text-status-warning",n="NW PROTECTED"):r.category==="roto"?(d="bg-status-error/15 text-status-error",n="BROKEN"):(r.category==="sin_fichero"||r.category==="sin-fichero")&&(d="bg-surface-variant text-text-faint",n="MISSING"),`
        <tr class="hover:bg-card-hover border-b border-border/40 transition-colors group">
          <td class="py-2.5 pr-4">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-text-faint group-hover:text-primary">javascript</span>
              <span class="font-medium text-body-md text-on-surface truncate max-w-[280px]" title="${r.name}">
                ${r.name}.js
              </span>
            </div>
            ${r.motivos.length>0?`<div class="text-[10px] text-text-faint pl-6">${r.motivos.join(", ")}</div>`:""}
          </td>
          <td class="py-2.5 text-center w-20">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" data-index="${s}" class="sr-only peer plugin-toggle" ${r.status?"checked":""} />
              <div class="w-8 h-4 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform peer-checked:bg-primary"></div>
            </label>
          </td>
          <td class="py-2.5 text-right w-36">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${d}">
              ${n}
            </span>
          </td>
        </tr>
      `}).join("");e.innerHTML=`
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">Plugin</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">Estado</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">WebKit</th>
          </tr>
        </thead>
        <tbody>
          ${t}
        </tbody>
      </table>
    `,e.querySelectorAll(".plugin-toggle").forEach(r=>{r.addEventListener("change",async s=>{const d=s.target,n=parseInt(d.dataset.index||"0",10),c=this.plugins[n],o=d.checked;c.status=o;try{await b.togglePlugins(this.game.name,{names:[c.name],status:o}),u.show(`Plugin ${c.name} ${o?"activado":"desactivado"}`,"success",2e3)}catch(m){u.show(`Error: ${m.message}`,"error"),d.checked=!o,c.status=!o}})})}async toggleAll(e){try{await b.togglePlugins(this.game.name,{all:!0,status:e}),this.plugins.forEach(t=>t.status=e),this.renderTable(),u.show(`Todos los plugins ${e?"activados":"desactivados"}`,"success")}catch(t){u.show(`Error: ${t.message}`,"error")}}async restoreOriginal(){try{await b.togglePlugins(this.game.name,{action:"restore"}),u.show("Plugins restaurados desde la copia original","success"),await this.loadData()}catch(e){u.show(`Error restaurando plugins: ${e.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class ie{constructor(e,t){p(this,"game");p(this,"filename");p(this,"saveContent",null);p(this,"activeTab","general");p(this,"modalEl",null);p(this,"gold",0);p(this,"items",{});p(this,"variables",{});p(this,"switches",{});this.game=e,this.filename=t}async open(){var e;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[760px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[540px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex flex-col border-b border-border bg-surface-container-low shrink-0">
          <div class="flex items-center justify-between px-6 py-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[22px]">edit_document</span>
              <h2 class="font-bold text-headline-md text-text-primary">
                ${i("saveEditorTitle")} · <span class="text-primary font-mono text-sm">${this.filename}</span>
              </h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Warning Banner -->
          <div class="bg-status-warning/10 border-t border-b border-status-warning/20 px-6 py-2 flex items-center gap-2.5 text-status-warning text-[11px] font-medium">
            <span class="material-symbols-outlined text-[16px] shrink-0">warning</span>
            <span>${i("saveEditorWarning")}</span>
          </div>

          <!-- Summary Stats -->
          <div id="save-summary-bar" class="px-6 py-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-faint bg-surface-container-lowest border-b border-border/50">
            <span>Cargando datos...</span>
          </div>

          <!-- Tabs -->
          <div class="flex px-6 pt-2 gap-2 bg-surface-container-low/50">
            <button data-tab="general" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-primary text-primary transition-colors">
              ${i("saveEditorGeneral")}
            </button>
            <button data-tab="items" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${i("saveEditorItems")}
            </button>
            <button data-tab="variables" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${i("saveEditorVariables")}
            </button>
            <button data-tab="switches" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${i("saveEditorSwitches")}
            </button>
          </div>
        </div>

        <!-- Tab Body Content -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-surface" id="editor-tab-content">
          <div class="flex items-center justify-center h-full text-text-muted">Cargando partida...</div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-end gap-3 shrink-0">
          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${i("btnCancel")}
          </button>
          <button id="btn-save-savegame" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">save</span>
            <span>${i("btnSave")}</span>
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(t=>{t.addEventListener("click",()=>this.close())}),(e=this.modalEl.querySelector("#btn-save-savegame"))==null||e.addEventListener("click",()=>this.saveChanges()),this.modalEl.querySelectorAll(".tab-btn").forEach(t=>{t.addEventListener("click",a=>{var s;const r=a.currentTarget.dataset.tab;r&&(this.activeTab=r,(s=this.modalEl)==null||s.querySelectorAll(".tab-btn").forEach(d=>{d.classList.remove("border-primary","text-primary"),d.classList.add("border-transparent","text-text-muted")}),a.currentTarget.classList.add("border-primary","text-primary"),a.currentTarget.classList.remove("border-transparent","text-text-muted"),this.renderTabContent())})}),await this.loadData()}async loadData(){var e;try{const t=await b.getSaveContent(this.game.name,this.filename);this.saveContent=t,this.gold=t.gold,this.items={...t.items},this.variables={...t.variables},this.switches={...t.switches},this.renderSummary(),this.renderTabContent()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#editor-tab-content");a&&(a.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar la partida: ${t.message}</div>`)}}renderSummary(){var t;const e=(t=this.modalEl)==null?void 0:t.querySelector("#save-summary-bar");!e||!this.saveContent||(e.innerHTML=`
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-status-warning">monetization_on</span> Oro: <strong class="text-text-primary font-mono">${this.gold.toLocaleString()}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">category</span> Objetos: <strong class="text-text-primary">${Object.keys(this.items).length}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">data_object</span> Variables: <strong class="text-text-primary">${Object.keys(this.variables).length}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">toggle_on</span> Switches: <strong class="text-text-primary">${Object.values(this.switches).filter(Boolean).length}</strong></span>
    `)}renderTabContent(){var t,a,r,s,d;const e=(t=this.modalEl)==null?void 0:t.querySelector("#editor-tab-content");if(!(!e||!this.saveContent)){if(this.activeTab==="general"){e.innerHTML=`
        <div class="flex flex-col gap-6 max-w-md">
          <div class="flex flex-col gap-2">
            <label class="text-label-md font-semibold text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-status-warning text-[18px]">monetization_on</span>
              <span>${i("saveEditorGold")}</span>
            </label>
            <div class="flex items-center gap-3">
              <input
                id="input-gold"
                class="w-full bg-surface-container border border-border rounded-lg py-2 px-3 text-headline-lg font-bold font-mono text-primary focus:outline-none focus:border-primary"
                type="number"
                min="0"
                max="99999999"
                value="${this.gold}"
              />
            </div>
            <div class="flex items-center gap-2 mt-1">
              <button id="btn-gold-add-1k" class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-border text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors">
                +1,000
              </button>
              <button id="btn-gold-add-50k" class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-border text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors">
                +50,000
              </button>
              <button id="btn-gold-max" class="px-2.5 py-1 rounded bg-accent-soft hover:bg-primary text-primary hover:text-white border border-primary/40 text-[11px] font-bold transition-colors">
                MAX (99,999,999)
              </button>
            </div>
          </div>

          ${this.saveContent.actors.length>0?`
            <div>
              <label class="text-label-md font-semibold text-text-primary flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-primary text-[18px]">group</span>
                <span>Personajes en la partida</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                ${this.saveContent.actors.map(c=>`
                  <div class="p-2.5 rounded-lg bg-surface-container border border-border flex items-center justify-between">
                    <div>
                      <div class="font-bold text-body-md text-on-surface">${c.name}</div>
                      <div class="text-[10px] text-text-faint">Nivel ${c.level}</div>
                    </div>
                    <div class="text-right text-[11px] font-mono text-primary">
                      HP ${c.hp} / MP ${c.mp}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          `:""}
        </div>
      `;const n=e.querySelector("#input-gold");n==null||n.addEventListener("input",c=>{this.gold=parseInt(c.target.value||"0",10),this.renderSummary()}),(a=e.querySelector("#btn-gold-add-1k"))==null||a.addEventListener("click",()=>{this.gold=Math.min(99999999,this.gold+1e3),n.value=String(this.gold),this.renderSummary()}),(r=e.querySelector("#btn-gold-add-50k"))==null||r.addEventListener("click",()=>{this.gold=Math.min(99999999,this.gold+5e4),n.value=String(this.gold),this.renderSummary()}),(s=e.querySelector("#btn-gold-max"))==null||s.addEventListener("click",()=>{this.gold=99999999,n.value=String(this.gold),this.renderSummary()})}else if(this.activeTab==="items"){const n=Object.entries(this.items);e.innerHTML=`
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <input id="search-items-filter" placeholder="Buscar ID de objeto..." class="w-64 bg-surface-container border border-border rounded-lg py-1 px-3 text-body-md text-on-surface focus:outline-none focus:border-primary" />
            <div class="flex items-center gap-2">
              <input id="input-new-item-id" placeholder="ID" type="number" class="w-16 bg-surface-container border border-border rounded-lg py-1 px-2 text-body-md text-on-surface text-center" />
              <input id="input-new-item-qty" placeholder="Cant" type="number" value="10" class="w-16 bg-surface-container border border-border rounded-lg py-1 px-2 text-body-md text-on-surface text-center" />
              <button id="btn-add-item" class="px-3 py-1 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-semibold transition-colors">
                + Añadir
              </button>
            </div>
          </div>

          <div class="border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
            <table class="w-full text-left border-collapse" id="items-table">
              <thead class="sticky top-0 bg-surface-container-high border-b border-border z-10">
                <tr>
                  <th class="py-2 px-3 text-[11px] font-bold text-text-muted uppercase">ID Objeto</th>
                  <th class="py-2 px-3 text-[11px] font-bold text-text-muted uppercase text-center">Cantidad</th>
                  <th class="py-2 px-3 text-[11px] font-bold text-text-muted uppercase text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                ${n.length>0?n.map(([c,o])=>`
                  <tr class="hover:bg-card-hover border-b border-border/30 item-row" data-id="${c}">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${c}</td>
                    <td class="py-2 px-3 text-center">
                      <input type="number" min="0" max="99" value="${o}" data-id="${c}" class="item-qty-input w-20 text-center bg-surface-container border border-border rounded py-0.5 px-1 font-mono text-on-surface focus:outline-none focus:border-primary" />
                    </td>
                    <td class="py-2 px-3 text-right">
                      <button data-id="${c}" class="btn-delete-item text-text-faint hover:text-status-error transition-colors p-1">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="3" class="p-4 text-center text-text-muted">No hay objetos en el inventario</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,e.querySelectorAll(".item-qty-input").forEach(c=>{c.addEventListener("change",o=>{const m=o.target,h=m.dataset.id;this.items[h]=parseInt(m.value||"0",10),this.renderSummary()})}),e.querySelectorAll(".btn-delete-item").forEach(c=>{c.addEventListener("click",o=>{const m=o.currentTarget.dataset.id;delete this.items[m],this.renderSummary(),this.renderTabContent()})}),(d=e.querySelector("#btn-add-item"))==null||d.addEventListener("click",()=>{const c=e.querySelector("#input-new-item-id"),o=e.querySelector("#input-new-item-qty"),m=c.value.trim(),h=parseInt(o.value||"1",10);m&&(this.items[m]=h,this.renderSummary(),this.renderTabContent())})}else if(this.activeTab==="variables"){const n=Object.entries(this.variables);e.innerHTML=`
        <div class="flex flex-col gap-3">
          <input id="search-variables-filter" placeholder="Buscar ID o valor de variable..." class="w-64 bg-surface-container border border-border rounded-lg py-1 px-3 text-body-md text-on-surface focus:outline-none focus:border-primary" />

          <div class="border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-surface-container-high border-b border-border z-10">
                <tr>
                  <th class="py-2 px-3 text-[11px] font-bold text-text-muted uppercase w-24">ID</th>
                  <th class="py-2 px-3 text-[11px] font-bold text-text-muted uppercase">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${n.length>0?n.map(([c,o])=>`
                  <tr class="hover:bg-card-hover border-b border-border/30">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${c}</td>
                    <td class="py-2 px-3">
                      <input type="text" value="${o}" data-id="${c}" class="var-val-input w-full bg-surface-container border border-border rounded py-0.5 px-2 font-mono text-body-md text-on-surface focus:outline-none focus:border-primary" />
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="2" class="p-4 text-center text-text-muted">No hay variables activas</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,e.querySelectorAll(".var-val-input").forEach(c=>{c.addEventListener("change",o=>{const m=o.target,h=m.dataset.id,g=Number(m.value);this.variables[h]=isNaN(g)?m.value:g,this.renderSummary()})})}else if(this.activeTab==="switches"){const n=Object.entries(this.switches);e.innerHTML=`
        <div class="flex flex-col gap-3">
          <input id="search-switches-filter" placeholder="Buscar interruptor..." class="w-64 bg-surface-container border border-border rounded-lg py-1 px-3 text-body-md text-on-surface focus:outline-none focus:border-primary" />

          <div class="border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-surface-container-high border-b border-border z-10">
                <tr>
                  <th class="py-2 px-3 text-[11px] font-bold text-text-muted uppercase w-24">ID</th>
                  <th class="py-2 px-3 text-[11px] font-bold text-text-muted uppercase text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${n.length>0?n.map(([c,o])=>`
                  <tr class="hover:bg-card-hover border-b border-border/30">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${c}</td>
                    <td class="py-2 px-3 text-center">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" data-id="${c}" class="sr-only peer switch-toggle" ${o?"checked":""} />
                        <div class="w-8 h-4 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform peer-checked:bg-primary"></div>
                      </label>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="2" class="p-4 text-center text-text-muted">No hay switches activos</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,e.querySelectorAll(".switch-toggle").forEach(c=>{c.addEventListener("change",o=>{const m=o.target,h=m.dataset.id;this.switches[h]=m.checked,this.renderSummary()})})}}}async saveChanges(){try{await b.saveSaveContent(this.game.name,this.filename,{gold:this.gold,items:this.items,variables:this.variables,switches:this.switches}),u.show("Partida guardada con copia de seguridad","success"),this.close()}catch(e){u.show(`Error guardando partida: ${e.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class le{constructor(e){p(this,"game");p(this,"saves",[]);p(this,"selectedSave",null);p(this,"modalEl",null);this.game=e}async open(){var e,t;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[640px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-container-low shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-primary text-[24px]">save</span>
            <div>
              <h2 class="font-bold text-headline-md text-text-primary">${i("savesTitle")} · ${this.game.name}</h2>
              <p class="text-[11px] text-text-muted">${i("savesDesc")}</p>
            </div>
          </div>
          <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Table Content -->
        <div class="flex-1 overflow-y-auto px-6 py-3 custom-scrollbar" id="saves-table-container">
          <div class="flex items-center justify-center h-full text-text-muted">Cargando partidas...</div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <button id="btn-backup-saves" class="px-3 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
              <span class="material-symbols-outlined text-[16px]">backup</span>
              <span>${i("btnBackup")}</span>
            </button>

            <button id="btn-edit-save" class="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-symbols-outlined text-[16px]">edit</span>
              <span>Editar contenido</span>
            </button>
          </div>

          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${i("btnClose")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(a=>{a.addEventListener("click",()=>this.close())}),(e=this.modalEl.querySelector("#btn-backup-saves"))==null||e.addEventListener("click",()=>this.createBackup()),(t=this.modalEl.querySelector("#btn-edit-save"))==null||t.addEventListener("click",()=>this.openEditor()),await this.loadData()}async loadData(){var e;try{const t=await b.getSaves(this.game.name);this.saves=t.saves,this.selectedSave=this.saves[0]||null,this.renderTable(),this.updateEditButtonState()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#saves-table-container");a&&(a.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar partidas: ${t.message}</div>`)}}updateEditButtonState(){var t;const e=(t=this.modalEl)==null?void 0:t.querySelector("#btn-edit-save");e&&(e.disabled=!this.selectedSave)}renderTable(){var a;const e=(a=this.modalEl)==null?void 0:a.querySelector("#saves-table-container");if(!e)return;if(this.saves.length===0){e.innerHTML=`
        <div class="flex flex-col items-center justify-center h-full text-center p-6">
          <span class="material-symbols-outlined text-[48px] text-text-faint mb-2">folder_open</span>
          <p class="text-body-md text-text-muted">Aún no hay partidas guardadas en este juego.</p>
          <p class="text-[11px] text-text-faint mt-1">Guarda partida dentro del juego para verla aquí.</p>
        </div>
      `;return}const t=this.saves.map(r=>{var d;const s=((d=this.selectedSave)==null?void 0:d.name)===r.name;return`
        <tr data-name="${r.name}" class="save-row cursor-pointer transition-colors border-b border-border/40 ${s?"bg-card-selected text-primary font-semibold":"hover:bg-card-hover text-on-surface"}">
          <td class="py-2.5 pr-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] ${s?"text-primary":"text-text-faint"}">description</span>
            <span class="truncate max-w-[220px]">${r.name}</span>
          </td>
          <td class="py-2.5 text-center text-text-muted w-24">${r.size_kb} KB</td>
          <td class="py-2.5 text-right text-text-muted w-36">${r.mtime_str}</td>
        </tr>
      `}).join("");e.innerHTML=`
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">Archivo</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">Tamaño</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Modificado</th>
          </tr>
        </thead>
        <tbody>
          ${t}
        </tbody>
      </table>
    `,e.querySelectorAll(".save-row").forEach(r=>{r.addEventListener("click",s=>{const d=s.currentTarget.dataset.name;this.selectedSave=this.saves.find(n=>n.name===d)||null,this.renderTable(),this.updateEditButtonState()}),r.addEventListener("dblclick",()=>{this.openEditor()})})}async createBackup(){try{const e=await b.backupSaves(this.game.name);u.show(`Copia de seguridad creada en snapshot-${e.timestamp}`,"success")}catch(e){u.show(`Error creando copia: ${e.message}`,"error")}}openEditor(){if(!this.selectedSave)return;new ie(this.game,this.selectedSave.name).open()}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class de{constructor(e){p(this,"game");p(this,"currentCategory","Items");p(this,"items",[]);p(this,"searchQuery","");p(this,"modalEl",null);this.game=e}async open(){this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[760px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">database</span>
              <h2 class="font-bold text-headline-md text-text-primary">${i("dataTitle")} · ${this.game.name}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Controls: Category & Search -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-label-md text-text-muted">
              <span>Categoría:</span>
              <select id="select-category" class="bg-surface border border-border rounded-lg py-1 px-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary">
                <option value="Items">Objetos</option>
                <option value="Weapons">Armas</option>
                <option value="Armors">Defensas</option>
                <option value="Skills">Habilidades</option>
                <option value="Enemies">Enemigos</option>
              </select>
            </div>

            <div class="flex-1 relative flex items-center">
              <span class="material-symbols-outlined absolute left-2.5 text-text-faint text-[16px]">search</span>
              <input
                id="data-search-input"
                class="w-full bg-surface border border-border rounded-lg py-1 pl-8 pr-3 text-body-md text-on-surface focus:outline-none focus:border-primary"
                placeholder="Buscar por nombre o ID..."
                type="text"
              />
            </div>

            <div id="data-count-lbl" class="text-[11px] text-text-faint font-mono shrink-0">
              0 elemento(s)
            </div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar" id="data-table-container">
          <div class="flex items-center justify-center h-full text-text-muted">Cargando base de datos...</div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-2.5 border-t border-border bg-surface-container-low flex justify-end shrink-0">
          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${i("btnClose")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(a=>{a.addEventListener("click",()=>this.close())});const e=this.modalEl.querySelector("#select-category");e==null||e.addEventListener("change",a=>{this.currentCategory=a.target.value,this.loadData()});const t=this.modalEl.querySelector("#data-search-input");t==null||t.addEventListener("input",a=>{this.searchQuery=a.target.value.toLowerCase(),this.renderTable()}),await this.loadData()}async loadData(){var e;try{const t=await b.getData(this.game.name,this.currentCategory);this.items=t.items,this.renderTable()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#data-table-container");a&&(a.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar datos: ${t.message}</div>`)}}renderTable(){var d,n;const e=(d=this.modalEl)==null?void 0:d.querySelector("#data-table-container"),t=(n=this.modalEl)==null?void 0:n.querySelector("#data-count-lbl");if(!e)return;const a=this.items.filter(c=>this.searchQuery?c.name.toLowerCase().includes(this.searchQuery)||String(c.id).includes(this.searchQuery):!0);if(t&&(t.textContent=`${a.length} elemento(s)`),a.length===0){e.innerHTML='<div class="p-6 text-center text-text-muted">No se encontraron elementos en esta categoría.</div>';return}let r='<th class="py-2 text-[11px] font-bold text-text-muted uppercase w-16">ID</th><th class="py-2 text-[11px] font-bold text-text-muted uppercase">Nombre</th>';["Items","Weapons","Armors"].includes(this.currentCategory)&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-24">Precio</th>'),this.currentCategory==="Weapons"&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">ATK</th>'),this.currentCategory==="Armors"&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">DEF</th>'),this.currentCategory==="Skills"&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-24">Coste MP</th>'),this.currentCategory==="Enemies"&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">HP</th>',r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">EXP</th>',r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">Oro</th>');const s=a.map(c=>{let o="";return["Items","Weapons","Armors"].includes(this.currentCategory)&&(o+=`<td class="py-2 text-right font-mono text-text-muted">${c.price??0}</td>`),this.currentCategory==="Weapons"&&(o+=`<td class="py-2 text-right font-mono text-primary font-bold">+${c.atk??0}</td>`),this.currentCategory==="Armors"&&(o+=`<td class="py-2 text-right font-mono text-primary font-bold">+${c.def??0}</td>`),this.currentCategory==="Skills"&&(o+=`<td class="py-2 text-right font-mono text-primary">${c.mp_cost??0}</td>`),this.currentCategory==="Enemies"&&(o+=`<td class="py-2 text-right font-mono text-status-error font-bold">${c.hp??0}</td>`,o+=`<td class="py-2 text-right font-mono text-text-muted">${c.exp??0}</td>`,o+=`<td class="py-2 text-right font-mono text-status-warning">${c.gold??0}</td>`),`
        <tr class="hover:bg-card-hover border-b border-border/30 transition-colors">
          <td class="py-2 font-mono text-primary text-[12px]">#${c.id}</td>
          <td class="py-2 font-medium text-on-surface text-[13px]">${c.name}</td>
          ${o}
        </tr>
      `}).join("");e.innerHTML=`
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>${r}</tr>
        </thead>
        <tbody>${s}</tbody>
      </table>
    `}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}async function ce(){const l=window;return l.runtime&&l.runtime.EventsOn,prompt("Ruta de la carpeta de sync:")||null}class pe{constructor(){p(this,"syncData",null);p(this,"modalEl",null);p(this,"folder","")}async open(){var a,r,s,d;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[680px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">sync</span>
              <h2 class="font-bold text-headline-md text-text-primary">${i("syncTitle")}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p class="text-[11px] text-text-muted">
            Sincroniza tus partidas con cualquier carpeta (Dropbox, Syncthing, Nextcloud o USB).
          </p>

          <!-- Destination folder bar -->
          <div class="flex items-center gap-2 mt-3 p-2 rounded-lg bg-surface border border-border ">
            <span class="text-[11px] font-bold text-text-faint uppercase shrink-0">${i("syncDestFolder")}</span>
            <input
              id="input-sync-folder"
              class="flex-1 min-w-0 bg-transparent border-none text-body-md text-primary font-mono focus:outline-none truncate"
              placeholder="Ruta no configurada (p. ej. /home/usuario/Dropbox/Saves)"
              type="text"
            />
            <button id="btn-pick-folder" class="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-label-md font-semibold border border-border text-on-surface transition-colors shrink-0">
              <span class="material-symbols-outlined text-[16px] text-primary">drive_folder_upload</span>
              <span>Elegir...</span>
            </button>
            <button id="btn-open-folder" class="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-primary border border-border transition-colors disabled:opacity-40 disabled:pointer-events-none" title="Abrir carpeta de destino" disabled>
              <span class="material-symbols-outlined text-[16px]">folder_open</span>
            </button>
          </div>
          <p id="sync-folder-hint" class="hidden text-[11px] text-status-error mt-1.5">
            Elige la carpeta de destino con «Elegir...» o escríbela a mano.
          </p>
        </div>

        <!-- Table Container -->
        <div class="flex-1 overflow-y-auto px-6 py-3 custom-scrollbar" id="sync-table-container">
          <div class="flex items-center justify-center h-full text-text-muted">Cargando estado de sincronización...</div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-between gap-2 shrink-0">
          <label class="flex items-center gap-2 text-label-md text-text-muted cursor-pointer min-w-0">
            <input id="chk-auto-sync" type="checkbox" class="rounded border-border bg-surface text-primary focus:ring-0" />
            <span class="truncate">${i("syncAutoToggle")}</span>
          </label>

          <div class="flex items-center gap-2 shrink-0">
            <button id="btn-sync-pull" class="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>${i("btnPull")}</span>
            </button>

            <button id="btn-sync-push" class="px-4 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none">
              <span class="material-symbols-outlined text-[16px]">upload</span>
              <span>${i("btnPush")}</span>
            </button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(n=>{n.addEventListener("click",()=>this.close())}),this.modalEl.addEventListener("click",n=>{n.target===this.modalEl&&this.close()});const e=this.modalEl.querySelector("#input-sync-folder");e==null||e.addEventListener("change",()=>{this.folder=e.value.trim(),this.persistFolder(),this.updateFolderUi()}),(a=this.modalEl.querySelector("#btn-pick-folder"))==null||a.addEventListener("click",async()=>{try{const n=await ce();if(!n)return;this.folder=n,e&&(e.value=n),await this.persistFolder(),this.updateFolderUi()}catch(n){u.show(`No se pudo abrir el selector: ${n.message}`,"error")}}),(r=this.modalEl.querySelector("#btn-open-folder"))==null||r.addEventListener("click",async()=>{if(this.folder)try{await b.openTarget(this.folder)}catch(n){u.show(`No se pudo abrir la carpeta: ${n.message}`,"error")}}),(s=this.modalEl.querySelector("#btn-sync-push"))==null||s.addEventListener("click",()=>this.execute("push")),(d=this.modalEl.querySelector("#btn-sync-pull"))==null||d.addEventListener("click",()=>this.execute("pull"));const t=this.modalEl.querySelector("#chk-auto-sync");t==null||t.addEventListener("change",async()=>{try{const n=await b.getConfig();n.sync={...n.sync||{},auto:t.checked},await b.updateConfig(n),u.show("Ajuste de sincronización guardado","info",2e3)}catch(n){u.show(`Error al guardar ajuste: ${n.message}`,"error")}}),await this.loadData(),this.updateFolderUi()}updateFolderUi(){if(!this.modalEl)return;const e=!!this.folder,t=this.modalEl.querySelector("#sync-folder-hint"),a=this.modalEl.querySelector("#btn-open-folder"),r=this.modalEl.querySelector("#btn-sync-push"),s=this.modalEl.querySelector("#btn-sync-pull");t==null||t.classList.toggle("hidden",e||!this.modalEl.querySelector("#input-sync-folder")),e||t==null||t.classList.remove("hidden"),a&&(a.disabled=!e),r&&(r.disabled=!e),s&&(s.disabled=!e)}async persistFolder(){var e;try{const t=await b.getConfig();t.sync={...t.sync||{auto:!1},folder:this.folder,auto:((e=t.sync)==null?void 0:e.auto)??!1},await b.updateConfig(t),u.show("Carpeta de sincronización guardada","info",2e3),await this.loadData(),this.updateFolderUi()}catch(t){u.show(`Error al guardar carpeta: ${t.message}`,"error")}}async loadData(){var e,t,a;try{this.syncData=await b.getSyncStatus(),this.folder=this.syncData.destination||"";const r=(e=this.modalEl)==null?void 0:e.querySelector("#input-sync-folder");r&&(r.value=this.folder);const s=(t=this.modalEl)==null?void 0:t.querySelector("#chk-auto-sync");s&&(s.checked=this.syncData.auto_sync),this.renderTable()}catch(r){const s=(a=this.modalEl)==null?void 0:a.querySelector("#sync-table-container");s&&(s.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar sincronización: ${r.message}</div>`)}}renderTable(){var a;const e=(a=this.modalEl)==null?void 0:a.querySelector("#sync-table-container");if(!e||!this.syncData)return;if(this.syncData.games.length===0){e.innerHTML=`
        <div class="flex flex-col items-center justify-center h-full text-center text-text-muted">
          <span class="material-symbols-outlined text-[48px] text-text-faint mb-2">sports_esports</span>
          <p>No hay juegos instalados todavía.</p>
        </div>
      `;return}const t=this.syncData.games.map(r=>{const s=r.local_saves>=0?`${r.local_saves} partida(s)`:"sin save/",d=r.dest_saves>=0?`${r.dest_saves} partida(s)`:this.folder?"vacío":"-";return`
        <tr class="hover:bg-card-hover border-b border-border/30 transition-colors">
          <td class="py-2.5 pr-4 font-semibold text-body-md text-on-surface truncate max-w-[260px]">${r.name}</td>
          <td class="py-2.5 text-center font-mono text-text-muted w-32">${s}</td>
          <td class="py-2.5 text-center font-mono text-primary w-32">${d}</td>
        </tr>
      `}).join("");e.innerHTML=`
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase">Juego</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase text-center">Local</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase text-center">Destino</th>
          </tr>
        </thead>
        <tbody>${t}</tbody>
      </table>
    `}async execute(e){var t,a;if(this.folder=(((a=(t=this.modalEl)==null?void 0:t.querySelector("#input-sync-folder"))==null?void 0:a.value)||"").trim(),!this.folder){u.show("Configura primero la carpeta de destino","warning"),this.updateFolderUi();return}try{u.show(`Ejecutando sincronización (${e==="push"?"enviar":"traer"})...`,"info");const s=((await b.executeSync(e,this.folder)).results||[]).reduce((d,n)=>d+(Number(n[1])||0),0);s>0?u.show(`${i("toastSyncDone")} (${s} archivo(s))`,"success"):u.show("Nada que sincronizar (no hay partidas locales)","info"),await this.loadData(),this.updateFolderUi()}catch(r){u.show(`Error de sincronización: ${r.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class ue{constructor(e,t){p(this,"games",[]);p(this,"selectedGame","");p(this,"modalEl",null);var a;this.games=e,this.selectedGame=t?t.name:((a=e[0])==null?void 0:a.name)||""}async open(){var a;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none";const e=this.games.map(r=>`<option value="${r.name}" ${r.name===this.selectedGame?"selected":""}>${r.name} (${r.engine})</option>`).join("");this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[620px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[440px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-1">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">lock_open</span>
              <h2 class="font-bold text-headline-md text-text-primary">${i("decryptTitle")}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p class="text-[11px] text-text-muted">${i("decryptNotice")}</p>
        </div>

        <!-- Body -->
        <div class="flex-1 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-semibold text-text-primary">Seleccionar juego:</label>
            <select id="select-decrypt-game" class="bg-surface border border-border rounded-lg py-2 px-3 text-body-md text-on-surface focus:outline-none focus:border-primary">
              ${e||'<option value="">Sin juegos disponibles</option>'}
            </select>
          </div>

          <div class="flex flex-col gap-2 p-3 rounded-lg bg-surface border border-border">
            <label class="flex items-center gap-2 text-label-md text-on-surface cursor-pointer">
              <input id="chk-recreate" type="checkbox" checked class="rounded border-border bg-surface text-primary focus:ring-0" />
              <span>Intentar reconstruir estructura original del proyecto (Game.rpgproject)</span>
            </label>
          </div>

          <div id="decrypt-log-box" class="flex-1 p-3 rounded-lg bg-surface-container-lowest border border-border font-mono text-[11px] text-text-muted overflow-y-auto custom-scrollbar whitespace-pre-wrap">
            Listo para descifrar. Los archivos se guardarán en <nombre_juego>_descifrado/.
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-end gap-3 shrink-0">
          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${i("btnClose")}
          </button>
          <button id="btn-start-decrypt" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">lock_open</span>
            <span>Descifrar ahora</span>
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(r=>{r.addEventListener("click",()=>this.close())});const t=this.modalEl.querySelector("#select-decrypt-game");t==null||t.addEventListener("change",r=>{this.selectedGame=r.target.value}),(a=this.modalEl.querySelector("#btn-start-decrypt"))==null||a.addEventListener("click",()=>this.startDecrypt())}async startDecrypt(){var a,r;if(!this.selectedGame)return;const e=(a=this.modalEl)==null?void 0:a.querySelector("#decrypt-log-box"),t=(r=this.modalEl)==null?void 0:r.querySelector("#chk-recreate");e&&(e.textContent=`>> Iniciando descifrado de ${this.selectedGame}...
Descargando binario RPGMakerDecrypter si es necesario...
`);try{const s=await b.decrypt(this.selectedGame,(t==null?void 0:t.checked)??!0);e&&(e.textContent+=`
¡Descifrado con éxito!
Carpeta de salida:
${s.output_dir}

${s.log||""}`),u.show("Juego descifrado correctamente","success")}catch(s){e&&(e.textContent+=`
ERROR: ${s.message}`),u.show(`Error descifrando: ${s.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class be{constructor(){p(this,"config",null);p(this,"modalEl",null)}async open(){var e;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[620px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0 flex justify-between items-center">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-primary text-[24px]">keyboard</span>
            <h2 class="font-bold text-headline-md text-text-primary">${i("shortcutsTitle")}</h2>
          </div>
          <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar" id="shortcuts-body-container">
          <div class="flex items-center justify-center h-full text-text-muted">Cargando configuración...</div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-end gap-3 shrink-0">
          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${i("btnCancel")}
          </button>
          <button id="btn-save-shortcuts" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md">
            ${i("btnSave")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(t=>{t.addEventListener("click",()=>this.close())}),(e=this.modalEl.querySelector("#btn-save-shortcuts"))==null||e.addEventListener("click",()=>this.saveConfig()),await this.loadConfig()}async loadConfig(){var e;try{this.config=await b.getConfig(),this.renderBody()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#shortcuts-body-container");a&&(a.innerHTML=`<div class="text-center text-status-error p-6">Error: ${t.message}</div>`)}}renderBody(){var r;const e=(r=this.modalEl)==null?void 0:r.querySelector("#shortcuts-body-container");if(!e||!this.config)return;const a=[{key:"trucos",label:"Menú de trucos in-game"},{key:"recargar",label:"Recargar juego en visor"},{key:"fps",label:"Mostrar/Ocultar FPS"},{key:"captura",label:"Captura de pantalla"},{key:"pantalla_completa",label:"Pantalla completa"},{key:"zoom_in",label:"Aumentar Zoom"},{key:"zoom_out",label:"Reducir Zoom"}].map(s=>{const d=this.config.teclas[s.key]||"";return`
        <div class="flex items-center justify-between py-1.5 border-b border-border/30">
          <span class="text-body-md text-on-surface">${s.label}</span>
          <input
            data-key="${s.key}"
            class="key-input w-36 bg-surface border border-border rounded py-1 px-2.5 font-mono text-center text-primary text-body-md focus:outline-none focus:border-primary"
            type="text"
            value="${d}"
          />
        </div>
      `}).join("");e.innerHTML=`
      <div class="flex flex-col gap-2">
        <h3 class="text-label-md font-bold text-text-muted uppercase tracking-wider">Atajos de Teclado</h3>
        <div class="flex flex-col bg-surface-container-low p-3 rounded-lg border border-border">
          ${a}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h3 class="text-label-md font-bold text-text-muted uppercase tracking-wider">Opciones Generales</h3>
        <div class="flex flex-col gap-2 bg-surface-container-low p-3 rounded-lg border border-border">
          <label class="flex items-center gap-2.5 text-body-md text-on-surface cursor-pointer">
            <input id="chk-default-webkit" type="checkbox" ${this.config.general.webkit?"checked":""} class="rounded border-border bg-surface text-primary focus:ring-0" />
            <span>Usar visor WebKit (más ligero) por defecto en lugar del navegador</span>
          </label>
          <label class="flex items-center gap-2.5 text-body-md text-on-surface cursor-pointer">
            <input id="chk-auto-del-zip" type="checkbox" ${this.config.general.auto_delete_zip?"checked":""} class="rounded border-border bg-surface text-primary focus:ring-0" />
            <span>Eliminar automáticamente archivos .zip tras extraerlos</span>
          </label>
        </div>
      </div>
    `,e.querySelectorAll(".key-input").forEach(s=>{s.addEventListener("change",d=>{const n=d.target,c=n.dataset.key;this.config.teclas[c]=n.value.trim()})})}async saveConfig(){var a,r;if(!this.config)return;const e=(a=this.modalEl)==null?void 0:a.querySelector("#chk-default-webkit"),t=(r=this.modalEl)==null?void 0:r.querySelector("#chk-auto-del-zip");this.config.general.webkit=(e==null?void 0:e.checked)??!1,this.config.general.auto_delete_zip=(t==null?void 0:t.checked)??!1;try{await b.updateConfig(this.config),u.show("Configuración guardada correctamente","success"),this.close()}catch(s){u.show(`Error guardando configuración: ${s.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}const he="modulepreload",me=function(l){return"/"+l},$={},ge=function(e,t,a){let r=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const d=document.querySelector("meta[property=csp-nonce]"),n=(d==null?void 0:d.nonce)||(d==null?void 0:d.getAttribute("nonce"));r=Promise.allSettled(t.map(c=>{if(c=me(c),c in $)return;$[c]=!0;const o=c.endsWith(".css"),m=o?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${m}`))return;const h=document.createElement("link");if(h.rel=o?"stylesheet":he,o||(h.as="script"),h.crossOrigin="",h.href=c,n&&h.setAttribute("nonce",n),document.head.appendChild(h),o)return new Promise((g,x)=>{h.addEventListener("load",g),h.addEventListener("error",()=>x(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(d){const n=new Event("vite:preloadError",{cancelable:!0});if(n.payload=d,window.dispatchEvent(n),!n.defaultPrevented)throw d}return r.then(d=>{for(const n of d||[])n.status==="rejected"&&s(n.reason);return e().catch(s)})};async function xe(){return prompt("Ruta de la carpeta de juegos:")||null}class fe{constructor(){p(this,"folder","");p(this,"modalEl",null)}async open(){var t,a;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[560px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[340px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">settings</span>
              <h2 class="font-bold text-headline-md text-text-primary">${i("settingsTitle")}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p class="text-[11px] text-text-muted">
            ${i("settingsDesc")}
          </p>

          <!-- Games folder bar -->
          <div class="flex items-center gap-2 mt-3 p-2 rounded-lg bg-surface border border-border">
            <span class="text-[11px] font-bold text-text-faint uppercase shrink-0">${i("settingsGamesFolder")}</span>
            <input
              id="input-games-folder"
              class="flex-1 min-w-0 bg-transparent border-none text-body-md text-primary font-mono focus:outline-none truncate"
              placeholder="${i("settingsDefaultFolder","")}"
              type="text"
            />
            <button id="btn-pick-folder" class="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-label-md font-semibold border border-border text-on-surface transition-colors shrink-0">
              <span class="material-symbols-outlined text-[16px] text-primary">drive_folder_upload</span>
              <span>${i("btnChangeFolder")}</span>
            </button>
            <button id="btn-open-folder" class="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-primary border border-border transition-colors disabled:opacity-40 disabled:pointer-events-none" title="${i("btnOpenFolder")}" disabled>
              <span class="material-symbols-outlined text-[16px]">folder_open</span>
            </button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-end gap-2 shrink-0">
          <button id="btn-settings-close" class="px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors">
            ${i("btnClose")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close, #btn-settings-close").forEach(r=>{r.addEventListener("click",()=>this.close())}),this.modalEl.addEventListener("click",r=>{r.target===this.modalEl&&this.close()});const e=this.modalEl.querySelector("#input-games-folder");e==null||e.addEventListener("change",()=>{this.folder=e.value.trim(),this.persistFolder(),this.updateFolderUi()}),(t=this.modalEl.querySelector("#btn-pick-folder"))==null||t.addEventListener("click",async()=>{try{const r=await xe();if(!r)return;this.folder=r,e&&(e.value=r),await this.persistFolder(),this.updateFolderUi()}catch(r){u.show(`${i("settingsTitle")}: ${r.message}`,"error")}}),(a=this.modalEl.querySelector("#btn-open-folder"))==null||a.addEventListener("click",async()=>{if(this.folder)try{await b.openTarget(this.folder)}catch(r){u.show(`${i("settingsTitle")}: ${r.message}`,"error")}}),await this.loadData(),this.updateFolderUi()}updateFolderUi(){if(!this.modalEl)return;const e=!!this.folder,t=this.modalEl.querySelector("#btn-open-folder");t.disabled=!e}async persistFolder(){try{const e=await b.getConfig();e.general={...e.general,games_dir:this.folder},await b.updateConfig(e),u.show("Carpeta de juegos guardada","info",2e3),await this.loadData(),this.updateFolderUi()}catch(e){u.show(`Error al guardar carpeta: ${e.message}`,"error")}}async loadData(){var e,t;try{const a=await b.getConfig();this.folder=(((e=a.general)==null?void 0:e.games_dir)||"").trim();const r=(t=this.modalEl)==null?void 0:t.querySelector("#input-games-folder");r&&(r.value=this.folder),await this.renderPlaceholder()}catch(a){u.show(`Error al cargar config: ${a.message}`,"error")}}async renderPlaceholder(){if(!this.modalEl)return;const e=this.modalEl.querySelector("#input-games-folder");if(!e)return;const{api:t}=await ge(async()=>{const{api:r}=await Promise.resolve().then(()=>X);return{api:r}},void 0),a=await t.getConfig().then(r=>r.general.games_dir||"~/.local/share/rpgmaker-launcher/games");e.placeholder=i("settingsDefaultFolder",a)}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class ye{constructor(e){p(this,"games",[]);p(this,"selectedGame",null);p(this,"searchQuery","");p(this,"activeGame",null);p(this,"activePort",null);p(this,"cardMap",new Map);p(this,"sidebar");p(this,"header");p(this,"actionBar");p(this,"statusBar");p(this,"appRoot");this.appRoot=e}async init(){var a,r,s,d,n,c;this.appRoot.className="flex h-screen overflow-hidden bg-background text-on-background select-none",this.sidebar=new Y({onNav:o=>this.handleNav(o)});let e=!0,t=!1;try{const o=await b.getConfig();e=o.general.webkit!==!1,t=!!o.general.auto_delete_zip,(o.general.lang==="en"||o.general.lang==="es")&&v(o.general.lang)}catch{}this.header=new ee({onSearch:o=>this.handleSearch(o),onRefresh:()=>this.handleRefresh(),onLanguageChange:o=>this.handleLanguageChange(o),onToggleWebKit:o=>this.persistGeneralConfig({webkit:o}),onToggleDelZip:o=>this.persistGeneralConfig({auto_delete_zip:o}),onUpdateClick:()=>this.handleOpenReleases(),onSettingsClick:()=>this.handleOpenSettings()},e,t),this.actionBar=new re({onPlay:()=>this.handlePlaySelected(),onPlugins:()=>this.handleOpenPlugins(),onSaves:()=>this.handleOpenSaves(),onData:()=>this.handleOpenData(),onMods:()=>this.handleOpenMods(),onSync:()=>this.handleOpenSync(),onDecrypt:()=>this.handleOpenDecrypt(),onStopServer:()=>this.handleStopServer(),onShortcuts:()=>this.handleOpenShortcuts(),onQuit:()=>window.close()}),this.statusBar=new ae;try{const o=await b.getVersion();(r=(a=this.header).setVersion)==null||r.call(a,o),this.statusBar.setVersion(o)}catch{}this.appRoot.innerHTML=`
      <div id="sidebar-slot"></div>
      <div class="pl-60 flex-1 min-w-0 h-screen flex flex-col relative">
        <div id="header-slot" class="shrink-0"></div>
        <main class="flex-1 min-h-0 px-8 py-4 flex flex-col overflow-y-auto custom-scrollbar">
          <div class="flex items-end justify-between mb-4 shrink-0">
            <div>
              <h1 class="text-headline-lg font-bold text-on-surface mb-0.5">${i("library")}</h1>
              <p id="library-subtitle" class="text-body-md text-text-muted">
                Cargando biblioteca...
              </p>
            </div>
          </div>

          <!-- Drag and Drop Overlay Indicator (hidden by default) -->
          <div id="drag-drop-overlay" class="hidden fixed inset-0 z-50 bg-background/90 flex flex-col items-center justify-center border-4 border-dashed border-primary/70 pointer-events-none animate-in fade-in duration-200">
            <span class="material-symbols-outlined text-[64px] text-primary mb-3 animate-bounce">archive</span>
            <h2 class="text-2xl font-bold text-on-surface">${i("dragDropZip")}</h2>
            <p class="text-text-muted text-sm mt-1">Los juegos se extraerán y detectarán automáticamente</p>
          </div>

          <!-- Game Cards Grid -->
          <div id="games-grid" class="grid grid-cols-[repeat(auto-fill,minmax(178px,1fr))] gap-4 pb-4">
          </div>
        </main>
        <div id="actionbar-slot" class="shrink-0"></div>
        <div id="statusbar-slot" class="shrink-0"></div>
      </div>
    `,(s=this.appRoot.querySelector("#sidebar-slot"))==null||s.appendChild(this.sidebar.render()),(d=this.appRoot.querySelector("#header-slot"))==null||d.appendChild(this.header.render()),(n=this.appRoot.querySelector("#actionbar-slot"))==null||n.appendChild(this.actionBar.render()),(c=this.appRoot.querySelector("#statusbar-slot"))==null||c.appendChild(this.statusBar.render()),this.setupDragAndDrop(),b.listenEvents({onProgress:o=>{u.show(`Extrayendo: ${o.filename} (${o.current}/${o.total})`,"info",2e3)},onServerStarted:o=>{this.activeGame=o.game,this.activePort=o.port,this.updateBars(),u.show(i("toastServerStarted",o.port),"success")},onServerStopped:o=>{this.activeGame=null,this.activePort=null,this.updateBars(),o.game&&(u.show(i("toastServerStopped",o.seconds_added),"info"),this.loadGames())},onSyncComplete:o=>{u.show(`Sincronización de ${o.game} completada`,"success")},onGameLaunched:o=>{u.show(`${o.engine==="renpy"?"Ren'Py":"Juego nativo"} lanzado: abriendo ventana...`,"info",4e3)}}),await this.loadStatus(),await this.loadGames(),b.checkUpdate().then(o=>{o.update_available&&o.tag_name&&(this.header.setUpdateTag(o.tag_name),u.show(`Nueva versión disponible: ${o.tag_name}`,"info",5e3))}).catch(()=>{})}setupDragAndDrop(){const e=this.appRoot.querySelector("#drag-drop-overlay"),t=s=>e==null?void 0:e.classList.toggle("hidden",!s),a=window;if(a.runtime&&a.runtime.EventsOn){a.runtime.EventsOn("drag-drop",s=>{s.type==="enter"||s.type==="over"?t(!0):s.type==="leave"?t(!1):s.type==="drop"&&(t(!1),this.handleDroppedPaths(s.paths??[]))});return}let r=0;window.addEventListener("dragenter",s=>{s.preventDefault(),r++,t(!0)}),window.addEventListener("dragleave",s=>{s.preventDefault(),r--,r<=0&&(t(!1),r=0)}),window.addEventListener("dragover",s=>{s.preventDefault()}),window.addEventListener("drop",async s=>{s.preventDefault(),r=0,t(!1),await this.handleRefresh()})}async handleDroppedPaths(e){const t=e.filter(a=>a.toLowerCase().endsWith(".zip"));if(t.length===0){u.show(i("dragDropZip"),"warning");return}try{u.show(`Copiando ${t.length} .zip y extrayendo...`,"info");const a=await b.getConfig(),r=await b.installZips(t,a.general.auto_delete_zip);for(const s of r.extracted)u.show(`Extraído: ${s}`,"success");for(const s of r.skipped)u.show(s,"error");r.extracted.length===0&&r.skipped.length===0&&u.show("Sin nuevos archivos .zip","info"),this.games=r.games,this.renderGrid(),this.updateSubtitle()}catch(a){u.show(`Error al instalar: ${a.message}`,"error")}}async loadStatus(){try{const e=await b.getStatus();this.activeGame=e.active_game,this.activePort=e.port,this.updateBars()}catch{}}async loadGames(){try{const e=await b.getGames();this.games=e.games,this.selectedGame?this.selectedGame=this.games.find(t=>{var a;return t.name===((a=this.selectedGame)==null?void 0:a.name)})||this.games[0]||null:this.games.length>0&&(this.selectedGame=this.games[0]),this.renderGrid(),this.updateSubtitle(),this.updateBars()}catch(e){u.show(`Error al cargar juegos: ${e.message}`,"error")}}updateSubtitle(){const e=this.appRoot.querySelector("#library-subtitle");e&&(e.textContent=`${this.games.length} ${i("gamesInstalled")}`)}updateBars(){const e=!!(this.activeGame&&this.activePort);this.actionBar.update(this.selectedGame,e),this.statusBar.update(this.activeGame,this.activePort);const t=this.appRoot.querySelector("#actionbar-slot");t&&(t.innerHTML="",t.appendChild(this.actionBar.render()));const a=this.appRoot.querySelector("#statusbar-slot");a&&(a.innerHTML="",a.appendChild(this.statusBar.render()))}renderGrid(){const e=this.appRoot.querySelector("#games-grid");if(!e)return;e.innerHTML="",this.cardMap.clear();const t=this.games.filter(a=>this.searchQuery?a.name.toLowerCase().includes(this.searchQuery)||a.engine.toLowerCase().includes(this.searchQuery):!0);if(t.length===0){e.innerHTML=`
        <div class="col-span-full flex flex-col items-center justify-center p-12 text-center">
          <span class="material-symbols-outlined text-[56px] text-text-faint mb-3">sports_esports</span>
          <p class="text-body-md text-text-muted whitespace-pre-line leading-relaxed">${i("emptyLibrary")}</p>
        </div>
      `;return}t.forEach(a=>{var n;const r=((n=this.selectedGame)==null?void 0:n.name)===a.name,s=new te(a,r,{onSelect:c=>this.selectGame(c),onLaunch:c=>{this.launchGame(c)},onFavorite:async(c,o)=>{try{const m=!c.favorite;await b.toggleFavorite(c.name,m),c.favorite=m,this.loadGames()}catch(m){u.show(`Error: ${m.message}`,"error")}}}),d=s.render();this.cardMap.set(a.name,{card:s,el:d}),e.appendChild(d)})}selectGame(e){var a,r,s;if(((a=this.selectedGame)==null?void 0:a.name)===e.name)return;const t=this.selectedGame;this.selectedGame=e,t&&((r=this.cardMap.get(t.name))==null||r.card.setSelected(!1)),(s=this.cardMap.get(e.name))==null||s.card.setSelected(!0),this.updateBars()}async launchGame(e){if(e.is_incomplete){u.show(i("incompleteNotice"),"warning");return}try{const a=(await b.getConfig()).general.webkit?"webkit":"browser";u.show(`Iniciando ${e.name}...`,"info"),await b.launchGame(e.name,a)}catch(t){u.show(`No se pudo lanzar '${e.name}': ${t.message}`,"error")}}handleSearch(e){this.searchQuery=e.toLowerCase().trim(),this.renderGrid()}async handleRefresh(){try{u.show("Buscando y extrayendo nuevos .zip...","info");const e=await b.getConfig(),t=await b.rescan(e.general.auto_delete_zip);t.extracted.length>0?u.show(`Extraídos: ${t.extracted.join(", ")}`,"success"):u.show("Sin nuevos archivos .zip","info"),this.loadGames()}catch(e){u.show(`Error al actualizar: ${e.message}`,"error")}}async handleLanguageChange(e){v(e),this.persistGeneralConfig({lang:e}),this.appRoot.innerHTML="",await this.init()}async persistGeneralConfig(e){try{const t=await b.getConfig();t.general={...t.general,...e},await b.updateConfig(t)}catch(t){u.show(`No se pudo guardar la preferencia: ${t.message}`,"error")}}handleOpenReleases(){b.openTarget("https://github.com/AsterrZep/rpgmaker-launcher/releases").catch(e=>u.show(`Error al abrir releases: ${e.message}`,"error"))}async handleOpenMods(){if(!this.selectedGame){u.show("Selecciona un juego primero","warning");return}try{const e=await b.setupMods(this.selectedGame.name);await b.openTarget(e.mods_dir),u.show(i("modsReadyToast"),"success")}catch(e){u.show(`Error con mods: ${e.message}`,"error")}}handlePlaySelected(){this.selectedGame&&this.launchGame(this.selectedGame)}async handleStopServer(){try{await b.stopServer()}catch(e){u.show(`Error al detener servidor: ${e.message}`,"error")}}handleNav(e){switch(e){case"library":break;case"plugins":this.handleOpenPlugins();break;case"saves":this.handleOpenSaves();break;case"data":this.handleOpenData();break;case"sync":this.handleOpenSync();break;case"decrypt":this.handleOpenDecrypt();break;case"shortcuts":this.handleOpenShortcuts();break}}handleOpenPlugins(){if(!this.selectedGame){u.show("Selecciona un juego primero","warning");return}new oe(this.selectedGame).open()}handleOpenSaves(){if(!this.selectedGame){u.show("Selecciona un juego primero","warning");return}new le(this.selectedGame).open()}handleOpenData(){if(!this.selectedGame){u.show("Selecciona un juego primero","warning");return}new de(this.selectedGame).open()}handleOpenSync(){new pe().open()}handleOpenDecrypt(){new ue(this.games,this.selectedGame).open()}handleOpenShortcuts(){new be().open()}handleOpenSettings(){new fe().open()}}window.addEventListener("DOMContentLoaded",async()=>{const l=document.getElementById("app");l&&await new ye(l).init()});
