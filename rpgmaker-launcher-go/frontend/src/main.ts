import './styles/main.css';
import { App } from './app';

window.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('app');
  if (root) {
    const app = new App(root);
    await app.init();
  }
});
