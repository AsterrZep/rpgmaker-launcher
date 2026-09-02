import { api, Game, PluginItem } from '../api';
import { t } from '../i18n';
import { toasts } from './Toasts';

export class PluginsModal {
  private game: Game;
  private plugins: PluginItem[] = [];
  private hasBackup: boolean = false;
  private modalEl: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  public async open(): Promise<void> {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none';

    this.modalEl.innerHTML = `
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
              ${t('btnEnableAll')}
            </button>
            <button id="btn-toggle-all-off" class="px-2.5 py-1 rounded bg-surface hover:bg-surface-container-high text-text-primary text-[11px] font-semibold border border-border transition-colors">
              ${t('btnDisableAll')}
            </button>
            <button id="btn-restore-plugins" class="px-2.5 py-1 rounded bg-surface hover:bg-surface-container-high text-status-warning text-[11px] font-semibold border border-border transition-colors">
              ${t('btnRestore')}
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

    this.modalEl.querySelector('#btn-toggle-all-on')?.addEventListener('click', () => this.toggleAll(true));
    this.modalEl.querySelector('#btn-toggle-all-off')?.addEventListener('click', () => this.toggleAll(false));
    this.modalEl.querySelector('#btn-restore-plugins')?.addEventListener('click', () => this.restoreOriginal());

    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const res = await api.getPlugins(this.game.name);
      this.plugins = res.plugins;
      this.hasBackup = res.has_backup;
      this.renderTable();
    } catch (err: any) {
      const container = this.modalEl?.querySelector('#plugins-table-container');
      if (container) {
        container.innerHTML = `<div class="p-6 text-center text-status-error">Error al cargar plugins: ${err.message}</div>`;
      }
    }
  }

  private renderTable(): void {
    const container = this.modalEl?.querySelector('#plugins-table-container');
    if (!container) return;

    if (this.plugins.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-text-muted">No se encontraron plugins en este juego.</div>`;
      return;
    }

    const rows = this.plugins.map((p, index) => {
      let badgeClass = 'bg-status-success/15 text-status-success';
      let badgeText = 'OK';

      if (p.category === 'nw-protegido') {
        badgeClass = 'bg-status-warning/15 text-status-warning';
        badgeText = 'NW PROTECTED';
      } else if (p.category === 'roto') {
        badgeClass = 'bg-status-error/15 text-status-error';
        badgeText = 'BROKEN';
      } else if (p.category === 'sin-fichero') {
        badgeClass = 'bg-surface-variant text-text-faint';
        badgeText = 'MISSING';
      }

      return `
        <tr class="hover:bg-card-hover border-b border-border/40 transition-colors group">
          <td class="py-2.5 pr-4">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-text-faint group-hover:text-primary">javascript</span>
              <span class="font-medium text-body-md text-on-surface truncate max-w-[280px]" title="${p.name}">
                ${p.name}.js
              </span>
            </div>
            ${p.motivos.length > 0 ? `<div class="text-[10px] text-text-faint pl-6">${p.motivos.join(', ')}</div>` : ''}
          </td>
          <td class="py-2.5 text-center w-20">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" data-index="${index}" class="sr-only peer plugin-toggle" ${p.status ? 'checked' : ''} />
              <div class="w-8 h-4 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform peer-checked:bg-primary"></div>
            </label>
          </td>
          <td class="py-2.5 text-right w-36">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeClass}">
              ${badgeText}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">Plugin</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">Estado</th>
            <th class="py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">WebKit</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    // Bind individual toggles
    container.querySelectorAll('.plugin-toggle').forEach((input) => {
      input.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        const index = parseInt(target.dataset.index || '0', 10);
        const plugin = this.plugins[index];
        const newStatus = target.checked;
        plugin.status = newStatus;

        try {
          await api.togglePlugins(this.game.name, { names: [plugin.name], status: newStatus });
          toasts.show(`Plugin ${plugin.name} ${newStatus ? 'activado' : 'desactivado'}`, 'success', 2000);
        } catch (err: any) {
          toasts.show(`Error: ${err.message}`, 'error');
          target.checked = !newStatus;
          plugin.status = !newStatus;
        }
      });
    });
  }

  private async toggleAll(status: boolean): Promise<void> {
    try {
      await api.togglePlugins(this.game.name, { all: true, status });
      this.plugins.forEach((p) => (p.status = status));
      this.renderTable();
      toasts.show(`Todos los plugins ${status ? 'activados' : 'desactivados'}`, 'success');
    } catch (err: any) {
      toasts.show(`Error: ${err.message}`, 'error');
    }
  }

  private async restoreOriginal(): Promise<void> {
    try {
      await api.togglePlugins(this.game.name, { action: 'restore' });
      toasts.show('Plugins restaurados desde la copia original', 'success');
      await this.loadData();
    } catch (err: any) {
      toasts.show(`Error restaurando plugins: ${err.message}`, 'error');
    }
  }

  public close(): void {
    this.modalEl?.remove();
    this.modalEl = null;
  }
}
