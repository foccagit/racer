// Força landscape em mobile. Tenta lock nativo; usa overlay como fallback (iOS).

import { isMobile } from './device.js';

let overlayEl = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.id = 'rotate-overlay';
  overlayEl.innerHTML = `
    <div class="rotate-icon" aria-hidden="true">📱</div>
    <p class="rotate-text">Gire o celular para jogar</p>
  `;
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function syncOverlay() {
  if (!isMobile) return;
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  ensureOverlay().classList.toggle('visible', portrait);
}

// Tenta travar landscape. Precisa ser chamado dentro de um gesto do usuário (ex: clique JOGAR).
// Em iOS lança/rejeita silenciosamente — o overlay garante o fallback.
export async function requestLandscapeLock() {
  if (!isMobile) return;
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch {
    // Sem suporte ou bloqueado — overlay assume.
  }
}

export function setupOrientation() {
  if (!isMobile) return;
  ensureOverlay();
  syncOverlay();
  window.matchMedia('(orientation: portrait)').addEventListener('change', syncOverlay);
  window.addEventListener('orientationchange', syncOverlay);
}
