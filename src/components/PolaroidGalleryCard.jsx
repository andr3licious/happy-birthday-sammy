import React, { useState } from 'react';
import { CONFIG } from '../config';
import { music } from '../utils/audio';
import { vibrate, usePointerTap } from '../utils/haptics';

const DEFAULT_TILTS = ['-4deg', '3deg', '-2.5deg', '4.5deg', '-3deg', '2deg'];
const DEFAULT_PINS = ['#ff7fb5', '#b18cff', '#f6c75e', '#7fd4ff'];

function PolaroidItem({ memory, index, onZoom }) {
  const [flipped, setFlipped] = useState(false);
  const [missing, setMissing] = useState(false);

  const tilt = memory.tilt || DEFAULT_TILTS[index % DEFAULT_TILTS.length];
  const pin = memory.pin || DEFAULT_PINS[index % DEFAULT_PINS.length];

  const tapProps = usePointerTap(() => {
    setFlipped((prev) => {
      const next = !prev;
      vibrate(10);
      music.pageTurn();
      return next;
    });
  });

  const handleZoomClick = (e) => {
    e.stopPropagation();
    vibrate(12);
    onZoom(index);
  };

  return (
    <div
      className={`polaroid-wrap ${flipped ? 'is-flipped' : ''}`}
      style={{ '--tilt': tilt, '--pin': pin }}
    >
      <button
        type="button"
        className={`polaroid ${flipped ? 'is-flipped' : ''}`}
        aria-pressed={flipped}
        aria-label={`Memory ${index + 1}: ${memory.caption}. Tap to flip.`}
        {...tapProps}
      >
        <span className="polaroid-tape" aria-hidden="true" />
        <span className="polaroid-inner">
          <span className="polaroid-face polaroid-front">
            <span className={`polaroid-photo ${missing ? 'is-missing' : ''}`}>
              {/* Metallic Gold Photo Corners */}
              <i className="photo-corner pc-tl" aria-hidden="true" />
              <i className="photo-corner pc-tr" aria-hidden="true" />
              <i className="photo-corner pc-bl" aria-hidden="true" />
              <i className="photo-corner pc-br" aria-hidden="true" />
              <img
                src={memory.src}
                alt=""
                decoding="async"
                draggable="false"
                onError={() => setMissing(true)}
              />
              <span className="photo-fallback" aria-hidden="true">
                📷
              </span>
            </span>
            <span className="polaroid-caption">{memory.caption}</span>
          </span>
          <span className="polaroid-face polaroid-back">
            <span className="back-text">{memory.back}</span>
            <span className="back-footer">
              <small>{memory.date || ''}</small>
              <span className="back-heart" aria-hidden="true">♥</span>
            </span>
          </span>
        </span>
      </button>

      {!flipped && (
        <button
          type="button"
          className="polaroid-zoom-btn"
          onClick={handleZoomClick}
          aria-label={`Enlarge photo: ${memory.caption}`}
          title="View larger"
        >
          🔍
        </button>
      )}
    </div>
  );
}

export function PolaroidGalleryCard() {
  const [zoomIdx, setZoomIdx] = useState(null);
  const [zoomFlipped, setZoomFlipped] = useState(false);

  const activeMemory = zoomIdx !== null ? CONFIG.memories[zoomIdx] : null;

  const handleOpenZoom = (idx) => {
    setZoomFlipped(false);
    setZoomIdx(idx);
  };

  const handleCloseZoom = () => {
    setZoomIdx(null);
    setZoomFlipped(false);
  };

  const handleStepZoom = (delta) => {
    if (zoomIdx === null) return;
    vibrate(10);
    music.pageTurn();
    setZoomFlipped(false);
    const total = CONFIG.memories.length;
    setZoomIdx((zoomIdx + delta + total) % total);
  };

  return (
    <article className="card glass gallery-card" style={{ '--i': 2 }}>
      <span className="washi-tape washi-lilac" aria-hidden="true" />
      <span className="card-sticker card-sticker-lilac" aria-hidden="true">
        ✿ KEEPSAKES
      </span>
      <p className="card-eyebrow">The Birthday Girl</p>
      <h3 className="card-title">
        A Few Favorites <span className="emoji">📸</span>
      </h3>
      <div id="gallery" className="gallery">
        {CONFIG.memories.map((memory, index) => (
          <PolaroidItem
            key={memory.id || index}
            memory={memory}
            index={index}
            onZoom={handleOpenZoom}
          />
        ))}
      </div>
      <p className="gallery-hint">
        Tap a photo to flip it over · Tap 🔍 to view close-up
      </p>

      {/* Close-Up Polaroid Lightbox Modal */}
      {activeMemory && (
        <div
          className="polaroid-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Close-up memory: ${activeMemory.caption}`}
          onClick={handleCloseZoom}
        >
          <div
            className="polaroid-lightbox-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close"
              onClick={handleCloseZoom}
              aria-label="Close photo view"
            >
              ✕
            </button>

            <div
              className={`lightbox-polaroid ${zoomFlipped ? 'is-flipped' : ''}`}
              onClick={() => {
                vibrate(10);
                music.pageTurn();
                setZoomFlipped((p) => !p);
              }}
            >
              {!zoomFlipped ? (
                <div className="lightbox-front">
                  <div className="lightbox-photo-wrap">
                    <i className="photo-corner pc-tl" aria-hidden="true" />
                    <i className="photo-corner pc-tr" aria-hidden="true" />
                    <i className="photo-corner pc-bl" aria-hidden="true" />
                    <i className="photo-corner pc-br" aria-hidden="true" />
                    <img src={activeMemory.src} alt={activeMemory.caption} />
                  </div>
                  <p className="lightbox-caption">{activeMemory.caption}</p>
                </div>
              ) : (
                <div className="lightbox-back">
                  <span className="back-stamp">✦ BIRTHDAY ARCHIVE · 2026 ✦</span>
                  <p className="lightbox-back-text">{activeMemory.back}</p>
                  <span className="lightbox-back-date">
                    {activeMemory.date} · For {CONFIG.name} 💖
                  </span>
                </div>
              )}
            </div>

            <div className="lightbox-controls">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => handleStepZoom(-1)}
              >
                ← Prev
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  vibrate(10);
                  music.pageTurn();
                  setZoomFlipped((p) => !p);
                }}
              >
                🔄 {zoomFlipped ? 'Show Photo' : 'Read Backside'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => handleStepZoom(1)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
