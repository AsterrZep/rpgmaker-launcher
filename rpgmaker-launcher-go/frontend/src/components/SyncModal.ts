import { api, SyncStatus } from '../api';
import { t } from '../i18n';
import { toasts } from './Toasts';

async function pickFolder(): Promise<string | null> {
  const path = prompt('Introduce la ruta de la carpeta de destino de partidas:');
  return path?.trim() || null;
}

export class SyncModal {
  private syncData: SyncStatus | null = null;
  private modalEl: HTMLElement | null = null;
  private folder: string = '';

  public async open(): Promise<void> {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-[680px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">sync</span>
              <h2 class="font-bold text-headline-md text-text-primary">${t('syncTitle')}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p class="text-[11px] text-text-muted">
            Sincroniza tus partidas con cualquier carpeta (Dropbox, Syncthing, Nextcloud o USB).
          </p>

          <!-- Destination folder bar -->
          <div class="flex items-center gap-2 mt-3 p-2 rounded-lg bg-surface border border-border ${''}">
            <span class="text-[11px] font-bold text-text-faint uppercase shrink-0">${t('syncDestFolder')}</span>
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
            <span class="truncate">${t('syncAutoToggle')}</span>
          </label>

          <div class="flex items-center gap-2 shrink-0">
            <button id="btn-sync-pull" class="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>${t('btnPull')}</span>
            </button>

            <button id="btn-sync-push" class="px-4 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none">
              <span class="material-symbols-outlined text-[16px]">upload</span>
              <span>${t('btnPush')}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Bind close
    this.modalEl.querySelectorAll('.btn-close').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    const folderInput = this.modalEl.querySelector('#input-sync-folder') as HTMLInputElement;
    folderInput?.addEventListener('change', () => {
      this.folder = folderInput.value.trim();
      void this.persistFolder();
      this.updateFolderUi();
    });

    // Selector nativo de carpetas (plugin dialog de Tauri)
    this.modalEl.querySelector('#btn-pick-folder')?.addEventListener('click', async () => {
      try {
        const dir = await pickFolder();
        if (!dir) return;
        this.folder = dir;
        if (folderInput) folderInput.value = dir;
        await this.persistFolder();
        this.updateFolderUi();
      } catch (err: any) {
        toasts.show(`No se pudo abrir el selector: ${err.message}`, 'error');
      }
    });

    this.modalEl.querySelector('#btn-open-folder')?.addEventListener('click', async () => {
      if (!this.folder) return;
      try {
        await api.openTarget(this.folder);
      } catch (err: any) {
        toasts.show(`No se pudo abrir la carpeta: ${err.message}`, 'error');
      }
    });

    this.modalEl.querySelector('#btn-sync-push')?.addEventListener('click', () => this.execute('push'));
    this.modalEl.querySelector('#btn-sync-pull')?.addEventListener('click', () => this.execute('pull'));

    const autoSyncChk = this.modalEl.querySelector('#chk-auto-sync') as HTMLInputElement;
    autoSyncChk?.addEventListener('change', async () => {
      try {
        const cfg = await api.getConfig();
        cfg.sync = { ...(cfg.sync || {}), auto: autoSyncChk.checked };
        await api.updateConfig(cfg);
        toasts.show('Ajuste de sincronización guardado', 'info', 2000);
      } catch (err: any) {
        toasts.show(`Error al guardar ajuste: ${err.message}`, 'error');
      }
    });

    await this.loadData();
    this.updateFolderUi();
  }

  private updateFolderUi(): void {
    if (!this.modalEl) return;
    const hasFolder = Boolean(this.folder);
    const hint = this.modalEl.querySelector('#sync-folder-hint');
    const openBtn = this.modalEl.querySelector('#btn-open-folder') as HTMLButtonElement;
    const pushBtn = this.modalEl.querySelector('#btn-sync-push') as HTMLButtonElement;
    const pullBtn = this.modalEl.querySelector('#btn-sync-pull') as HTMLButtonElement;

    hint?.classList.toggle('hidden', hasFolder || !this.modalEl.querySelector('#input-sync-folder'));
    if (!hasFolder) hint?.classList.remove('hidden');
    if (openBtn) openBtn.disabled = !hasFolder;
    if (pushBtn) pushBtn.disabled = !hasFolder;
    if (pullBtn) pullBtn.disabled = !hasFolder;
  }

  private async persistFolder(): Promise<void> {
    try {
      const cfg = await api.getConfig();
      cfg.sync = { ...(cfg.sync || {}), folder: this.folder };
      await api.updateConfig(cfg);
      toasts.show('Carpeta de sincronización guardada', 'info', 2000);
      await this.loadData();
      this.updateFolderUi();
    } catch (err: any) {
      toasts.show(`Error al guardar carpeta: ${err.message}`, 'error');
    }
  }

  private async loadData(): Promise<void> {
    try {
      this.syncData = await api.getSyncStatus();
      this.folder = this.syncData.destination || '';
      const folderInput = this.modalEl?.querySelector('#input-sync-folder') as HTMLInputElement;
      if (folderInput) {
        folderInput.value = this.folder;
      }

      const autoChk = this.modalEl?.querySelector('#chk-auto-sync') as HTMLInputElement;
      if (autoChk) {
        autoChk.checked = this.syncData.auto_sync;
      }

      this.renderTable();
    } catch (err: any) {
      const container = this.modalEl?.querySelector('#sync-table-container');
      if (container) {
        container.innerHTML = `<div class="p-6 text-center text-status-error">Error al cargar sincronización: ${err.message}</div>`;
      }
    }
  }

  private renderTable(): void {
    const container = this.modalEl?.querySelector('#sync-table-container');
    if (!container || !this.syncData) return;

    if (this.syncData.games.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center text-text-muted">
          <span class="material-symbols-outlined text-[48px] text-text-faint mb-2">sports_esports</span>
          <p>No hay juegos instalados todavía.</p>
        </div>
      `;
      return;
    }

    const rows = this.syncData.games.map((g) => {
      const localStr = g.local_saves >= 0 ? `${g.local_saves} partida(s)` : 'sin save/';
      const destStr = g.dest_saves >= 0 ? `${g.dest_saves} partida(s)` : (this.folder ? 'vacío' : '-');

      return `
        <tr class="hover:bg-card-hover border-b border-border/30 transition-colors">
          <td class="py-2.5 pr-4 font-semibold text-body-md text-on-surface truncate max-w-[260px]">${g.name}</td>
          <td class="py-2.5 text-center font-mono text-text-muted w-32">${localStr}</td>
          <td class="py-2.5 text-center font-mono text-primary w-32">${destStr}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase">Juego</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase text-center">Local</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase text-center">Destino</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private async execute(mode: 'push' | 'pull'): Promise<void> {
    this.folder = ((this.modalEl?.querySelector('#input-sync-folder') as HTMLInputElement)?.value || '').trim();
    if (!this.folder) {
      toasts.show('Configura primero la carpeta de destino', 'warning');
      this.updateFolderUi();
      return;
    }
    try {
      toasts.show(`Ejecutando sincronización (${mode === 'push' ? 'enviar' : 'traer'})...`, 'info');
      // La carpeta viaja explícita: sin carreras con el guardado de config.
      const res = await api.executeSync(mode, this.folder);
      const moved = (res.results || []).reduce((acc: number, r: any) => acc + (Number(r[1]) || 0), 0);
      if (moved > 0) {
        toasts.show(`${t('toastSyncDone')} (${moved} archivo(s))`, 'success');
      } else {
        toasts.show('Nada que sincronizar (no hay partidas locales)', 'info');
      }
      await this.loadData();
      this.updateFolderUi();
    } catch (err: any) {
      toasts.show(`Error de sincronización: ${err.message}`, 'error');
    }
  }

  public close(): void {
    this.modalEl?.remove();
    this.modalEl = null;
  }
}
