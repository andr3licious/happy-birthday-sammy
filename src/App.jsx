import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CONFIG } from './config';
import { music, useMusic } from './utils/audio';
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
  { id: 1, label: '🎂 Cake', color: 'rose' },
  { id: 2, label: '🎵 Music & Snaps', color: 'lilac' },
  { id: 3, label: '💌 Gift & Letter', color: 'gold' },
  { id: 4, label: '💖 QR Card', color: 'berry' },
];

const SESSION_KEY = 'hb-sammy-session-v1';

function readSessionState() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeSessionState(state) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch (_) {
    /* ignore */
  }
}

export default function App() {
  const initialSessionRef = useRef(null);
  if (!initialSessionRef.current) {
    initialSessionRef.current = readSessionState();
  }
  const init = initialSessionRef.current;

  // 0 = closed front cover, 1..4 = open spreads inside the 3D birthday card
  const [spread, setSpread] = useState(() => {
    const n = Number(init.spread);
    return Number.isInteger(n) && n >= 0 && n <= 4 ? n : 0;
  });
  const [turnDir, setTurnDir] = useState('none'); // 'none' | 'opening' | 'next' | 'prev' | 'closing'
  const [linerOpen, setLinerOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [bookTilt, setBookTilt] = useState({ rx: 3, ry: -2 });

  // Persisted progress across page turns and mobile tab reloads
  const [cakeBlown, setCakeBlown] = useState(Boolean(init.cakeBlown));
  const [flippedSnaps, setFlippedSnaps] = useState(() =>
    init.flippedSnaps && typeof init.flippedSnaps === 'object' ? init.flippedSnaps : {}
  );
  const [voucherRevealed, setVoucherRevealed] = useState(Boolean(init.voucherRevealed));
  const [letterDone, setLetterDone] = useState(Boolean(init.letterDone));
  const [card3dOpen, setCard3dOpen] = useState(Boolean(init.card3dOpen));

  useEffect(() => {
    writeSessionState({
      spread,
      cakeBlown,
      flippedSnaps,
      voucherRevealed,
      letterDone,
      card3dOpen,
    });
  }, [spread, cakeBlown, flippedSnaps, voucherRevealed, letterDone, card3dOpen]);

  const { playing, fileFailed, trackIndex } = useMusic();

  const stardustRef = useRef(null);
  const linerBtnRef = useRef(null);
  const transitioningRef = useRef(false);
  const touchRef = useRef(null);

  const anyModalOpen = linerOpen || subModalOpen;

  const toggleSnapFlip = useCallback((key) => {
    setFlippedSnaps((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const goToSpread = useCallback(
    (targetSpread, customDir) => {
      if (transitioningRef.current || targetSpread === spread) return;
      transitioningRef.current = true;
      setSubModalOpen(false);

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
      music.pageTurn();

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

  // Keyboard ArrowLeft / ArrowRight page navigation
  useEffect(() => {
    if (spread < 1 || anyModalOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (
        target &&
        typeof target.closest === 'function' &&
        target.closest('input, textarea, select, [role="slider"]')
      ) {
        return;
      }
      if (e.key === 'ArrowRight' && spread < 4) {
        e.preventDefault();
        goToSpread(spread + 1, 'next');
      } else if (e.key === 'ArrowLeft' && spread > 1) {
        e.preventDefault();
        goToSpread(spread - 1, 'prev');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [spread, anyModalOpen, goToSpread]);

  const handleTouchStart = (e) => {
    if (anyModalOpen || !e.touches || e.touches.length !== 1) {
      touchRef.current = null;
      return;
    }
    const target = e.target;
    const blocked = Boolean(
      target &&
        typeof target.closest === 'function' &&
        target.closest(
          '.scratch-wrap, .track-scrubber, .gift-card-3d-stage, input, textarea'
        )
    );
    touchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now(),
      blocked,
    };
  };

  const handleTouchEnd = (e) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start || start.blocked || anyModalOpen || !e.changedTouches || !e.changedTouches.length) {
      return;
    }
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const dt = Date.now() - start.t;
    if (dt < 650 && Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      if (dx < 0 && spread < 4) {
        goToSpread(spread + 1, 'next');
      } else if (dx > 0 && spread > 1) {
        goToSpread(spread - 1, 'prev');
      }
    }
  };

  const handleOpenCard = useCallback(
    (btnRect) => {
      if (transitioningRef.current) return;
      if (!music.playing) music.play();
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
      rx: Math.max(-5, Math.min(6, 2 - ny * 7)),
      ry: Math.max(-7, Math.min(7, nx * 9)),
    });
  };

  const handleBookPointerLeave = () => {
    setBookTilt({ rx: 3, ry: -2 });
  };

  const currentTrack =
    (Array.isArray(CONFIG.songs) && CONFIG.songs[trackIndex]) || CONFIG.song;
  const coverImg =
    currentTrack.cover || (CONFIG.memories[0] && CONFIG.memories[0].src) || '';
  const isDoubleSpread = spread === 2 || spread === 3;

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
            {/* Top Stitched Fabric Ribbon Bookmark Tabs + In-Flow Mini Vinyl Pill */}
            <nav className="book-bookmarks" aria-label="Birthday card pages">
              {SPREADS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`bookmark-tab ribbon-${s.color} ${
                    spread === s.id ? 'is-current' : ''
                  }`}
                  onClick={() => goToSpread(s.id)}
                >
                  <span className="bookmark-stitch">{s.label}</span>
                </button>
              ))}
              <button
                type="button"
                className="bookmark-tab bookmark-close"
                onClick={() => goToSpread(0, 'closing')}
                aria-label="Close birthday card"
              >
                <span className="bookmark-stitch">📕 Close Card</span>
              </button>

              {spread !== 2 && (
                <div
                  className={`mini-vinyl-pill ${playing ? 'is-playing' : ''}`}
                  role="region"
                  aria-label="Now playing mini bar"
                >
                  <button
                    type="button"
                    className="mini-vinyl-disc-btn"
                    onClick={() => music.toggle()}
                    aria-label={playing ? 'Pause music' : 'Play music'}
                    title={playing ? 'Pause music' : 'Play music'}
                  >
                    <span
                      className="mini-vinyl-disc"
                      style={
                        coverImg
                          ? { backgroundImage: `url("${encodeURI(coverImg)}")` }
                          : undefined
                      }
                    />
                  </button>
                  <button
                    type="button"
                    className="mini-vinyl-info"
                    onClick={() => goToSpread(2)}
                    title="Jump to Music & Snaps page"
                  >
                    <span className="mini-vinyl-title">
                      {fileFailed ? CONFIG.song.fallbackTitle : currentTrack.title}
                    </span>
                    <span className="mini-vinyl-eq" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </button>
                  {CONFIG.songs && CONFIG.songs.length > 1 && (
                    <button
                      type="button"
                      id="miniSwitchTrackBtn"
                      className="mini-vinyl-switch-btn"
                      onClick={() => {
                        vibrate(10);
                        music.nextTrack(true);
                      }}
                      aria-label="Switch song"
                      title="Switch song"
                    >
                      ⇄
                    </button>
                  )}
                </div>
              )}
            </nav>

            {/* The Open 3D Birthday Card Book */}
            <div
              className={`bday-book-3d ${
                isDoubleSpread ? 'is-double-spread' : 'is-single-spread'
              }`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* 3D Layered Paper Thickness Edges */}
              <div className="book-edge-left" aria-hidden="true" />
              <div className="book-edge-right" aria-hidden="true" />
              {isDoubleSpread && (
                <div className="book-spine-crease" aria-hidden="true" />
              )}

              {/* Gold-Foil Filigree Corners */}
              <span className="foil-corner foil-tl" aria-hidden="true" />
              <span className="foil-corner foil-tr" aria-hidden="true" />
              <span className="foil-corner foil-bl" aria-hidden="true" />
              <span className="foil-corner foil-br" aria-hidden="true" />

              {/* Real 3D Flipping Page Sheet during Page Transitions */}
              <div
                className={`book-flip-sheet is-${turnDir}`}
                aria-hidden="true"
              >
                <div className="flip-sheet-face flip-sheet-front">
                  <span className="flip-sheet-GoldLine" />
                </div>
                <div className="flip-sheet-face flip-sheet-back">
                  <span className="flip-sheet-GoldLine" />
                </div>
              </div>

              {/* SPREAD 1: Interactive Pop-Up Birthday Cake */}
              {spread === 1 && (
                <div className="book-spread book-spread-single">
                  <StageCake
                    status="active"
                    blown={cakeBlown}
                    onBlowOut={() => setCakeBlown(true)}
                    onRelight={() => setCakeBlown(false)}
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
                    <PolaroidGalleryCard
                      flippedMap={flippedSnaps}
                      onToggleFlip={toggleSnapFlip}
                      onModalChange={setSubModalOpen}
                    />
                  </div>
                </div>
              )}

              {/* SPREAD 3: Left Page (Scratch Voucher) + Right Page (Typewriter Letter) */}
              {spread === 3 && (
                <div className="book-spread book-spread-double">
                  <div className="book-page book-page-left">
                    <ScratchVoucherCard
                      active={spread === 3}
                      revealed={voucherRevealed}
                      onReveal={() => setVoucherRevealed(true)}
                    />
                  </div>
                  <div className="book-page book-page-right">
                    <TypewriterLetterCard
                      active={spread === 3}
                      done={letterDone}
                      onDone={() => setLetterDone(true)}
                      onReplay={() => setLetterDone(false)}
                    />
                  </div>
                </div>
              )}

              {/* SPREAD 4: Interactive Card & Scannable Cake + Heart QR */}
              {spread === 4 && (
                <div className="book-spread book-spread-single">
                  <QrCakeHeartCard
                    card3dOpen={card3dOpen}
                    onToggleCard3d={() => setCard3dOpen((prev) => !prev)}
                    onModalChange={setSubModalOpen}
                  />
                </div>
              )}

              {/* Bottom Page-Turn Bar Inside the Card */}
              <footer className="book-footer">
                <button
                  type="button"
                  id="prevPageBtn"
                  className="btn-ghost page-turn-btn"
                  onClick={() =>
                    spread > 1
                      ? goToSpread(spread - 1, 'prev')
                      : goToSpread(0, 'closing')
                  }
                >
                  {spread > 1 ? '← Previous Page' : '📕 Front Cover'}
                </button>

                <div className="book-footer-meta">
                  <span className="book-page-num">Page {spread} of 4</span>
                  <span className="hub-footer">
                    Just for Sammy ·{' '}
                    <span id="year">{new Date().getFullYear()}</span>
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
