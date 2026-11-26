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
  const [micPending, setMicPending] = useState(false);

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
        const closing = micCtxRef.current.close();
        if (closing && closing.catch) closing.catch(() => {});
      } catch (_) {
        /* ignore */
      }
      micCtxRef.current = null;
    }
    blowFramesRef.current = 0;
    setMicPending(false);
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
    if (blown || blowingRef.current || !micSupported || micPending) return;
    setMicError('');
    setMicPending(true);
    const reqId = ++micRequestIdRef.current;

    // Create + resume the AudioContext synchronously inside the tap. If we
    // wait until after getUserMedia, the first-time permission prompt eats
    // the user gesture and mobile browsers leave the context suspended, so
    // the analyser only ever hears silence (it "works after a reload" because
    // the permission is remembered and no prompt interrupts the gesture).
    let ctx = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch (_) {
      ctx = null;
    }
    micCtxRef.current = ctx;

    const closeCtx = () => {
      if (!ctx) return;
      try {
        const closing = ctx.close();
        if (closing && closing.catch) closing.catch(() => {});
      } catch (_) {
        /* ignore */
      }
      if (micCtxRef.current === ctx) micCtxRef.current = null;
    };

    try {
      if (!ctx) throw new Error('AudioContext unavailable');
      let stream;
      try {
        // Phone noise suppression treats blowing as noise and filters it out.
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch (err) {
        if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) throw err;
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (!mountedRef.current || blowingRef.current || blown || reqId !== micRequestIdRef.current) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (_) {
            /* ignore */
          }
        });
        closeCtx();
        if (reqId === micRequestIdRef.current) setMicPending(false);
        return;
      }
      micStreamRef.current = stream;

      if (ctx.state !== 'running') {
        await ctx.resume().catch(() => {});
      }
      if (ctx.state !== 'running') {
        // Still blocked: the next tap anywhere on the page will start it.
        const kick = () => {
          if (micCtxRef.current === ctx && ctx.state !== 'closed') {
            ctx.resume().catch(() => {});
          }
        };
        document.addEventListener('pointerdown', kick, { once: true, capture: true });
        document.addEventListener('touchend', kick, { once: true, capture: true });
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
      setMicPending(false);
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
      if (reqId !== micRequestIdRef.current) {
        // Cancelled (or superseded) while the permission prompt was open.
        closeCtx();
        return;
      }
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
                disabled={micPending}
                aria-busy={micPending || undefined}
              >
                {micPending ? '🎤 Allow mic access…' : '🎤 Or blow using your mic'}
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
