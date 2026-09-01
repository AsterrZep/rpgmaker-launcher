import { api, Game, SaveItem } from '../api';
import { t } from '../i18n';
import { SaveEditorModal } from './SaveEditorModal';
import { toasts } from './Toasts';

export class SavesModal {
  private game: Game;
  private saves: SaveItem[] = [];
  private selectedSave: SaveItem | null = null;
  private modalEl: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  public async open(): Promise<void> {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-[640px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-container-low shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-primary text-[24px]">save</span>
            <div>
              <h2 class="font-bold text-headline-md text-text-primary">${t('savesTitle')} · ${this.game.name}</h2>
              <p class="text-[11px] text-text-muted">${t('savesDesc')}</p>
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
              <span>${t('btnBackup')}</span>
            </button>

            <button id="btn-edit-save" class="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-primary border border-border text-label-md font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-symbols-outlined text-[16px]">edit</span>
              <span>Editar contenido</span>
            </button>
          </div>

          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${t('btnClose')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Bind close
    this.modalEl.querySelectorAll('.btn-close').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    this.modalEl.querySelector('#btn-backup-saves')?.addEventListener('click', () => this.createBackup());
    this.modalEl.querySelector('#btn-edit-save')?.addEventListener('click', () => this.openEditor());

    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const res = await api.getSaves(this.game.name);
      this.saves = res.saves;
      this.selectedSave = this.saves[0] || null;
      this.renderTable();
      this.updateEditButtonState();
    } catch (err: any) {
      const container = this.modalEl?.querySelector('#saves-table-container');
      if (container) {
        container.innerHTML = `<div class="p-6 text-center text-status-error">Error al cargar partidas: ${err.message}</div>`;
      }
    }
  }

  private updateEditButtonState(): void {
    const btn = this.modalEl?.querySelector('#btn-edit-save') as HTMLButtonElement;
    if (btn) {
      btn.disabled = !this.selectedSave;
    }
  }

  private renderTable(): void {
    const container = this.modalEl?.querySelector('#saves-table-container');
    if (!container) return;

    if (this.saves.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center p-6">
          <span class="material-symbols-outlined text-[48px] text-text-faint mb-2">folder_open</span>
          <p class="text-body-md text-text-muted">Aún no hay partidas guardadas en este juego.</p>
          <p class="text-[11px] text-text-faint mt-1">Guarda partida dentro del juego para verla aquí.</p>
        </div>
      `;
      return;
    }

    const rows = this.saves.map((s) => {
      const isSelected = this.selectedSave?.name === s.name;
      return `
        <tr data-name="${s.name}" class="save-row cursor-pointer transition-colors border-b border-border/40 ${
          isSelected ? 'bg-card-selected text-primary font-semibold' : 'hover:bg-card-hover text-on-surface'
        }">
          <td class="py-2.5 pr-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] ${isSelected ? 'text-primary' : 'text-text-faint'}">description</span>
            <span class="truncate max-w-[220px]">${s.name}</span>
          </td>
          <td class="py-2.5 text-center text-text-muted w-24">${s.size_kb} KB</td>
          <td class="py-2.5 text-right text-text-muted w-36">${s.mtime_str}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">Archivo</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">Tamaño</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Modificado</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.save-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        const name = (e.currentTarget as HTMLElement).dataset.name;
        this.selectedSave = this.saves.find((s) => s.name === name) || null;
        this.renderTable();
        this.updateEditButtonState();
      });

      row.addEventListener('dblclick', () => {
        this.openEditor();
      });
    });
  }

  private async createBackup(): Promise<void> {
    try {
      const res = await api.backupSaves(this.game.name);
      toasts.show(`Copia de seguridad creada en snapshot-${res.timestamp}`, 'success');
    } catch (err: any) {
      toasts.show(`Error creando copia: ${err.message}`, 'error');
    }
  }

  private openEditor(): void {
    if (!this.selectedSave) return;
    const editor = new SaveEditorModal(this.game, this.selectedSave.name);
    editor.open();
  }

  public close(): void {
    this.modalEl?.remove();
    this.modalEl = null;
  }
}
