import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { CONFIG } from '../config';
import { fireConfetti } from '../utils/confetti';
import { vibrate } from '../utils/haptics';
import { music } from '../utils/audio';

function drawMiniHeart(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const topY = cy - r * 0.38;
  const botY = cy + r * 0.95;
  ctx.moveTo(cx, botY);
  ctx.bezierCurveTo(cx - r * 1.35, cy + r * 0.15, cx - r * 1.15, cy - r * 0.98, cx - r * 0.5, cy - r * 0.98);
  ctx.bezierCurveTo(cx - r * 0.15, cy - r * 0.98, cx, cy - r * 0.62, cx, topY);
  ctx.bezierCurveTo(cx, cy - r * 0.62, cx + r * 0.15, cy - r * 0.98, cx + r * 0.5, cy - r * 0.98);
  ctx.bezierCurveTo(cx + r * 1.15, cy - r * 0.98, cx + r * 1.35, cy + r * 0.15, cx, botY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawFinderEye(ctx, x, y, cell, darkColor, accentColor) {
  const size7 = cell * 7;
  const size5 = cell * 5;
  const size3 = cell * 3;

  // Outer 7x7 dark frame
  ctx.fillStyle = darkColor;
  drawRoundedRect(ctx, x, y, size7, size7, cell * 1.4);
  ctx.fill();

  // Inner 5x5 light ring
  ctx.fillStyle = '#FFFDFB';
  drawRoundedRect(ctx, x + cell, y + cell, size5, size5, cell * 0.9);
  ctx.fill();

  // Inner 3x3 dark core (must remain dark at center for 1:1:3:1:1 scanner lock)
  ctx.fillStyle = darkColor;
  drawRoundedRect(ctx, x + cell * 2, y + cell * 2, size3, size3, cell * 0.75);
  ctx.fill();

  // Deep berry heart accent at center (dark enough for every camera binarizer)
  drawMiniHeart(ctx, x + size7 / 2, y + size7 / 2, cell * 0.55, accentColor);
}

function drawCandle(ctx, cx, bottomY, w, h) {
  // Candle body
  ctx.save();
  drawRoundedRect(ctx, cx - w / 2, bottomY - h, w, h, 4);
  ctx.fillStyle = '#FFF9FB';
  ctx.fill();
  ctx.strokeStyle = '#E87A9F';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Diagonal candy stripes
  ctx.clip();
  ctx.fillStyle = '#FF9EC4';
  for (let sy = bottomY - h - 10; sy < bottomY + 10; sy += 9) {
    ctx.beginPath();
    ctx.moveTo(cx - w, sy);
    ctx.lineTo(cx + w, sy - 8);
    ctx.lineTo(cx + w, sy - 3);
    ctx.lineTo(cx - w, sy + 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Wick
  ctx.fillStyle = '#4A2C3A';
  ctx.fillRect(cx - 1, bottomY - h - 5, 2, 5);

  // Flame halo
  const halo = ctx.createRadialGradient(cx, bottomY - h - 14, 1, cx, bottomY - h - 14, 16);
  halo.addColorStop(0, 'rgba(255, 206, 96, 0.65)');
  halo.addColorStop(1, 'rgba(255, 142, 184, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, bottomY - h - 14, 16, 0, Math.PI * 2);
  ctx.fill();

  // Flame teardrop
  ctx.fillStyle = '#FFAE34';
  ctx.beginPath();
  ctx.moveTo(cx, bottomY - h - 25);
  ctx.quadraticCurveTo(cx + 7, bottomY - h - 13, cx, bottomY - h - 5);
  ctx.quadraticCurveTo(cx - 7, bottomY - h - 13, cx, bottomY - h - 25);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFF7C2';
  ctx.beginPath();
  ctx.arc(cx, bottomY - h - 10, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrostingDrips(ctx, x, y, w, dripsCount, color) {
  ctx.save();
  ctx.fillStyle = color;
  drawRoundedRect(ctx, x, y, w, 12, 6);
  ctx.fill();
  const step = w / dripsCount;
  for (let i = 0; i < dripsCount; i++) {
    const dx = x + step * (i + 0.5);
    const dh = i % 2 === 0 ? 11 : 7;
    ctx.beginPath();
    ctx.arc(dx, y + 9, step * 0.36, 0, Math.PI);
    ctx.ellipse(dx, y + 8, step * 0.32, dh, 0, 0, Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

export function QrCakeHeartCard() {
  const canvasRef = useRef(null);
  const [card3dOpen, setCard3dOpen] = useState(false);
  const [tilt, setTilt] = useState({ rx: 8, ry: -10 });
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const defaultPayload = () => {
    if (CONFIG.qr && CONFIG.qr.url) return CONFIG.qr.url;
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return window.location.href;
    }
    return (
      (CONFIG.qr && CONFIG.qr.secretMessage) ||
      `Happy Birthday, ${CONFIG.name}! 🎂💖 Made with love by ${CONFIG.from}`
    );
  };

  const [qrPayload, setQrPayload] = useState(defaultPayload);

  const renderArtisticQr = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = (qrPayload || defaultPayload()).trim();

    let qr;
    try {
      qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
    } catch (_) {
      qr = QRCode.create('Happy Birthday, Sam!', { errorCorrectionLevel: 'H' });
    }

    const N = qr.modules.size;
    const data = qr.modules.data;
    const isDark = (r, c) => r >= 0 && r < N && c >= 0 && c < N && Boolean(data[r * N + c]);
    const isFinder = (r, c) =>
      (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);

    const W = 520;
    const H = 560;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Soft pastel cream background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#FFFDFB');
    bg.addColorStop(1, '#FFF3F8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const DARK = '#331528'; // Deep espresso-berry (high contrast for instant camera scan)
    const ROSE = '#E55B8A';
    const LILAC = '#9D71E8';
    const GOLD = '#D99338';

    // Core QR layout box (centered with generous quiet zone)
    const qrBoxSize = 256;
    const cell = qrBoxSize / N;
    const qrX = (W - qrBoxSize) / 2;
    const qrY = 198;
    const quietPad = Math.max(cell * 3.2, 22);

    // === BIRTHDAY CAKE + HEART QR SILHOUETTE ===
    const cCx = W / 2;

    // Crowned with a glowing Pastel Heart + 2 Candles on top of the cake
    drawCandle(ctx, cCx - 58, 128, 12, 38);
    drawCandle(ctx, cCx + 58, 128, 12, 38);
    drawMiniHeart(ctx, cCx, 88, 38, '#FF7AA8');
    drawMiniHeart(ctx, cCx, 88, 26, '#FFE8F2');
    drawMiniHeart(ctx, cCx, 88, 15, ROSE);

    // Top Cake Tier (above the QR matrix)
    const topTierW = 240;
    const topTierH = 54;
    const topTierX = cCx - topTierW / 2;
    const topTierY = 124;
    ctx.fillStyle = '#FFD2E4';
    drawRoundedRect(ctx, topTierX, topTierY, topTierW, topTierH, 12);
    ctx.fill();
    ctx.strokeStyle = '#F28AB2';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawFrostingDrips(ctx, topTierX - 2, topTierY, topTierW + 4, 9, '#FFFDFB');

    // Decorative heart sprinkles along top tier
    for (let sx = topTierX + 24; sx < topTierX + topTierW - 18; sx += 28) {
      drawMiniHeart(ctx, sx, topTierY + 36, 5.5, sx % 56 === 0 ? LILAC : ROSE);
    }

    // Middle Cake Tier (houses the QR matrix + decorative mosaic side wings)
    const midTierW = 396;
    const midTierH = qrBoxSize + quietPad * 2 + 24;
    const midTierX = cCx - midTierW / 2;
    const midTierY = qrY - quietPad - 12;

    const tierGrd = ctx.createLinearGradient(midTierX, midTierY, midTierX + midTierW, midTierY);
    tierGrd.addColorStop(0, '#F7DDF8');
    tierGrd.addColorStop(0.5, '#FFF5F9');
    tierGrd.addColorStop(1, '#F7DDF8');
    ctx.fillStyle = tierGrd;
    drawRoundedRect(ctx, midTierX, midTierY, midTierW, midTierH, 18);
    ctx.fill();
    ctx.strokeStyle = '#D99CE8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Side cake mosaic columns (outside the QR quiet-zone so scanner never confuses them)
    const step = cell;
    for (let py = midTierY + 24; py < midTierY + midTierH - 14; py += step) {
      for (let px = midTierX + 14; px < midTierX + midTierW - 10; px += step) {
        if (
          px >= qrX - quietPad - 6 &&
          px <= qrX + qrBoxSize + quietPad + 6
        ) {
          continue;
        }
        const hash = Math.abs(Math.sin(px * 19.19 + py * 47.77) * 9182.3) % 1;
        if (hash > 0.35) {
          drawMiniHeart(
            ctx,
            px,
            py,
            step * 0.42,
            hash > 0.68 ? ROSE : hash > 0.48 ? LILAC : GOLD
          );
        }
      }
    }

    // Clean white-cream QR quiet-zone frame inside the middle cake tier
    ctx.fillStyle = '#FFFDFB';
    drawRoundedRect(
      ctx,
      qrX - quietPad,
      qrY - quietPad,
      qrBoxSize + quietPad * 2,
      qrBoxSize + quietPad * 2,
      14
    );
    ctx.fill();

    // Frosting drips along top of middle tier
    drawFrostingDrips(ctx, midTierX - 3, midTierY - 2, midTierW + 6, 14, '#FFFDFB');

    // Bottom Cake Base & Porcelain Pedestal Plate
    const botTierW = 446;
    const botTierH = 34;
    const botTierX = cCx - botTierW / 2;
    const botTierY = midTierY + midTierH - 4;
    ctx.fillStyle = '#FFC4DC';
    drawRoundedRect(ctx, botTierX, botTierY, botTierW, botTierH, 12);
    ctx.fill();
    ctx.strokeStyle = '#E87A9F';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Golden satin ribbon on bottom tier
    ctx.fillStyle = '#F7D288';
    ctx.fillRect(botTierX + 4, botTierY + 13, botTierW - 8, 8);

    // Porcelain plate
    ctx.fillStyle = '#F3E4EE';
    ctx.beginPath();
    ctx.ellipse(cCx, botTierY + botTierH + 6, 240, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // === RENDER REAL SCANNABLE QR MATRIX ===
    // Center emblem exclusion zone (~11% radius, well within Level H 30% tolerance for all URL lengths)
    const centerR = Math.min(N * 0.118, 5.2);
    const centerC = (N - 1) / 2;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (isFinder(r, c)) continue;
        const dr = r - centerC;
        const dc = c - centerC;
        if (Math.sqrt(dr * dr + dc * dc) < centerR) continue;

        if (isDark(r, c)) {
          const cx = qrX + (c + 0.5) * cell;
          const cy = qrY + (r + 0.5) * cell;

          // Draw dark solid core + mini-heart silhouette so both human eye & camera scanner love it
          ctx.fillStyle = DARK;
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.45, 0, Math.PI * 2);
          ctx.fill();
          drawMiniHeart(ctx, cx, cy, cell * 0.48, DARK);
        }
      }
    }

    // Draw the 3 Finder Patterns (using deep berry-plum heart accents so 1:1:3:1:1 ratio is 100% preserved)
    drawFinderEye(ctx, qrX, qrY, cell, DARK, '#5A1838');
    drawFinderEye(ctx, qrX + (N - 7) * cell, qrY, cell, DARK, '#4B1D52');
    drawFinderEye(ctx, qrX, qrY + (N - 7) * cell, cell, DARK, '#5A1838');

    // Draw Center Emblem (Heart + Cake badge)
    const badgeX = qrX + qrBoxSize / 2;
    const badgeY = qrY + qrBoxSize / 2;
    const badgeRad = cell * centerR * 1.05;

    ctx.fillStyle = '#FFFDFB';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRad + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ROSE;
    ctx.lineWidth = 2;
    ctx.stroke();

    drawMiniHeart(ctx, badgeX, badgeY + 1, badgeRad * 0.78, '#FF85B3');
    ctx.font = `700 ${Math.round(badgeRad * 0.95)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎂', badgeX, badgeY + 1);

    // Footer caption on the QR card canvas
    ctx.fillStyle = '#5B3249';
    ctx.font = '700 16px Quicksand, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Happy Birthday, ${CONFIG.name}!`, W / 2, H - 14);
  }, [qrPayload]);

  useEffect(() => {
    renderArtisticQr();
  }, [renderArtisticQr]);

  const handleDownloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    vibrate(15);
    const link = document.createElement('a');
    link.download = 'qr-cake-heart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCardPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setTilt({
      rx: Math.max(-18, Math.min(18, -ny * 26)),
      ry: Math.max(-22, Math.min(22, nx * 32)),
    });
  };

  const handleCardPointerLeave = () => {
    setTilt({ rx: 8, ry: -10 });
  };

  const handleTriggerSurprise = () => {
    vibrate([20, 40, 20]);
    music.sparkle();
    setSurpriseOpen(true);
    fireConfetti({
      particleCount: 80,
      spread: 80,
      origin: { x: 0.5, y: 0.55 },
    });
  };

  return (
    <article className="card glass qr-cake-card" style={{ '--i': 4 }}>
      <span className="washi-tape washi-rose" aria-hidden="true" />
      <span className="card-sticker" aria-hidden="true">
        🎂 CARD &amp; QR
      </span>
      <p className="card-eyebrow">Interactive Keepsake</p>
      <h3 className="card-title">
        Birthday Cake Card &amp; Scannable QR <span className="emoji">🎂💖</span>
      </h3>

      <div className="qr-cake-layout">
        {/* Left: Interactive Pop-Up Birthday Gift Card Cake */}
        <div className="popup-gift-col">
          <div
            id="giftCard3D"
            className={`gift-card-3d-stage ${card3dOpen ? 'is-open' : 'is-closed'}`}
            onPointerMove={handleCardPointerMove}
            onPointerLeave={handleCardPointerLeave}
            onClick={() => {
              vibrate(12);
              setCard3dOpen((prev) => !prev);
            }}
            role="button"
            tabIndex={0}
            aria-pressed={card3dOpen}
            aria-label="Interactive Birthday Cake Card. Tap to open or close."
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCard3dOpen((prev) => !prev);
              }
            }}
            style={{
              '--rx': `${tilt.rx}deg`,
              '--ry': `${tilt.ry}deg`,
            }}
          >
            <div className="gift-card-3d-pivot">
              {/* Upright Back Cover of Pop-Up Card */}
              <div className="gift-card-back">
                <div className="gift-card-bunting" aria-hidden="true">
                  <span>H</span>
                  <span>B</span>
                  <span>D</span>
                  <span>✦</span>
                </div>
                <div className="gift-card-arch" aria-hidden="true" />
                <span className="pop-float pop-h1" aria-hidden="true">💖</span>
                <span className="pop-float pop-h2" aria-hidden="true">✨</span>
                <span className="pop-float pop-h3" aria-hidden="true">🌸</span>
                <p className="gift-card-back-title">
                  Happy Birthday, {CONFIG.name}!
                </p>
                {CONFIG.fullName && (
                  <p className="gift-card-back-sub">{CONFIG.fullName}</p>
                )}
              </div>

              {/* Hinged Horizontal Floor with Pop-Up Multi-Tier Cake */}
              <div className="gift-card-floor">
                <div className="floor-crease" aria-hidden="true" />

                <div className="cake-3d-model" aria-hidden="true">
                  <div className="cake-3d-topper">
                    <span>{CONFIG.name} ✨</span>
                  </div>
                  <div className="cake-3d-tier-top">
                    <div className="cake-3d-cap-top" />
                    <div className="cake-3d-candle">
                      <span className="cake-3d-flame" />
                    </div>
                  </div>
                  <div className="cake-3d-tier-mid">
                    <div className="cake-3d-cap-mid" />
                    <div className="cake-3d-berries">
                      <i /><i /><i /><i /><i />
                    </div>
                  </div>
                  <div className="cake-3d-tier-bottom">
                    <div className="cake-3d-cap-bottom" />
                    <div className="cake-3d-ribbon" />
                  </div>
                  <div className="cake-3d-plate" />
                </div>

                <p className="floor-caption">
                  {card3dOpen
                    ? '✦ Pop-Up Birthday Edition · Tap to Close ✦'
                    : '✦ Tap to Open Your Birthday Card ✦'}
                </p>
              </div>
            </div>
          </div>

          <div className="gift-card-controls">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                vibrate(10);
                setCard3dOpen((prev) => !prev);
              }}
            >
              {card3dOpen ? '📖 Fold Card' : '🎂 Open Card'}
            </button>
            <button
              type="button"
              id="previewScanBtn"
              className="btn-ghost"
              onClick={handleTriggerSurprise}
            >
              ✨ Open Scan Surprise
            </button>
          </div>
        </div>

        {/* Right: Scannable Birthday Cake + Heart QR Code */}
        <div className="qr-col">
          <div className="qr-canvas-frame">
            <canvas
              id="birthdayQrCanvas"
              ref={canvasRef}
              className="qr-canvas"
              aria-label={`Scannable Birthday Cake and Heart QR code for ${CONFIG.name}`}
            />
          </div>

          <p className="qr-hint">
            Point your phone camera at the cake &amp; heart QR to scan! 📱✨
          </p>

          <div className="qr-actions">
            <button
              type="button"
              id="downloadQrBtn"
              className="btn-ghost"
              onClick={handleDownloadQr}
            >
              ⬇️ Save QR Image
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setCustomizerOpen((prev) => !prev)}
            >
              🔗 {customizerOpen ? 'Hide Link Setup' : 'Customize QR'}
            </button>
          </div>

          {customizerOpen && (
            <div className="qr-customizer">
              <label htmlFor="qrPayloadInput" className="qr-customizer-label">
                QR Code Destination (URL or Secret Birthday Note):
              </label>
              <input
                id="qrPayloadInput"
                type="text"
                className="qr-customizer-input"
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
                placeholder="Paste website URL, Spotify/TikTok link, or secret note..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Secret Scan Surprise Modal */}
      {surpriseOpen && (
        <div
          id="qrSurpriseModal"
          className="modal is-open"
          role="dialog"
          aria-modal="true"
          aria-label="Secret Birthday Surprise"
        >
          <div
            className="modal-backdrop"
            onClick={() => setSurpriseOpen(false)}
          />
          <div className="modal-card glass qr-surprise-card">
            <button
              type="button"
              className="modal-close"
              aria-label="Close surprise"
              onClick={() => setSurpriseOpen(false)}
            >
              ×
            </button>
            <span className="washi-tape washi-blush" aria-hidden="true" />
            <p className="card-eyebrow">QR Secret Unlocked 🎂💖</p>
            <h3 className="card-title">
              Happy Birthday, {CONFIG.name}! <span className="emoji">🎀</span>
            </h3>
            <p className="liner-text">
              {(CONFIG.qr && CONFIG.qr.secretMessage) || qrPayload}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
