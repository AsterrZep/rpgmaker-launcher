// ============================================================
//  RPG Maker Launcher - API Client (Tauri IPC Native)
// ============================================================
// Cliente API que utiliza Tauri's invoke() para comunicación
// IPC nativa con el backend Rust. Solo usa HTTP fallback para
// funcionalidad que aún no está migrada a Rust.
// ============================================================

// Detectar si estamos en Tauri
const isTauri = !!(window as any).__TAURI_INTERNALS__;

// Importar invoke de Tauri (solo en entorno Tauri)
let invoke: ((cmd: string, args?: Record<string, any>) => Promise<any>) | null = null;

if (isTauri) {
  import('@tauri-apps/api/core').then((module) => {
    invoke = module.invoke;
  });
}

// ---------- Interfaces ----------

export interface Game {
  name: string;
  path: string;
  engine: string;
  engine_label: string;
  is_web: boolean;
  is_incomplete: boolean;
  has_cover: boolean;
  cover_url: string | null;
  favorite: boolean;
  seconds: number;
  last_played: number | null;
  has_saves: boolean;
}

export interface PluginItem {
  name: string;
  status: boolean;
  description?: string;
  category: 'ok' | 'nw-protegido' | 'roto' | 'sin-fichero';
  motivos: string[];
}

export interface SaveItem {
  name: string;
  size_bytes: number;
  size_kb: number;
  mtime: number;
  mtime_str: string;
}

export interface SaveContent {
  summary: {
    gold: number;
    items_kinds: number;
    variables_used: number;
    switches_on: number;
    actors: string;
  };
  gold: number;
  items: Record<string, number>;
  weapons: Record<string, number>;
  armors: Record<string, number>;
  variables: Record<string, any>;
  switches: Record<string, boolean>;
  actors: Array<{
    id: number;
    name: string;
    level: number;
    hp: number;
    mp: number;
  }>;
}

export interface DataItem {
  id: number;
  name: string;
  description?: string;
  price?: number;
  atk?: number;
  def?: number;
  mp_cost?: number;
  hp?: number;
  exp?: number;
  gold?: number;
}

export interface SyncStatus {
  destination: string;
  auto_sync: boolean;
  games: Array<{
    name: string;
    local_saves: number;
    dest_saves: number;
  }>;
}

export interface AppConfig {
  teclas: Record<string, string>;
  general: {
    webkit: boolean;
    auto_delete_zip: boolean;
    lang?: string;
    games_dir?: string;
  };
  sync?: {
    folder?: string;
    auto?: boolean;
  };
}

// ---------- API Client ----------

class ApiClient {
  private baseUrl: string = "";
  private useTauri: boolean = isTauri;

  constructor() {
    const w = window as any;
    if (w.__API_BASE__) {
      this.baseUrl = w.__API_BASE__;
    } else if (window.location.port === "5173") {
      this.baseUrl = "http://127.0.0.1:38915";
    } else {
      this.baseUrl = "http://127.0.0.1:38915";
    }
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, "");
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  // ---------- Tauri IPC Methods ----------

  private async invokeTauri<T>(cmd: string, args?: Record<string, any>): Promise<T> {
    if (!invoke) {
      throw new Error("Tauri invoke not available");
    }
    return invoke(cmd, args);
  }

  // ---------- HTTP Fallback Methods ----------

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let err = "API Error";
      try {
        const body = await response.json();
        err = body.error || err;
      } catch (_) {}
      throw new Error(err);
    }
    return response.json();
  }

  // ---------- Unified API Methods ----------

  // Games
  public async getGames(): Promise<{ games: Game[]; total: number }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ games: Game[]; total: number }>('get_games');
    }
    return this.request('/api/games');
  }

  public async launchGame(name: string, viewer: 'webkit' | 'browser' = 'webkit'): Promise<{ ok: boolean; port?: number; engine?: string }> {
    if (this.useTauri && invoke) {
      // Need game path and engine - detect first
      const detectResult = await this.invokeTauri<{ ok: boolean; root: string; engine: string }>('detect_game_engine', { gamePath: name });
      if (!detectResult.ok) {
        throw new Error('No se pudo detectar el juego');
      }
      return this.invokeTauri<{ ok: boolean; port?: number; engine?: string }>('launch_game', {
        gameName: name,
        gamePath: detectResult.root,
        engine: detectResult.engine,
      });
    }
    return this.request('/api/games/launch', {
      method: 'POST',
      body: JSON.stringify({ name, viewer }),
    });
  }

  public async stopServer(): Promise<{ ok: boolean; game: string | null; seconds_added: number; total_seconds: number }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ ok: boolean; game: string | null; seconds_added: number; total_seconds: number }>('stop_game');
    }
    return this.request('/api/games/stop', { method: 'POST' });
  }

  public async toggleFavorite(name: string, favorite?: boolean): Promise<{ ok: boolean; name: string; favorite: boolean }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ ok: boolean; name: string; favorite: boolean }>('toggle_favorite', { gameName: name });
    }
    return this.request('/api/games/favorite', {
      method: 'POST',
      body: JSON.stringify({ name, favorite }),
    });
  }

  // Scanning & Installation
  public async rescan(autoDelete: boolean = false): Promise<{ extracted: string[]; errors: string[]; games: Game[] }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ extracted: string[]; errors: string[]; games: Game[] }>('rescan_games', { autoDelete });
    }
    return this.request('/api/games/rescan', {
      method: 'POST',
      body: JSON.stringify({ auto_delete: autoDelete }),
    });
  }

  public async installZips(paths: string[], autoDelete: boolean = false): Promise<{ copied: string[]; skipped: string[]; extracted: string[]; games: Game[] }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ copied: string[]; skipped: string[]; extracted: string[]; games: Game[] }>('install_zips', { paths, autoDelete });
    }
    return this.request('/api/games/install', {
      method: 'POST',
      body: JSON.stringify({ paths, auto_delete: autoDelete }),
    });
  }

  // Plugins
  public async getPlugins(game: string): Promise<{ plugins: PluginItem[]; has_backup: boolean }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ plugins: PluginItem[]; has_backup: boolean }>('get_plugins', { gamePath: game });
    }
    return this.request(`/api/plugins?game=${encodeURIComponent(game)}`);
  }

  public async togglePlugins(game: string, params: { names?: string[]; status?: boolean; all?: boolean; action?: 'restore' }): Promise<any> {
    if (this.useTauri && invoke) {
      if (params.action === 'restore') {
        return this.invokeTauri<any>('restore_plugins', { gamePath: game });
      }
      return this.invokeTauri<any>('toggle_plugins', {
        gamePath: game,
        names: params.names || [],
        status: params.status ?? true,
        all: params.all ?? false,
      });
    }
    return this.request('/api/plugins/toggle', {
      method: 'POST',
      body: JSON.stringify({ game, ...params }),
    });
  }

  // Saves
  public async getSaves(game: string): Promise<{ saves: SaveItem[]; count: number }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ saves: SaveItem[]; count: number }>('get_saves', { gamePath: game });
    }
    return this.request(`/api/saves?game=${encodeURIComponent(game)}`);
  }

  public async getSaveContent(game: string, file: string): Promise<SaveContent> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<SaveContent>('get_save_content', { gamePath: game, saveName: file });
    }
    return this.request(`/api/saves/content?game=${encodeURIComponent(game)}&file=${encodeURIComponent(file)}`);
  }

  public async saveSaveContent(game: string, file: string, data: any): Promise<{ ok: boolean; message: string }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ ok: boolean; message: string }>('update_save_content', {
        gamePath: game,
        saveName: file,
        updates: data,
      });
    }
    return this.request('/api/saves/content', {
      method: 'POST',
      body: JSON.stringify({ game, file, ...data }),
    });
  }

  public async backupSaves(game: string): Promise<{ ok: boolean; backup_path: string; timestamp: string }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ ok: boolean; backup_path: string; timestamp: string }>('backup_save', {
        gamePath: game,
        saveName: 'all',
      });
    }
    return this.request('/api/saves/backup', {
      method: 'POST',
      body: JSON.stringify({ game }),
    });
  }

  // Data Browser
  public async getData(game: string, cat: string): Promise<{ category: string; items: DataItem[]; count: number }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ category: string; items: DataItem[]; count: number }>('get_data', {
        gamePath: game,
        category: cat,
      });
    }
    return this.request(`/api/data?game=${encodeURIComponent(game)}&cat=${encodeURIComponent(cat)}`);
  }

  // Sync
  public async getSyncStatus(): Promise<SyncStatus> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<SyncStatus>('get_sync_status');
    }
    return this.request('/api/sync/status');
  }

  public async executeSync(mode: 'push' | 'pull', folder?: string): Promise<{ ok: boolean; mode: string; results: any[] }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ ok: boolean; mode: string; results: any[] }>('execute_sync', { mode, folder });
    }
    return this.request('/api/sync/execute', {
      method: 'POST',
      body: JSON.stringify({ mode, folder }),
    });
  }

  // Decrypt
  public async decrypt(game: string, recreate: boolean = false): Promise<{ ok: boolean; output_dir: string; log?: string }> {
    if (this.useTauri && invoke) {
      // Need encryption key - read from project
      const keyResult = await this.invokeTauri<string | null>('read_encryption_key', { gamePath: game });
      if (!keyResult) {
        throw new Error('No se encontró la clave de encriptación');
      }
      return this.invokeTauri<{ success_count: number; failed_count: number; output_dir: string; log: string }>('decrypt_game_assets', {
        gamePath: game,
        encryptionKey: keyResult,
      });
    }
    return this.request('/api/decrypt', {
      method: 'POST',
      body: JSON.stringify({ game, recreate }),
    });
  }

  // Tools
  public async setupMods(game: string): Promise<{ ok: boolean; mods_dir: string; created: boolean }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ ok: boolean; mods_dir: string; created: boolean }>('setup_mods', { gamePath: game });
    }
    return this.request('/api/tools/mods', {
      method: 'POST',
      body: JSON.stringify({ game }),
    });
  }

  public async openTarget(target: string): Promise<{ ok: boolean }> {
    if (this.useTauri && invoke) {
      try {
        await import('@tauri-apps/plugin-shell').then(({ open }) => {
          open(target);
        });
        return { ok: true };
      } catch (e) {
        // Fallback to Rust command
        return this.invokeTauri<{ ok: boolean }>('open_target', { target });
      }
    }
    return this.request(`/api/open?target=${encodeURIComponent(target)}`);
  }

  // Updates
  public async checkUpdate(): Promise<{ update_available: boolean; tag_name: string; current_version: string; url: string; error?: string }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ update_available: boolean; tag_name: string; current_version: string; url: string }>('check_update');
    }
    return this.request('/api/update/check');
  }

  // Config
  public async getConfig(): Promise<AppConfig> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<AppConfig>('get_config');
    }
    return this.request('/api/config');
  }

  public async updateConfig(cfg: Partial<AppConfig>): Promise<{ ok: boolean; config: AppConfig }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ ok: boolean; config: AppConfig }>('update_config', { config: cfg });
    }
    return this.request('/api/config', {
      method: 'POST',
      body: JSON.stringify(cfg),
    });
  }

  // Status
  public async getStatus(): Promise<any> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<any>('get_status');
    }
    return this.request('/api/status');
  }

  public async getVersion(): Promise<string> {
    const status = await this.getStatus();
    return status.version || '0.0.0';
  }

  // Game Detection
  public async detectGameEngine(gamePath: string): Promise<{ ok: boolean; root: string; engine: string; engineLabel: string; isWeb: boolean; isIncomplete: boolean }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ ok: boolean; root: string; engine: string; engineLabel: string; isWeb: boolean; isIncomplete: boolean }>('detect_game_engine', { gamePath });
    }
    return { ok: false, root: gamePath, engine: '', engineLabel: '', isWeb: false, isIncomplete: false };
  }

  // Cover Images
  public async getCoverImage(gameName: string, gamePath: string): Promise<{ found: boolean; data?: number[]; mime_type: string }> {
    if (this.useTauri && invoke) {
      return this.invokeTauri<{ found: boolean; data?: number[]; mime_type: string }>('get_cover_image', { gameName, gamePath });
    }
    return { found: false, mime_type: '' };
  }

  // SSE Events (HTTP only - Tauri uses different mechanism)
  public listenEvents(callbacks: {
    onProgress?: (data: any) => void;
    onServerStarted?: (data: any) => void;
    onServerStopped?: (data: any) => void;
    onSyncComplete?: (data: any) => void;
    onGameLaunched?: (data: any) => void;
  }): () => void {
    if (!this.baseUrl || this.useTauri) {
      return () => {};
    }

    const sse = new EventSource(`${this.baseUrl}/api/events`);
    
    sse.addEventListener('extraction_progress', (e) => {
      callbacks.onProgress?.(JSON.parse(e.data));
    });
    sse.addEventListener('server_started', (e) => {
      callbacks.onServerStarted?.(JSON.parse(e.data));
    });
    sse.addEventListener('server_stopped', (e) => {
      callbacks.onServerStopped?.(JSON.parse(e.data));
    });
    sse.addEventListener('sync_complete', (e) => {
      callbacks.onSyncComplete?.(JSON.parse(e.data));
    });
    sse.addEventListener('game_launched', (e) => {
      callbacks.onGameLaunched?.(JSON.parse(e.data));
    });

    return () => sse.close();
  }
}

export const api = new ApiClient();
