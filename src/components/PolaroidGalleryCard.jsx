import React, { useState } from 'react';
import { CONFIG } from '../config';
import { vibrate, usePointerTap } from '../utils/haptics';

const DEFAULT_TILTS = ['-4deg', '3deg', '-2.5deg', '4.5deg', '-3deg', '2deg'];
const DEFAULT_PINS = ['#ff7fb5', '#b18cff', '#f6c75e', '#7fd4ff'];

function PolaroidItem({ memory, index }) {
  const [flipped, setFlipped] = useState(false);
  const [missing, setMissing] = useState(false);

  const tilt = memory.tilt || DEFAULT_TILTS[index % DEFAULT_TILTS.length];
  const pin = memory.pin || DEFAULT_PINS[index % DEFAULT_PINS.length];

  const tapProps = usePointerTap(() => {
    setFlipped((prev) => {
      const next = !prev;
      if (next) vibrate(10);
      return next;
    });
  });

  return (
    <button
      type="button"
      className={`polaroid ${flipped ? 'is-flipped' : ''}`}
      style={{ '--tilt': tilt, '--pin': pin }}
      aria-pressed={flipped}
      aria-label={`Memory ${index + 1}: ${memory.caption}. Tap to flip.`}
      {...tapProps}
    >
      <span className="polaroid-tape" aria-hidden="true" />
      <span className="polaroid-inner">
        <span className="polaroid-face polaroid-front">
          <span className={`polaroid-photo ${missing ? 'is-missing' : ''}`}>
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
          <small>{memory.date || ''}</small>
        </span>
      </span>
    </button>
  );
}

export function PolaroidGalleryCard() {
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
          <PolaroidItem key={memory.id || index} memory={memory} index={index} />
        ))}
      </div>
      <p className="gallery-hint">Tap a photo to flip it over</p>
    </article>
  );
}
