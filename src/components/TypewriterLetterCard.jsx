import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CONFIG } from '../config';
import { isReducedMotion } from '../utils/confetti';
import { usePointerTap } from '../utils/haptics';

export function TypewriterLetterCard({ active }) {
  const fullText = useMemo(
    () => CONFIG.letter.replace('{from}', CONFIG.from).trim(),
    []
  );
  const chars = useMemo(() => Array.from(fullText), [fullText]);

  const [typedCount, setTypedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const cardRef = useRef(null);
  const bodyRef = useRef(null);
  const typedRef = useRef(null);
  const caretRef = useRef(null);

  // Start observing once Stage 3 is active
  useEffect(() => {
    if (!active || started) return;
    const card = cardRef.current;
    if (!card) return;

    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            setStarted(true);
            io.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      io.observe(card);
      return () => io.disconnect();
    } else {
      setStarted(true);
    }
  }, [active, started]);

  // Typewriter loop
  useEffect(() => {
    if (!started || done) return;
    if (isReducedMotion()) {
      setTypedCount(chars.length);
      setDone(true);
      return;
    }
    if (typedCount >= chars.length) {
      setDone(true);
      return;
    }

    const ch = chars[typedCount - 1] || '';
    let delay = typedCount === 0 ? 120 : 22 + Math.random() * 34;
    if ('.!?'.includes(ch)) delay = 280;
    else if (',;:'.includes(ch)) delay = 140;
    else if (ch === '\n') delay = 180;

    const timer = setTimeout(() => {
      setTypedCount((c) => c + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [started, done, typedCount, chars]);

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
    }
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
      <p className="letter-hint">Tap the letter to skip ahead ✨</p>
    </article>
  );
}
