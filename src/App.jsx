import React, { useState, useRef, useCallback } from 'react';
import { CONFIG } from './config';
import { music } from './utils/audio';
import { isReducedMotion } from './utils/confetti';
import { vibrate } from './utils/haptics';
import { StardustCanvas } from './components/StardustCanvas';
import { MuteButton } from './components/MuteButton';
import { StageIntro } from './components/StageIntro';
import { StageCake } from './components/StageCake';
import { MusicPlayerCard } from './components/MusicPlayerCard';
import { PolaroidGalleryCard } from './components/PolaroidGalleryCard';
import { ScratchVoucherCard } from './components/ScratchVoucherCard';
import { TypewriterLetterCard } from './components/TypewriterLetterCard';
import { QrCakeHeartCard } from './components/QrCakeHeartCard';
import { LinerNotesModal } from './components/LinerNotesModal';

const SPREADS = [
  { id: 1, label: '🎂 Cake' },
  { id: 2, label: '🎵 Music & Snaps' },
  { id: 3, label: '💌 Gift & Letter' },
  { id: 4, label: '💖 QR Card' },
];

export default function App() {
  // 0 = closed front cover, 1..4 = open spreads inside the 3D birthday card
  const [spread, setSpread] = useState(0);
  const [turnDir, setTurnDir] = useState('none'); // 'none' | 'opening' | 'next' | 'prev' | 'closing'
  const [linerOpen, setLinerOpen] = useState(false);
  const [bookTilt, setBookTilt] = useState({ rx: 4, ry: -4 });

  const stardustRef = useRef(null);
  const linerBtnRef = useRef(null);
  const transitioningRef = useRef(false);

  const goToSpread = useCallback(
    (targetSpread, customDir) => {
      if (transitioningRef.current || targetSpread === spread) return;
      transitioningRef.current = true;

      const dir =
        customDir ||
        (spread === 0
          ? 'opening'
          : targetSpread === 0
          ? 'closing'
          : targetSpread > spread
          ? 'next'
          : 'prev');

      setTurnDir(dir);
      vibrate(14);

      const delay = isReducedMotion() ? 120 : 520;
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setSpread(targetSpread);
        requestAnimationFrame(() => {
          setTurnDir('none');
          transitioningRef.current = false;
        });
      }, delay);
    },
    [spread]
  );

  const handleOpenCard = useCallback(
    (btnRect) => {
      if (transitioningRef.current) return;
      music.play();
      if (btnRect && stardustRef.current) {
        stardustRef.current.burst(
          btnRect.left + btnRect.width / 2,
          btnRect.top + btnRect.height / 2,
          24
        );
      }
      goToSpread(1, 'opening');
    },
    [goToSpread]
  );

  const handleOpenLiner = useCallback(() => {
    setLinerOpen(true);
  }, []);

  const handleCloseLiner = useCallback(() => {
    setLinerOpen(false);
    if (linerBtnRef.current) {
      linerBtnRef.current.focus({ preventScroll: true });
    }
  }, []);

  const handleBookPointerMove = (e) => {
    if (window.innerWidth < 768) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setBookTilt({
      rx: Math.max(-6, Math.min(7, 2 - ny * 8)),
      ry: Math.max(-8, Math.min(8, nx * 10)),
    });
  };

  const handleBookPointerLeave = () => {
    setBookTilt({ rx: 3, ry: -2 });
  };

  return (
    <>
      <div className="sky" aria-hidden="true" />
      <StardustCanvas ref={stardustRef} />
      <MuteButton />

      <main
        id="app"
        className={`card-book-stage ${spread === 0 ? 'is-cover' : 'is-open-book'}`}
      >
        {spread === 0 ? (
          <StageIntro
            status={turnDir === 'opening' ? 'leaving' : 'active'}
            onOpen={handleOpenCard}
          />
        ) : (
          <div
            id="stage-hub"
            className={`bday-book-shell is-active turn-${turnDir}`}
            onPointerMove={handleBookPointerMove}
            onPointerLeave={handleBookPointerLeave}
            style={{
              '--book-rx': `${bookTilt.rx}deg`,
              '--book-ry': `${bookTilt.ry}deg`,
            }}
          >
            {/* Top Ribbon Bookmark Tabs */}
            <nav className="book-bookmarks" aria-label="Birthday card pages">
              {SPREADS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`bookmark-tab ${spread === s.id ? 'is-current' : ''}`}
                  onClick={() => goToSpread(s.id)}
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                className="bookmark-tab bookmark-close"
                onClick={() => goToSpread(0, 'closing')}
                aria-label="Close birthday card"
              >
                📕 Close Card
              </button>
            </nav>

            {/* The Open 3D Birthday Card Book */}
            <div className="bday-book-3d">
              {/* 3D Layered Paper Thickness Edges */}
              <div className="book-edge-left" aria-hidden="true" />
              <div className="book-edge-right" aria-hidden="true" />
              <div className="book-spine-crease" aria-hidden="true" />

              {/* SPREAD 1: Interactive Pop-Up Birthday Cake */}
              {spread === 1 && (
                <div className="book-spread book-spread-single">
                  <StageCake
                    status="active"
                    onContinue={() => goToSpread(2, 'next')}
                  />
                </div>
              )}

              {/* SPREAD 2: Left Page (Music Player) + Right Page (Polaroids) */}
              {spread === 2 && (
                <div className="book-spread book-spread-double">
                  <div className="book-page book-page-left">
                    <MusicPlayerCard
                      linerOpen={linerOpen}
                      onOpenLiner={handleOpenLiner}
                      linerBtnRef={linerBtnRef}
                    />
                  </div>
                  <div className="book-page book-page-right">
                    <PolaroidGalleryCard />
                  </div>
                </div>
              )}

              {/* SPREAD 3: Left Page (Scratch Voucher) + Right Page (Typewriter Letter) */}
              {spread === 3 && (
                <div className="book-spread book-spread-double">
                  <div className="book-page book-page-left">
                    <ScratchVoucherCard active={spread === 3} />
                  </div>
                  <div className="book-page book-page-right">
                    <TypewriterLetterCard active={spread === 3} />
                  </div>
                </div>
              )}

              {/* SPREAD 4: Interactive Card & Scannable Cake + Heart QR */}
              {spread === 4 && (
                <div className="book-spread book-spread-single">
                  <QrCakeHeartCard />
                </div>
              )}

              {/* Bottom Page-Turn Bar Inside the Card */}
              <footer className="book-footer">
                <button
                  type="button"
                  id="prevPageBtn"
                  className="btn-ghost page-turn-btn"
                  onClick={() =>
                    spread > 1 ? goToSpread(spread - 1, 'prev') : goToSpread(0, 'closing')
                  }
                >
                  {spread > 1 ? '← Previous Page' : '📕 Front Cover'}
                </button>

                <div className="book-footer-meta">
                  <span className="book-page-num">Page {spread} of 4</span>
                  <span className="hub-footer">
                    Just for Sammy · <span id="year">{new Date().getFullYear()}</span>
                  </span>
                </div>

                {spread < 4 ? (
                  <button
                    type="button"
                    id="nextPageBtn"
                    className="btn-glow page-turn-btn page-turn-next"
                    onClick={() => goToSpread(spread + 1, 'next')}
                  >
                    Turn Page →
                  </button>
                ) : (
                  <button
                    type="button"
                    id="nextPageBtn"
                    className="btn-ghost page-turn-btn"
                    onClick={() => goToSpread(1, 'prev')}
                  >
                    🎂 Back to Cake
                  </button>
                )}
              </footer>
            </div>
          </div>
        )}
      </main>

      <LinerNotesModal open={linerOpen} onClose={handleCloseLiner} />
    </>
  );
}
