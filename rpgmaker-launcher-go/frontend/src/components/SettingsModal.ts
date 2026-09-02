import { api } from '../api';
import { t } from '../i18n';
import { toasts } from './Toasts';

async function pickFolder(): Promise<string | null> {
  const path = prompt('Introduce la ruta de la carpeta de juegos:');
  return path?.trim() || null;
}

export class SettingsModal {
  private folder: string = '';
  private modalEl: HTMLElement | null = null;

  public async open(): Promise<void> {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-[560px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[340px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">settings</span>
              <h2 class="font-bold text-headline-md text-text-primary">${t('settingsTitle')}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p class="text-[11px] text-text-muted">
            ${t('settingsDesc')}
          </p>

          <!-- Games folder bar -->
          <div class="flex items-center gap-2 mt-3 p-2 rounded-lg bg-surface border border-border">
            <span class="text-[11px] font-bold text-text-faint uppercase shrink-0">${t('settingsGamesFolder')}</span>
            <input
              id="input-games-folder"
              class="flex-1 min-w-0 bg-transparent border-none text-body-md text-primary font-mono focus:outline-none truncate"
              placeholder="${t('settingsDefaultFolder', '')}"
              type="text"
            />
            <button id="btn-pick-folder" class="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-label-md font-semibold border border-border text-on-surface transition-colors shrink-0">
              <span class="material-symbols-outlined text-[16px] text-primary">drive_folder_upload</span>
              <span>${t('btnChangeFolder')}</span>
            </button>
            <button id="btn-open-folder" class="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-primary border border-border transition-colors disabled:opacity-40 disabled:pointer-events-none" title="${t('btnOpenFolder')}" disabled>
              <span class="material-symbols-outlined text-[16px]">folder_open</span>
            </button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-end gap-2 shrink-0">
          <button id="btn-settings-close" class="px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors">
            ${t('btnClose')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Bind close
    this.modalEl.querySelectorAll('.btn-close, #btn-settings-close').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    const folderInput = this.modalEl.querySelector('#input-games-folder') as HTMLInputElement;
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
        toasts.show(`${t('settingsTitle')}: ${err.message}`, 'error');
      }
    });

    this.modalEl.querySelector('#btn-open-folder')?.addEventListener('click', async () => {
      if (!this.folder) return;
      try {
        await api.openTarget(this.folder);
      } catch (err: any) {
        toasts.show(`${t('settingsTitle')}: ${err.message}`, 'error');
      }
    });

    await this.loadData();
    this.updateFolderUi();
  }

  private updateFolderUi(): void {
    if (!this.modalEl) return;
    const hasFolder = Boolean(this.folder);
    const openBtn = this.modalEl.querySelector('#btn-open-folder') as HTMLButtonElement;
    openBtn.disabled = !hasFolder;
  }

  private async persistFolder(): Promise<void> {
    try {
      const cfg = await api.getConfig();
      cfg.general = { ...cfg.general, games_dir: this.folder };
      await api.updateConfig(cfg);
      toasts.show('Carpeta de juegos guardada', 'info', 2000);
      await this.loadData();
      this.updateFolderUi();
    } catch (err: any) {
      toasts.show(`Error al guardar carpeta: ${err.message}`, 'error');
    }
  }

  private async loadData(): Promise<void> {
    try {
      const cfg = await api.getConfig();
      this.folder = (cfg.general?.games_dir || '').trim();
      const folderInput = this.modalEl?.querySelector('#input-games-folder') as HTMLInputElement;
      if (folderInput) {
        folderInput.value = this.folder;
      }
      await this.renderPlaceholder();
    } catch (err: any) {
      toasts.show(`Error al cargar config: ${err.message}`, 'error');
    }
  }

  private async renderPlaceholder(): Promise<void> {
    if (!this.modalEl) return;
    const folderInput = this.modalEl.querySelector('#input-games-folder') as HTMLInputElement;
    if (!folderInput) return;
    const { api } = await import('../api');
    const defaultGamesDir = api.getBaseUrl().replace('/api', '') + '/games'; // fallback visual
    folderInput.placeholder = t('settingsDefaultFolder', defaultGamesDir);
  }

  public close(): void {
    this.modalEl?.remove();
    this.modalEl = null;
  }
}