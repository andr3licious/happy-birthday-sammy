import React, { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { music } from '../utils/audio';
import { celebrateBirthday } from '../utils/confetti';
import { vibrate, usePointerTap } from '../utils/haptics';

export function StageCake({ status, onContinue }) {
  const [blown, setBlown] = useState(false);
  const [swappingPrompt, setSwappingPrompt] = useState(false);
  const [promptText, setPromptText] = useState(
    'Make a wish and tap the candle on your card to blow it out 🕯️'
  );
  const [celebrating, setCelebrating] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [tilt, setTilt] = useState({ rx: 7, ry: 0 });

  const candleBtnRef = useRef(null);
  const continueBtnRef = useRef(null);

  useEffect(() => {
    if (status === 'active' && candleBtnRef.current) {
      candleBtnRef.current.focus({ preventScroll: true });
    }
  }, [status]);

  const handleBlowOut = () => {
    if (blown) return;
    setBlown(true);
    music.whoosh();
    vibrate([25, 30, 25]);
    setSwappingPrompt(true);

    setTimeout(() => {
      setPromptText('Your wish is on its way to the stars ✨');
      setSwappingPrompt(false);
      music.chime();
      celebrateBirthday();
      setCelebrating(true);

      setTimeout(() => {
        setShowContinue(true);
        if (continueBtnRef.current) {
          continueBtnRef.current.focus({ preventScroll: true });
        }
      }, 1700);
    }, 450);
  };

  const handlePointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setTilt({
      rx: Math.max(-14, Math.min(16, 7 - ny * 22)),
      ry: Math.max(-20, Math.min(20, nx * 28)),
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 7, ry: 0 });
  };

  const candleTapProps = usePointerTap(handleBlowOut);
  const continueTapProps = usePointerTap(() => {
    if (blown) onContinue();
  });

  return (
    <section
      id="stage-cake"
      className={[
        'stage',
        'stage-cake',
        status === 'active' ? 'is-active' : '',
        status === 'leaving' ? 'is-leaving' : '',
        blown ? 'is-out' : '',
        celebrating ? 'is-celebrating' : '',
        showContinue ? 'show-continue' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Birthday Cake Gift Card"
    >
      <p id="cakePrompt" className={`cake-prompt ${swappingPrompt ? 'is-swapping' : ''}`}>
        {promptText}
      </p>

      {/* Interactive 3D Pop-Up Birthday Gift Card Stage */}
      <div
        id="cakeScene"
        className="cake-scene cake-card-3d-wrap"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          '--card-rx': `${tilt.rx}deg`,
          '--card-ry': `${tilt.ry}deg`,
        }}
      >
        <div className="cake-card-3d">
          {/* 3D Upright Pop-Up Card Back Panel */}
          <div className="cake-card-back" aria-hidden="true">
            <span className="washi-tape washi-blush" />
            <div className="cake-card-bunting">
              <span>H</span>
              <span>B</span>
              <span>D</span>
              <span>🎀</span>
            </div>
            <div className="cake-card-arch" />
            <span className="cake-pop-heart h-left">💖</span>
            <span className="cake-pop-heart h-right">🌸</span>
          </div>

          {/* 3D Pop-Up Card Base Floor */}
          <div className="cake-card-base" aria-hidden="true" />

          <div className="cake-glow" aria-hidden="true" />

          <button
            id="candleBtn"
            ref={candleBtnRef}
            className="candle-btn"
            type="button"
            disabled={blown}
            aria-label={blown ? 'Candle blown out' : 'Blow out the candle'}
            {...candleTapProps}
          >
            <span className="flame-wrap" aria-hidden="true">
              <span className="flame-halo" />
              <span className="flame" />
              <span className="smoke">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
            <span className="wick" aria-hidden="true" />
            <span className="candle" aria-hidden="true" />
          </button>

          <div className="cake cake-is-3d" aria-hidden="true">
            <div className="cake-topper-3d">{CONFIG.name} 👑</div>
            <div className="tier tier-top">
              <span className="tier-cap-3d" />
              <span className="frosting" />
              <span className="strawberries-row">
                <i /><i /><i /><i />
              </span>
            </div>
            <div className="tier tier-bottom">
              <span className="tier-cap-3d" />
              <span className="frosting" />
              <span className="ribbon" />
            </div>
            <div className="plate" />
          </div>
        </div>
      </div>

      <div className="cake-reveal">
        <h1 id="bdayTitle" className="bday-title">
          <span className="grad">
            Happy Birthday, <span data-fill="name">{CONFIG.name}</span>!
          </span>{' '}
          <span className="emoji">🎉</span>
        </h1>
        {CONFIG.fullName && (
          <p id="fullName" className="full-name" data-fill="fullName">
            {CONFIG.fullName}
          </p>
        )}
        <button
          id="continueBtn"
          ref={continueBtnRef}
          className="btn-glow continue-btn"
          type="button"
          {...continueTapProps}
        >
          Turn the Page <span className="emoji">✨</span>
        </button>
      </div>
    </section>
  );
}
