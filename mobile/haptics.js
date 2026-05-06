// Vibração curta quando o carro sai da pista. Cooldown evita spam
// enquanto o jogador permanece fora.

import { isMobile } from './device.js';

const VIBRATE_MS = 100;
const COOLDOWN_MS = 500;
const supported = isMobile && typeof navigator !== 'undefined' && 'vibrate' in navigator;

let lastBuzzAt = 0;

export function tickHaptics(state) {
  if (!supported || !state?.offTrack) return;
  const now = performance.now();
  if (now - lastBuzzAt < COOLDOWN_MS) return;
  navigator.vibrate(VIBRATE_MS);
  lastBuzzAt = now;
}
