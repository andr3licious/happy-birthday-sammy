import React, { useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { MusicPlayerCard } from './MusicPlayerCard';
import { ScratchVoucherCard } from './ScratchVoucherCard';
import { PolaroidGalleryCard } from './PolaroidGalleryCard';
import { TypewriterLetterCard } from './TypewriterLetterCard';
import { QrCakeHeartCard } from './QrCakeHeartCard';

export function StageHub({ status, linerOpen, onOpenLiner, linerBtnRef }) {
  const titleRef = useRef(null);
  const isActive = status === 'active';

  useEffect(() => {
    if (isActive && titleRef.current) {
      titleRef.current.focus({ preventScroll: true });
    }
  }, [isActive]);

  return (
    <section
      id="stage-hub"
      className={`stage stage-hub ${isActive ? 'is-active' : ''} ${
        status === 'leaving' ? 'is-leaving' : ''
      }`}
      aria-label="Your birthday gifts"
    >
      <header className="hub-header">
        <span className="scrap-pill" aria-hidden="true">
          ✦ Birthday Scrapbook · Edition 01 ✦
        </span>
        <p className="card-eyebrow">Your birthday gifts</p>
        <h2 ref={titleRef} tabIndex={-1} className="hub-title">
          For you, <span data-fill="name">{CONFIG.name}</span>{' '}
          <span className="emoji">🎀</span>
        </h2>
        <p className="hub-sub">
          Tap, scratch, flip and read. Every page &amp; note here was made for you.
        </p>
      </header>

      <div className="hub-grid">
        <MusicPlayerCard
          linerOpen={linerOpen}
          onOpenLiner={onOpenLiner}
          linerBtnRef={linerBtnRef}
        />
        <ScratchVoucherCard active={isActive} />
        <PolaroidGalleryCard />
        <TypewriterLetterCard active={isActive} />
        <QrCakeHeartCard />
      </div>

      <footer className="hub-footer">
        Just for Sammy · <span id="year">{new Date().getFullYear()}</span>
      </footer>
    </section>
  );
}
