import { getLang, setLang, t } from '../i18n';

export interface HeaderCallbacks {
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onLanguageChange: (lang: 'es' | 'en') => void;
  onToggleWebKit: (value: boolean) => void;
  onToggleDelZip: (value: boolean) => void;
  onUpdateClick: () => void;
}

export class Header {
  private callbacks: HeaderCallbacks;
  private webkit: boolean = true;
  private autoDeleteZip: boolean = false;

  constructor(callbacks: HeaderCallbacks, webkit: boolean, autoDeleteZip: boolean) {
    this.callbacks = callbacks;
    this.webkit = webkit;
    this.autoDeleteZip = autoDeleteZip;
  }

  public setUpdateTag(tag: string): void {
    const chip = document.querySelector('#update-chip');
    if (!chip || !tag) return;
    chip.classList.remove('hidden');
    (chip.querySelector('#update-tag') as HTMLElement).textContent = `↓ ${tag}`;
  }

  private toggle(id: string, checked: boolean, label: string, tip: string): string {
    return `
      <label class="hidden sm:flex items-center gap-1.5 cursor-pointer select-none" title="${tip}">
        <input type="checkbox" id="${id}" class="peer sr-only" ${checked ? 'checked' : ''} />
        <span class="relative w-8 h-[18px] rounded-full bg-surface-container-high border border-border peer-checked:bg-primary transition-colors
                     after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-[12px] after:h-[12px] after:rounded-full
                     after:bg-text-muted peer-checked:after:bg-on-primary peer-checked:after:translate-x-[14px] after:transition-transform"></span>
        <span class="text-label-md text-text-muted">${label}</span>
      </label>
    `;
  }

  public render(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'h-14 shrink-0 bg-surface border-b border-border flex items-center justify-between gap-3 px-6 select-none';

    const currentLang = getLang();

    header.innerHTML = `
      <div class="flex items-center gap-3 shrink-0">
        <span class="font-bold text-headline-md text-primary tracking-tight">RPG Maker Launcher</span>
        <div class="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-primary text-label-sm font-semibold">
          v0.8.0
        </div>
        <button id="update-chip" class="hidden items-center gap-1 bg-primary hover:bg-accent-hover text-on-primary px-2.5 py-1 rounded-lg text-label-md font-bold shadow-md transition-colors">
          <span class="material-symbols-outlined text-[16px]">download</span>
          <span id="update-tag"></span>
        </button>
      </div>

      <div class="flex-1 max-w-md mx-2 min-w-[120px]">
        <div class="relative flex items-center">
          <span class="material-symbols-outlined absolute left-3 text-text-faint text-[18px]">search</span>
          <input
            id="search-input"
            class="w-full bg-surface-container border border-border rounded-lg py-1.5 pl-9 pr-3 text-body-md text-on-surface placeholder:text-text-faint focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors"
            placeholder="${t('searchPlaceholder')}"
            type="text"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        ${this.toggle('toggle-webkit', this.webkit, t('toggleWebKit'), t('toggleWebKitTip'))}
        ${this.toggle('toggle-del-zip', this.autoDeleteZip, t('toggleDelZip'), t('toggleDelZipTip'))}

        <button id="btn-refresh-zips" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-3 py-1.5 rounded-lg border border-border text-on-surface text-label-md font-medium transition-colors" title="${t('btnRefresh')}">
          <span class="material-symbols-outlined text-[16px] text-primary">refresh</span>
          <span>${t('btnRefresh')}</span>
        </button>

        <button id="btn-lang" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg border border-border text-on-surface text-label-md font-semibold transition-colors cursor-pointer" title="ES / EN">
          <span class="material-symbols-outlined text-[16px] text-text-muted">translate</span>
          <span>${currentLang.toUpperCase()}</span>
        </button>
      </div>
    `;

    // Search input (debounce: no filtrar por cada tecla)
    const searchInput = header.querySelector('#search-input') as HTMLInputElement;
    let searchTimer: number | undefined;
    searchInput?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        this.callbacks.onSearch(value);
      }, 150);
    });

    // Refresh
    header.querySelector('#btn-refresh-zips')?.addEventListener('click', () => {
      this.callbacks.onRefresh();
    });

    // Language toggle
    header.querySelector('#btn-lang')?.addEventListener('click', () => {
      const nextLang = getLang() === 'es' ? 'en' : 'es';
      setLang(nextLang);
      this.callbacks.onLanguageChange(nextLang);
    });

    // Config toggles
    header.querySelector('#toggle-webkit')?.addEventListener('change', (e) => {
      this.webkit = (e.target as HTMLInputElement).checked;
      this.callbacks.onToggleWebKit(this.webkit);
    });
    header.querySelector('#toggle-del-zip')?.addEventListener('change', (e) => {
      this.autoDeleteZip = (e.target as HTMLInputElement).checked;
      this.callbacks.onToggleDelZip(this.autoDeleteZip);
    });

    // Update chip -> open releases page
    const chip = header.querySelector('#update-chip');
    chip?.addEventListener('click', () => this.callbacks.onUpdateClick());

    return header;
  }
}
