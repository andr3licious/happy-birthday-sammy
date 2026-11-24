import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CONFIG } from '../config';
import { music } from '../utils/audio';
import { fireConfetti } from '../utils/confetti';
import { vibrate } from '../utils/haptics';

const THRESHOLD = 0.5;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function drawRoundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapCanvasLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function ScratchVoucherCard({ active, revealed: persistedRevealed = false, onReveal }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const scratchedRef = useRef(false);
  const revealedRef = useRef(persistedRevealed);
  const brushRef = useRef(22);
  const lastCheckRef = useRef(0);
  const savedTimerRef = useRef(null);

  const [isReady, setIsReady] = useState(persistedRevealed);
  const [revealed, setRevealed] = useState(persistedRevealed);
  const [percent, setPercent] = useState(persistedRevealed ? 100 : 0);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    return () => clearTimeout(savedTimerRef.current);
  }, []);

  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    drawingRef.current = false;
    setRevealed(true);
    setPercent(100);
    if (onReveal) onReveal();
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
  }, [onReveal]);

  const handleSaveVoucher = () => {
    const W = 960;
    const H = 580;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // Pastel rose-cream background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#FFFDF9');
    bg.addColorStop(1, '#FFF0F6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Champagne & lavender radial corner glows
    const g1 = ctx.createRadialGradient(0, 0, 20, 0, 0, 560);
    g1.addColorStop(0, 'rgba(255, 226, 178, 0.55)');
    g1.addColorStop(1, 'rgba(255, 226, 178, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W, H, 20, W, H, 560);
    g2.addColorStop(0, 'rgba(232, 205, 255, 0.55)');
    g2.addColorStop(1, 'rgba(232, 205, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // Outer border
    drawRoundRectPath(ctx, 10, 10, W - 20, H - 20, 32);
    ctx.strokeStyle = 'rgba(229, 91, 138, 0.45)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner dashed rose border
    ctx.save();
    ctx.setLineDash([10, 8]);
    drawRoundRectPath(ctx, 22, 22, W - 44, H - 44, 24);
    ctx.strokeStyle = 'rgba(218, 102, 146, 0.48)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Ticket notches at left & right midpoints
    ctx.fillStyle = '#FFEAF3';
    [0, W].forEach((nx) => {
      ctx.beginPath();
      ctx.arc(nx, H / 2, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(229, 91, 138, 0.42)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    // Top rose-to-lavender pill badge: BIRTHDAY VOUCHER
    const badgeW = 280;
    const badgeH = 44;
    const badgeX = (W - badgeW) / 2;
    const badgeY = 66;
    const pillGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    pillGrad.addColorStop(0, '#E55B8A');
    pillGrad.addColorStop(1, '#9D79E8');
    ctx.fillStyle = pillGrad;
    drawRoundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 22);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px Quicksand, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B I R T H D A Y   V O U C H E R', W / 2, badgeY + badgeH / 2 + 1);

    // Cursive "Valid for:"
    ctx.fillStyle = '#E55B8A';
    ctx.font = '700 34px Caveat, cursive';
    ctx.fillText('Valid for:', W / 2, 154);

    // Main prize text (word-wrapped)
    ctx.fillStyle = '#3A2233';
    ctx.font = '700 40px "Cormorant Garamond", Georgia, serif';
    const lines = wrapCanvasLines(ctx, CONFIG.voucher.prize, 780);
    const lineHeight = 52;
    const startY = lines.length > 1 ? 236 : 262;
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, W / 2, startY + idx * lineHeight);
    });

    // Fine print
    const afterPrizeY = startY + Math.max(0, lines.length - 1) * lineHeight + 64;
    ctx.fillStyle = '#7E556B';
    ctx.font = '600 22px Quicksand, system-ui, sans-serif';
    ctx.fillText(CONFIG.voucher.fine, W / 2, Math.min(afterPrizeY, H - 106));

    // Footer
    ctx.fillStyle = '#C4849F';
    ctx.font = '700 24px Caveat, cursive';
    ctx.fillText(`Just for Sammy · ${new Date().getFullYear()}`, W / 2, H - 56);

    const link = document.createElement('a');
    link.download = 'sammy-birthday-voucher.png';
    link.href = c.toDataURL('image/png');
    link.click();

    vibrate(14);
    music.sparkle();
    setSavedMsg(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedMsg(false), 3000);
  };

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
    if (revealedRef.current) {
      setIsReady(true);
      return;
    }
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
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const r = canvas.getBoundingClientRect();
    const logicalW = wrap ? wrap.clientWidth : r.width;
    const logicalH = wrap ? wrap.clientHeight : r.height;
    const scaleX = r.width ? logicalW / r.width : 1;
    const scaleY = r.height ? logicalH / r.height : 1;
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY,
    };
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
    const shown = Math.min(100, Math.round((pct / THRESHOLD) * 100));
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
            'Unlocked! Ready to claim 😉'
          ) : (
            <>
              <span id="scratchPct">{percent}%</span> scratched
            </>
          )}
        </p>
        {revealed && (
          <button
            id="saveVoucherBtn"
            type="button"
            className="btn-ghost save-voucher-btn"
            onClick={handleSaveVoucher}
          >
            {savedMsg ? '✓ Voucher Saved!' : '📥 Save Voucher'}
          </button>
        )}
      </div>
    </article>
  );
}
