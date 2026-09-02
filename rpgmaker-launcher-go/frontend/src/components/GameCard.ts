import { api, Game } from '../api';
import { t } from '../i18n';

export interface GameCardCallbacks {
  onSelect: (game: Game) => void;
  onLaunch: (game: Game) => void;
  onFavorite: (game: Game, e: MouseEvent) => void;
}

export class GameCard {
  private game: Game;
  private isSelected: boolean;
  private callbacks: GameCardCallbacks;

  constructor(game: Game, isSelected: boolean, callbacks: GameCardCallbacks) {
    this.game = game;
    this.isSelected = isSelected;
    this.callbacks = callbacks;
  }

  private formatLastPlayed(ts: number | null): string {
    if (!ts) return t('neverPlayed');
    const d = (Date.now() / 1000) - ts;
    if (d < 60) return t('playedNow');
    if (d < 3600) return t('playedMin', Math.floor(d / 60));
    if (d < 86400) return t('playedHoursAgo', Math.floor(d / 3600));
    if (d < 7 * 86400) return t('playedDaysAgo', Math.floor(d / 86400));
    const date = new Date(ts * 1000);
    return date.toLocaleDateString();
  }

  private formatHours(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return '0m';
  }

  private getEngineBadgeClass(engine: string): string {
    switch (engine) {
      case 'MZ':
        return 'bg-accent-soft text-primary';
      case 'MV':
        return 'bg-secondary-container text-on-secondary-container';
      case 'XP':
      case 'VX':
      case 'VXAce':
        return 'bg-surface-variant text-text-muted';
      case 'renpy':
        return 'bg-status-success/20 text-status-success';
      default:
        return 'bg-surface-variant text-text-muted';
    }
  }

  public render(): HTMLElement {
    const card = document.createElement('div');
    const isIncomplete = this.game.is_incomplete;

    this.applySelectionClass(card);

    // Cover image or initial placeholder (URL absoluta: el origen en Tauri
    // es tauri://localhost, las rutas relativas no llegan al backend API)
    const coverSrc = this.game.cover_url ? `${api.getBaseUrl()}${this.game.cover_url}` : null;
    const coverHtml = coverSrc
      ? `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${coverSrc}" alt="${this.game.name}" loading="lazy" decoding="async" draggable="false" />`
      : `<div class="w-full h-full flex items-center justify-center bg-surface-container-high text-primary font-black text-3xl select-none">${this.game.name.charAt(0).toUpperCase()}</div>`;

    card.innerHTML = `
      <!-- Favorite Star Badge -->
      <button class="btn-favorite absolute top-2 right-2 z-10 w-6 h-6 bg-surface-container-lowest hover:bg-surface-container-highest rounded-full flex items-center justify-center shadow-md transition-colors" title="Favorito">
        <span class="material-symbols-outlined text-[15px] ${this.game.favorite ? 'text-status-warning' : 'text-text-faint hover:text-status-warning'}" style="${this.game.favorite ? "font-variation-settings: 'FILL' 1;" : ""}">star</span>
      </button>

      <!-- Cover -->
      <div class="w-[150px] h-[104px] mx-auto rounded-lg overflow-hidden shadow-sm mb-2 bg-surface-variant relative shrink-0">
        ${coverHtml}
        <div class="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-center pb-2">
          <span class="material-symbols-outlined text-primary text-[24px]">play_circle</span>
        </div>
      </div>

      <!-- Info -->
      <div class="flex-1 flex flex-col min-w-0 justify-between">
        <div>
          <h3 class="text-[13px] font-bold text-on-surface truncate leading-tight group-hover:text-primary transition-colors" title="${this.game.name}">
            ${this.game.name}
          </h3>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="px-1.5 py-[1px] rounded text-[9px] font-bold uppercase tracking-wider ${this.getEngineBadgeClass(this.game.engine)}">
              ${this.game.engine}
            </span>
            <span class="text-[10px] text-text-faint truncate">
              ${this.formatHours(this.game.seconds)}
            </span>
          </div>
        </div>

        <div class="text-[10px] text-text-muted flex items-center gap-1.5 truncate mt-1">
          <span class="w-1.5 h-1.5 rounded-full ${this.game.last_played ? 'bg-status-success' : 'bg-surface-variant'} shrink-0"></span>
          <span class="truncate">${this.formatLastPlayed(this.game.last_played)}</span>
        </div>
      </div>
    `;

    // Click events
    card.addEventListener('click', () => {
      this.callbacks.onSelect(this.game);
    });

    card.addEventListener('dblclick', () => {
      if (!this.game.is_incomplete) {
        this.callbacks.onLaunch(this.game);
      }
    });

    const favBtn = card.querySelector('.btn-favorite');
    favBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onFavorite(this.game, e as MouseEvent);
    });

    return card;
  }

  /**
   * Aplica (o actualiza) las clases visuales según selección.
   * Evita reconstruir el DOM del grid al cambiar de tarjeta seleccionada:
   * clave para que el hover/selección reaccione instantáneo.
   */
  public applySelectionClass(card?: HTMLElement): void {
    const el = card || (this._el as HTMLElement | null);
    if (!el) return;
    this._el = el;
    const isIncomplete = this.game.is_incomplete;
    el.className = `group relative flex flex-col h-[218px] w-[178px] p-3 rounded-xl transition duration-200 select-none cursor-pointer border ${
      this.isSelected
        ? 'bg-card-selected border-primary ring-1 ring-primary/50 shadow-lg shadow-primary/10'
        : 'bg-surface-container hover:bg-card-hover border-border hover:border-primary/40 hover:-translate-y-0.5 shadow-md'
    } ${isIncomplete ? 'opacity-60 grayscale hover:grayscale-0' : ''}`;
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.applySelectionClass();
  }

  private _el: HTMLElement | null = null;
}
