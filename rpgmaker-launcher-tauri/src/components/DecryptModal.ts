import { api, Game } from '../api';
import { t } from '../i18n';
import { toasts } from './Toasts';

export class DecryptModal {
  private games: Game[] = [];
  private selectedGame: string = '';
  private modalEl: HTMLElement | null = null;

  constructor(games: Game[], initialGame?: Game | null) {
    this.games = games;
    this.selectedGame = initialGame ? initialGame.name : (games[0]?.name || '');
  }

  public async open(): Promise<void> {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 select-none';

    const gameOptions = this.games
      .map(
        (g) =>
          `<option value="${g.name}" ${g.name === this.selectedGame ? 'selected' : ''}>${g.name} (${g.engine})</option>`
      )
      .join('');

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-[620px] bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[440px] animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border bg-surface-container-low shrink-0">
          <div class="flex justify-between items-center mb-1">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[24px]">lock_open</span>
              <h2 class="font-bold text-headline-md text-text-primary">${t('decryptTitle')}</h2>
            </div>
            <button class="btn-close w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-text-muted hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p class="text-[11px] text-text-muted">${t('decryptNotice')}</p>
        </div>

        <!-- Body -->
        <div class="flex-1 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-semibold text-text-primary">Seleccionar juego:</label>
            <select id="select-decrypt-game" class="bg-surface border border-border rounded-lg py-2 px-3 text-body-md text-on-surface focus:outline-none focus:border-primary">
              ${gameOptions || '<option value="">Sin juegos disponibles</option>'}
            </select>
          </div>

          <div class="flex flex-col gap-2 p-3 rounded-lg bg-surface border border-border">
            <label class="flex items-center gap-2 text-label-md text-on-surface cursor-pointer">
              <input id="chk-recreate" type="checkbox" checked class="rounded border-border bg-surface text-primary focus:ring-0" />
              <span>Intentar reconstruir estructura original del proyecto (Game.rpgproject)</span>
            </label>
          </div>

          <div id="decrypt-log-box" class="flex-1 p-3 rounded-lg bg-surface-container-lowest border border-border font-mono text-[11px] text-text-muted overflow-y-auto custom-scrollbar whitespace-pre-wrap">
            Listo para descifrar. Los archivos se guardarán en <nombre_juego>_descifrado/.
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-border bg-surface-container-low flex items-center justify-end gap-3 shrink-0">
          <button class="btn-close px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-label-md font-semibold border border-border transition-colors">
            ${t('btnClose')}
          </button>
          <button id="btn-start-decrypt" class="px-5 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-label-md font-bold transition shadow-md flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">lock_open</span>
            <span>Descifrar ahora</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Bind close
    this.modalEl.querySelectorAll('.btn-close').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    const selectEl = this.modalEl.querySelector('#select-decrypt-game') as HTMLSelectElement;
    selectEl?.addEventListener('change', (e) => {
      this.selectedGame = (e.target as HTMLSelectElement).value;
    });

    this.modalEl.querySelector('#btn-start-decrypt')?.addEventListener('click', () => this.startDecrypt());
  }

  private async startDecrypt(): Promise<void> {
    if (!this.selectedGame) return;
    const logBox = this.modalEl?.querySelector('#decrypt-log-box');
    const recreateChk = this.modalEl?.querySelector('#chk-recreate') as HTMLInputElement;

    if (logBox) {
      logBox.textContent = `>> Iniciando descifrado de ${this.selectedGame}...\nDescargando binario RPGMakerDecrypter si es necesario...\n`;
    }

    try {
      const res = await api.decrypt(this.selectedGame, recreateChk?.checked ?? true);
      if (logBox) {
        logBox.textContent += `\n¡Descifrado con éxito!\nCarpeta de salida:\n${res.output_dir}\n\n${res.log || ''}`;
      }
      toasts.show('Juego descifrado correctamente', 'success');
    } catch (err: any) {
      if (logBox) {
        logBox.textContent += `\nERROR: ${err.message}`;
      }
      toasts.show(`Error descifrando: ${err.message}`, 'error');
    }
  }

  public close(): void {
    this.modalEl?.remove();
    this.modalEl = null;
  }
}
