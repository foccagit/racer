// Integração PWA: registra service worker, detecta standalone,
// captura beforeinstallprompt e mostra as instruções certas na splash.

import { isMobile } from './device.js';

export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

let deferredPrompt = null;

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Caminho relativo pra funcionar em qualquer scope (raiz, subpath, tunnel).
  navigator.serviceWorker.register('./sw.js')
    .then((reg) => console.log('[PWA] Service Worker registrado:', reg.scope))
    .catch((err) => console.error('[PWA] Falha ao registrar SW:', err));
}

// Texto + ícone das instruções por plataforma. Retorna HTML pra injetar.
function instructionHTML(platform) {
  if (platform === 'ios') {
    // Ícone de "Compartilhar" do iOS (quadrado com seta pra cima).
    const icon = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3v12"/>
        <polyline points="7 8 12 3 17 8"/>
        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
      </svg>`;
    return `Para jogar em tela cheia: toque em ${icon} (compartilhar) e selecione “Adicionar à Tela de Início”.`;
  }
  if (platform === 'android') {
    return 'Para jogar em tela cheia: toque no menu (⋮) do navegador e selecione “Instalar app” ou “Adicionar à tela inicial”.';
  }
  return '';
}

function ensureInstallUI() {
  let wrap = document.getElementById('pwa-install');
  if (wrap) return wrap;
  wrap = document.createElement('div');
  wrap.id = 'pwa-install';
  wrap.innerHTML = `
    <button id="pwa-install-btn" class="btn-outline" hidden>INSTALAR APP</button>
    <p id="pwa-install-hint" class="install-hint"></p>
  `;
  // Coloca dentro da .screen-content da splash, depois do botão Ranking.
  const host = document.querySelector('#screen-start .screen-content');
  host?.appendChild(wrap);
  return wrap;
}

function showInstallButton() {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.hidden = false;
}
function hideInstallButton() {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.hidden = true;
}

function triggerInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.finally(() => {
    deferredPrompt = null;
    hideInstallButton();
  });
}

export function setupPWA() {
  registerServiceWorker();

  // Só renderiza UI de instalação se for mobile e ainda não instalado.
  if (!isMobile || isStandalone()) return;

  const platform = detectPlatform();
  const wrap = ensureInstallUI();
  const hint = wrap.querySelector('#pwa-install-hint');
  if (hint) hint.innerHTML = instructionHTML(platform);

  // Android (Chrome): tenta o prompt nativo. iOS não dispara este evento.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  document.getElementById('pwa-install-btn')?.addEventListener('click', triggerInstall);

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
    if (hint) hint.textContent = '';
  });
}
