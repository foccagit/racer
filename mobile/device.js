// Detecta mobile e perfil de performance.
// Roda uma vez no boot; expõe flags pros outros módulos.

const UA_MOBILE_RE = /android|iphone|ipad|ipod|iemobile|blackberry|opera mini|mobile/i;

function detectMobile() {
  // Critério principal: ponteiro grosso (touch) — funciona em iPad mesmo com UA "desktop".
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  // Fallback por UA pra casos esquisitos (ex: testes em headless).
  const uaMatch = UA_MOBILE_RE.test(navigator.userAgent || '');
  return coarse || uaMatch;
}

function detectLowEnd() {
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = navigator.deviceMemory ?? 8; // só Chrome expõe; default otimista
  return cores <= 4 || memory <= 4;
}

export const isMobile = detectMobile();
export const isLowEnd = isMobile && detectLowEnd();

if (isMobile) {
  document.body.classList.add('is-mobile');
  if (isLowEnd) document.body.classList.add('is-low-end');
  console.log(`[Mobile] Perfil aplicado: ${isLowEnd ? 'low-end' : 'standard'} (cores=${navigator.hardwareConcurrency ?? '?'}, mem=${navigator.deviceMemory ?? '?'})`);
}
