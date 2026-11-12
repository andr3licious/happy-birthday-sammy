import confetti from 'canvas-confetti';

export const CONFETTI_COLORS = [
  '#F2789F',
  '#F4B860',
  '#B388EB',
  '#FF9EC7',
  '#FFD6E8',
  '#E2C2FF',
  '#FFAE8F',
];

export const isReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function fireConfetti(opts = {}) {
  if (isReducedMotion()) return;
  const options = {
    colors: CONFETTI_COLORS,
    zIndex: 70,
    disableForReducedMotion: true,
    ...opts,
  };
  try {
    confetti(options);
  } catch (_) {
    /* ignore */
  }
}

export function celebrateBirthday() {
  fireConfetti({
    particleCount: 150,
    spread: 95,
    startVelocity: 48,
    origin: { x: 0.5, y: 0.62 },
  });

  setTimeout(() => {
    fireConfetti({
      particleCount: 70,
      angle: 60,
      spread: 60,
      startVelocity: 60,
      origin: { x: 0, y: 0.75 },
    });
    fireConfetti({
      particleCount: 70,
      angle: 120,
      spread: 60,
      startVelocity: 60,
      origin: { x: 1, y: 0.75 },
    });
  }, 260);

  setTimeout(() => {
    fireConfetti({
      particleCount: 45,
      spread: 160,
      startVelocity: 30,
      scalar: 1.1,
      shapes: ['star'],
      origin: { x: 0.5, y: 0.3 },
    });
  }, 650);

  const end = Date.now() + 1800;
  (function shower() {
    fireConfetti({
      particleCount: 3,
      angle: 270,
      spread: 120,
      startVelocity: 8,
      gravity: 0.7,
      ticks: 260,
      origin: { x: Math.random(), y: -0.05 },
    });
    if (Date.now() < end) setTimeout(shower, 90);
  })();
}
