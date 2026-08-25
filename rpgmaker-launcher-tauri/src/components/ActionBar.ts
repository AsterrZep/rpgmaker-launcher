import { Game } from '../api';
import { t } from '../i18n';

export interface ActionBarCallbacks {
  onPlay: () => void;
  onPlugins: () => void;
  onSaves: () => void;
  onData: () => void;
  onMods: () => void;
  onSync: () => void;
  onDecrypt: () => void;
  onStopServer: () => void;
  onShortcuts: () => void;
  onQuit: () => void;
}

export class ActionBar {
  private selectedGame: Game | null = null;
  private isServerRunning: boolean = false;
  private callbacks: ActionBarCallbacks;

  constructor(callbacks: ActionBarCallbacks) {
    this.callbacks = callbacks;
  }

  public update(selectedGame: Game | null, isServerRunning: boolean) {
    this.selectedGame = selectedGame;
    this.isServerRunning = isServerRunning;
    this.render();
  }

  public render(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'w-full shrink-0 bg-surface-container-highest/95 border-t border-border px-6 py-2.5 flex items-center justify-between select-none shadow-2xl';

    const canPlay = this.selectedGame && !this.selectedGame.is_incomplete;
    const isWebGame = this.selectedGame && this.selectedGame.is_web;

    bar.innerHTML = `
      <div class="flex items-center gap-2">
        <!-- Play Button -->
        <button
          id="btn-play"
          class="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-headline-md transition shadow-md ${
            canPlay
              ? 'bg-primary hover:bg-accent-hover text-on-primary cursor-pointer hover:shadow-primary/20 hover:scale-[1.02]'
              : 'bg-surface-variant text-text-faint cursor-not-allowed opacity-60'
          }"
          ${!canPlay ? 'disabled' : ''}
        >
          <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
          <span>${t('btnPlay')}</span>
        </button>

        <div class="w-px h-6 bg-border mx-2"></div>

        <!-- Tool Buttons -->
        <button
          id="btn-plugins"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${
            isWebGame
              ? 'bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50'
              : 'bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50'
          }"
          ${!isWebGame ? 'disabled' : ''}
          title="${isWebGame ? 'Gestor de plugins' : 'Solo disponible para juegos MZ/MV'}"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">extension</span>
          <span>${t('navPlugins')}</span>
        </button>

        <button
          id="btn-saves"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${
            this.selectedGame
              ? 'bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50'
              : 'bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50'
          }"
          ${!this.selectedGame ? 'disabled' : ''}
          title="Gestor de partidas guardadas"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">save</span>
          <span>${t('navSaves')}</span>
        </button>

        <button
          id="btn-data"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${
            isWebGame
              ? 'bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50'
              : 'bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50'
          }"
          ${!isWebGame ? 'disabled' : ''}
          title="Navegador de base de datos"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">database</span>
          <span>${t('navData')}</span>
        </button>

        <button
          id="btn-mods"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors border border-border/60 ${
            isWebGame
              ? 'bg-surface hover:bg-surface-container-low text-text-primary hover:border-primary/50'
              : 'bg-surface/50 text-text-faint border-border/30 cursor-not-allowed opacity-50'
          }"
          ${!isWebGame ? 'disabled' : ''}
          title="${isWebGame ? 'Carpeta de mods del juego' : 'Solo disponible para juegos MZ/MV'}"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">code_blocks</span>
          <span>${t('navMods')}</span>
        </button>

        <button
          id="btn-sync"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold bg-surface hover:bg-surface-container-low text-text-primary border border-border/60 hover:border-primary/50 transition-colors"
          title="Sincronización de partidas"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">sync</span>
          <span>${t('navSync')}</span>
        </button>

        <button
          id="btn-decrypt"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold bg-surface hover:bg-surface-container-low text-text-primary border border-border/60 hover:border-primary/50 transition-colors"
          title="Herramienta de descifrado"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">lock_open</span>
          <span>${t('navDecrypt')}</span>
        </button>
      </div>

      <!-- Right Group: Stop Server & Settings -->
      <div class="flex items-center gap-2">
        <button
          id="btn-stop-server"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-semibold transition ${
            this.isServerRunning
              ? 'bg-error-container hover:bg-status-error text-on-error-container hover:text-white cursor-pointer shadow-sm'
              : 'bg-surface/30 text-text-faint border border-border/30 cursor-not-allowed opacity-40'
          }"
          ${!this.isServerRunning ? 'disabled' : ''}
        >
          <span class="material-symbols-outlined text-[16px]">stop_circle</span>
          <span>${t('btnStopServer')}</span>
        </button>

        <button
          id="btn-shortcuts"
          class="p-2 rounded-lg bg-surface hover:bg-surface-container-low text-text-muted hover:text-on-surface border border-border/60 transition-colors"
          title="${t('shortcutsTitle')}"
        >
          <span class="material-symbols-outlined text-[18px]">keyboard</span>
        </button>

        <button
          id="btn-quit"
          class="p-2 rounded-lg bg-surface hover:bg-error-container text-text-muted hover:text-status-error border border-border/60 transition-colors"
          title="${t('quitTip')}"
        >
          <span class="material-symbols-outlined text-[18px]">power_settings_new</span>
        </button>
      </div>
    `;

    // Bind events
    bar.querySelector('#btn-play')?.addEventListener('click', () => this.callbacks.onPlay());
    bar.querySelector('#btn-plugins')?.addEventListener('click', () => this.callbacks.onPlugins());
    bar.querySelector('#btn-saves')?.addEventListener('click', () => this.callbacks.onSaves());
    bar.querySelector('#btn-data')?.addEventListener('click', () => this.callbacks.onData());
    bar.querySelector('#btn-mods')?.addEventListener('click', () => this.callbacks.onMods());
    bar.querySelector('#btn-sync')?.addEventListener('click', () => this.callbacks.onSync());
    bar.querySelector('#btn-decrypt')?.addEventListener('click', () => this.callbacks.onDecrypt());
    bar.querySelector('#btn-stop-server')?.addEventListener('click', () => this.callbacks.onStopServer());
    bar.querySelector('#btn-shortcuts')?.addEventListener('click', () => this.callbacks.onShortcuts());
    bar.querySelector('#btn-quit')?.addEventListener('click', () => this.callbacks.onQuit());

    return bar;
  }
}
