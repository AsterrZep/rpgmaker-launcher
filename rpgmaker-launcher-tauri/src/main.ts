// ============================================================
//  RPG Maker Launcher - Frontend Entry Point (with diagnostics)
// ============================================================
import './styles/main.css';
import { App } from './app';

// ── Diagnóstico frontend ──────────────────────────────────────
const diagLines: string[] = [];
const diag = (msg: string) => {
  const ts = new Date().toISOString().slice(11, 23);
  const line = `[${ts}] ${msg}`;
  diagLines.push(line);
  console.log(`%c[DIAG] ${msg}`, 'color: cyan; font-weight: bold');
};

// Recoger errores globales
window.addEventListener('error', (e) => {
  diag(`❌ GLOBAL ERROR: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
});
window.addEventListener('unhandledrejection', (e) => {
  diag(`❌ UNHANDLED REJECTION: ${e.reason}`);
});

// ── Info del entorno ──────────────────────────────────────────
diag('═══════════════════════════════════════════');
diag('Frontend diagnostics iniciado');
diag(`URL actual: ${window.location.href}`);
diag(`Protocolo: ${window.location.protocol}`);
diag(`Hostname: ${window.location.hostname}`);
diag(`Puerto: ${window.location.port}`);
diag(`Origin: ${window.location.origin}`);

// Detectar Tauri
const isTauri = !!(window as any).__TAURI_INTERNALS__;
diag(`Tauri detectado: ${isTauri}`);
if (isTauri) {
  try {
    const info = (window as any).__TAURI_INTERNALS__;
    diag(`Tauri internals keys: ${Object.keys(info).join(', ')}`);
  } catch (_) {}
}

// User agent
diag(`User-Agent: ${navigator.userAgent}`);

// ── Inicialización ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  diag('DOMContentLoaded fired');
  const root = document.getElementById('app');
  if (root) {
    diag('Elemento #app encontrado');
    try {
      const app = new App(root);
      diag('App instancia creada, llamando init()...');
      await app.init();
      diag('✅ App.init() completado sin errores');
    } catch (err: any) {
      diag(`❌ Error en App.init(): ${err.message}\n${err.stack}`);
    }
  } else {
    diag('❌ Elemento #app NO encontrado en el DOM');
  }

  // Exponer diagnósticos globalmente para inspección
  (window as any).__RPG_DIAG__ = {
    lines: diagLines,
    dump: () => diagLines.join('\n'),
  };
  diag('Dump disponible en: window.__RPG_DIAG__.dump()');
});
