import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CONFIG } from '../config';
import { music } from '../utils/audio';
import { celebrateBirthday } from '../utils/confetti';
import { vibrate, usePointerTap } from '../utils/haptics';

const PROMPT_LIT = 'Make a wish and tap the candle on your card to blow it out 🕯️';
const PROMPT_OUT = 'Your wish is on its way to the stars ✨';

export function StageCake({ status, blown = false, onBlowOut, onRelight, onContinue }) {
  const [swappingPrompt, setSwappingPrompt] = useState(false);
  const [promptText, setPromptText] = useState(blown ? PROMPT_OUT : PROMPT_LIT);
  const [celebrating, setCelebrating] = useState(blown);
  const [showContinue, setShowContinue] = useState(blown);
  const [tilt, setTilt] = useState({ rx: 7, ry: 0 });
  const [micListening, setMicListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState('');

  const candleBtnRef = useRef(null);
  const continueBtnRef = useRef(null);
  const blowingRef = useRef(blown);
  const promptTimerRef = useRef(null);
  const continueTimerRef = useRef(null);
  const micStreamRef = useRef(null);
  const micCtxRef = useRef(null);
  const micRafRef = useRef(0);
  const blowFramesRef = useRef(0);
  const handleBlowOutRef = useRef(null);
  const mountedRef = useRef(true);
  const micRequestIdRef = useRef(0);

  const micSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const stopMic = useCallback(() => {
    micRequestIdRef.current += 1;
    if (micRafRef.current) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = 0;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {
          /* ignore */
        }
      });
      micStreamRef.current = null;
    }
    if (micCtxRef.current) {
      try {
        micCtxRef.current.close();
      } catch (_) {
        /* ignore */
      }
      micCtxRef.current = null;
    }
    blowFramesRef.current = 0;
    setMicListening(false);
    setMicLevel(0);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopMic();
      clearTimeout(promptTimerRef.current);
      clearTimeout(continueTimerRef.current);
    };
  }, [stopMic]);

  const handleBlowOut = useCallback(() => {
    if (blown || blowingRef.current) return;
    blowingRef.current = true;
    stopMic();
    setMicError('');
    if (onBlowOut) onBlowOut();
    music.whoosh();
    vibrate([25, 30, 25]);
    setSwappingPrompt(true);

    clearTimeout(promptTimerRef.current);
    clearTimeout(continueTimerRef.current);

    promptTimerRef.current = setTimeout(() => {
      setPromptText(PROMPT_OUT);
      setSwappingPrompt(false);
      music.chime();
      celebrateBirthday();
      setCelebrating(true);

      continueTimerRef.current = setTimeout(() => {
        setShowContinue(true);
        if (continueBtnRef.current) {
          continueBtnRef.current.focus({ preventScroll: true });
        }
      }, 1700);
    }, 450);
  }, [blown, onBlowOut, stopMic]);

  handleBlowOutRef.current = handleBlowOut;

  const startMic = async () => {
    if (blown || blowingRef.current || !micSupported) return;
    setMicError('');
    const reqId = ++micRequestIdRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current || blowingRef.current || blown || reqId !== micRequestIdRef.current) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (_) {
            /* ignore */
          }
        });
        return;
      }
      micStreamRef.current = stream;

      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      micCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      if (!mountedRef.current || blowingRef.current || reqId !== micRequestIdRef.current) {
        stopMic();
        return;
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      blowFramesRef.current = 0;
      setMicListening(true);

      const monitor = () => {
        if (!micStreamRef.current || !mountedRef.current) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setMicLevel(Math.min(1, rms * 5));

        if (rms > 0.13) {
          blowFramesRef.current += 1;
        } else {
          blowFramesRef.current = Math.max(0, blowFramesRef.current - 1);
        }

        if (blowFramesRef.current >= 10) {
          stopMic();
          if (handleBlowOutRef.current) handleBlowOutRef.current();
          return;
        }

        micRafRef.current = requestAnimationFrame(monitor);
      };

      micRafRef.current = requestAnimationFrame(monitor);
    } catch (_) {
      stopMic();
      if (mountedRef.current) {
        setMicError('Mic unavailable — just tap the candle 🕯️');
      }
    }
  };

  const handleRelight = () => {
    stopMic();
    clearTimeout(promptTimerRef.current);
    clearTimeout(continueTimerRef.current);
    blowingRef.current = false;
    setSwappingPrompt(false);
    setCelebrating(false);
    setShowContinue(false);
    setMicError('');
    setPromptText(PROMPT_LIT);
    vibrate(10);
    if (onRelight) onRelight();
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
        className={`cake-scene cake-card-3d-wrap ${
          micListening ? 'is-mic-listening' : ''
        }`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          '--card-rx': `${tilt.rx}deg`,
          '--card-ry': `${tilt.ry}deg`,
          '--flame-lean': `${(micLevel * 18).toFixed(1)}deg`,
          '--flame-scale': `${(1 - micLevel * 0.22).toFixed(2)}`,
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
            <div className="tier tier-top">
              <span className="tier-cap-3d" />
              <span className="frosting" />
              <span className="strawberries-row">
                <i /><i /><i /><i />
              </span>
            </div>
            <div className="cake-topper-3d">{CONFIG.name} 👑</div>
            <div className="tier tier-bottom">
              <span className="tier-cap-3d" />
              <span className="frosting" />
              <span className="ribbon" />
            </div>
            <div className="plate" />
          </div>
        </div>
      </div>

      {!blown && (micSupported || micError) && (
        <div className="mic-blow-wrap">
          {micSupported &&
            (!micListening ? (
              <button
                id="micBlowBtn"
                type="button"
                className="btn-ghost mic-blow-btn"
                onClick={startMic}
              >
                🎤 Or blow using your mic
              </button>
            ) : (
              <div className="mic-listening-pill" role="status" aria-live="polite">
                <span className="mic-meter" aria-hidden="true">
                  <span style={{ width: `${Math.round(micLevel * 100)}%` }} />
                </span>
                <span>Blow toward your mic...</span>
                <button
                  type="button"
                  className="mic-cancel-btn"
                  onClick={stopMic}
                  aria-label="Cancel microphone"
                >
                  ✕
                </button>
              </div>
            ))}
          {micError && <p className="mic-error-hint">{micError}</p>}
        </div>
      )}

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
        <div className="cake-reveal-actions">
          <button
            id="continueBtn"
            ref={continueBtnRef}
            className="btn-glow continue-btn"
            type="button"
            {...continueTapProps}
          >
            Turn the Page <span className="emoji">✨</span>
          </button>
          <button
            id="relightBtn"
            type="button"
            className="btn-ghost relight-btn"
            onClick={handleRelight}
          >
            🕯️ Re-light
          </button>
        </div>
      </div>
    </section>
  );
}
