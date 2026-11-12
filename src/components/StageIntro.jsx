import React, { useRef } from 'react';

export function StageIntro({ status, onOpen }) {
  const btnRef = useRef(null);

  const handleClick = () => {
    const r = btnRef.current ? btnRef.current.getBoundingClientRect() : null;
    onOpen(r);
  };

  return (
    <section
      id="stage-intro"
      className={`stage stage-intro ${status === 'active' ? 'is-active' : ''} ${
        status === 'leaving' ? 'is-leaving' : ''
      }`}
      aria-label="Welcome"
    >
      <div className="intro-card glass">
        <span className="washi-tape washi-blush" aria-hidden="true" />
        <span className="scrap-stamp" aria-hidden="true">
          <span>SPECIAL DELIVERY</span>
          <strong>FOR SAMMY ✦</strong>
        </span>
        <span className="intro-emoji" aria-hidden="true">
          🎀
        </span>
        <h1 className="intro-title">
          Someone special has a birthday today... <span className="emoji">✨</span>
        </h1>
        <p className="intro-sub">A little handmade scrapbook, made just for you.</p>
        <button
          id="openBtn"
          ref={btnRef}
          className="btn-glow"
          type="button"
          onClick={handleClick}
        >
          Open Present <span className="emoji">🎁</span>
        </button>
        <p className="intro-hint">🎧 Sound on for the full experience</p>
      </div>
    </section>
  );
}
