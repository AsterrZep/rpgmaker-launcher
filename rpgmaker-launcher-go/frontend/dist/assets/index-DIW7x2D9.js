const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-CRKb_1Il.js","assets/core-DhEqZVGG.js","assets/index-C4lDuuOm.js","assets/webview-DTu1fAsl.js"])))=>i.map(i=>d[i]);
var G=Object.defineProperty;var O=(p,e,t)=>e in p?G(p,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):p[e]=t;var c=(p,e,t)=>O(p,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const M="modulepreload",R=function(p){return"/"+p},D={},y=function(e,t,a){let r=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const n=document.querySelector("meta[property=csp-nonce]"),l=(n==null?void 0:n.nonce)||(n==null?void 0:n.getAttribute("nonce"));r=Promise.allSettled(t.map(d=>{if(d=R(d),d in D)return;D[d]=!0;const i=d.endsWith(".css"),b=i?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${b}`))return;const m=document.createElement("link");if(m.rel=i?"stylesheet":M,i||(m.as="script"),m.crossOrigin="",m.href=d,l&&m.setAttribute("nonce",l),document.head.appendChild(m),i)return new Promise((f,v)=>{m.addEventListener("load",f),m.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(n){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=n,window.dispatchEvent(l),!l.defaultPrevented)throw n}return r.then(n=>{for(const l of n||[])l.status==="rejected"&&s(l.reason);return e().catch(s)})},q=!!window.__TAURI_INTERNALS__;let g=null;const S=q?y(()=>import("./core-DhEqZVGG.js"),[]).then(p=>{g=p.invoke}):null;class N{constructor(){c(this,"baseUrl","");c(this,"useTauri",q);const e=window;e.__API_BASE__?this.baseUrl=e.__API_BASE__:window.location.port==="5173"?this.baseUrl="http://127.0.0.1:38915":this.baseUrl="http://127.0.0.1:38915"}setBaseUrl(e){this.baseUrl=e.replace(/\/$/,"")}getBaseUrl(){return this.baseUrl}async ensureReady(){S&&await S}async invokeTauri(e,t){if(S&&await S,!g){const r=new Error("Tauri invoke not available");throw console.error(`[IPC] ❌ ${e}: invoke not loaded`,r),r}console.log(`[IPC] → ${e}`,t?JSON.stringify(t).slice(0,200):"(no args)");const a=performance.now();try{const r=await g(e,t),s=Math.round(performance.now()-a);return console.log(`[IPC] ← ${e} OK (${s}ms)`,r!==void 0?JSON.stringify(r).slice(0,300):"undefined"),r}catch(r){const s=Math.round(performance.now()-a);throw console.error(`[IPC] ← ${e} ERROR (${s}ms):`,r),r}}async request(e,t={}){const a=`${this.baseUrl}${e}`;console.warn(`[HTTP] ⚠️ FALLBACK used: ${t.method||"GET"} ${a}`);const r={"Content-Type":"application/json",...t.headers||{}},s=await fetch(a,{...t,headers:r});if(!s.ok){let n="API Error";try{n=(await s.json()).error||n}catch{}throw console.error(`[HTTP] ❌ ${e}: ${n}`),new Error(n)}return s.json()}async getGames(){return this.useTauri&&g?this.invokeTauri("get_games"):this.request("/api/games")}async launchGame(e,t="webkit"){if(this.useTauri&&g){const a=await this.invokeTauri("detect_game_engine",{gamePath:e});if(!a.ok)throw new Error("No se pudo detectar el juego");const r=e.split("/").pop()||e;return this.invokeTauri("launch_game",{gameName:r,gamePath:a.root,engine:a.engine})}return this.request("/api/games/launch",{method:"POST",body:JSON.stringify({name:e,viewer:t})})}async stopServer(){return this.useTauri&&g?this.invokeTauri("stop_game"):this.request("/api/games/stop",{method:"POST"})}async toggleFavorite(e,t){return this.useTauri&&g?this.invokeTauri("toggle_favorite",{gameName:e}):this.request("/api/games/favorite",{method:"POST",body:JSON.stringify({name:e,favorite:t})})}async rescan(e=!1){return this.useTauri&&g?this.invokeTauri("rescan_games",{autoDelete:e}):this.request("/api/games/rescan",{method:"POST",body:JSON.stringify({auto_delete:e})})}async installZips(e,t=!1){return this.useTauri&&g?this.invokeTauri("install_zips",{paths:e,autoDelete:t}):this.request("/api/games/install",{method:"POST",body:JSON.stringify({paths:e,auto_delete:t})})}async getPlugins(e){return this.useTauri&&g?this.invokeTauri("get_plugins",{gamePath:e}):this.request(`/api/plugins?game=${encodeURIComponent(e)}`)}async togglePlugins(e,t){var a,r;return this.useTauri&&g?t.action==="restore"?this.invokeTauri("restore_plugins",{gamePath:e}):this.invokeTauri("toggle_plugins",{gamePath:e,names:t.names||[],status:(a=t.status)!=null?a:!0,all:(r=t.all)!=null?r:!1}):this.request("/api/plugins/toggle",{method:"POST",body:JSON.stringify({game:e,...t})})}async getSaves(e){return this.useTauri&&g?this.invokeTauri("get_saves",{gamePath:e}):this.request(`/api/saves?game=${encodeURIComponent(e)}`)}async getSaveContent(e,t){return this.useTauri&&g?this.invokeTauri("get_save_content",{gamePath:e,saveName:t}):this.request(`/api/saves/content?game=${encodeURIComponent(e)}&file=${encodeURIComponent(t)}`)}async saveSaveContent(e,t,a){return this.useTauri&&g?this.invokeTauri("update_save_content",{gamePath:e,saveName:t,updates:a}):this.request("/api/saves/content",{method:"POST",body:JSON.stringify({game:e,file:t,...a})})}async backupSaves(e){return this.useTauri&&g?this.invokeTauri("backup_save",{gamePath:e,saveName:"all"}):this.request("/api/saves/backup",{method:"POST",body:JSON.stringify({game:e})})}async getData(e,t){return this.useTauri&&g?this.invokeTauri("get_data",{gamePath:e,category:t}):this.request(`/api/data?game=${encodeURIComponent(e)}&cat=${encodeURIComponent(t)}`)}async getSyncStatus(){return this.useTauri&&g?this.invokeTauri("get_sync_status"):this.request("/api/sync/status")}async executeSync(e,t){return this.useTauri&&g?this.invokeTauri("execute_sync",{mode:e,folder:t}):this.request("/api/sync/execute",{method:"POST",body:JSON.stringify({mode:e,folder:t})})}async decrypt(e,t=!1){if(this.useTauri&&g){const a=await this.invokeTauri("read_encryption_key",{gamePath:e});if(!a)throw new Error("No se encontró la clave de encriptación");return this.invokeTauri("decrypt_game_assets",{gamePath:e,encryptionKey:a})}return this.request("/api/decrypt",{method:"POST",body:JSON.stringify({game:e,recreate:t})})}async setupMods(e){return this.useTauri&&g?this.invokeTauri("setup_mods",{gamePath:e}):this.request("/api/tools/mods",{method:"POST",body:JSON.stringify({game:e})})}async openTarget(e){if(this.useTauri&&g)try{return await y(async()=>{const{open:t}=await import("./index-CRKb_1Il.js");return{open:t}},__vite__mapDeps([0,1])).then(({open:t})=>{t(e)}),{ok:!0}}catch{return this.invokeTauri("open_target",{target:e})}return this.request(`/api/open?target=${encodeURIComponent(e)}`)}async checkUpdate(){return this.useTauri&&g?this.invokeTauri("check_update"):this.request("/api/update/check")}async getConfig(){return this.useTauri&&g?this.invokeTauri("get_config"):this.request("/api/config")}async updateConfig(e){return this.useTauri&&g?this.invokeTauri("update_config",{config:e}):this.request("/api/config",{method:"POST",body:JSON.stringify(e)})}async getStatus(){return this.useTauri&&g?this.invokeTauri("get_status"):this.request("/api/status")}async getVersion(){return(await this.getStatus()).version||"0.0.0"}async detectGameEngine(e){return this.useTauri&&g?this.invokeTauri("detect_game_engine",{gamePath:e}):{ok:!1,root:e,engine:"",engineLabel:"",isWeb:!1,isIncomplete:!1}}async getCoverImage(e,t){return this.useTauri&&g?this.invokeTauri("get_cover_image",{gameName:e,gamePath:t}):{found:!1,mime_type:""}}listenEvents(e){if(!this.baseUrl||this.useTauri)return()=>{};const t=new EventSource(`${this.baseUrl}/api/events`);return t.addEventListener("extraction_progress",a=>{var r;(r=e.onProgress)==null||r.call(e,JSON.parse(a.data))}),t.addEventListener("server_started",a=>{var r;(r=e.onServerStarted)==null||r.call(e,JSON.parse(a.data))}),t.addEventListener("server_stopped",a=>{var r;(r=e.onServerStopped)==null||r.call(e,JSON.parse(a.data))}),t.addEventListener("sync_complete",a=>{var r;(r=e.onSyncComplete)==null||r.call(e,JSON.parse(a.data))}),t.addEventListener("game_launched",a=>{var r;(r=e.onGameLaunched)==null||r.call(e,JSON.parse(a.data))}),()=>t.close()}}const h=new N,z=Object.freeze(Object.defineProperty({__proto__:null,api:h},Symbol.toStringTag,{value:"Module"})),E={es:{appTitle:"RPG Maker Launcher",subtitle:"Lanzador de juegos de RPG Maker & Ren'Py",library:"Mi Biblioteca",gamesInstalled:"juegos instalados",lastSync:"Última sincronización",searchPlaceholder:"Buscar juegos...",filter:"Filtrar",emptyLibrary:`No hay juegos todavía.
Coloca los archivos .zip junto al lanzador y pulsa Actualizar.`,dragDropZip:"¡Suelta los archivos .zip aquí para añadirlos!",navPlay:"Biblioteca",navPlugins:"Plugins",navSaves:"Partidas",navData:"Datos",navMods:"Mods",navSync:"Sync",navDecrypt:"Descifrar",navShortcuts:"Atajos",navQuit:"Salir",navSettings:"Configuración",btnPlay:"Jugar",btnStopServer:"Detener servidor",btnRefresh:"Actualizar",btnSave:"Guardar Cambios",btnCancel:"Cancelar",btnClose:"Cerrar",btnBackup:"Copia de seguridad",btnRestore:"Restaurar",btnExport:"Exportar",btnDelete:"Borrar",btnEnableAll:"Todo ON",btnDisableAll:"Todo OFF",btnPush:"Enviar al destino →",btnPull:"← Traer del destino",btnChangeFolder:"Cambiar...",btnOpenFolder:"Abrir carpeta",toggleWebKit:"WebKit",toggleDelZip:"Borrar .zip",toggleWebKitTip:"Usar el visor WebKit (más ligero) en vez del navegador",toggleDelZipTip:"Eliminar el .zip tras extraerlo",updateChipTip:"Nueva versión disponible. Clic para ver las releases.",modsReadyToast:"Carpeta de mods lista y abierta. Cada .js se inyecta al arrancar; recarga con F5.",quitTip:"Cerrar el lanzador",settingsTitle:"Configuración",settingsDesc:"Elige la carpeta donde se guardarán los juegos y archivos .zip.",settingsGamesFolder:"Carpeta de juegos:",settingsDefaultFolder:"Por defecto: %s",playedHours:"jugado",playedNow:"Jugado ahora",playedMin:"Jugado hace %d min",playedHoursAgo:"Jugado hace %d h",playedDaysAgo:"Jugado hace %d d",neverPlayed:"Sin jugar aún",incompleteBadge:"Incompleto",incompleteNotice:"Descarga incompleta (faltan archivos)",serverActive:"Servidor activo:",serverPort:"Puerto",serverStopped:"Servidor detenido",runtimeReady:"RPG Maker Engine Runtime v{version}",pluginsTitle:"Plugins",pluginsDesc:"Gestión y análisis de compatibilidad de scripts WebKit/nw.js",savesTitle:"Gestor de Partidas",savesDesc:"Copias de seguridad, restauración y edición de partidas",saveEditorTitle:"Editor de Partidas",saveEditorWarning:"⚠ Cierra el juego antes de editar: si está abierto, su autoguardado puede sobrescribir tus cambios.",saveEditorGold:"Oro del Grupo",saveEditorItems:"Objetos",saveEditorVariables:"Variables",saveEditorSwitches:"Interruptores (Switches)",saveEditorGeneral:"General",dataTitle:"Navegador de Base de Datos",syncTitle:"Sincronización de Partidas",syncDestFolder:"Carpeta de destino:",syncAutoToggle:"Sincronizar automáticamente al cerrar una partida",decryptTitle:"Herramienta de Descifrado",decryptNotice:"Descifra archivos .rgssad/.rgss2a/.rgss3a o assets cifrados de RPG Maker MV/MZ.",shortcutsTitle:"Atajos de Teclado y Preferencias",toastServerStarted:"Servidor iniciado en puerto %d",toastServerStopped:"Servidor detenido (%d seg jugados)",toastSaved:"Partida guardada con éxito",toastSyncDone:"Sincronización completada",toastBackupDone:"Copia de seguridad creada"},en:{appTitle:"RPG Maker Launcher",subtitle:"RPG Maker & Ren'Py Game Launcher",library:"My Library",gamesInstalled:"installed games",lastSync:"Last sync",searchPlaceholder:"Search games...",filter:"Filter",emptyLibrary:`No games yet.
Place .zip files next to the launcher and click Refresh.`,dragDropZip:"Drop .zip files here to add them!",navPlay:"Library",navPlugins:"Plugins",navSaves:"Saves",navData:"Data",navMods:"Mods",navSync:"Sync",navDecrypt:"Decrypt",navShortcuts:"Shortcuts",navQuit:"Quit",navSettings:"Settings",btnPlay:"Play",btnStopServer:"Stop Server",btnRefresh:"Refresh",btnSave:"Save Changes",btnCancel:"Cancel",btnClose:"Close",btnBackup:"Backup",btnRestore:"Restore",btnExport:"Export",btnDelete:"Delete",btnEnableAll:"All ON",btnDisableAll:"All OFF",btnPush:"Push to Destination →",btnPull:"← Pull from Destination",btnChangeFolder:"Change...",btnOpenFolder:"Open Folder",toggleWebKit:"WebKit",toggleDelZip:"Delete .zip",toggleWebKitTip:"Use the WebKit viewer (lighter) instead of the browser",toggleDelZipTip:"Delete the .zip after extracting",updateChipTip:"New version available. Click to view releases.",modsReadyToast:"Mods folder ready and opened. Every .js is injected on launch; reload with F5.",quitTip:"Close the launcher",settingsTitle:"Settings",settingsDesc:"Choose the folder where games and .zip files will be stored.",settingsGamesFolder:"Games folder:",settingsDefaultFolder:"Default: %s",playedHours:"played",playedNow:"Played just now",playedMin:"Played %d min ago",playedHoursAgo:"Played %d h ago",playedDaysAgo:"Played %d d ago",neverPlayed:"Not played yet",incompleteBadge:"Incomplete",incompleteNotice:"Incomplete download (missing files)",serverActive:"Active Server:",serverPort:"Port",serverStopped:"Server stopped",runtimeReady:"RPG Maker Engine Runtime v{version}",pluginsTitle:"Plugins",pluginsDesc:"Manage and analyze WebKit / nw.js compatibility",savesTitle:"Save Manager",savesDesc:"Backups, snapshots, and save editing",saveEditorTitle:"Save Editor",saveEditorWarning:"⚠ Close the game before editing: autosaves might overwrite your changes.",saveEditorGold:"Party Gold",saveEditorItems:"Items",saveEditorVariables:"Variables",saveEditorSwitches:"Switches",saveEditorGeneral:"General",dataTitle:"Database Browser",syncTitle:"Save Sync",syncDestFolder:"Destination folder:",syncAutoToggle:"Automatically sync saves when closing a game",decryptTitle:"Decryption Tool",decryptNotice:"Decrypts .rgssad/.rgss2a/.rgss3a and RPG Maker MV/MZ encrypted assets.",shortcutsTitle:"Shortcuts & Preferences",toastServerStarted:"Server started on port %d",toastServerStopped:"Server stopped (%d sec played)",toastSaved:"Save file updated successfully",toastSyncDone:"Sync completed",toastBackupDone:"Backup created"}};let T="es";function P(){return T}function k(p){T=p,document.documentElement.lang=p}function o(p,...e){let a=(E[T]||E.es)[p]||E.es[p]||p;return e.length>0&&e.forEach(r=>{a=a.replace(/%[ds]/,String(r))}),a}class B{constructor(e){c(this,"activeTab","library");c(this,"callbacks");this.callbacks=e}setActiveTab(e){this.activeTab=e,this.render()}render(){const e=document.createElement("aside");return e.className="fixed left-0 top-0 h-full w-60 bg-surface-container-lowest z-30 flex flex-col border-r border-border select-none",e.innerHTML=`
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
          <span>${o("navPlay")}</span>
        </a>

        <div class="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-text-faint">
          Herramientas
        </div>

        <a data-tab="plugins" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="plugins"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">extension</span>
          <span>${o("navPlugins")}</span>
        </a>

        <a data-tab="saves" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="saves"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">save</span>
          <span>${o("navSaves")}</span>
        </a>

        <a data-tab="data" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="data"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">database</span>
          <span>${o("navData")}</span>
        </a>

        <a data-tab="sync" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="sync"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">sync</span>
          <span>${o("navSync")}</span>
        </a>

        <a data-tab="decrypt" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${this.activeTab==="decrypt"?"bg-accent-soft text-primary font-bold shadow-sm":"text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}">
          <span class="material-symbols-outlined text-[18px]">lock_open</span>
          <span>${o("navDecrypt")}</span>
        </a>
      </nav>

      <div class="p-3 border-t border-border/50">
        <a data-tab="shortcuts" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer text-text-muted hover:bg-surface-container-high hover:text-on-surface">
          <span class="material-symbols-outlined text-[18px]">settings</span>
          <span>${o("shortcutsTitle")}</span>
        </a>
      </div>
    `,e.querySelectorAll(".sidebar-item").forEach(t=>{t.addEventListener("click",a=>{const r=a.currentTarget.dataset.tab;r&&this.callbacks.onNav(r)})}),e}}class I{constructor(e,t,a){c(this,"callbacks");c(this,"webkit",!0);c(this,"autoDeleteZip",!1);c(this,"version","0.0.0");this.callbacks=e,this.webkit=t,this.autoDeleteZip=a,this.loadVersion()}async loadVersion(){try{this.version=await h.getVersion(),this.updateVersionDisplay()}catch{this.version="0.0.0",this.updateVersionDisplay()}}updateVersionDisplay(){const e=document.querySelector("#app-version");e&&(e.textContent=`v${this.version}`)}setVersion(e){this.version=e,this.updateVersionDisplay()}setUpdateTag(e){const t=document.querySelector("#update-chip");!t||!e||(t.classList.remove("hidden"),t.querySelector("#update-tag").textContent=`↓ ${e}`)}toggle(e,t,a,r){return`
      <label class="hidden sm:flex items-center gap-1.5 cursor-pointer select-none" title="${r}">
        <input type="checkbox" id="${e}" class="peer sr-only" ${t?"checked":""} />
        <span class="relative w-8 h-[18px] rounded-full bg-surface-container-high border border-border peer-checked:bg-primary transition-colors
                     after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-[12px] after:h-[12px] after:rounded-full
                     after:bg-text-muted peer-checked:after:bg-on-primary peer-checked:after:translate-x-[14px] after:transition-transform"></span>
        <span class="text-label-md text-text-muted">${a}</span>
      </label>
    `}render(){var n,l,d,i,b;const e=document.createElement("header");e.className="h-14 shrink-0 bg-surface border-b border-border flex items-center justify-between gap-3 px-6 select-none";const t=P();e.innerHTML=`
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
            placeholder="${o("searchPlaceholder")}"
            type="text"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        ${this.toggle("toggle-webkit",this.webkit,o("toggleWebKit"),o("toggleWebKitTip"))}
        ${this.toggle("toggle-del-zip",this.autoDeleteZip,o("toggleDelZip"),o("toggleDelZipTip"))}

        <button id="btn-refresh-zips" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-3 py-1.5 rounded-lg border border-border text-on-surface text-label-md font-medium transition-colors" title="${o("btnRefresh")}">
          <span class="material-symbols-outlined text-[16px] text-primary">refresh</span>
          <span>${o("btnRefresh")}</span>
        </button>

        <button id="btn-settings" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg border border-border text-on-surface text-label-md font-semibold transition-colors cursor-pointer" title="${o("navSettings")}">
          <span class="material-symbols-outlined text-[16px] text-text-muted">settings</span>
          <span>${o("navSettings")}</span>
        </button>

        <button id="btn-lang" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg border border-border text-on-surface text-label-md font-semibold transition-colors cursor-pointer" title="ES / EN">
          <span class="material-symbols-outlined text-[16px] text-text-muted">translate</span>
          <span>${t.toUpperCase()}</span>
        </button>
      </div>
    `;const a=e.querySelector("#search-input");let r;a==null||a.addEventListener("input",m=>{const f=m.target.value;window.clearTimeout(r),r=window.setTimeout(()=>{this.callbacks.onSearch(f)},150)}),(n=e.querySelector("#btn-refresh-zips"))==null||n.addEventListener("click",()=>{this.callbacks.onRefresh()}),(l=e.querySelector("#btn-lang"))==null||l.addEventListener("click",()=>{const m=P()==="es"?"en":"es";k(m),this.callbacks.onLanguageChange(m)}),(d=e.querySelector("#btn-settings"))==null||d.addEventListener("click",()=>{this.callbacks.onSettingsClick()}),(i=e.querySelector("#toggle-webkit"))==null||i.addEventListener("change",m=>{this.webkit=m.target.checked,this.callbacks.onToggleWebKit(this.webkit)}),(b=e.querySelector("#toggle-del-zip"))==null||b.addEventListener("change",m=>{this.autoDeleteZip=m.target.checked,this.callbacks.onToggleDelZip(this.autoDeleteZip)});const s=e.querySelector("#update-chip");return s==null||s.addEventListener("click",()=>this.callbacks.onUpdateClick()),e}}class F{constructor(e,t,a){c(this,"game");c(this,"isSelected");c(this,"callbacks");c(this,"_el",null);this.game=e,this.isSelected=t,this.callbacks=a}formatLastPlayed(e){if(!e)return o("neverPlayed");const t=Date.now()/1e3-e;return t<60?o("playedNow"):t<3600?o("playedMin",Math.floor(t/60)):t<86400?o("playedHoursAgo",Math.floor(t/3600)):t<7*86400?o("playedDaysAgo",Math.floor(t/86400)):new Date(e*1e3).toLocaleDateString()}formatHours(e){const t=Math.floor(e/3600),a=Math.floor(e%3600/60);return t>0&&a>0?`${t}h ${a}m`:t>0?`${t}h`:a>0?`${a}m`:"0m"}getEngineBadgeClass(e){switch(e){case"MZ":return"bg-accent-soft text-primary";case"MV":return"bg-secondary-container text-on-secondary-container";case"XP":case"VX":case"VXAce":return"bg-surface-variant text-text-muted";case"renpy":return"bg-status-success/20 text-status-success";default:return"bg-surface-variant text-text-muted"}}render(){const e=document.createElement("div");this.game.is_incomplete,this.applySelectionClass(e);const t=this.game.cover_url?`${h.getBaseUrl()}${this.game.cover_url}`:null,a=t?`<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${t}" alt="${this.game.name}" loading="lazy" decoding="async" draggable="false" />`:`<div class="w-full h-full flex items-center justify-center bg-surface-container-high text-primary font-black text-3xl select-none">${this.game.name.charAt(0).toUpperCase()}</div>`;e.innerHTML=`
      <!-- Favorite Star Badge -->
      <button class="btn-favorite absolute top-2 right-2 z-10 w-6 h-6 bg-surface-container-lowest hover:bg-surface-container-highest rounded-full flex items-center justify-center shadow-md transition-colors" title="Favorito">
        <span class="material-symbols-outlined text-[15px] ${this.game.favorite?"text-status-warning":"text-text-faint hover:text-status-warning"}" style="${this.game.favorite?"font-variation-settings: 'FILL' 1;":""}">star</span>
      </button>

      <!-- Cover -->
      <div class="w-[150px] h-[104px] mx-auto rounded-lg overflow-hidden shadow-sm mb-2 bg-surface-variant relative shrink-0">
        ${a}
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
    `,e.addEventListener("click",()=>{this.callbacks.onSelect(this.game)}),e.addEventListener("dblclick",()=>{this.game.is_incomplete||this.callbacks.onLaunch(this.game)});const r=e.querySelector(".btn-favorite");return r==null||r.addEventListener("click",s=>{s.stopPropagation(),this.callbacks.onFavorite(this.game,s)}),e}applySelectionClass(e){const t=e||this._el;if(!t)return;this._el=t;const a=this.game.is_incomplete;t.className=`group relative flex flex-col h-[218px] w-[178px] p-3 rounded-xl transition duration-200 select-none cursor-pointer border ${this.isSelected?"bg-card-selected border-primary ring-1 ring-primary/50 shadow-lg shadow-primary/10":"bg-surface-container hover:bg-card-hover border-border hover:border-primary/40 hover:-translate-y-0.5 shadow-md"} ${a?"opacity-60 grayscale hover:grayscale-0":""}`}setSelected(e){this.isSelected=e,this.applySelectionClass()}}class H{constructor(e){c(this,"selectedGame",null);c(this,"isServerRunning",!1);c(this,"callbacks");this.callbacks=e}update(e,t){this.selectedGame=e,this.isServerRunning=t,this.render()}render(){var r,s,n,l,d,i,b,m,f,v;const e=document.createElement("div");e.className="w-full shrink-0 bg-surface-container-highest/95 border-t border-border px-6 py-2.5 flex items-center justify-between select-none shadow-2xl";const t=this.selectedGame&&!this.selectedGame.is_incomplete,a=this.selectedGame&&this.selectedGame.is_web;return e.innerHTML=`
      <div class="flex items-center gap-2">
        <!-- Play Button -->
        <button
          id="btn-play"
          class="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-headline-md transition shadow-md ${t?"bg-primary hover:bg-accent-hover text-on-primary cursor-pointer hover:shadow-primary/20 hover:scale-[1.02]":"bg-surface-variant text-text-faint cursor-not-allowed opacity-60"}"
          ${t?"":"disabled"}
        >
          <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
          <span>${o("btnPlay")}</span>
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
          <span>${o("navPlugins")}</span>
        </button>

        <button
          id="btn-saves"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${this.selectedGame?"bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50":"bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50"}"
          ${this.selectedGame?"":"disabled"}
          title="Gestor de partidas guardadas"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">save</span>
          <span>${o("navSaves")}</span>
        </button>

        <button
          id="btn-data"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${a?"bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50":"bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50"}"
          ${a?"":"disabled"}
          title="Navegador de base de datos"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">database</span>
          <span>${o("navData")}</span>
        </button>

        <button
          id="btn-mods"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${a?"bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50":"bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50"}"
          ${a?"":"disabled"}
          title="${a?"Carpeta de mods del juego":"Solo disponible para juegos MZ/MV"}"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">code_blocks</span>
          <span>${o("navMods")}</span>
        </button>

        <button
          id="btn-sync"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold bg-surface hover:bg-surface-container-low text-text-primary border border-border/60 hover:border-primary/50 transition-colors"
          title="Sincronización de partidas"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">sync</span>
          <span>${o("navSync")}</span>
        </button>

        <button
          id="btn-decrypt"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold bg-surface hover:bg-surface-container-low text-text-primary border border-border/60 hover:border-primary/50 transition-colors"
          title="Herramienta de descifrado"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">lock_open</span>
          <span>${o("navDecrypt")}</span>
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
          <span>${o("btnStopServer")}</span>
        </button>

        <button
          id="btn-shortcuts"
          class="p-2 rounded-lg bg-surface hover:bg-surface-container-low text-text-muted hover:text-on-surface border border-border/60 transition-colors"
          title="${o("shortcutsTitle")}"
        >
          <span class="material-symbols-outlined text-[18px]">keyboard</span>
        </button>

        <button
          id="btn-quit"
          class="p-2 rounded-lg bg-surface hover:bg-error-container text-text-muted hover:text-status-error border border-border/60 transition-colors"
          title="${o("quitTip")}"
        >
          <span class="material-symbols-outlined text-[18px]">power_settings_new</span>
        </button>
      </div>
    `,(r=e.querySelector("#btn-play"))==null||r.addEventListener("click",()=>this.callbacks.onPlay()),(s=e.querySelector("#btn-plugins"))==null||s.addEventListener("click",()=>this.callbacks.onPlugins()),(n=e.querySelector("#btn-saves"))==null||n.addEventListener("click",()=>this.callbacks.onSaves()),(l=e.querySelector("#btn-data"))==null||l.addEventListener("click",()=>this.callbacks.onData()),(d=e.querySelector("#btn-mods"))==null||d.addEventListener("click",()=>this.callbacks.onMods()),(i=e.querySelector("#btn-sync"))==null||i.addEventListener("click",()=>this.callbacks.onSync()),(b=e.querySelector("#btn-decrypt"))==null||b.addEventListener("click",()=>this.callbacks.onDecrypt()),(m=e.querySelector("#btn-stop-server"))==null||m.addEventListener("click",()=>this.callbacks.onStopServer()),(f=e.querySelector("#btn-shortcuts"))==null||f.addEventListener("click",()=>this.callbacks.onShortcuts()),(v=e.querySelector("#btn-quit"))==null||v.addEventListener("click",()=>this.callbacks.onQuit()),e}}class U{constructor(){c(this,"activeGame",null);c(this,"activePort",null);c(this,"version","0.0.0")}setVersion(e){this.version=e,this.render()}update(e,t){this.activeGame=e,this.activePort=t,this.render()}render(){const e=document.createElement("footer");e.className="h-7 shrink-0 w-full bg-surface-container-lowest border-t border-border flex items-center justify-between px-6 select-none text-[11px]";const t=V(this.activeGame&&this.activePort);return e.innerHTML=`
      <div class="flex items-center gap-2">
        <span class="flex h-2 w-2 rounded-full ${t?"bg-status-success animate-pulse-fast":"bg-surface-variant"}"></span>
        <span class="text-text-muted">
          ${t?`<span class="text-text-faint">${o("serverActive")}</span> <span class="font-semibold text-primary">${this.activeGame}</span> <span class="text-text-faint">(${o("serverPort")} ${this.activePort})</span>`:`<span class="text-text-faint">${o("serverStopped")}</span>`}
        </span>
      </div>
      <div class="text-text-faint font-medium">
        ${o("runtimeReady").replace("{version}",this.version)}
      </div>
    `,e}}function V(p){return!!p}class W{constructor(){c(this,"container");this.container=document.createElement("div"),this.container.className="fixed bottom-12 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none",document.body.appendChild(this.container)}show(e,t="info",a=3500){const r=document.createElement("div");r.className=`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-body-md transition duration-300 translate-y-2 opacity-0 ${t==="success"?"bg-surface-container-high border-status-success/40 text-on-surface":t==="error"?"bg-surface-container-high border-status-error/40 text-on-surface":t==="warning"?"bg-surface-container-high border-status-warning/40 text-on-surface":"bg-surface-container-high border-border text-on-surface"}`;const s={info:"info",success:"check_circle",warning:"warning",error:"error"},n={info:"text-primary",success:"text-status-success",warning:"text-status-warning",error:"text-status-error"};r.innerHTML=`
      <span class="material-symbols-outlined text-[20px] ${n[t]}">${s[t]}</span>
      <span class="flex-1 font-medium">${e}</span>
    `,this.container.appendChild(r),requestAnimationFrame(()=>{r.classList.remove("translate-y-2","opacity-0")}),setTimeout(()=>{r.classList.add("opacity-0","translate-y-2"),setTimeout(()=>r.remove(),300)},a)}}const u=new W;class Z{constructor(e){c(this,"game");c(this,"plugins",[]);c(this,"hasBackup",!1);c(this,"modalEl",null);this.game=e}async open(){var e,t,a;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
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
              ${o("btnEnableAll")}
            </button>
            <button id="btn-toggle-all-off" class="px-2.5 py-1 rounded bg-surface hover:bg-surface-container-high text-text-primary text-[11px] font-semibold border border-border transition-colors">
              ${o("btnDisableAll")}
            </button>
            <button id="btn-restore-plugins" class="px-2.5 py-1 rounded bg-surface hover:bg-surface-container-high text-status-warning text-[11px] font-semibold border border-border transition-colors">
              ${o("btnRestore")}
            </button>
          </div>

          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${o("btnClose")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(r=>{r.addEventListener("click",()=>this.close())}),(e=this.modalEl.querySelector("#btn-toggle-all-on"))==null||e.addEventListener("click",()=>this.toggleAll(!0)),(t=this.modalEl.querySelector("#btn-toggle-all-off"))==null||t.addEventListener("click",()=>this.toggleAll(!1)),(a=this.modalEl.querySelector("#btn-restore-plugins"))==null||a.addEventListener("click",()=>this.restoreOriginal()),await this.loadData()}async loadData(){var e;try{const t=await h.getPlugins(this.game.path);this.plugins=t.plugins,this.hasBackup=t.has_backup,this.renderTable()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#plugins-table-container");a&&(a.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar plugins: ${t.message}</div>`)}}renderTable(){var a;const e=(a=this.modalEl)==null?void 0:a.querySelector("#plugins-table-container");if(!e)return;if(this.plugins.length===0){e.innerHTML='<div class="p-6 text-center text-text-muted">No se encontraron plugins en este juego.</div>';return}const t=this.plugins.map((r,s)=>{let n="bg-status-success/15 text-status-success",l="OK";return r.category==="nw-protegido"?(n="bg-status-warning/15 text-status-warning",l="NW PROTECTED"):r.category==="roto"?(n="bg-status-error/15 text-status-error",l="BROKEN"):r.category==="sin-fichero"&&(n="bg-surface-variant text-text-faint",l="MISSING"),`
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
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${n}">
              ${l}
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
    `,e.querySelectorAll(".plugin-toggle").forEach(r=>{r.addEventListener("change",async s=>{const n=s.target,l=parseInt(n.dataset.index||"0",10),d=this.plugins[l],i=n.checked;d.status=i;try{await h.togglePlugins(this.game.path,{names:[d.name],status:i}),u.show(`Plugin ${d.name} ${i?"activado":"desactivado"}`,"success",2e3)}catch(b){u.show(`Error: ${b.message}`,"error"),n.checked=!i,d.status=!i}})})}async toggleAll(e){try{await h.togglePlugins(this.game.path,{all:!0,status:e}),this.plugins.forEach(t=>t.status=e),this.renderTable(),u.show(`Todos los plugins ${e?"activados":"desactivados"}`,"success")}catch(t){u.show(`Error: ${t.message}`,"error")}}async restoreOriginal(){try{await h.togglePlugins(this.game.path,{action:"restore"}),u.show("Plugins restaurados desde la copia original","success"),await this.loadData()}catch(e){u.show(`Error restaurando plugins: ${e.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class J{constructor(e,t){c(this,"game");c(this,"filename");c(this,"saveContent",null);c(this,"activeTab","general");c(this,"modalEl",null);c(this,"gold",0);c(this,"items",{});c(this,"variables",{});c(this,"switches",{});this.game=e,this.filename=t}async open(){var e;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[760px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[540px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex flex-col border-b border-border bg-surface-container-low shrink-0">
          <div class="flex items-center justify-between px-6 py-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[22px]">edit_document</span>
              <h2 class="font-bold text-headline-md text-text-primary">
                ${o("saveEditorTitle")} · <span class="text-primary font-mono text-sm">${this.filename}</span>
              </h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Warning Banner -->
          <div class="bg-status-warning/10 border-t border-b border-status-warning/20 px-6 py-2 flex items-center gap-2.5 text-status-warning text-[11px] font-medium">
            <span class="material-symbols-outlined text-[16px] shrink-0">warning</span>
            <span>${o("saveEditorWarning")}</span>
          </div>

          <!-- Summary Stats -->
          <div id="save-summary-bar" class="px-6 py-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-faint bg-surface-container-lowest border-b border-border/50">
            <span>Cargando datos...</span>
          </div>

          <!-- Tabs -->
          <div class="flex px-6 pt-2 gap-2 bg-surface-container-low/50">
            <button data-tab="general" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-primary text-primary transition-colors">
              ${o("saveEditorGeneral")}
            </button>
            <button data-tab="items" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${o("saveEditorItems")}
            </button>
            <button data-tab="variables" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${o("saveEditorVariables")}
            </button>
            <button data-tab="switches" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${o("saveEditorSwitches")}
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
            ${o("btnCancel")}
          </button>
          <button id="btn-save-savegame" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">save</span>
            <span>${o("btnSave")}</span>
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(t=>{t.addEventListener("click",()=>this.close())}),(e=this.modalEl.querySelector("#btn-save-savegame"))==null||e.addEventListener("click",()=>this.saveChanges()),this.modalEl.querySelectorAll(".tab-btn").forEach(t=>{t.addEventListener("click",a=>{var s;const r=a.currentTarget.dataset.tab;r&&(this.activeTab=r,(s=this.modalEl)==null||s.querySelectorAll(".tab-btn").forEach(n=>{n.classList.remove("border-primary","text-primary"),n.classList.add("border-transparent","text-text-muted")}),a.currentTarget.classList.add("border-primary","text-primary"),a.currentTarget.classList.remove("border-transparent","text-text-muted"),this.renderTabContent())})}),await this.loadData()}async loadData(){var e;try{const t=await h.getSaveContent(this.game.path,this.filename);this.saveContent=t,this.gold=t.gold,this.items={...t.items},this.variables={...t.variables},this.switches={...t.switches},this.renderSummary(),this.renderTabContent()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#editor-tab-content");a&&(a.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar la partida: ${t.message}</div>`)}}renderSummary(){var t;const e=(t=this.modalEl)==null?void 0:t.querySelector("#save-summary-bar");!e||!this.saveContent||(e.innerHTML=`
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-status-warning">monetization_on</span> Oro: <strong class="text-text-primary font-mono">${this.gold.toLocaleString()}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">category</span> Objetos: <strong class="text-text-primary">${Object.keys(this.items).length}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">data_object</span> Variables: <strong class="text-text-primary">${Object.keys(this.variables).length}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">toggle_on</span> Switches: <strong class="text-text-primary">${Object.values(this.switches).filter(Boolean).length}</strong></span>
    `)}renderTabContent(){var t,a,r,s,n;const e=(t=this.modalEl)==null?void 0:t.querySelector("#editor-tab-content");if(!(!e||!this.saveContent)){if(this.activeTab==="general"){e.innerHTML=`
        <div class="flex flex-col gap-6 max-w-md">
          <div class="flex flex-col gap-2">
            <label class="text-label-md font-semibold text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-status-warning text-[18px]">monetization_on</span>
              <span>${o("saveEditorGold")}</span>
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
                ${this.saveContent.actors.map(d=>`
                  <div class="p-2.5 rounded-lg bg-surface-container border border-border flex items-center justify-between">
                    <div>
                      <div class="font-bold text-body-md text-on-surface">${d.name}</div>
                      <div class="text-[10px] text-text-faint">Nivel ${d.level}</div>
                    </div>
                    <div class="text-right text-[11px] font-mono text-primary">
                      HP ${d.hp} / MP ${d.mp}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          `:""}
        </div>
      `;const l=e.querySelector("#input-gold");l==null||l.addEventListener("input",d=>{this.gold=parseInt(d.target.value||"0",10),this.renderSummary()}),(a=e.querySelector("#btn-gold-add-1k"))==null||a.addEventListener("click",()=>{this.gold=Math.min(99999999,this.gold+1e3),l.value=String(this.gold),this.renderSummary()}),(r=e.querySelector("#btn-gold-add-50k"))==null||r.addEventListener("click",()=>{this.gold=Math.min(99999999,this.gold+5e4),l.value=String(this.gold),this.renderSummary()}),(s=e.querySelector("#btn-gold-max"))==null||s.addEventListener("click",()=>{this.gold=99999999,l.value=String(this.gold),this.renderSummary()})}else if(this.activeTab==="items"){const l=Object.entries(this.items);e.innerHTML=`
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
                ${l.length>0?l.map(([d,i])=>`
                  <tr class="hover:bg-card-hover border-b border-border/30 item-row" data-id="${d}">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${d}</td>
                    <td class="py-2 px-3 text-center">
                      <input type="number" min="0" max="99" value="${i}" data-id="${d}" class="item-qty-input w-20 text-center bg-surface-container border border-border rounded py-0.5 px-1 font-mono text-on-surface focus:outline-none focus:border-primary" />
                    </td>
                    <td class="py-2 px-3 text-right">
                      <button data-id="${d}" class="btn-delete-item text-text-faint hover:text-status-error transition-colors p-1">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="3" class="p-4 text-center text-text-muted">No hay objetos en el inventario</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,e.querySelectorAll(".item-qty-input").forEach(d=>{d.addEventListener("change",i=>{const b=i.target,m=b.dataset.id;this.items[m]=parseInt(b.value||"0",10),this.renderSummary()})}),e.querySelectorAll(".btn-delete-item").forEach(d=>{d.addEventListener("click",i=>{const b=i.currentTarget.dataset.id;delete this.items[b],this.renderSummary(),this.renderTabContent()})}),(n=e.querySelector("#btn-add-item"))==null||n.addEventListener("click",()=>{const d=e.querySelector("#input-new-item-id"),i=e.querySelector("#input-new-item-qty"),b=d.value.trim(),m=parseInt(i.value||"1",10);b&&(this.items[b]=m,this.renderSummary(),this.renderTabContent())})}else if(this.activeTab==="variables"){const l=Object.entries(this.variables);e.innerHTML=`
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
                ${l.length>0?l.map(([d,i])=>`
                  <tr class="hover:bg-card-hover border-b border-border/30">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${d}</td>
                    <td class="py-2 px-3">
                      <input type="text" value="${i}" data-id="${d}" class="var-val-input w-full bg-surface-container border border-border rounded py-0.5 px-2 font-mono text-body-md text-on-surface focus:outline-none focus:border-primary" />
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="2" class="p-4 text-center text-text-muted">No hay variables activas</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,e.querySelectorAll(".var-val-input").forEach(d=>{d.addEventListener("change",i=>{const b=i.target,m=b.dataset.id,f=Number(b.value);this.variables[m]=isNaN(f)?b.value:f,this.renderSummary()})})}else if(this.activeTab==="switches"){const l=Object.entries(this.switches);e.innerHTML=`
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
                ${l.length>0?l.map(([d,i])=>`
                  <tr class="hover:bg-card-hover border-b border-border/30">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${d}</td>
                    <td class="py-2 px-3 text-center">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" data-id="${d}" class="sr-only peer switch-toggle" ${i?"checked":""} />
                        <div class="w-8 h-4 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform peer-checked:bg-primary"></div>
                      </label>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="2" class="p-4 text-center text-text-muted">No hay switches activos</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,e.querySelectorAll(".switch-toggle").forEach(d=>{d.addEventListener("change",i=>{const b=i.target,m=b.dataset.id;this.switches[m]=b.checked,this.renderSummary()})})}}}async saveChanges(){try{await h.saveSaveContent(this.game.path,this.filename,{gold:this.gold,items:this.items,variables:this.variables,switches:this.switches}),u.show("Partida guardada con copia de seguridad","success"),this.close()}catch(e){u.show(`Error guardando partida: ${e.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class K{constructor(e){c(this,"game");c(this,"saves",[]);c(this,"selectedSave",null);c(this,"modalEl",null);this.game=e}async open(){var e,t;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[640px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-container-low shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-primary text-[24px]">save</span>
            <div>
              <h2 class="font-bold text-headline-md text-text-primary">${o("savesTitle")} · ${this.game.name}</h2>
              <p class="text-[11px] text-text-muted">${o("savesDesc")}</p>
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
              <span>${o("btnBackup")}</span>
            </button>

            <button id="btn-edit-save" class="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-symbols-outlined text-[16px]">edit</span>
              <span>Editar contenido</span>
            </button>
          </div>

          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${o("btnClose")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(a=>{a.addEventListener("click",()=>this.close())}),(e=this.modalEl.querySelector("#btn-backup-saves"))==null||e.addEventListener("click",()=>this.createBackup()),(t=this.modalEl.querySelector("#btn-edit-save"))==null||t.addEventListener("click",()=>this.openEditor()),await this.loadData()}async loadData(){var e;try{const t=await h.getSaves(this.game.path);this.saves=t.saves,this.selectedSave=this.saves[0]||null,this.renderTable(),this.updateEditButtonState()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#saves-table-container");a&&(a.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar partidas: ${t.message}</div>`)}}updateEditButtonState(){var t;const e=(t=this.modalEl)==null?void 0:t.querySelector("#btn-edit-save");e&&(e.disabled=!this.selectedSave)}renderTable(){var a;const e=(a=this.modalEl)==null?void 0:a.querySelector("#saves-table-container");if(!e)return;if(this.saves.length===0){e.innerHTML=`
        <div class="flex flex-col items-center justify-center h-full text-center p-6">
          <span class="material-symbols-outlined text-[48px] text-text-faint mb-2">folder_open</span>
          <p class="text-body-md text-text-muted">Aún no hay partidas guardadas en este juego.</p>
          <p class="text-[11px] text-text-faint mt-1">Guarda partida dentro del juego para verla aquí.</p>
        </div>
      `;return}const t=this.saves.map(r=>{var n;const s=((n=this.selectedSave)==null?void 0:n.name)===r.name;return`
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
    `,e.querySelectorAll(".save-row").forEach(r=>{r.addEventListener("click",s=>{const n=s.currentTarget.dataset.name;this.selectedSave=this.saves.find(l=>l.name===n)||null,this.renderTable(),this.updateEditButtonState()}),r.addEventListener("dblclick",()=>{this.openEditor()})})}async createBackup(){try{const e=await h.backupSaves(this.game.name);u.show(`Copia de seguridad creada en snapshot-${e.timestamp}`,"success")}catch(e){u.show(`Error creando copia: ${e.message}`,"error")}}openEditor(){if(!this.selectedSave)return;new J(this.game,this.selectedSave.name).open()}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class Q{constructor(e){c(this,"game");c(this,"currentCategory","Items");c(this,"items",[]);c(this,"searchQuery","");c(this,"modalEl",null);this.game=e}async open(){this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[760px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">database</span>
              <h2 class="font-bold text-headline-md text-text-primary">${o("dataTitle")} · ${this.game.name}</h2>
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
            ${o("btnClose")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(a=>{a.addEventListener("click",()=>this.close())});const e=this.modalEl.querySelector("#select-category");e==null||e.addEventListener("change",a=>{this.currentCategory=a.target.value,this.loadData()});const t=this.modalEl.querySelector("#data-search-input");t==null||t.addEventListener("input",a=>{this.searchQuery=a.target.value.toLowerCase(),this.renderTable()}),await this.loadData()}async loadData(){var e;try{const t=await h.getData(this.game.path,this.currentCategory);this.items=t.items,this.renderTable()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#data-table-container");a&&(a.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar datos: ${t.message}</div>`)}}renderTable(){var n,l;const e=(n=this.modalEl)==null?void 0:n.querySelector("#data-table-container"),t=(l=this.modalEl)==null?void 0:l.querySelector("#data-count-lbl");if(!e)return;const a=this.items.filter(d=>this.searchQuery?d.name.toLowerCase().includes(this.searchQuery)||String(d.id).includes(this.searchQuery):!0);if(t&&(t.textContent=`${a.length} elemento(s)`),a.length===0){e.innerHTML='<div class="p-6 text-center text-text-muted">No se encontraron elementos en esta categoría.</div>';return}let r='<th class="py-2 text-[11px] font-bold text-text-muted uppercase w-16">ID</th><th class="py-2 text-[11px] font-bold text-text-muted uppercase">Nombre</th>';["Items","Weapons","Armors"].includes(this.currentCategory)&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-24">Precio</th>'),this.currentCategory==="Weapons"&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">ATK</th>'),this.currentCategory==="Armors"&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">DEF</th>'),this.currentCategory==="Skills"&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-24">Coste MP</th>'),this.currentCategory==="Enemies"&&(r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">HP</th>',r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">EXP</th>',r+='<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">Oro</th>');const s=a.map(d=>{var b,m,f,v,_,L,C;let i="";return["Items","Weapons","Armors"].includes(this.currentCategory)&&(i+=`<td class="py-2 text-right font-mono text-text-muted">${(b=d.price)!=null?b:0}</td>`),this.currentCategory==="Weapons"&&(i+=`<td class="py-2 text-right font-mono text-primary font-bold">+${(m=d.atk)!=null?m:0}</td>`),this.currentCategory==="Armors"&&(i+=`<td class="py-2 text-right font-mono text-primary font-bold">+${(f=d.def)!=null?f:0}</td>`),this.currentCategory==="Skills"&&(i+=`<td class="py-2 text-right font-mono text-primary">${(v=d.mp_cost)!=null?v:0}</td>`),this.currentCategory==="Enemies"&&(i+=`<td class="py-2 text-right font-mono text-status-error font-bold">${(_=d.hp)!=null?_:0}</td>`,i+=`<td class="py-2 text-right font-mono text-text-muted">${(L=d.exp)!=null?L:0}</td>`,i+=`<td class="py-2 text-right font-mono text-status-warning">${(C=d.gold)!=null?C:0}</td>`),`
        <tr class="hover:bg-card-hover border-b border-border/30 transition-colors">
          <td class="py-2 font-mono text-primary text-[12px]">#${d.id}</td>
          <td class="py-2 font-medium text-on-surface text-[13px]">${d.name}</td>
          ${i}
        </tr>
      `}).join("");e.innerHTML=`
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>${r}</tr>
        </thead>
        <tbody>${s}</tbody>
      </table>
    `}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}const X=!!window.__TAURI_INTERNALS__;async function Y(){const{open:p}=await y(async()=>{const{open:t}=await import("./index-C4lDuuOm.js");return{open:t}},__vite__mapDeps([2,1])),e=await p({directory:!0,multiple:!1,title:"Carpeta de destino de partidas"});return typeof e=="string"?e:Array.isArray(e)&&e.length>0?e[0]:null}class ee{constructor(){c(this,"syncData",null);c(this,"modalEl",null);c(this,"folder","")}async open(){var a,r,s,n;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[680px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">sync</span>
              <h2 class="font-bold text-headline-md text-text-primary">${o("syncTitle")}</h2>
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
            <span class="text-[11px] font-bold text-text-faint uppercase shrink-0">${o("syncDestFolder")}</span>
            <input
              id="input-sync-folder"
              class="flex-1 min-w-0 bg-transparent border-none text-body-md text-primary font-mono focus:outline-none truncate"
              placeholder="Ruta no configurada (p. ej. /home/usuario/Dropbox/Saves)"
              type="text"
            />
            <button id="btn-pick-folder" class="${X?"flex":"hidden"} items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-label-md font-semibold border border-border text-on-surface transition-colors shrink-0">
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
            <span class="truncate">${o("syncAutoToggle")}</span>
          </label>

          <div class="flex items-center gap-2 shrink-0">
            <button id="btn-sync-pull" class="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>${o("btnPull")}</span>
            </button>

            <button id="btn-sync-push" class="px-4 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none">
              <span class="material-symbols-outlined text-[16px]">upload</span>
              <span>${o("btnPush")}</span>
            </button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(l=>{l.addEventListener("click",()=>this.close())}),this.modalEl.addEventListener("click",l=>{l.target===this.modalEl&&this.close()});const e=this.modalEl.querySelector("#input-sync-folder");e==null||e.addEventListener("change",()=>{this.folder=e.value.trim(),this.persistFolder(),this.updateFolderUi()}),(a=this.modalEl.querySelector("#btn-pick-folder"))==null||a.addEventListener("click",async()=>{try{const l=await Y();if(!l)return;this.folder=l,e&&(e.value=l),await this.persistFolder(),this.updateFolderUi()}catch(l){u.show(`No se pudo abrir el selector: ${l.message}`,"error")}}),(r=this.modalEl.querySelector("#btn-open-folder"))==null||r.addEventListener("click",async()=>{if(this.folder)try{await h.openTarget(this.folder)}catch(l){u.show(`No se pudo abrir la carpeta: ${l.message}`,"error")}}),(s=this.modalEl.querySelector("#btn-sync-push"))==null||s.addEventListener("click",()=>this.execute("push")),(n=this.modalEl.querySelector("#btn-sync-pull"))==null||n.addEventListener("click",()=>this.execute("pull"));const t=this.modalEl.querySelector("#chk-auto-sync");t==null||t.addEventListener("change",async()=>{try{const l=await h.getConfig();l.sync={...l.sync||{},auto:t.checked},await h.updateConfig(l),u.show("Ajuste de sincronización guardado","info",2e3)}catch(l){u.show(`Error al guardar ajuste: ${l.message}`,"error")}}),await this.loadData(),this.updateFolderUi()}updateFolderUi(){if(!this.modalEl)return;const e=!!this.folder,t=this.modalEl.querySelector("#sync-folder-hint"),a=this.modalEl.querySelector("#btn-open-folder"),r=this.modalEl.querySelector("#btn-sync-push"),s=this.modalEl.querySelector("#btn-sync-pull");t==null||t.classList.toggle("hidden",e||!this.modalEl.querySelector("#input-sync-folder")),e||t==null||t.classList.remove("hidden"),a&&(a.disabled=!e),r&&(r.disabled=!e),s&&(s.disabled=!e)}async persistFolder(){try{const e=await h.getConfig();e.sync={...e.sync||{},folder:this.folder},await h.updateConfig(e),u.show("Carpeta de sincronización guardada","info",2e3),await this.loadData(),this.updateFolderUi()}catch(e){u.show(`Error al guardar carpeta: ${e.message}`,"error")}}async loadData(){var e,t,a;try{this.syncData=await h.getSyncStatus(),this.folder=this.syncData.destination||"";const r=(e=this.modalEl)==null?void 0:e.querySelector("#input-sync-folder");r&&(r.value=this.folder);const s=(t=this.modalEl)==null?void 0:t.querySelector("#chk-auto-sync");s&&(s.checked=this.syncData.auto_sync),this.renderTable()}catch(r){const s=(a=this.modalEl)==null?void 0:a.querySelector("#sync-table-container");s&&(s.innerHTML=`<div class="p-6 text-center text-status-error">Error al cargar sincronización: ${r.message}</div>`)}}renderTable(){var a;const e=(a=this.modalEl)==null?void 0:a.querySelector("#sync-table-container");if(!e||!this.syncData)return;if(this.syncData.games.length===0){e.innerHTML=`
        <div class="flex flex-col items-center justify-center h-full text-center text-text-muted">
          <span class="material-symbols-outlined text-[48px] text-text-faint mb-2">sports_esports</span>
          <p>No hay juegos instalados todavía.</p>
        </div>
      `;return}const t=this.syncData.games.map(r=>{const s=r.local_saves>=0?`${r.local_saves} partida(s)`:"sin save/",n=r.dest_saves>=0?`${r.dest_saves} partida(s)`:this.folder?"vacío":"-";return`
        <tr class="hover:bg-card-hover border-b border-border/30 transition-colors">
          <td class="py-2.5 pr-4 font-semibold text-body-md text-on-surface truncate max-w-[260px]">${r.name}</td>
          <td class="py-2.5 text-center font-mono text-text-muted w-32">${s}</td>
          <td class="py-2.5 text-center font-mono text-primary w-32">${n}</td>
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
    `}async execute(e){var t,a;if(this.folder=(((a=(t=this.modalEl)==null?void 0:t.querySelector("#input-sync-folder"))==null?void 0:a.value)||"").trim(),!this.folder){u.show("Configura primero la carpeta de destino","warning"),this.updateFolderUi();return}try{u.show(`Ejecutando sincronización (${e==="push"?"enviar":"traer"})...`,"info");const s=((await h.executeSync(e,this.folder)).results||[]).reduce((n,l)=>n+(Number(l[1])||0),0);s>0?u.show(`${o("toastSyncDone")} (${s} archivo(s))`,"success"):u.show("Nada que sincronizar (no hay partidas locales)","info"),await this.loadData(),this.updateFolderUi()}catch(r){u.show(`Error de sincronización: ${r.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class te{constructor(e,t){c(this,"games",[]);c(this,"selectedGame","");c(this,"modalEl",null);var a;this.games=e,this.selectedGame=t?t.name:((a=e[0])==null?void 0:a.name)||""}async open(){var a;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none";const e=this.games.map(r=>`<option value="${r.name}" ${r.name===this.selectedGame?"selected":""}>${r.name} (${r.engine})</option>`).join("");this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[620px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[440px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-1">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">lock_open</span>
              <h2 class="font-bold text-headline-md text-text-primary">${o("decryptTitle")}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p class="text-[11px] text-text-muted">${o("decryptNotice")}</p>
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
            ${o("btnClose")}
          </button>
          <button id="btn-start-decrypt" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">lock_open</span>
            <span>Descifrar ahora</span>
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(r=>{r.addEventListener("click",()=>this.close())});const t=this.modalEl.querySelector("#select-decrypt-game");t==null||t.addEventListener("change",r=>{this.selectedGame=r.target.value}),(a=this.modalEl.querySelector("#btn-start-decrypt"))==null||a.addEventListener("click",()=>this.startDecrypt())}async startDecrypt(){var a,r,s;if(!this.selectedGame)return;const e=(a=this.modalEl)==null?void 0:a.querySelector("#decrypt-log-box"),t=(r=this.modalEl)==null?void 0:r.querySelector("#chk-recreate");e&&(e.textContent=`>> Iniciando descifrado de ${this.selectedGame}...
Descargando binario RPGMakerDecrypter si es necesario...
`);try{const n=await h.decrypt(this.selectedGame,(s=t==null?void 0:t.checked)!=null?s:!0);e&&(e.textContent+=`
¡Descifrado con éxito!
Carpeta de salida:
${n.output_dir}

${n.log||""}`),u.show("Juego descifrado correctamente","success")}catch(n){e&&(e.textContent+=`
ERROR: ${n.message}`),u.show(`Error descifrando: ${n.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class re{constructor(){c(this,"config",null);c(this,"modalEl",null)}async open(){var e;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[620px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0 flex justify-between items-center">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-primary text-[24px]">keyboard</span>
            <h2 class="font-bold text-headline-md text-text-primary">${o("shortcutsTitle")}</h2>
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
            ${o("btnCancel")}
          </button>
          <button id="btn-save-shortcuts" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md">
            ${o("btnSave")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close").forEach(t=>{t.addEventListener("click",()=>this.close())}),(e=this.modalEl.querySelector("#btn-save-shortcuts"))==null||e.addEventListener("click",()=>this.saveConfig()),await this.loadConfig()}async loadConfig(){var e;try{this.config=await h.getConfig(),this.renderBody()}catch(t){const a=(e=this.modalEl)==null?void 0:e.querySelector("#shortcuts-body-container");a&&(a.innerHTML=`<div class="text-center text-status-error p-6">Error: ${t.message}</div>`)}}renderBody(){var r;const e=(r=this.modalEl)==null?void 0:r.querySelector("#shortcuts-body-container");if(!e||!this.config)return;const a=[{key:"trucos",label:"Menú de trucos in-game"},{key:"recargar",label:"Recargar juego en visor"},{key:"fps",label:"Mostrar/Ocultar FPS"},{key:"captura",label:"Captura de pantalla"},{key:"pantalla_completa",label:"Pantalla completa"},{key:"zoom_in",label:"Aumentar Zoom"},{key:"zoom_out",label:"Reducir Zoom"}].map(s=>{const n=this.config.teclas[s.key]||"";return`
        <div class="flex items-center justify-between py-1.5 border-b border-border/30">
          <span class="text-body-md text-on-surface">${s.label}</span>
          <input
            data-key="${s.key}"
            class="key-input w-36 bg-surface border border-border rounded py-1 px-2.5 font-mono text-center text-primary text-body-md focus:outline-none focus:border-primary"
            type="text"
            value="${n}"
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
    `,e.querySelectorAll(".key-input").forEach(s=>{s.addEventListener("change",n=>{const l=n.target,d=l.dataset.key;this.config.teclas[d]=l.value.trim()})})}async saveConfig(){var a,r,s,n;if(!this.config)return;const e=(a=this.modalEl)==null?void 0:a.querySelector("#chk-default-webkit"),t=(r=this.modalEl)==null?void 0:r.querySelector("#chk-auto-del-zip");this.config.general.webkit=(s=e==null?void 0:e.checked)!=null?s:!1,this.config.general.auto_delete_zip=(n=t==null?void 0:t.checked)!=null?n:!1;try{await h.updateConfig(this.config),u.show("Configuración guardada correctamente","success"),this.close()}catch(l){u.show(`Error guardando configuración: ${l.message}`,"error")}}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}const j=!!window.__TAURI_INTERNALS__;async function ae(){if(!j)return null;const{open:p}=await y(async()=>{const{open:t}=await import("./index-C4lDuuOm.js");return{open:t}},__vite__mapDeps([2,1])),e=await p({directory:!0,multiple:!1,title:o("settingsTitle")});return typeof e=="string"?e:Array.isArray(e)&&e.length>0?e[0]:null}class se{constructor(){c(this,"folder","");c(this,"modalEl",null)}async open(){var t,a;this.modalEl=document.createElement("div"),this.modalEl.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none",this.modalEl.innerHTML=`
      <div class="relative w-full max-w-[560px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[340px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">settings</span>
              <h2 class="font-bold text-headline-md text-text-primary">${o("settingsTitle")}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p class="text-[11px] text-text-muted">
            ${o("settingsDesc")}
          </p>

          <!-- Games folder bar -->
          <div class="flex items-center gap-2 mt-3 p-2 rounded-lg bg-surface border border-border">
            <span class="text-[11px] font-bold text-text-faint uppercase shrink-0">${o("settingsGamesFolder")}</span>
            <input
              id="input-games-folder"
              class="flex-1 min-w-0 bg-transparent border-none text-body-md text-primary font-mono focus:outline-none truncate"
              placeholder="${o("settingsDefaultFolder","")}"
              type="text"
            />
            <button id="btn-pick-folder" class="${j?"flex":"hidden"} items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-label-md font-semibold border border-border text-on-surface transition-colors shrink-0">
              <span class="material-symbols-outlined text-[16px] text-primary">drive_folder_upload</span>
              <span>${o("btnChangeFolder")}</span>
            </button>
            <button id="btn-open-folder" class="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-primary border border-border transition-colors disabled:opacity-40 disabled:pointer-events-none" title="${o("btnOpenFolder")}" disabled>
              <span class="material-symbols-outlined text-[16px]">folder_open</span>
            </button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-end gap-2 shrink-0">
          <button id="btn-settings-close" class="px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors">
            ${o("btnClose")}
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.modalEl),this.modalEl.querySelectorAll(".btn-close, #btn-settings-close").forEach(r=>{r.addEventListener("click",()=>this.close())}),this.modalEl.addEventListener("click",r=>{r.target===this.modalEl&&this.close()});const e=this.modalEl.querySelector("#input-games-folder");e==null||e.addEventListener("change",()=>{this.folder=e.value.trim(),this.persistFolder(),this.updateFolderUi()}),(t=this.modalEl.querySelector("#btn-pick-folder"))==null||t.addEventListener("click",async()=>{try{const r=await ae();if(!r)return;this.folder=r,e&&(e.value=r),await this.persistFolder(),this.updateFolderUi()}catch(r){u.show(`${o("settingsTitle")}: ${r.message}`,"error")}}),(a=this.modalEl.querySelector("#btn-open-folder"))==null||a.addEventListener("click",async()=>{if(this.folder)try{await h.openTarget(this.folder)}catch(r){u.show(`${o("settingsTitle")}: ${r.message}`,"error")}}),await this.loadData(),this.updateFolderUi()}updateFolderUi(){if(!this.modalEl)return;const e=!!this.folder,t=this.modalEl.querySelector("#btn-open-folder");t.disabled=!e}async persistFolder(){try{const e=await h.getConfig();e.general={...e.general,games_dir:this.folder},await h.updateConfig(e),u.show("Carpeta de juegos guardada","info",2e3),await this.loadData(),this.updateFolderUi()}catch(e){u.show(`Error al guardar carpeta: ${e.message}`,"error")}}async loadData(){var e,t;try{const a=await h.getConfig();this.folder=(((e=a.general)==null?void 0:e.games_dir)||"").trim();const r=(t=this.modalEl)==null?void 0:t.querySelector("#input-games-folder");r&&(r.value=this.folder),await this.renderPlaceholder()}catch(a){u.show(`Error al cargar config: ${a.message}`,"error")}}async renderPlaceholder(){if(!this.modalEl)return;const e=this.modalEl.querySelector("#input-games-folder");if(!e)return;const{api:t}=await y(async()=>{const{api:r}=await Promise.resolve().then(()=>z);return{api:r}},void 0),a=t.getBaseUrl().replace("/api","")+"/games";e.placeholder=o("settingsDefaultFolder",a)}close(){var e;(e=this.modalEl)==null||e.remove(),this.modalEl=null}}class oe{constructor(e){c(this,"games",[]);c(this,"selectedGame",null);c(this,"searchQuery","");c(this,"activeGame",null);c(this,"activePort",null);c(this,"cardMap",new Map);c(this,"sidebar");c(this,"header");c(this,"actionBar");c(this,"statusBar");c(this,"appRoot");this.appRoot=e}async init(){var a,r,s,n,l,d;this.appRoot.className="flex h-screen overflow-hidden bg-background text-on-background select-none",await h.ensureReady(),this.sidebar=new B({onNav:i=>this.handleNav(i)});let e=!0,t=!1;try{const i=await h.getConfig();e=i.general.webkit!==!1,t=!!i.general.auto_delete_zip,(i.general.lang==="en"||i.general.lang==="es")&&k(i.general.lang)}catch{}this.header=new I({onSearch:i=>this.handleSearch(i),onRefresh:()=>this.handleRefresh(),onLanguageChange:i=>this.handleLanguageChange(i),onToggleWebKit:i=>this.persistGeneralConfig({webkit:i}),onToggleDelZip:i=>this.persistGeneralConfig({auto_delete_zip:i}),onUpdateClick:()=>this.handleOpenReleases(),onSettingsClick:()=>this.handleOpenSettings()},e,t),this.actionBar=new H({onPlay:()=>this.handlePlaySelected(),onPlugins:()=>this.handleOpenPlugins(),onSaves:()=>this.handleOpenSaves(),onData:()=>this.handleOpenData(),onMods:()=>this.handleOpenMods(),onSync:()=>this.handleOpenSync(),onDecrypt:()=>this.handleOpenDecrypt(),onStopServer:()=>this.handleStopServer(),onShortcuts:()=>this.handleOpenShortcuts(),onQuit:()=>window.close()}),this.statusBar=new U;try{const i=await h.getVersion();(r=(a=this.header).setVersion)==null||r.call(a,i),this.statusBar.setVersion(i)}catch{}this.appRoot.innerHTML=`
      <div id="sidebar-slot"></div>
      <div class="pl-60 flex-1 min-w-0 h-screen flex flex-col relative">
        <div id="header-slot" class="shrink-0"></div>
        <main class="flex-1 min-h-0 px-8 py-4 flex flex-col overflow-y-auto custom-scrollbar">
          <div class="flex items-end justify-between mb-4 shrink-0">
            <div>
              <h1 class="text-headline-lg font-bold text-on-surface mb-0.5">${o("library")}</h1>
              <p id="library-subtitle" class="text-body-md text-text-muted">
                Cargando biblioteca...
              </p>
            </div>
          </div>

          <!-- Drag and Drop Overlay Indicator (hidden by default) -->
          <div id="drag-drop-overlay" class="hidden fixed inset-0 z-50 bg-background/90 flex flex-col items-center justify-center border-4 border-dashed border-primary/70 pointer-events-none animate-in fade-in duration-200">
            <span class="material-symbols-outlined text-[64px] text-primary mb-3 animate-bounce">archive</span>
            <h2 class="text-2xl font-bold text-on-surface">${o("dragDropZip")}</h2>
            <p class="text-text-muted text-sm mt-1">Los juegos se extraerán y detectarán automáticamente</p>
          </div>

          <!-- Game Cards Grid -->
          <div id="games-grid" class="grid grid-cols-[repeat(auto-fill,minmax(178px,1fr))] gap-4 pb-4">
          </div>
        </main>
        <div id="actionbar-slot" class="shrink-0"></div>
        <div id="statusbar-slot" class="shrink-0"></div>
      </div>
    `,(s=this.appRoot.querySelector("#sidebar-slot"))==null||s.appendChild(this.sidebar.render()),(n=this.appRoot.querySelector("#header-slot"))==null||n.appendChild(this.header.render()),(l=this.appRoot.querySelector("#actionbar-slot"))==null||l.appendChild(this.actionBar.render()),(d=this.appRoot.querySelector("#statusbar-slot"))==null||d.appendChild(this.statusBar.render()),this.setupDragAndDrop(),h.listenEvents({onProgress:i=>{u.show(`Extrayendo: ${i.filename} (${i.current}/${i.total})`,"info",2e3)},onServerStarted:i=>{this.activeGame=i.game,this.activePort=i.port,this.updateBars(),u.show(o("toastServerStarted",i.port),"success")},onServerStopped:i=>{this.activeGame=null,this.activePort=null,this.updateBars(),i.game&&(u.show(o("toastServerStopped",i.seconds_added),"info"),this.loadGames())},onSyncComplete:i=>{u.show(`Sincronización de ${i.game} completada`,"success")},onGameLaunched:i=>{u.show(`${i.engine==="renpy"?"Ren'Py":"Juego nativo"} lanzado: abriendo ventana...`,"info",4e3)}}),await this.loadStatus(),await this.loadGames(),h.checkUpdate().then(i=>{i.update_available&&i.tag_name&&(this.header.setUpdateTag(i.tag_name),u.show(`Nueva versión disponible: ${i.tag_name}`,"info",5e3))}).catch(()=>{})}setupDragAndDrop(){const e=this.appRoot.querySelector("#drag-drop-overlay"),t=r=>e==null?void 0:e.classList.toggle("hidden",!r);if(window.__TAURI_INTERNALS__){y(async()=>{const{getCurrentWebview:r}=await import("./webview-DTu1fAsl.js");return{getCurrentWebview:r}},__vite__mapDeps([3,1])).then(({getCurrentWebview:r})=>{r().onDragDropEvent(s=>{var l;const n=s.payload;n.type==="enter"||n.type==="over"?t(!0):n.type==="leave"?t(!1):n.type==="drop"&&(t(!1),this.handleDroppedPaths((l=n.paths)!=null?l:[]))})});return}let a=0;window.addEventListener("dragenter",r=>{r.preventDefault(),a++,t(!0)}),window.addEventListener("dragleave",r=>{r.preventDefault(),a--,a<=0&&(t(!1),a=0)}),window.addEventListener("dragover",r=>{r.preventDefault()}),window.addEventListener("drop",async r=>{r.preventDefault(),a=0,t(!1),await this.handleRefresh()})}async handleDroppedPaths(e){const t=e.filter(a=>a.toLowerCase().endsWith(".zip"));if(t.length===0){u.show(o("dragDropZip"),"warning");return}try{u.show(`Copiando ${t.length} .zip y extrayendo...`,"info");const a=await h.getConfig(),r=await h.installZips(t,a.general.auto_delete_zip);for(const s of r.extracted)u.show(`Extraído: ${s}`,"success");for(const s of r.skipped)u.show(s,"error");r.extracted.length===0&&r.skipped.length===0&&u.show("Sin nuevos archivos .zip","info"),this.games=r.games,this.renderGrid(),this.updateSubtitle()}catch(a){u.show(`Error al instalar: ${a.message}`,"error")}}async loadStatus(){try{const e=await h.getStatus();this.activeGame=e.active_game,this.activePort=e.port,this.updateBars()}catch{}}async loadGames(){try{const e=await h.getGames();this.games=e.games,this.selectedGame?this.selectedGame=this.games.find(t=>{var a;return t.name===((a=this.selectedGame)==null?void 0:a.name)})||this.games[0]||null:this.games.length>0&&(this.selectedGame=this.games[0]),this.renderGrid(),this.updateSubtitle(),this.updateBars()}catch(e){u.show(`Error al cargar juegos: ${e.message}`,"error")}}updateSubtitle(){const e=this.appRoot.querySelector("#library-subtitle");e&&(e.textContent=`${this.games.length} ${o("gamesInstalled")}`)}updateBars(){const e=!!(this.activeGame&&this.activePort);this.actionBar.update(this.selectedGame,e),this.statusBar.update(this.activeGame,this.activePort);const t=this.appRoot.querySelector("#actionbar-slot");t&&(t.innerHTML="",t.appendChild(this.actionBar.render()));const a=this.appRoot.querySelector("#statusbar-slot");a&&(a.innerHTML="",a.appendChild(this.statusBar.render()))}renderGrid(){const e=this.appRoot.querySelector("#games-grid");if(!e)return;e.innerHTML="",this.cardMap.clear();const t=this.games.filter(a=>this.searchQuery?a.name.toLowerCase().includes(this.searchQuery)||a.engine.toLowerCase().includes(this.searchQuery):!0);if(t.length===0){e.innerHTML=`
        <div class="col-span-full flex flex-col items-center justify-center p-12 text-center">
          <span class="material-symbols-outlined text-[56px] text-text-faint mb-3">sports_esports</span>
          <p class="text-body-md text-text-muted whitespace-pre-line leading-relaxed">${o("emptyLibrary")}</p>
        </div>
      `;return}t.forEach(a=>{var l;const r=((l=this.selectedGame)==null?void 0:l.name)===a.name,s=new F(a,r,{onSelect:d=>this.selectGame(d),onLaunch:d=>{this.launchGame(d)},onFavorite:async(d,i)=>{try{const b=!d.favorite;await h.toggleFavorite(d.name,b),d.favorite=b,this.loadGames()}catch(b){u.show(`Error: ${b.message}`,"error")}}}),n=s.render();this.cardMap.set(a.name,{card:s,el:n}),e.appendChild(n)})}selectGame(e){var a,r,s;if(((a=this.selectedGame)==null?void 0:a.name)===e.name)return;const t=this.selectedGame;this.selectedGame=e,t&&((r=this.cardMap.get(t.name))==null||r.card.setSelected(!1)),(s=this.cardMap.get(e.name))==null||s.card.setSelected(!0),this.updateBars()}async launchGame(e){if(e.is_incomplete){u.show(o("incompleteNotice"),"warning");return}try{const a=(await h.getConfig()).general.webkit?"webkit":"browser";u.show(`Iniciando ${e.name}...`,"info"),await h.launchGame(e.path,a)}catch(t){u.show(`No se pudo lanzar '${e.name}': ${t.message}`,"error")}}handleSearch(e){this.searchQuery=e.toLowerCase().trim(),this.renderGrid()}async handleRefresh(){try{u.show("Buscando y extrayendo nuevos .zip...","info");const e=await h.getConfig(),t=await h.rescan(e.general.auto_delete_zip);t.extracted.length>0?u.show(`Extraídos: ${t.extracted.join(", ")}`,"success"):u.show("Sin nuevos archivos .zip","info"),this.loadGames()}catch(e){u.show(`Error al actualizar: ${e.message}`,"error")}}async handleLanguageChange(e){k(e),this.persistGeneralConfig({lang:e}),this.appRoot.innerHTML="",await this.init()}async persistGeneralConfig(e){try{const t=await h.getConfig();t.general={...t.general,...e},await h.updateConfig(t)}catch(t){u.show(`No se pudo guardar la preferencia: ${t.message}`,"error")}}handleOpenReleases(){h.openTarget("https://github.com/AsterrZep/rpgmaker-launcher/releases").catch(e=>u.show(`Error al abrir releases: ${e.message}`,"error"))}async handleOpenMods(){if(!this.selectedGame){u.show("Selecciona un juego primero","warning");return}try{const e=await h.setupMods(this.selectedGame.path);await h.openTarget(e.mods_dir),u.show(o("modsReadyToast"),"success")}catch(e){u.show(`Error con mods: ${e.message}`,"error")}}handlePlaySelected(){this.selectedGame&&this.launchGame(this.selectedGame)}async handleStopServer(){try{await h.stopServer()}catch(e){u.show(`Error al detener servidor: ${e.message}`,"error")}}handleNav(e){switch(e){case"library":break;case"plugins":this.handleOpenPlugins();break;case"saves":this.handleOpenSaves();break;case"data":this.handleOpenData();break;case"sync":this.handleOpenSync();break;case"decrypt":this.handleOpenDecrypt();break;case"shortcuts":this.handleOpenShortcuts();break}}handleOpenPlugins(){if(!this.selectedGame){u.show("Selecciona un juego primero","warning");return}new Z(this.selectedGame).open()}handleOpenSaves(){if(!this.selectedGame){u.show("Selecciona un juego primero","warning");return}new K(this.selectedGame).open()}handleOpenData(){if(!this.selectedGame){u.show("Selecciona un juego primero","warning");return}new Q(this.selectedGame).open()}handleOpenSync(){new ee().open()}handleOpenDecrypt(){new te(this.games,this.selectedGame).open()}handleOpenShortcuts(){new re().open()}handleOpenSettings(){new se().open()}}const $=[],x=p=>{const t=`[${new Date().toISOString().slice(11,23)}] ${p}`;$.push(t),console.log(`%c[DIAG] ${p}`,"color: cyan; font-weight: bold")};window.addEventListener("error",p=>{x(`❌ GLOBAL ERROR: ${p.message} at ${p.filename}:${p.lineno}:${p.colno}`)});window.addEventListener("unhandledrejection",p=>{x(`❌ UNHANDLED REJECTION: ${p.reason}`)});x("═══════════════════════════════════════════");x("Frontend diagnostics iniciado");x(`URL actual: ${window.location.href}`);x(`Protocolo: ${window.location.protocol}`);x(`Hostname: ${window.location.hostname}`);x(`Puerto: ${window.location.port}`);x(`Origin: ${window.location.origin}`);const A=!!window.__TAURI_INTERNALS__;x(`Tauri detectado: ${A}`);if(A)try{const p=window.__TAURI_INTERNALS__;x(`Tauri internals keys: ${Object.keys(p).join(", ")}`)}catch{}x(`User-Agent: ${navigator.userAgent}`);async function w(p){try{const{invoke:e}=await y(async()=>{const{invoke:t}=await import("./core-DhEqZVGG.js");return{invoke:t}},[]);await e("log_frontend",{msg:p})}catch{}}window.addEventListener("DOMContentLoaded",async()=>{x("DOMContentLoaded fired"),await w("DOMContentLoaded fired");const p=document.getElementById("app");if(p){x("Elemento #app encontrado"),await w("Elemento #app encontrado");try{const{invoke:e}=await y(async()=>{const{invoke:r}=await import("./core-DhEqZVGG.js");return{invoke:r}},[]),t=await e("ping");x(`IPC ping: ${t}`),await w(`IPC ping: ${t}`);const a=new oe(p);x("App instancia creada, llamando init()..."),await w("App instancia creada, llamando init()..."),await a.init(),x("✅ App.init() completado sin errores"),await w("✅ App.init() completado sin errores")}catch(e){x(`❌ Error en App.init(): ${e.message}
${e.stack}`),await w(`❌ Error en App.init(): ${e.message} ${e.stack}`)}}else x("❌ Elemento #app NO encontrado en el DOM"),await w("❌ Elemento #app NO encontrado en el DOM");window.__RPG_DIAG__={lines:$,dump:()=>$.join(`
`)},x("Dump disponible en: window.__RPG_DIAG__.dump()")});
