import React, { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { usePointerTap } from '../utils/haptics';

export function LinerNotesModal({ open, onClose }) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open) {
      setRendered(true);
      document.documentElement.style.overflow = 'hidden';
      const raf = requestAnimationFrame(() => {
        setVisible(true);
        if (closeBtnRef.current) {
          closeBtnRef.current.focus({ preventScroll: true });
        }
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      document.documentElement.style.overflow = '';
      const timer = setTimeout(() => setRendered(false), 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const backdropTapProps = usePointerTap(onClose);
  const closeTapProps = usePointerTap(onClose);

  if (!rendered) return null;

  return (
    <div
      id="linerModal"
      className={`modal ${visible ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="linerTitle"
    >
      <div className="modal-backdrop" {...backdropTapProps} />
      <div className="modal-card glass">
        <button
          ref={closeBtnRef}
          className="modal-close"
          type="button"
          aria-label="Close liner notes"
          {...closeTapProps}
        >
          &times;
        </button>
        <p className="card-eyebrow">Liner Notes</p>
        <h3 id="linerTitle" className="card-title">
          Why this song? <span className="emoji">🎶</span>
        </h3>
        <p id="linerText" className="liner-text">
          {CONFIG.song.linerNotes}
        </p>
      </div>
    </div>
  );
}
