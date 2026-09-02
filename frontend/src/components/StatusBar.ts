import { t } from '../i18n';

export class StatusBar {
  private activeGame: string | null = null;
  private activePort: number | null = null;
  private version: string = '0.0.0';

  public setVersion(version: string) {
    this.version = version;
    this.render();
  }

  public update(activeGame: string | null, activePort: number | null) {
    this.activeGame = activeGame;
    this.activePort = activePort;
    this.render();
  }

  public render(): HTMLElement {
    const footer = document.createElement('footer');
    footer.className = 'h-7 shrink-0 w-full bg-surface-container-lowest border-t border-border flex items-center justify-between px-6 select-none text-[11px]';

    const isRunning = bool(this.activeGame && this.activePort);

    footer.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="flex h-2 w-2 rounded-full ${isRunning ? 'bg-status-success animate-pulse-fast' : 'bg-surface-variant'}"></span>
        <span class="text-text-muted">
          ${isRunning
            ? `<span class="text-text-faint">${t('serverActive')}</span> <span class="font-semibold text-primary">${this.activeGame}</span> <span class="text-text-faint">(${t('serverPort')} ${this.activePort})</span>`
            : `<span class="text-text-faint">${t('serverStopped')}</span>`
          }
        </span>
      </div>
      <div class="text-text-faint font-medium">
        ${t('runtimeReady').replace('{version}', this.version)}
      </div>
    `;

    return footer;
  }
}

function bool(val: any): boolean {
  return Boolean(val);
}
