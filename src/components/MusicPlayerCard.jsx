import React from 'react';
import { CONFIG } from '../config';
import { music, useMusic } from '../utils/audio';
import { usePointerTap } from '../utils/haptics';

export function MusicPlayerCard({ linerOpen, onOpenLiner, linerBtnRef }) {
  const { playing, fileFailed } = useMusic();

  const cover =
    CONFIG.song.cover || (CONFIG.memories[0] && CONFIG.memories[0].src) || '';
  const bgImage = cover
    ? `url("${encodeURI(cover)}"), radial-gradient(circle at 30% 30%, #ffd1e6, #b48cff 60%, #7b5ad8)`
    : undefined;

  const linerTapProps = usePointerTap(onOpenLiner);

  return (
    <article
      className={`card glass player-card ${playing ? 'is-playing' : ''}`}
      style={{ '--i': 0 }}
    >
      <span className="washi-tape washi-rose" aria-hidden="true" />
      <span className="card-sticker" aria-hidden="true">
        ♫ ON REPEAT
      </span>

      <p className="card-eyebrow">Now Playing</p>
      <h3 className="card-title">
        Spin the Record <span className="emoji">💿</span>
      </h3>

      <div className="player">
        <div className="turntable">
          <div className="vinyl">
            <div
              id="vinylLabel"
              className="vinyl-label"
              style={bgImage ? { backgroundImage: bgImage } : undefined}
            />
          </div>
          <div className="tonearm" aria-hidden="true" />
        </div>
        <div className="track">
          <h4 id="songTitle" className="track-title">
            {fileFailed ? CONFIG.song.fallbackTitle : CONFIG.song.title}
          </h4>
          <p id="songArtist" className="track-artist">
            {fileFailed ? CONFIG.song.fallbackArtist : CONFIG.song.artist}
          </p>

          <div className="track-progress-row" aria-hidden="true">
            <div className="eq">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="track-scrubber">
              <span className="track-scrubber-fill" />
              <span className="track-scrubber-dot" />
            </div>
          </div>

          <div className="player-actions">
            <button
              id="playBtn"
              className="play-btn"
              type="button"
              aria-label={playing ? 'Pause music' : 'Play music'}
              onClick={() => music.toggle()}
            >
              <svg className="i-play" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
              </svg>
              <svg className="i-pause" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor" />
              </svg>
            </button>
            <button
              id="linerBtn"
              ref={linerBtnRef}
              className="btn-ghost"
              type="button"
              aria-haspopup="dialog"
              aria-controls="linerModal"
              aria-expanded={linerOpen}
              {...linerTapProps}
            >
              📝 Liner Notes
            </button>
          </div>
        </div>
      </div>

      {/* Coquette Scrapbook Soundtrack Note Strip (balances left/right page height) */}
      <div className="player-lyric-strip">
        <div className="lyric-strip-header">
          <span className="lyric-pin" aria-hidden="true">🎀</span>
          <span className="lyric-strip-label">SOUNDTRACK DEDICATION</span>
          <span className="lyric-pin" aria-hidden="true">✿</span>
        </div>
        <p className="lyric-strip-quote">
          &ldquo;{CONFIG.song.linerNotes}&rdquo;
        </p>
        <div className="lyric-mood-tags" aria-hidden="true">
          <span>✨ Birthday Vibes</span>
          <span>🎶 Throwback Classic</span>
          <span>💖 Track 01 · For {CONFIG.name}</span>
        </div>
      </div>
    </article>
  );
}
