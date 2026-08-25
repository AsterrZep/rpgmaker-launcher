import { t } from '../i18n';

export interface SidebarCallbacks {
  onNav: (tab: string) => void;
}

export class Sidebar {
  private activeTab: string = 'library';
  private callbacks: SidebarCallbacks;

  constructor(callbacks: SidebarCallbacks) {
    this.callbacks = callbacks;
  }

  public setActiveTab(tab: string) {
    this.activeTab = tab;
    this.render();
  }

  public render(): HTMLElement {
    const aside = document.createElement('aside');
    aside.className = 'fixed left-0 top-0 h-full w-60 bg-surface-container-lowest z-30 flex flex-col border-r border-border select-none';

    aside.innerHTML = `
      <div class="p-4 mb-2 flex items-center gap-3 border-b border-border/50">
        <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border border-primary/30">
          🎮
        </div>
        <div>
          <span class="font-bold text-headline-md tracking-tight text-text-primary block leading-none">RPG Maker</span>
          <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Launcher</span>
        </div>
      </div>

      <nav class="flex-1 px-3 space-y-1">
        <a data-tab="library" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md transition-colors cursor-pointer ${
          this.activeTab === 'library' ? 'bg-accent-soft text-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }">
          <span class="material-symbols-outlined text-[20px]">sports_esports</span>
          <span>${t('navPlay')}</span>
        </a>

        <div class="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-text-faint">
          Herramientas
        </div>

        <a data-tab="plugins" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${
          this.activeTab === 'plugins' ? 'bg-accent-soft text-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }">
          <span class="material-symbols-outlined text-[18px]">extension</span>
          <span>${t('navPlugins')}</span>
        </a>

        <a data-tab="saves" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${
          this.activeTab === 'saves' ? 'bg-accent-soft text-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }">
          <span class="material-symbols-outlined text-[18px]">save</span>
          <span>${t('navSaves')}</span>
        </a>

        <a data-tab="data" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${
          this.activeTab === 'data' ? 'bg-accent-soft text-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }">
          <span class="material-symbols-outlined text-[18px]">database</span>
          <span>${t('navData')}</span>
        </a>

        <a data-tab="sync" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${
          this.activeTab === 'sync' ? 'bg-accent-soft text-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }">
          <span class="material-symbols-outlined text-[18px]">sync</span>
          <span>${t('navSync')}</span>
        </a>

        <a data-tab="decrypt" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer ${
          this.activeTab === 'decrypt' ? 'bg-accent-soft text-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }">
          <span class="material-symbols-outlined text-[18px]">lock_open</span>
          <span>${t('navDecrypt')}</span>
        </a>
      </nav>

      <div class="p-3 border-t border-border/50">
        <a data-tab="shortcuts" class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors cursor-pointer text-text-muted hover:bg-surface-container-high hover:text-on-surface">
          <span class="material-symbols-outlined text-[18px]">settings</span>
          <span>${t('shortcutsTitle')}</span>
        </a>
      </div>
    `;

    aside.querySelectorAll('.sidebar-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab;
        if (tab) {
          this.callbacks.onNav(tab);
        }
      });
    });

    return aside;
  }
}
