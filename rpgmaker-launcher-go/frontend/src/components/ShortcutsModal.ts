import { api, AppConfig } from '../api';
import { t } from '../i18n';
import { toasts } from './Toasts';

export class ShortcutsModal {
  private config: AppConfig | null = null;
  private modalEl: HTMLElement | null = null;

  public async open(): Promise<void> {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-[620px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0 flex justify-between items-center">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-primary text-[24px]">keyboard</span>
            <h2 class="font-bold text-headline-md text-text-primary">${t('shortcutsTitle')}</h2>
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
            ${t('btnCancel')}
          </button>
          <button id="btn-save-shortcuts" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md">
            ${t('btnSave')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Bind close & save
    this.modalEl.querySelectorAll('.btn-close').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    this.modalEl.querySelector('#btn-save-shortcuts')?.addEventListener('click', () => this.saveConfig());

    await this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    try {
      this.config = await api.getConfig();
      this.renderBody();
    } catch (err: any) {
      const container = this.modalEl?.querySelector('#shortcuts-body-container');
      if (container) {
        container.innerHTML = `<div class="text-center text-status-error p-6">Error: ${err.message}</div>`;
      }
    }
  }

  private renderBody(): void {
    const container = this.modalEl?.querySelector('#shortcuts-body-container');
    if (!container || !this.config) return;

    const keys = [
      { key: 'trucos', label: 'Menú de trucos in-game' },
      { key: 'recargar', label: 'Recargar juego en visor' },
      { key: 'fps', label: 'Mostrar/Ocultar FPS' },
      { key: 'captura', label: 'Captura de pantalla' },
      { key: 'pantalla_completa', label: 'Pantalla completa' },
      { key: 'zoom_in', label: 'Aumentar Zoom' },
      { key: 'zoom_out', label: 'Reducir Zoom' },
    ];

    const keyRows = keys
      .map((k) => {
        const val = (this.config!.teclas as Record<string, string>)[k.key] || '';
        return `
        <div class="flex items-center justify-between py-1.5 border-b border-border/30">
          <span class="text-body-md text-on-surface">${k.label}</span>
          <input
            data-key="${k.key}"
            class="key-input w-36 bg-surface border border-border rounded py-1 px-2.5 font-mono text-center text-primary text-body-md focus:outline-none focus:border-primary"
            type="text"
            value="${val}"
          />
        </div>
      `;
      })
      .join('');

    container.innerHTML = `
      <div class="flex flex-col gap-2">
        <h3 class="text-label-md font-bold text-text-muted uppercase tracking-wider">Atajos de Teclado</h3>
        <div class="flex flex-col bg-surface-container-low p-3 rounded-lg border border-border">
          ${keyRows}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h3 class="text-label-md font-bold text-text-muted uppercase tracking-wider">Opciones Generales</h3>
        <div class="flex flex-col gap-2 bg-surface-container-low p-3 rounded-lg border border-border">
          <label class="flex items-center gap-2.5 text-body-md text-on-surface cursor-pointer">
            <input id="chk-default-webkit" type="checkbox" ${this.config.general.webkit ? 'checked' : ''} class="rounded border-border bg-surface text-primary focus:ring-0" />
            <span>Usar visor WebKit (más ligero) por defecto en lugar del navegador</span>
          </label>
          <label class="flex items-center gap-2.5 text-body-md text-on-surface cursor-pointer">
            <input id="chk-auto-del-zip" type="checkbox" ${this.config.general.auto_delete_zip ? 'checked' : ''} class="rounded border-border bg-surface text-primary focus:ring-0" />
            <span>Eliminar automáticamente archivos .zip tras extraerlos</span>
          </label>
        </div>
      </div>
    `;

    // Handle key inputs
    container.querySelectorAll('.key-input').forEach((inp) => {
      inp.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const key = target.dataset.key!;
        (this.config!.teclas as Record<string, string>)[key] = target.value.trim();
      });
    });
  }

  private async saveConfig(): Promise<void> {
    if (!this.config) return;
    const webkitChk = this.modalEl?.querySelector('#chk-default-webkit') as HTMLInputElement;
    const autoDelChk = this.modalEl?.querySelector('#chk-auto-del-zip') as HTMLInputElement;

    this.config.general.webkit = webkitChk?.checked ?? false;
    this.config.general.auto_delete_zip = autoDelChk?.checked ?? false;

    try {
      await api.updateConfig(this.config);
      toasts.show('Configuración guardada correctamente', 'success');
      this.close();
    } catch (err: any) {
      toasts.show(`Error guardando configuración: ${err.message}`, 'error');
    }
  }

  public close(): void {
    this.modalEl?.remove();
    this.modalEl = null;
  }
}
