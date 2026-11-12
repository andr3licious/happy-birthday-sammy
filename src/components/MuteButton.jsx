import React from 'react';
import { music, useMusic } from '../utils/audio';

export function MuteButton() {
  const { muted } = useMusic();

  return (
    <button
      id="muteBtn"
      className={`mute-btn ${muted ? 'is-muted' : ''}`}
      type="button"
      aria-label={muted ? 'Unmute music' : 'Mute music'}
      aria-pressed={muted}
      onClick={() => music.toggleMute()}
    >
      <svg className="icon-on" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <svg className="icon-off" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path
          d="M16.5 9.5l5 5M21.5 9.5l-5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
