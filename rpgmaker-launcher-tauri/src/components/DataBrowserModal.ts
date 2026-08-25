import { api, DataItem, Game } from '../api';
import { t } from '../i18n';

export class DataBrowserModal {
  private game: Game;
  private currentCategory: string = 'Items';
  private items: DataItem[] = [];
  private searchQuery: string = '';
  private modalEl: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  public async open(): Promise<void> {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-[760px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">database</span>
              <h2 class="font-bold text-headline-md text-text-primary">${t('dataTitle')} · ${this.game.name}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Controls: Category & Search -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-label-md text-text-muted">
              <span>Categoría:</span>
              <select id="select-category" class="bg-surface border border-border rounded-lg py-1 px-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary">
                <option value="Items">Objetos</option>
                <option value="Weapons">Armas</option>
                <option value="Armors">Defensas</option>
                <option value="Skills">Habilidades</option>
                <option value="Enemies">Enemigos</option>
              </select>
            </div>

            <div class="flex-1 relative flex items-center">
              <span class="material-symbols-outlined absolute left-2.5 text-text-faint text-[16px]">search</span>
              <input
                id="data-search-input"
                class="w-full bg-surface border border-border rounded-lg py-1 pl-8 pr-3 text-body-md text-on-surface focus:outline-none focus:border-primary"
                placeholder="Buscar por nombre o ID..."
                type="text"
              />
            </div>

            <div id="data-count-lbl" class="text-[11px] text-text-faint font-mono shrink-0">
              0 elemento(s)
            </div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar" id="data-table-container">
          <div class="flex items-center justify-center h-full text-text-muted">Cargando base de datos...</div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-2.5 border-t border-border bg-surface-container-low flex justify-end shrink-0">
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

    const selectCat = this.modalEl.querySelector('#select-category') as HTMLSelectElement;
    selectCat?.addEventListener('change', (e) => {
      this.currentCategory = (e.target as HTMLSelectElement).value;
      this.loadData();
    });

    const searchInput = this.modalEl.querySelector('#data-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
      this.renderTable();
    });

    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const res = await api.getData(this.game.name, this.currentCategory);
      this.items = res.items;
      this.renderTable();
    } catch (err: any) {
      const container = this.modalEl?.querySelector('#data-table-container');
      if (container) {
        container.innerHTML = `<div class="p-6 text-center text-status-error">Error al cargar datos: ${err.message}</div>`;
      }
    }
  }

  private renderTable(): void {
    const container = this.modalEl?.querySelector('#data-table-container');
    const countLbl = this.modalEl?.querySelector('#data-count-lbl');
    if (!container) return;

    const filtered = this.items.filter((item) => {
      if (!this.searchQuery) return true;
      return (
        item.name.toLowerCase().includes(this.searchQuery) ||
        String(item.id).includes(this.searchQuery)
      );
    });

    if (countLbl) {
      countLbl.textContent = `${filtered.length} elemento(s)`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-text-muted">No se encontraron elementos en esta categoría.</div>`;
      return;
    }

    // Dynamic columns based on category
    let headerCols = `<th class="py-2 text-[11px] font-bold text-text-muted uppercase w-16">ID</th><th class="py-2 text-[11px] font-bold text-text-muted uppercase">Nombre</th>`;
    if (['Items', 'Weapons', 'Armors'].includes(this.currentCategory)) {
      headerCols += `<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-24">Precio</th>`;
    }
    if (this.currentCategory === 'Weapons') {
      headerCols += `<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">ATK</th>`;
    }
    if (this.currentCategory === 'Armors') {
      headerCols += `<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">DEF</th>`;
    }
    if (this.currentCategory === 'Skills') {
      headerCols += `<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-24">Coste MP</th>`;
    }
    if (this.currentCategory === 'Enemies') {
      headerCols += `<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">HP</th>`;
      headerCols += `<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">EXP</th>`;
      headerCols += `<th class="py-2 text-[11px] font-bold text-text-muted uppercase text-right w-20">Oro</th>`;
    }

    const rows = filtered.map((item) => {
      let extraCells = '';
      if (['Items', 'Weapons', 'Armors'].includes(this.currentCategory)) {
        extraCells += `<td class="py-2 text-right font-mono text-text-muted">${item.price ?? 0}</td>`;
      }
      if (this.currentCategory === 'Weapons') {
        extraCells += `<td class="py-2 text-right font-mono text-primary font-bold">+${item.atk ?? 0}</td>`;
      }
      if (this.currentCategory === 'Armors') {
        extraCells += `<td class="py-2 text-right font-mono text-primary font-bold">+${item.def ?? 0}</td>`;
      }
      if (this.currentCategory === 'Skills') {
        extraCells += `<td class="py-2 text-right font-mono text-primary">${item.mp_cost ?? 0}</td>`;
      }
      if (this.currentCategory === 'Enemies') {
        extraCells += `<td class="py-2 text-right font-mono text-status-error font-bold">${item.hp ?? 0}</td>`;
        extraCells += `<td class="py-2 text-right font-mono text-text-muted">${item.exp ?? 0}</td>`;
        extraCells += `<td class="py-2 text-right font-mono text-status-warning">${item.gold ?? 0}</td>`;
      }

      return `
        <tr class="hover:bg-card-hover border-b border-border/30 transition-colors">
          <td class="py-2 font-mono text-primary text-[12px]">#${item.id}</td>
          <td class="py-2 font-medium text-on-surface text-[13px]">${item.name}</td>
          ${extraCells}
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-surface-container z-10 border-b border-border">
          <tr>${headerCols}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  public close(): void {
    this.modalEl?.remove();
    this.modalEl = null;
  }
}
