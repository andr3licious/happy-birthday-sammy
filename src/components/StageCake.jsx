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
  const [micStarting, setMicStarting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState('');

  const candleBtnRef = useRef(null);
  const continueBtnRef = useRef(null);
  const blowingRef = useRef(blown);
  const promptTimerRef = useRef(null);
  const continueTimerRef = useRef(null);
  const micStreamRef = useRef(null);
  const micCtxRef = useRef(null);
  const micSourceRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micSilentGainRef = useRef(null);
  const micRafRef = useRef(0);
  const blowFramesRef = useRef(0);
  const handleBlowOutRef = useRef(null);
  const mountedRef = useRef(true);
  const micRequestIdRef = useRef(0);
  const micStartingRef = useRef(false);
  const wasMusicPlayingRef = useRef(false);
  const micRetryCountRef = useRef(0);

  const micSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const stopMic = useCallback((options = {}) => {
    const { restoreMusic = true } =
      options && typeof options === 'object' && 'restoreMusic' in options
        ? options
        : {};
    micRequestIdRef.current += 1;
    if (micRafRef.current) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = 0;
    }
    try {
      if (micSourceRef.current) micSourceRef.current.disconnect();
    } catch (_) {
      /* ignore */
    }
    micSourceRef.current = null;
    try {
      if (micAnalyserRef.current) micAnalyserRef.current.disconnect();
    } catch (_) {
      /* ignore */
    }
    micAnalyserRef.current = null;
    try {
      if (micSilentGainRef.current) micSilentGainRef.current.disconnect();
    } catch (_) {
      /* ignore */
    }
    micSilentGainRef.current = null;
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
    try {
      if (typeof navigator !== 'undefined' && 'audioSession' in navigator && navigator.audioSession) {
        navigator.audioSession.type = 'playback';
      }
    } catch (_) {
      /* ignore */
    }
    blowFramesRef.current = 0;
    micStartingRef.current = false;
    setMicStarting(false);
    setMicListening(false);
    setMicLevel(0);
    if (restoreMusic && wasMusicPlayingRef.current) {
      wasMusicPlayingRef.current = false;
      music.play();
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      wasMusicPlayingRef.current = false;
      stopMic({ restoreMusic: false });
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
    if (blown || blowingRef.current || micStartingRef.current || !micSupported) return;
    micStartingRef.current = true;
    setMicStarting(true);
    setMicError('');
    micRetryCountRef.current = 0;
    const reqId = ++micRequestIdRef.current;

    // Pause background audio and unlock AudioContext synchronously during the tap gesture
    // before awaiting OS microphone permissions (prevents Android/iOS first-try silent streams).
    wasMusicPlayingRef.current = music.playing;
    if (music.playing) {
      music.pause();
    }
    try {
      if (typeof navigator !== 'undefined' && 'audioSession' in navigator && navigator.audioSession) {
        navigator.audioSession.type = 'play-and-record';
      }
    } catch (_) {
      /* ignore */
    }

    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    try {
      if (!AC) throw new Error('AudioContext unsupported');
      ctx = new AC();
      micCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const acquireStream = async () => {
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });
        } catch (err) {
          const name = err && err.name;
          if (
            name === 'NotAllowedError' ||
            name === 'PermissionDeniedError' ||
            name === 'NotFoundError' ||
            name === 'DevicesNotFoundError' ||
            name === 'SecurityError'
          ) {
            throw err;
          }
          return navigator.mediaDevices.getUserMedia({ audio: true });
        }
      };

      const connectStream = async (stream) => {
        if (!mountedRef.current || blowingRef.current || blown || reqId !== micRequestIdRef.current) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (_) {
              /* ignore */
            }
          });
          return false;
        }
        micStreamRef.current = stream;

        if (ctx.state !== 'running') {
          await ctx.resume().catch(() => {});
        }
        if (!mountedRef.current || blowingRef.current || blown || reqId !== micRequestIdRef.current) {
          return false;
        }

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.25;
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;

        // Routing through a zero-gain node to destination keeps Chromium/Safari audio pull active.
        source.connect(analyser);
        analyser.connect(silentGain);
        silentGain.connect(ctx.destination);

        micSourceRef.current = source;
        micAnalyserRef.current = analyser;
        micSilentGainRef.current = silentGain;
        return true;
      };

      const stream = await acquireStream();
      const connected = await connectStream(stream);
      if (!connected) {
        stopMic({ restoreMusic: true });
        return;
      }

      let activeAnalyser = micAnalyserRef.current;
      let floatBuf = new Float32Array(activeAnalyser.fftSize);
      let byteBuf = new Uint8Array(activeAnalyser.fftSize);
      let sawSignal = false;
      let startedAt = performance.now();
      let lastResumeAttempt = 0;
      let ambientRms = 0;
      let ambientFrames = 0;
      let recovering = false;

      blowFramesRef.current = 0;
      micStartingRef.current = false;
      setMicStarting(false);
      setMicListening(true);

      const monitor = () => {
        if ((!micStreamRef.current && !recovering) || !mountedRef.current || reqId !== micRequestIdRef.current) return;
        if (recovering) {
          micRafRef.current = requestAnimationFrame(monitor);
          return;
        }

        const now = performance.now();
        if (ctx.state === 'suspended' && now - lastResumeAttempt > 250) {
          lastResumeAttempt = now;
          ctx.resume().catch(() => {});
        }

        const curAnalyser = micAnalyserRef.current;
        if (!curAnalyser) return;
        if (curAnalyser !== activeAnalyser) {
          activeAnalyser = curAnalyser;
          floatBuf = new Float32Array(activeAnalyser.fftSize);
          byteBuf = new Uint8Array(activeAnalyser.fftSize);
        }

        let meanSq = 0;
        let peak = 0;
        if (typeof activeAnalyser.getFloatTimeDomainData === 'function') {
          activeAnalyser.getFloatTimeDomainData(floatBuf);
          for (let i = 0; i < floatBuf.length; i++) {
            const v = floatBuf[i];
            const a = Math.abs(v);
            if (a > peak) peak = a;
            meanSq += v * v;
          }
          meanSq /= floatBuf.length;
        } else {
          activeAnalyser.getByteTimeDomainData(byteBuf);
          for (let i = 0; i < byteBuf.length; i++) {
            const v = (byteBuf[i] - 128) / 128;
            const a = Math.abs(v);
            if (a > peak) peak = a;
            meanSq += v * v;
          }
          meanSq /= byteBuf.length;
        }
        const rms = Math.sqrt(meanSq);

        if (peak > 0.0003) {
          sawSignal = true;
        } else if (!sawSignal && now - startedAt > 900 && micRetryCountRef.current < 1) {
          // Some mobile browsers yield an all-zero buffer on the very first permission grant;
          // re-acquiring once now that permission is granted recovers without a page reload.
          micRetryCountRef.current += 1;
          recovering = true;
          try {
            if (micSourceRef.current) micSourceRef.current.disconnect();
            if (micAnalyserRef.current) micAnalyserRef.current.disconnect();
            if (micSilentGainRef.current) micSilentGainRef.current.disconnect();
          } catch (_) {
            /* ignore */
          }
          micSourceRef.current = null;
          micAnalyserRef.current = null;
          micSilentGainRef.current = null;
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
          acquireStream()
            .then((freshStream) => connectStream(freshStream))
            .then((ok) => {
              if (!ok || reqId !== micRequestIdRef.current) {
                stopMic({ restoreMusic: true });
                return;
              }
              startedAt = performance.now();
              ambientFrames = 0;
              ambientRms = 0;
              recovering = false;
            })
            .catch(() => {
              recovering = false;
              const isCurrent = mountedRef.current && reqId === micRequestIdRef.current;
              stopMic({ restoreMusic: true });
              if (isCurrent) {
                setMicError('Mic unavailable — just tap the candle 🕯️');
              }
            });
          micRafRef.current = requestAnimationFrame(monitor);
          return;
        }

        setMicLevel(Math.min(1, rms * 7.5));

        if (ambientFrames < 12) {
          ambientFrames += 1;
          ambientRms = ambientFrames === 1 ? rms : ambientRms * 0.8 + rms * 0.2;
        }
        const threshold = Math.max(0.085, ambientRms * 2.5 + 0.035);
        if (rms > threshold || rms > 0.12) {
          blowFramesRef.current += 1;
        } else {
          blowFramesRef.current = Math.max(0, blowFramesRef.current - 1);
        }

        if (blowFramesRef.current >= 8) {
          stopMic({ restoreMusic: true });
          if (handleBlowOutRef.current) handleBlowOutRef.current();
          return;
        }

        micRafRef.current = requestAnimationFrame(monitor);
      };

      micRafRef.current = requestAnimationFrame(monitor);
    } catch (_) {
      const isCurrent = mountedRef.current && reqId === micRequestIdRef.current;
      stopMic({ restoreMusic: true });
      if (isCurrent) {
        setMicError('Mic unavailable — just tap the candle 🕯️');
      }
    }
  };

  const handleRelight = () => {
    stopMic({ restoreMusic: false });
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
                disabled={micStarting}
                onClick={startMic}
              >
                {micStarting ? '🎤 Starting mic...' : '🎤 Or blow using your mic'}
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
                  onClick={() => stopMic({ restoreMusic: true })}
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
