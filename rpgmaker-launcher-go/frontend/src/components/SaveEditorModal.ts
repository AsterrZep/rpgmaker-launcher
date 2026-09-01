import { api, Game, SaveContent } from '../api';
import { t } from '../i18n';
import { toasts } from './Toasts';

export class SaveEditorModal {
  private game: Game;
  private filename: string;
  private saveContent: SaveContent | null = null;
  private activeTab: 'general' | 'items' | 'variables' | 'switches' = 'general';
  private modalEl: HTMLElement | null = null;

  // Local working copy of modified data
  private gold: number = 0;
  private items: Record<string, number> = {};
  private variables: Record<string, any> = {};
  private switches: Record<string, boolean> = {};

  constructor(game: Game, filename: string) {
    this.game = game;
    this.filename = filename;
  }

  public async open(): Promise<void> {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 select-none';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-[760px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[540px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex flex-col border-b border-border bg-surface-container-low shrink-0">
          <div class="flex items-center justify-between px-6 py-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[22px]">edit_document</span>
              <h2 class="font-bold text-headline-md text-text-primary">
                ${t('saveEditorTitle')} · <span class="text-primary font-mono text-sm">${this.filename}</span>
              </h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Warning Banner -->
          <div class="bg-status-warning/10 border-t border-b border-status-warning/20 px-6 py-2 flex items-center gap-2.5 text-status-warning text-[11px] font-medium">
            <span class="material-symbols-outlined text-[16px] shrink-0">warning</span>
            <span>${t('saveEditorWarning')}</span>
          </div>

          <!-- Summary Stats -->
          <div id="save-summary-bar" class="px-6 py-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-faint bg-surface-container-lowest border-b border-border/50">
            <span>Cargando datos...</span>
          </div>

          <!-- Tabs -->
          <div class="flex px-6 pt-2 gap-2 bg-surface-container-low/50">
            <button data-tab="general" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-primary text-primary transition-colors">
              ${t('saveEditorGeneral')}
            </button>
            <button data-tab="items" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${t('saveEditorItems')}
            </button>
            <button data-tab="variables" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${t('saveEditorVariables')}
            </button>
            <button data-tab="switches" class="tab-btn px-4 py-2 text-label-md font-semibold border-b-2 border-transparent text-text-muted hover:text-on-surface transition-colors">
              ${t('saveEditorSwitches')}
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
            ${t('btnCancel')}
          </button>
          <button id="btn-save-savegame" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">save</span>
            <span>${t('btnSave')}</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Bind close & save
    this.modalEl.querySelectorAll('.btn-close').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    this.modalEl.querySelector('#btn-save-savegame')?.addEventListener('click', () => this.saveChanges());

    // Bind tab clicks
    this.modalEl.querySelectorAll('.tab-btn').forEach((tabEl) => {
      tabEl.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab as any;
        if (tab) {
          this.activeTab = tab;
          this.modalEl?.querySelectorAll('.tab-btn').forEach((el) => {
            el.classList.remove('border-primary', 'text-primary');
            el.classList.add('border-transparent', 'text-text-muted');
          });
          (e.currentTarget as HTMLElement).classList.add('border-primary', 'text-primary');
          (e.currentTarget as HTMLElement).classList.remove('border-transparent', 'text-text-muted');
          this.renderTabContent();
        }
      });
    });

    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const res = await api.getSaveContent(this.game.name, this.filename);
      this.saveContent = res;
      this.gold = res.gold;
      this.items = { ...res.items };
      this.variables = { ...res.variables };
      this.switches = { ...res.switches };

      this.renderSummary();
      this.renderTabContent();
    } catch (err: any) {
      const container = this.modalEl?.querySelector('#editor-tab-content');
      if (container) {
        container.innerHTML = `<div class="p-6 text-center text-status-error">Error al cargar la partida: ${err.message}</div>`;
      }
    }
  }

  private renderSummary(): void {
    const summaryBar = this.modalEl?.querySelector('#save-summary-bar');
    if (!summaryBar || !this.saveContent) return;

    summaryBar.innerHTML = `
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-status-warning">monetization_on</span> Oro: <strong class="text-text-primary font-mono">${this.gold.toLocaleString()}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">category</span> Objetos: <strong class="text-text-primary">${Object.keys(this.items).length}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">data_object</span> Variables: <strong class="text-text-primary">${Object.keys(this.variables).length}</strong></span>
      <span class="text-border">|</span>
      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">toggle_on</span> Switches: <strong class="text-text-primary">${Object.values(this.switches).filter(Boolean).length}</strong></span>
    `;
  }

  private renderTabContent(): void {
    const container = this.modalEl?.querySelector('#editor-tab-content');
    if (!container || !this.saveContent) return;

    if (this.activeTab === 'general') {
      container.innerHTML = `
        <div class="flex flex-col gap-6 max-w-md">
          <div class="flex flex-col gap-2">
            <label class="text-label-md font-semibold text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-status-warning text-[18px]">monetization_on</span>
              <span>${t('saveEditorGold')}</span>
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

          ${
            this.saveContent.actors.length > 0
              ? `
            <div>
              <label class="text-label-md font-semibold text-text-primary flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-primary text-[18px]">group</span>
                <span>Personajes en la partida</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                ${this.saveContent.actors
                  .map(
                    (a) => `
                  <div class="p-2.5 rounded-lg bg-surface-container border border-border flex items-center justify-between">
                    <div>
                      <div class="font-bold text-body-md text-on-surface">${a.name}</div>
                      <div class="text-[10px] text-text-faint">Nivel ${a.level}</div>
                    </div>
                    <div class="text-right text-[11px] font-mono text-primary">
                      HP ${a.hp} / MP ${a.mp}
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;

      const inputGold = container.querySelector('#input-gold') as HTMLInputElement;
      inputGold?.addEventListener('input', (e) => {
        this.gold = parseInt((e.target as HTMLInputElement).value || '0', 10);
        this.renderSummary();
      });

      container.querySelector('#btn-gold-add-1k')?.addEventListener('click', () => {
        this.gold = Math.min(99999999, this.gold + 1000);
        inputGold.value = String(this.gold);
        this.renderSummary();
      });

      container.querySelector('#btn-gold-add-50k')?.addEventListener('click', () => {
        this.gold = Math.min(99999999, this.gold + 50000);
        inputGold.value = String(this.gold);
        this.renderSummary();
      });

      container.querySelector('#btn-gold-max')?.addEventListener('click', () => {
        this.gold = 99999999;
        inputGold.value = String(this.gold);
        this.renderSummary();
      });
    } else if (this.activeTab === 'items') {
      const entries = Object.entries(this.items);
      container.innerHTML = `
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
                ${
                  entries.length > 0
                    ? entries
                        .map(
                          ([id, qty]) => `
                  <tr class="hover:bg-card-hover border-b border-border/30 item-row" data-id="${id}">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${id}</td>
                    <td class="py-2 px-3 text-center">
                      <input type="number" min="0" max="99" value="${qty}" data-id="${id}" class="item-qty-input w-20 text-center bg-surface-container border border-border rounded py-0.5 px-1 font-mono text-on-surface focus:outline-none focus:border-primary" />
                    </td>
                    <td class="py-2 px-3 text-right">
                      <button data-id="${id}" class="btn-delete-item text-text-faint hover:text-status-error transition-colors p-1">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                `
                        )
                        .join('')
                    : `<tr><td colspan="3" class="p-4 text-center text-text-muted">No hay objetos en el inventario</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Event listeners for items
      container.querySelectorAll('.item-qty-input').forEach((input) => {
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          const id = target.dataset.id!;
          this.items[id] = parseInt(target.value || '0', 10);
          this.renderSummary();
        });
      });

      container.querySelectorAll('.btn-delete-item').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const id = (e.currentTarget as HTMLElement).dataset.id!;
          delete this.items[id];
          this.renderSummary();
          this.renderTabContent();
        });
      });

      container.querySelector('#btn-add-item')?.addEventListener('click', () => {
        const idInput = container.querySelector('#input-new-item-id') as HTMLInputElement;
        const qtyInput = container.querySelector('#input-new-item-qty') as HTMLInputElement;
        const id = idInput.value.trim();
        const qty = parseInt(qtyInput.value || '1', 10);
        if (id) {
          this.items[id] = qty;
          this.renderSummary();
          this.renderTabContent();
        }
      });
    } else if (this.activeTab === 'variables') {
      const entries = Object.entries(this.variables);
      container.innerHTML = `
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
                ${
                  entries.length > 0
                    ? entries
                        .map(
                          ([id, val]) => `
                  <tr class="hover:bg-card-hover border-b border-border/30">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${id}</td>
                    <td class="py-2 px-3">
                      <input type="text" value="${val}" data-id="${id}" class="var-val-input w-full bg-surface-container border border-border rounded py-0.5 px-2 font-mono text-body-md text-on-surface focus:outline-none focus:border-primary" />
                    </td>
                  </tr>
                `
                        )
                        .join('')
                    : `<tr><td colspan="2" class="p-4 text-center text-text-muted">No hay variables activas</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelectorAll('.var-val-input').forEach((input) => {
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          const id = target.dataset.id!;
          const num = Number(target.value);
          this.variables[id] = !isNaN(num) ? num : target.value;
          this.renderSummary();
        });
      });
    } else if (this.activeTab === 'switches') {
      const entries = Object.entries(this.switches);
      container.innerHTML = `
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
                ${
                  entries.length > 0
                    ? entries
                        .map(
                          ([id, state]) => `
                  <tr class="hover:bg-card-hover border-b border-border/30">
                    <td class="py-2 px-3 font-mono text-body-md text-primary">#${id}</td>
                    <td class="py-2 px-3 text-center">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" data-id="${id}" class="sr-only peer switch-toggle" ${state ? 'checked' : ''} />
                        <div class="w-8 h-4 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform peer-checked:bg-primary"></div>
                      </label>
                    </td>
                  </tr>
                `
                        )
                        .join('')
                    : `<tr><td colspan="2" class="p-4 text-center text-text-muted">No hay switches activos</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelectorAll('.switch-toggle').forEach((input) => {
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          const id = target.dataset.id!;
          this.switches[id] = target.checked;
          this.renderSummary();
        });
      });
    }
  }

  private async saveChanges(): Promise<void> {
    try {
      await api.saveSaveContent(this.game.name, this.filename, {
        gold: this.gold,
        items: this.items,
        variables: this.variables,
        switches: this.switches,
      });
      toasts.show('Partida guardada con copia de seguridad', 'success');
      this.close();
    } catch (err: any) {
      toasts.show(`Error guardando partida: ${err.message}`, 'error');
    }
  }

  public close(): void {
    this.modalEl?.remove();
    this.modalEl = null;
  }
}
