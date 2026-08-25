import { api, Game } from './api';
import { getLang, setLang, t } from './i18n';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GameCard } from './components/GameCard';
import { ActionBar } from './components/ActionBar';
import { StatusBar } from './components/StatusBar';
import { PluginsModal } from './components/PluginsModal';
import { SavesModal } from './components/SavesModal';
import { DataBrowserModal } from './components/DataBrowserModal';
import { SyncModal } from './components/SyncModal';
import { DecryptModal } from './components/DecryptModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { toasts } from './components/Toasts';

export class App {
  private games: Game[] = [];
  private selectedGame: Game | null = null;
  private searchQuery: string = '';
  private activeGame: string | null = null;
  private activePort: number | null = null;
  private cardMap = new Map<string, { card: GameCard; el: HTMLElement }>();

  private sidebar!: Sidebar;
  private header!: Header;
  private actionBar!: ActionBar;
  private statusBar!: StatusBar;

  private appRoot: HTMLElement;

  constructor(appRoot: HTMLElement) {
    this.appRoot = appRoot;
  }

  public async init(): Promise<void> {
    this.appRoot.className = 'flex h-screen overflow-hidden bg-background text-on-background select-none';

    // 1. Initialize Components
    this.sidebar = new Sidebar({
      onNav: (tab) => this.handleNav(tab),
    });

    let webkit = true;
    let autoDeleteZip = false;
    try {
      const cfg = await api.getConfig();
      webkit = cfg.general.webkit !== false;
      autoDeleteZip = Boolean(cfg.general.auto_delete_zip);
      if (cfg.general.lang === 'en' || cfg.general.lang === 'es') {
        setLang(cfg.general.lang);
      }
    } catch (_) {}

    this.header = new Header(
      {
        onSearch: (q) => this.handleSearch(q),
        onRefresh: () => this.handleRefresh(),
        onLanguageChange: (lang) => this.handleLanguageChange(lang),
        onToggleWebKit: (v) => this.persistGeneralConfig({ webkit: v }),
        onToggleDelZip: (v) => this.persistGeneralConfig({ auto_delete_zip: v }),
        onUpdateClick: () => this.handleOpenReleases(),
      },
      webkit,
      autoDeleteZip,
    );

    this.actionBar = new ActionBar({
      onPlay: () => this.handlePlaySelected(),
      onPlugins: () => this.handleOpenPlugins(),
      onSaves: () => this.handleOpenSaves(),
      onData: () => this.handleOpenData(),
      onMods: () => this.handleOpenMods(),
      onSync: () => this.handleOpenSync(),
      onDecrypt: () => this.handleOpenDecrypt(),
      onStopServer: () => this.handleStopServer(),
      onShortcuts: () => this.handleOpenShortcuts(),
      onQuit: () => window.close(),
    });

    this.statusBar = new StatusBar();

    // 2. Build Layout Structure
    this.appRoot.innerHTML = `
      <div id="sidebar-slot"></div>
      <div class="pl-60 flex-1 min-w-0 h-screen flex flex-col relative">
        <div id="header-slot" class="shrink-0"></div>
        <main class="flex-1 min-h-0 px-8 py-4 flex flex-col overflow-y-auto custom-scrollbar">
          <div class="flex items-end justify-between mb-4 shrink-0">
            <div>
              <h1 class="text-headline-lg font-bold text-on-surface mb-0.5">${t('library')}</h1>
              <p id="library-subtitle" class="text-body-md text-text-muted">
                Cargando biblioteca...
              </p>
            </div>
          </div>

          <!-- Drag and Drop Overlay Indicator (hidden by default) -->
          <div id="drag-drop-overlay" class="hidden fixed inset-0 z-50 bg-background/90 flex flex-col items-center justify-center border-4 border-dashed border-primary/70 pointer-events-none animate-in fade-in duration-200">
            <span class="material-symbols-outlined text-[64px] text-primary mb-3 animate-bounce">archive</span>
            <h2 class="text-2xl font-bold text-on-surface">${t('dragDropZip')}</h2>
            <p class="text-text-muted text-sm mt-1">Los juegos se extraerán y detectarán automáticamente</p>
          </div>

          <!-- Game Cards Grid -->
          <div id="games-grid" class="grid grid-cols-[repeat(auto-fill,minmax(178px,1fr))] gap-4 pb-4">
          </div>
        </main>
        <div id="actionbar-slot" class="shrink-0"></div>
        <div id="statusbar-slot" class="shrink-0"></div>
      </div>
    `;

    // 3. Mount Components
    this.appRoot.querySelector('#sidebar-slot')?.appendChild(this.sidebar.render());
    this.appRoot.querySelector('#header-slot')?.appendChild(this.header.render());
    this.appRoot.querySelector('#actionbar-slot')?.appendChild(this.actionBar.render());
    this.appRoot.querySelector('#statusbar-slot')?.appendChild(this.statusBar.render());

    // 4. Setup Drag & Drop Listener
    this.setupDragAndDrop();

    // 5. Connect SSE Events
    api.listenEvents({
      onProgress: (data) => {
        toasts.show(`Extrayendo: ${data.filename} (${data.current}/${data.total})`, 'info', 2000);
      },
      onServerStarted: (data) => {
        this.activeGame = data.game;
        this.activePort = data.port;
        this.updateBars();
        toasts.show(t('toastServerStarted', data.port), 'success');
      },
      onServerStopped: (data) => {
        this.activeGame = null;
        this.activePort = null;
        this.updateBars();
        if (data.game) {
          toasts.show(t('toastServerStopped', data.seconds_added), 'info');
          this.loadGames();
        }
      },
      onSyncComplete: (data) => {
        toasts.show(`Sincronización de ${data.game} completada`, 'success');
      },
      onGameLaunched: (data) => {
        // Juegos nativos (Ren'Py/XP/VX/mkxp-z/EasyRPG): sin servidor HTTP.
        // Confirmamos al instante que el proceso arrancó mientras la
        // ventana del juego tarda en aparecer.
        toasts.show(`${data.engine === 'renpy' ? "Ren'Py" : 'Juego nativo'} lanzado: abriendo ventana...`, 'info', 4000);
      },
    });

    // 6. Load Initial Data
    await this.loadStatus();
    await this.loadGames();

    // 7. Check for updates in the background (non-blocking)
    api.checkUpdate()
      .then((res) => {
        if (res.update_available && res.tag_name) {
          this.header.setUpdateTag(res.tag_name);
          toasts.show(`Nueva versión disponible: ${res.tag_name}`, 'info', 5000);
        }
      })
      .catch(() => {});
  }

  private setupDragAndDrop(): void {
    const overlay = this.appRoot.querySelector('#drag-drop-overlay') as HTMLElement;
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (overlay) overlay.classList.remove('hidden');
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0 && overlay) {
        overlay.classList.add('hidden');
        dragCounter = 0;
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragCounter = 0;
      if (overlay) overlay.classList.add('hidden');

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        toasts.show(`Detectados ${files.length} archivo(s). Escaneando...`, 'info');
        await this.handleRefresh();
      }
    });
  }

  private async loadStatus(): Promise<void> {
    try {
      const st = await api.getStatus();
      this.activeGame = st.active_game;
      this.activePort = st.port;
      this.updateBars();
    } catch (_) {}
  }

  public async loadGames(): Promise<void> {
    try {
      const res = await api.getGames();
      this.games = res.games;
      if (this.selectedGame) {
        this.selectedGame = this.games.find((g) => g.name === this.selectedGame?.name) || this.games[0] || null;
      } else if (this.games.length > 0) {
        this.selectedGame = this.games[0];
      }
      this.renderGrid();
      this.updateSubtitle();
      this.updateBars();
    } catch (err: any) {
      toasts.show(`Error al cargar juegos: ${err.message}`, 'error');
    }
  }

  private updateSubtitle(): void {
    const subtitle = this.appRoot.querySelector('#library-subtitle');
    if (subtitle) {
      subtitle.textContent = `${this.games.length} ${t('gamesInstalled')}`;
    }
  }

  private updateBars(): void {
    const isRunning = Boolean(this.activeGame && this.activePort);
    this.actionBar.update(this.selectedGame, isRunning);
    this.statusBar.update(this.activeGame, this.activePort);

    // Re-mount updated bars
    const actionSlot = this.appRoot.querySelector('#actionbar-slot');
    if (actionSlot) {
      actionSlot.innerHTML = '';
      actionSlot.appendChild(this.actionBar.render());
    }

    const statusSlot = this.appRoot.querySelector('#statusbar-slot');
    if (statusSlot) {
      statusSlot.innerHTML = '';
      statusSlot.appendChild(this.statusBar.render());
    }
  }

  private renderGrid(): void {
    const grid = this.appRoot.querySelector('#games-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.cardMap.clear();

    const filtered = this.games.filter((g) => {
      if (!this.searchQuery) return true;
      return (
        g.name.toLowerCase().includes(this.searchQuery) ||
        g.engine.toLowerCase().includes(this.searchQuery)
      );
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center p-12 text-center">
          <span class="material-symbols-outlined text-[56px] text-text-faint mb-3">sports_esports</span>
          <p class="text-body-md text-text-muted whitespace-pre-line leading-relaxed">${t('emptyLibrary')}</p>
        </div>
      `;
      return;
    }

    filtered.forEach((game) => {
      const isSelected = this.selectedGame?.name === game.name;
      const card = new GameCard(game, isSelected, {
        onSelect: (g) => this.selectGame(g),
        onLaunch: (g) => {
          this.launchGame(g);
        },
        onFavorite: async (g, e) => {
          try {
            const nextFav = !g.favorite;
            await api.toggleFavorite(g.name, nextFav);
            g.favorite = nextFav;
            this.loadGames();
          } catch (err: any) {
            toasts.show(`Error: ${err.message}`, 'error');
          }
        },
      });

      const el = card.render();
      this.cardMap.set(game.name, { card, el });
      grid.appendChild(el);
    });
  }

  /**
   * Selección incremental: alterna clases en las dos tarjetas afectadas
   * sin reconstruir el grid (reacción instantánea del hover/click).
   */
  private selectGame(g: Game): void {
    if (this.selectedGame?.name === g.name) return;
    const prev = this.selectedGame;
    this.selectedGame = g;
    if (prev) {
      this.cardMap.get(prev.name)?.card.setSelected(false);
    }
    this.cardMap.get(g.name)?.card.setSelected(true);
    this.updateBars();
  }

  private async launchGame(game: Game): Promise<void> {
    if (game.is_incomplete) {
      toasts.show(t('incompleteNotice'), 'warning');
      return;
    }

    try {
      const cfg = await api.getConfig();
      const viewer = cfg.general.webkit ? 'webkit' : 'browser';
      toasts.show(`Iniciando ${game.name}...`, 'info');
      await api.launchGame(game.name, viewer);
    } catch (err: any) {
      toasts.show(`No se pudo lanzar '${game.name}': ${err.message}`, 'error');
    }
  }

  private handleSearch(q: string): void {
    this.searchQuery = q.toLowerCase().trim();
    this.renderGrid();
  }

  private async handleRefresh(): Promise<void> {
    try {
      toasts.show('Buscando y extrayendo nuevos .zip...', 'info');
      const cfg = await api.getConfig();
      const res = await api.rescan(cfg.general.auto_delete_zip);
      if (res.extracted.length > 0) {
        toasts.show(`Extraídos: ${res.extracted.join(', ')}`, 'success');
      } else {
        toasts.show('Sin nuevos archivos .zip', 'info');
      }
      this.loadGames();
    } catch (err: any) {
      toasts.show(`Error al actualizar: ${err.message}`, 'error');
    }
  }

  private async handleLanguageChange(lang: 'es' | 'en'): Promise<void> {
    setLang(lang);
    this.persistGeneralConfig({ lang });
    this.appRoot.innerHTML = '';
    await this.init();
  }

  private async persistGeneralConfig(patch: Record<string, any>): Promise<void> {
    try {
      const cfg = await api.getConfig();
      cfg.general = { ...cfg.general, ...patch };
      await api.updateConfig(cfg);
    } catch (err: any) {
      toasts.show(`No se pudo guardar la preferencia: ${err.message}`, 'error');
    }
  }

  private handleOpenReleases(): void {
    api.openTarget('https://github.com/AsterrZep/rpgmaker-launcher/releases')
      .catch((err: any) => toasts.show(`Error al abrir releases: ${err.message}`, 'error'));
  }

  private async handleOpenMods(): Promise<void> {
    if (!this.selectedGame) {
      toasts.show('Selecciona un juego primero', 'warning');
      return;
    }
    try {
      const res = await api.setupMods(this.selectedGame.name);
      await api.openTarget(res.mods_dir);
      toasts.show(t('modsReadyToast'), 'success');
    } catch (err: any) {
      toasts.show(`Error con mods: ${err.message}`, 'error');
    }
  }

  private handlePlaySelected(): void {
    if (this.selectedGame) {
      this.launchGame(this.selectedGame);
    }
  }

  private async handleStopServer(): Promise<void> {
    try {
      await api.stopServer();
    } catch (err: any) {
      toasts.show(`Error al detener servidor: ${err.message}`, 'error');
    }
  }

  private handleNav(tab: string): void {
    switch (tab) {
      case 'library':
        // already on library
        break;
      case 'plugins':
        this.handleOpenPlugins();
        break;
      case 'saves':
        this.handleOpenSaves();
        break;
      case 'data':
        this.handleOpenData();
        break;
      case 'sync':
        this.handleOpenSync();
        break;
      case 'decrypt':
        this.handleOpenDecrypt();
        break;
      case 'shortcuts':
        this.handleOpenShortcuts();
        break;
    }
  }

  private handleOpenPlugins(): void {
    if (!this.selectedGame) {
      toasts.show('Selecciona un juego primero', 'warning');
      return;
    }
    const modal = new PluginsModal(this.selectedGame);
    modal.open();
  }

  private handleOpenSaves(): void {
    if (!this.selectedGame) {
      toasts.show('Selecciona un juego primero', 'warning');
      return;
    }
    const modal = new SavesModal(this.selectedGame);
    modal.open();
  }

  private handleOpenData(): void {
    if (!this.selectedGame) {
      toasts.show('Selecciona un juego primero', 'warning');
      return;
    }
    const modal = new DataBrowserModal(this.selectedGame);
    modal.open();
  }

  private handleOpenSync(): void {
    const modal = new SyncModal();
    modal.open();
  }

  private handleOpenDecrypt(): void {
    const modal = new DecryptModal(this.games, this.selectedGame);
    modal.open();
  }

  private handleOpenShortcuts(): void {
    const modal = new ShortcutsModal();
    modal.open();
  }
}
