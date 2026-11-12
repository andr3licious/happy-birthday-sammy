import { useRef } from 'react';

export function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (_) {
    /* unsupported */
  }
}

/**
 * Returns React event props (`onPointerDown`, `onPointerUp`, `onPointerCancel`, `onClick`)
 * that implement unified Pointer Events tap detection without triggering on scroll drags,
 * while still supporting keyboard Enter/Space activation (`e.detail === 0`).
 */
export function usePointerTap(handler) {
  const startRef = useRef(null);
  const lastTapRef = useRef(0);

  return {
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    onPointerUp: (e) => {
      const start = startRef.current;
      if (!start || e.pointerId !== start.id) return;
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      startRef.current = null;
      if (moved < 12) {
        lastTapRef.current = performance.now();
        handler(e);
      }
    },
    onPointerCancel: () => {
      startRef.current = null;
    },
    onClick: (e) => {
      if (e.detail === 0 && performance.now() - lastTapRef.current > 400) {
        handler(e);
      }
    },
  };
}
