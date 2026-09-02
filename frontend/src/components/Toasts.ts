export type ToastType = 'info' | 'success' | 'warning' | 'error';

class ToastManager {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'fixed bottom-12 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
    document.body.appendChild(this.container);
  }

  public show(message: string, type: ToastType = 'info', duration: number = 3500): void {
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-body-md transition duration-300 translate-y-2 opacity-0 ${
      type === 'success' ? 'bg-surface-container-high border-status-success/40 text-on-surface' :
      type === 'error' ? 'bg-surface-container-high border-status-error/40 text-on-surface' :
      type === 'warning' ? 'bg-surface-container-high border-status-warning/40 text-on-surface' :
      'bg-surface-container-high border-border text-on-surface'
    }`;

    const iconMap: Record<ToastType, string> = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      error: 'error',
    };

    const colorMap: Record<ToastType, string> = {
      info: 'text-primary',
      success: 'text-status-success',
      warning: 'text-status-warning',
      error: 'text-status-error',
    };

    toast.innerHTML = `
      <span class="material-symbols-outlined text-[20px] ${colorMap[type]}">${iconMap[type]}</span>
      <span class="flex-1 font-medium">${message}</span>
    `;

    this.container.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

export const toasts = new ToastManager();
