// Controles touch para mobile.
// Reaproveita state.keys (mesmas flags que o teclado) — assim a física não muda.
// Multi-touch: rastreia cada Touch.identifier separadamente, permitindo
// virar e acelerar ao mesmo tempo.

import { isMobile } from './device.js';

const DIR_KEYS = new Set(['up', 'down', 'left', 'right']);

export function setupTouchControls(state, { onCameraToggle } = {}) {
  if (!isMobile) return;

  const buttons = Array.from(document.querySelectorAll('[data-touch-action]'));
  // Cada touch ativo aponta pro botão (e ação) que está pressionando.
  const activeTouches = new Map(); // identifier -> { btn, action }

  function press(btn, action) {
    btn.classList.add('is-pressed');
    if (DIR_KEYS.has(action)) {
      state.keys[action] = true;
    } else if (action === 'camera') {
      onCameraToggle?.();
    }
  }
  function release(btn, action) {
    btn.classList.remove('is-pressed');
    if (DIR_KEYS.has(action)) {
      state.keys[action] = false;
    }
  }

  buttons.forEach((btn) => {
    const action = btn.dataset.touchAction;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        activeTouches.set(t.identifier, { btn, action });
      }
      press(btn, action);
    }, { passive: false });

    const endHandler = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const entry = activeTouches.get(t.identifier);
        if (!entry) continue;
        activeTouches.delete(t.identifier);
        // Só solta se nenhum outro toque ainda estiver no mesmo botão.
        const stillHeld = [...activeTouches.values()].some(v => v.btn === entry.btn);
        if (!stillHeld) release(entry.btn, entry.action);
      }
    };
    btn.addEventListener('touchend', endHandler, { passive: false });
    btn.addEventListener('touchcancel', endHandler, { passive: false });

    // Bloqueia menu de contexto / seleção no toque longo.
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // Safety net: se um touch sumir sem evento (raro), zera tudo no blur.
  window.addEventListener('blur', () => {
    activeTouches.forEach(({ btn, action }) => release(btn, action));
    activeTouches.clear();
  });
}
