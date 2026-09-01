// ============================================================
//  RPG Maker Launcher - API Client (Wails IPC)
// ============================================================
// Wraps auto-generated Wails bindings with the same interface
// as the old HTTP/Tauri API client so app.ts needs minimal changes.
// ============================================================

import * as App from '../wailsjs/go/main/App';

// ── Types (matching Go structs) ─────────────────────────────

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
  category: 'ok' | 'nw_protegido' | 'roto' | 'sin_fichero';
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
  summary: Record<string, any>;
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

// ── API Client ──────────────────────────────────────────────

class ApiClient {
  // No baseUrl needed — Wails IPC is direct function calls.

  public async getStatus(): Promise<any> {
    return App.GetStatus();
  }

  public async getVersion(): Promise<string> {
    const st = await App.GetStatus();
    return (st as any).version || '1.0.0-go';
  }

  public async getGames(): Promise<{ games: Game[]; total: number }> {
    return App.GetGames();
  }

  public async rescan(autoDelete: boolean = false): Promise<{ extracted: string[]; errors: string[]; games: Game[] }> {
    return App.RescanGames() as any;
  }

  public async installZips(paths: string[], autoDelete: boolean = false): Promise<{ copied: string[]; skipped: string[]; extracted: string[]; games: Game[] }> {
    return App.InstallZips(paths, autoDelete) as any;
  }

  public async toggleFavorite(name: string, favorite?: boolean): Promise<{ ok: boolean; name: string; favorite: boolean }> {
    return App.ToggleFavorite(name);
  }

  public async launchGame(name: string, viewer: 'webkit' | 'browser' = 'webkit'): Promise<{ ok: boolean; port?: number; engine?: string }> {
    // In Wails, we detect engine from path. The frontend sends name,
    // and the backend resolves path + engine internally.
    // For now, use empty path/engine — backend will look up from games cache.
    return App.LaunchGame(name, '', '') as any;
  }

  public async stopServer(): Promise<{ ok: boolean; game: string | null; seconds_added: number; total_seconds: number }> {
    return App.StopGame();
  }

  public async getPlugins(game: string): Promise<{ plugins: PluginItem[]; has_backup: boolean }> {
    return App.GetPlugins(game) as any;
  }

  public async togglePlugins(game: string, params: { names?: string[]; status?: boolean; all?: boolean; action?: 'restore' }): Promise<any> {
    if (params.action === 'restore') {
      return App.RestorePlugins(game);
    }
    return App.TogglePlugins(game, params.names || [], params.status ?? true, params.all ?? false);
  }

  public async getSaves(game: string): Promise<{ saves: SaveItem[]; count: number }> {
    return App.GetSaves(game) as any;
  }

  public async getSaveContent(game: string, file: string): Promise<SaveContent> {
    return App.GetSaveContent(game, file) as any;
  }

  public async saveSaveContent(game: string, file: string, data: any): Promise<{ ok: boolean; message: string }> {
    const ok = await App.UpdateSaveContent(game, file, data);
    return { ok, message: ok ? 'Partida guardada' : 'Error al guardar' };
  }

  public async backupSaves(game: string): Promise<{ ok: boolean; backup_path: string; timestamp: string }> {
    const path = await App.BackupSave(game, '');
    return { ok: true, backup_path: path, timestamp: new Date().toISOString() };
  }

  public async getData(game: string, cat: string): Promise<{ category: string; items: DataItem[]; count: number }> {
    return App.GetData(game, cat);
  }

  public async getSyncStatus(): Promise<SyncStatus> {
    return App.GetSyncStatus() as any;
  }

  public async executeSync(mode: 'push' | 'pull', folder?: string): Promise<{ ok: boolean; mode: string; results: any[] }> {
    return App.ExecuteSync(mode, folder || '') as any;
  }

  public async decrypt(game: string, recreate: boolean = false): Promise<{ ok: boolean; output_dir: string; log?: string }> {
    // Read encryption key first, then decrypt
    const key = await App.ReadEncryptionKey(game);
    if (!key) {
      throw new Error('No se encontró clave de encriptación');
    }
    const result = await App.DecryptGameAssets(game, key);
    return { ok: true, output_dir: game, log: JSON.stringify(result) };
  }

  public async setupMods(game: string): Promise<{ ok: boolean; mods_dir: string; created: boolean }> {
    return App.SetupMods(game) as any;
  }

  public async openTarget(target: string): Promise<{ ok: boolean }> {
    const ok = await App.OpenTarget(target);
    return { ok };
  }

  public async checkUpdate(): Promise<{ update_available: boolean; tag_name: string; current_version: string; url: string; error?: string }> {
    return App.CheckUpdate();
  }

  public async getConfig(): Promise<AppConfig> {
    return App.GetConfig();
  }

  public async updateConfig(cfg: Partial<AppConfig>): Promise<{ ok: boolean; config: AppConfig }> {
    return App.UpdateConfig(cfg as AppConfig);
  }

  /**
   * Event listening via Wails runtime events.
   * Wails uses a different event system than SSE — we poll the Go event bus.
   */
  public listenEvents(callbacks: {
    onProgress?: (data: any) => void;
    onServerStarted?: (data: any) => void;
    onServerStopped?: (data: any) => void;
    onSyncComplete?: (data: any) => void;
    onGameLaunched?: (data: any) => void;
  }): () => void {
    // Use Wails runtime events if available, otherwise poll
    const w = window as any;
    if (w.runtime) {
      // Wails v2 runtime events
      w.runtime.EventsOn('extraction_progress', (data: any) => callbacks.onProgress?.(data));
      w.runtime.EventsOn('server_started', (data: any) => callbacks.onServerStarted?.(data));
      w.runtime.EventsOn('server_stopped', (data: any) => callbacks.onServerStopped?.(data));
      w.runtime.EventsOn('sync_complete', (data: any) => callbacks.onSyncComplete?.(data));
      w.runtime.EventsOn('game_launched', (data: any) => callbacks.onGameLaunched?.(data));
      return () => {
        w.runtime.EventsOff('extraction_progress');
        w.runtime.EventsOff('server_started');
        w.runtime.EventsOff('server_stopped');
        w.runtime.EventsOff('sync_complete');
        w.runtime.EventsOff('game_launched');
      };
    }

    // Fallback: poll GetEventHistory every 2 seconds
    let active = true;
    let lastCount = 0;
    const poll = async () => {
      while (active) {
        try {
          const history = await App.GetEventHistory(10);
          if (history && history.length > lastCount) {
            for (const evt of history.slice(lastCount)) {
              const type = (evt as any).event || (evt as any).event_type;
              const data = (evt as any).data || {};
              switch (type) {
                case 'extraction_progress': callbacks.onProgress?.(data); break;
                case 'server_started': callbacks.onServerStarted?.(data); break;
                case 'server_stopped': callbacks.onServerStopped?.(data); break;
                case 'sync_complete': callbacks.onSyncComplete?.(data); break;
                case 'game_launched': callbacks.onGameLaunched?.(data); break;
              }
            }
            lastCount = history.length;
          }
        } catch (_) {}
        await new Promise(r => setTimeout(r, 2000));
      }
    };
    poll();
    return () => { active = false; };
  }
}

export const api = new ApiClient();
