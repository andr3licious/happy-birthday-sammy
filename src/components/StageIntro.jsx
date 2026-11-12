import React, { useRef, useState } from 'react';
import { music } from '../utils/audio';
import { vibrate } from '../utils/haptics';

export function StageIntro({ status, onOpen }) {
  const btnRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 6, ry: -8 });
  const [untying, setUntying] = useState(false);

  const handleClick = () => {
    if (untying) return;
    setUntying(true);
    vibrate([15, 30, 15]);
    music.waxPop();
    const r = btnRef.current ? btnRef.current.getBoundingClientRect() : null;
    setTimeout(() => {
      onOpen(r);
    }, 240);
  };

  const handlePointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setTilt({
      rx: Math.max(-14, Math.min(16, 4 - ny * 22)),
      ry: Math.max(-18, Math.min(18, -4 + nx * 26)),
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 6, ry: -8 });
  };

  return (
    <section
      id="stage-intro"
      className={`stage stage-intro ${status === 'active' ? 'is-active' : ''} ${
        status === 'leaving' ? 'is-leaving' : ''
      }`}
      aria-label="Birthday Card Cover"
    >
      <div
        className="closed-card-3d-scene"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          '--cover-rx': `${tilt.rx}deg`,
          '--cover-ry': `${tilt.ry}deg`,
        }}
      >
        <div
          className={`intro-card glass closed-card-book ${
            untying ? 'is-untying' : ''
          }`}
        >
          {/* 3D Book Spine & Layered Pages Edge */}
          <span className="cover-spine" aria-hidden="true" />
          <span className="cover-pages-edge" aria-hidden="true" />

          {/* Gold-Foil Filigree Corners */}
          <span className="foil-corner foil-tl" aria-hidden="true" />
          <span className="foil-corner foil-tr" aria-hidden="true" />
          <span className="foil-corner foil-bl" aria-hidden="true" />
          <span className="foil-corner foil-br" aria-hidden="true" />

          {/* Satin Ribbon Wrap (unties when opening) */}
          <div className="cover-ribbon-wrap" aria-hidden="true">
            <span className="satin-ribbon-h" />
            <span className="satin-ribbon-v" />
          </div>

          <span className="washi-tape washi-blush" aria-hidden="true" />
          <span className="scrap-stamp" aria-hidden="true">
            <span>SPECIAL DELIVERY</span>
            <strong>FOR SAM ✦</strong>
          </span>

          {/* Embossed 3D Mini Cake, Satin Bow & Rose-Gold "S" Wax Seal */}
          <div className="cover-crest-group">
            <div className="cover-cake-emblem" aria-hidden="true">
              <span className="cover-bow">🎀</span>
              <span className="cover-cake-icon">🎂</span>
            </div>
            <button
              type="button"
              className="wax-seal-badge"
              onClick={handleClick}
              aria-label="Break wax seal and open birthday card"
              title="Tap to break wax seal"
            >
              <span className="wax-seal-ring">
                <span className="wax-seal-monogram">S</span>
                <span className="wax-seal-heart">♥</span>
              </span>
            </button>
          </div>

          <p className="card-eyebrow">Birthday Edition · Pop-Up Card</p>
          <h1 className="intro-title">
            Someone special has a birthday today... <span className="emoji">✨</span>
          </h1>
          <p className="intro-sub">
            A handmade pop-up birthday card, made just for you.
          </p>

          <button
            id="openBtn"
            ref={btnRef}
            className="btn-glow"
            type="button"
            onClick={handleClick}
          >
            Open Birthday Card <span className="emoji">💌</span>
          </button>

          <p className="intro-hint">
            🎧 Sound on · Tap seal or button to untie &amp; unfold
          </p>
        </div>
      </div>
    </section>
  );
}
