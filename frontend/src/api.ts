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

class ApiClient {
  private baseUrl: string = "";

  constructor() {
    // __API_BASE__ is injected by Tauri's initialization_script in main.rs
    // before any page JS runs, so it's always available in production.
    const w = window as any;
    if (w.__API_BASE__) {
      this.baseUrl = w.__API_BASE__;
    } else if (window.location.port === "5173") {
      // Vite dev mode: Python server must be running separately.
      this.baseUrl = "http://127.0.0.1:18321";
    } else {
      // Fixed port for Tauri production mode
      this.baseUrl = "http://127.0.0.1:18321";
    }
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, "");
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }


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

  public async getStatus(): Promise<any> {
    return this.request('/api/status');
  }

  public async getVersion(): Promise<string> {
    const status = await this.getStatus();
    return status.version || '0.0.0';
  }

  public async getGames(): Promise<{ games: Game[]; total: number }> {
    return this.request('/api/games');
  }

  public async rescan(autoDelete: boolean = false): Promise<{ extracted: string[]; errors: string[]; games: Game[] }> {
    return this.request('/api/games/rescan', {
      method: 'POST',
      body: JSON.stringify({ auto_delete: autoDelete }),
    });
  }

  public async installZips(paths: string[], autoDelete: boolean = false): Promise<{ copied: string[]; skipped: string[]; extracted: string[]; games: Game[] }> {
    return this.request('/api/games/install', {
      method: 'POST',
      body: JSON.stringify({ paths, auto_delete: autoDelete }),
    });
  }

  public async toggleFavorite(name: string, favorite?: boolean): Promise<{ ok: boolean; name: string; favorite: boolean }> {
    return this.request('/api/games/favorite', {
      method: 'POST',
      body: JSON.stringify({ name, favorite }),
    });
  }

  public async launchGame(name: string, viewer: 'webkit' | 'browser' = 'webkit'): Promise<{ ok: boolean; port?: number; engine?: string }> {
    return this.request('/api/games/launch', {
      method: 'POST',
      body: JSON.stringify({ name, viewer }),
    });
  }

  public async stopServer(): Promise<{ ok: boolean; game: string | null; seconds_added: number; total_seconds: number }> {
    return this.request('/api/games/stop', { method: 'POST' });
  }

  public async getPlugins(game: string): Promise<{ plugins: PluginItem[]; has_backup: boolean }> {
    return this.request(`/api/plugins?game=${encodeURIComponent(game)}`);
  }

  public async togglePlugins(game: string, params: { names?: string[]; status?: boolean; all?: boolean; action?: 'restore' }): Promise<any> {
    return this.request('/api/plugins/toggle', {
      method: 'POST',
      body: JSON.stringify({ game, ...params }),
    });
  }

  public async getSaves(game: string): Promise<{ saves: SaveItem[]; count: number }> {
    return this.request(`/api/saves?game=${encodeURIComponent(game)}`);
  }

  public async getSaveContent(game: string, file: string): Promise<SaveContent> {
    return this.request(`/api/saves/content?game=${encodeURIComponent(game)}&file=${encodeURIComponent(file)}`);
  }

  public async saveSaveContent(game: string, file: string, data: any): Promise<{ ok: boolean; message: string }> {
    return this.request('/api/saves/content', {
      method: 'POST',
      body: JSON.stringify({ game, file, ...data }),
    });
  }

  public async backupSaves(game: string): Promise<{ ok: boolean; backup_path: string; timestamp: string }> {
    return this.request('/api/saves/backup', {
      method: 'POST',
      body: JSON.stringify({ game }),
    });
  }

  public async getData(game: string, cat: string): Promise<{ category: string; items: DataItem[]; count: number }> {
    return this.request(`/api/data?game=${encodeURIComponent(game)}&cat=${encodeURIComponent(cat)}`);
  }

  public async getSyncStatus(): Promise<SyncStatus> {
    return this.request('/api/sync/status');
  }

  public async executeSync(mode: 'push' | 'pull', folder?: string): Promise<{ ok: boolean; mode: string; results: any[] }> {
    return this.request('/api/sync/execute', {
      method: 'POST',
      body: JSON.stringify({ mode, folder }),
    });
  }

  public async decrypt(game: string, recreate: boolean = false): Promise<{ ok: boolean; output_dir: string; log?: string }> {
    return this.request('/api/decrypt', {
      method: 'POST',
      body: JSON.stringify({ game, recreate }),
    });
  }

  public async setupMods(game: string): Promise<{ ok: boolean; mods_dir: string; created: boolean }> {
    return this.request('/api/tools/mods', {
      method: 'POST',
      body: JSON.stringify({ game }),
    });
  }

  public async openTarget(target: string): Promise<{ ok: boolean }> {
    return this.request(`/api/open?target=${encodeURIComponent(target)}`);
  }

  public async checkUpdate(): Promise<{ update_available: boolean; tag_name: string; current_version: string; url: string; error?: string }> {
    return this.request('/api/update/check');
  }

  public async getConfig(): Promise<AppConfig> {
    return this.request('/api/config');
  }

  public async updateConfig(cfg: Partial<AppConfig>): Promise<{ ok: boolean; config: AppConfig }> {
    return this.request('/api/config', {
      method: 'POST',
      body: JSON.stringify(cfg),
    });
  }

  public listenEvents(callbacks: {
    onProgress?: (data: any) => void;
    onServerStarted?: (data: any) => void;
    onServerStopped?: (data: any) => void;
    onSyncComplete?: (data: any) => void;
    onGameLaunched?: (data: any) => void;
  }): () => void {
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
