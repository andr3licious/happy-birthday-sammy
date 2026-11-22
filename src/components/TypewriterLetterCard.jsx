import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CONFIG } from '../config';
import { isReducedMotion } from '../utils/confetti';
import { usePointerTap } from '../utils/haptics';

export function TypewriterLetterCard({ active, done: persistedDone = false, onDone }) {
  const fullText = useMemo(
    () => CONFIG.letter.replace('{from}', CONFIG.from).trim(),
    []
  );
  const chars = useMemo(() => Array.from(fullText), [fullText]);

  const [typedCount, setTypedCount] = useState(persistedDone ? chars.length : 0);
  const [started, setStarted] = useState(persistedDone);
  const [done, setDone] = useState(persistedDone);

  const cardRef = useRef(null);
  const bodyRef = useRef(null);
  const typedRef = useRef(null);
  const caretRef = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Start typing immediately when Spread 3 is active (avoids IntersectionObserver stalls inside 3D transforms)
  useEffect(() => {
    if (active && !started) {
      setStarted(true);
    }
  }, [active, started]);

  // Wall-clock requestAnimationFrame typewriter (~26 chars/sec cozy read-along cadence, zero timer drift)
  useEffect(() => {
    if (!started || done) return undefined;
    if (isReducedMotion()) {
      setTypedCount(chars.length);
      setDone(true);
      if (onDoneRef.current) onDoneRef.current();
      return undefined;
    }

    let rafId = 0;
    let idx = 0;
    let lastTime = performance.now();
    let budget = 1; // reveal first character immediately on mount
    let pauseUntil = 0;

    const tick = (now) => {
      const dt = Math.min(120, Math.max(0, now - lastTime));
      lastTime = now;

      if (now >= pauseUntil) {
        budget += dt * 0.026;
        const prevIdx = idx;
        while (budget >= 1 && idx < chars.length) {
          budget -= 1;
          const ch = chars[idx];
          idx += 1;
          if ('.!?'.includes(ch)) {
            pauseUntil = now + 260;
            budget = 0;
            break;
          } else if (',;:'.includes(ch)) {
            pauseUntil = now + 120;
            budget = 0;
            break;
          } else if (ch === '\n') {
            pauseUntil = now + 170;
            budget = 0;
            break;
          }
        }
        if (idx !== prevIdx) {
          setTypedCount(idx);
        }
      }

      if (idx >= chars.length) {
        setTypedCount(chars.length);
        setDone(true);
        if (onDoneRef.current) onDoneRef.current();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [started, done, chars]);

  // Keep caret in view on desktop scrollable body
  useEffect(() => {
    if (!started || done) return;
    const ch = chars[typedCount - 1];
    if (ch !== '\n' && ch !== ' ') return;
    const body = bodyRef.current;
    const caret = caretRef.current;
    const typed = typedRef.current;
    if (!body || !caret || !typed) return;
    if (body.scrollHeight <= body.clientHeight + 2) return;
    const target = caret.offsetTop + typed.offsetTop - body.clientHeight * 0.6;
    if (target > body.scrollTop + 2) {
      body.scrollTop = target;
    }
  }, [typedCount, started, done, chars]);

  const handleSkip = () => {
    if (!done) {
      setStarted(true);
      setTypedCount(chars.length);
      setDone(true);
      if (onDone) onDone();
    }
  };

  const handleReplay = (e) => {
    e.stopPropagation();
    setDone(false);
    setTypedCount(0);
    setStarted(true);
  };

  const skipTapProps = usePointerTap(handleSkip);

  const visibleText = done ? fullText : chars.slice(0, typedCount).join('');

  return (
    <article
      id="letterCard"
      ref={cardRef}
      className={`card glass letter-card ${done ? 'is-done' : ''}`}
      style={{ '--i': 3 }}
      onClick={handleSkip}
      {...skipTapProps}
    >
      <span className="washi-tape washi-blush" aria-hidden="true" />
      <p className="card-eyebrow">A Letter For You</p>
      <span className="letter-seal" aria-hidden="true">
        💌
      </span>
      <div ref={bodyRef} className="letter-body">
        <div className="letter-ghost" aria-hidden="true">
          {fullText}
        </div>
        <div ref={typedRef} className="letter-typed" aria-hidden="true">
          {visibleText}
          <span ref={caretRef} className="caret" />
        </div>
      </div>
      <p id="letterSr" className="sr-only">
        {fullText}
      </p>
      {!done ? (
        <p className="letter-hint">Tap the letter to skip ahead ✨</p>
      ) : (
        <div className="letter-done-bar">
          <button
            id="replayLetterBtn"
            type="button"
            className="letter-replay-btn"
            onClick={handleReplay}
          >
            ↺ Replay typing
          </button>
        </div>
      )}
    </article>
  );
}
