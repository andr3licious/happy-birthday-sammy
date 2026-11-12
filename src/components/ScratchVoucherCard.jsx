import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CONFIG } from '../config';
import { music } from '../utils/audio';
import { fireConfetti } from '../utils/confetti';
import { vibrate } from '../utils/haptics';

const THRESHOLD = 0.5;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function ScratchVoucherCard({ active }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const scratchedRef = useRef(false);
  const revealedRef = useRef(false);
  const brushRef = useRef(22);
  const lastCheckRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [percent, setPercent] = useState(0);

  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    drawingRef.current = false;
    setRevealed(true);
    setPercent(100);
    music.sparkle();
    vibrate([18, 40, 18]);

    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      fireConfetti({
        particleCount: 70,
        spread: 75,
        startVelocity: 32,
        origin: {
          x: (r.left + r.width / 2) / window.innerWidth,
          y: (r.top + r.height / 2) / window.innerHeight,
        },
      });
    }
  }, []);

  const paintCover = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    if (!W || !H) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let snapshot = null;
    if (scratchedRef.current && canvas.width && canvas.height) {
      snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d').drawImage(canvas, 0, 0);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // rose-gold & champagne pearl foil
    let g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#f4d5df');
    g.addColorStop(0.25, '#fff4f7');
    g.addColorStop(0.5, '#e8bece');
    g.addColorStop(0.75, '#fdf0e6');
    g.addColorStop(1, '#eccad8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // pastel iridescent sheen
    g = ctx.createLinearGradient(0, H, W, 0);
    g.addColorStop(0, 'rgba(242, 120, 159, 0.34)');
    g.addColorStop(0.35, 'rgba(197, 163, 255, 0.32)');
    g.addColorStop(0.68, 'rgba(255, 210, 150, 0.34)');
    g.addColorStop(1, 'rgba(255, 165, 195, 0.36)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // fine diagonal brushing
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -H; x < W; x += 6) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
    }
    ctx.stroke();

    // pearl & gold glitter
    const n = Math.round((W * H) / 150);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle =
        i % 3 === 0
          ? `rgba(217, 155, 78, ${(Math.random() * 0.45).toFixed(2)})`
          : `rgba(255, 255, 255, ${(0.35 + Math.random() * 0.6).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, 0.5 + Math.random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // label
    const fs = clamp(W * 0.065, 18, 30);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(92, 48, 76, 0.85)';
    ctx.font = `700 ${fs}px Quicksand, system-ui, sans-serif`;
    ctx.fillText('Scratch here ✨', W / 2, H / 2 - fs * 0.35);
    ctx.font = `600 ${fs * 0.5}px Quicksand, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(116, 68, 98, 0.68)';
    ctx.fillText('use your finger or mouse', W / 2, H / 2 + fs * 0.75);

    if (snapshot) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }

    brushRef.current = clamp(Math.min(W, H) * 0.085, 16, 34);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    paintCover();
    const wrap = wrapRef.current;
    if (!wrap) return;
    let lastW = wrap.clientWidth;
    let lastH = wrap.clientHeight;

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        const nw = wrap.clientWidth;
        const nh = wrap.clientHeight;
        if (!revealedRef.current && nw && nh && (nw !== lastW || nh !== lastH)) {
          lastW = nw;
          lastH = nh;
          paintCover();
        }
      });
      ro.observe(wrap);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!scratchedRef.current && !revealedRef.current) paintCover();
      });
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, [active, paintCover]);

  const getPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const scratchLine = (a, b) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const brush = brushRef.current;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brush * 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x, b.y, brush, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    scratchedRef.current = true;
  };

  const measure = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return 0;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const stride = Math.max(2, Math.round(Math.sqrt((width * height) / 9000)));
    let cleared = 0;
    let total = 0;
    for (let y = 0; y < height; y += stride) {
      for (let x = 0; x < width; x += stride) {
        total++;
        if (data[(y * width + x) * 4 + 3] < 128) cleared++;
      }
    }
    return total ? cleared / total : 0;
  };

  const checkProgress = (force) => {
    const now = performance.now();
    if (!force && now - lastCheckRef.current < 120) return;
    lastCheckRef.current = now;
    const pct = measure();
    const shown = Math.min(100, Math.round((pct / THRESHOLD) * 50));
    setPercent(shown);
    if (pct >= THRESHOLD) reveal();
  };

  const handlePointerDown = (e) => {
    if (revealedRef.current) return;
    e.preventDefault();
    drawingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
    const p = getPos(e);
    lastPosRef.current = p;
    scratchLine(p, p);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current || revealedRef.current) return;
    e.preventDefault();
    const native = e.nativeEvent;
    const events =
      native && typeof native.getCoalescedEvents === 'function'
        ? native.getCoalescedEvents()
        : [];
    const list = events.length ? events : [e];
    list.forEach((ev) => {
      const p = getPos(ev);
      scratchLine(lastPosRef.current || p, p);
      lastPosRef.current = p;
    });
    checkProgress(false);
  };

  const handlePointerEnd = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPosRef.current = null;
    checkProgress(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      reveal();
    }
  };

  return (
    <article className="card glass scratch-card" style={{ '--i': 1 }}>
      <span className="washi-tape washi-gold" aria-hidden="true" />
      <span className="card-sticker card-sticker-gold" aria-hidden="true">
        ★ SWEET TREAT
      </span>
      <p className="card-eyebrow">A Little Gift</p>
      <h3 className="card-title">
        Scratch &amp; win <span className="emoji">🎟️</span>
      </h3>
      <div
        id="scratchWrap"
        ref={wrapRef}
        className={[
          'scratch-wrap',
          isReady ? 'is-ready' : '',
          revealed ? 'is-revealed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="voucher">
          <span className="voucher-badge">Birthday Voucher</span>
          <p className="voucher-label">Valid for:</p>
          <p id="voucherPrize" className="voucher-prize">
            {CONFIG.voucher.prize}
          </p>
          <p id="voucherFine" className="voucher-fine">
            {CONFIG.voucher.fine}
          </p>
        </div>
        <canvas
          id="scratchCanvas"
          ref={canvasRef}
          className="scratch-canvas"
          tabIndex={revealed ? -1 : 0}
          role="button"
          aria-hidden={revealed ? 'true' : undefined}
          aria-label="Scratch-off card. Drag to scratch, or press Enter to reveal."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onLostPointerCapture={handlePointerEnd}
          onKeyDown={handleKeyDown}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="scratch-meta">
        <div className="scratch-bar" aria-hidden="true">
          <span id="scratchBar" style={{ width: `${percent}%` }} />
        </div>
        <p id="scratchStatus" className="scratch-status">
          {revealed ? (
            'Revealed! Screenshot it as proof 😉'
          ) : (
            <>
              <span id="scratchPct">{percent}%</span> scratched
            </>
          )}
        </p>
      </div>
    </article>
  );
}
