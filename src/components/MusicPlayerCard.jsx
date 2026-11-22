import React, { useRef, useState } from 'react';
import { CONFIG } from '../config';
import { music, useMusic } from '../utils/audio';
import { vibrate, usePointerTap } from '../utils/haptics';

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MusicPlayerCard({ linerOpen, onOpenLiner, linerBtnRef }) {
  const { playing, fileFailed, usingSynth, currentTime, duration, trackIndex } = useMusic();
  const [dragPct, setDragPct] = useState(null);
  const scrubberRef = useRef(null);

  const tracks =
    Array.isArray(CONFIG.songs) && CONFIG.songs.length ? CONFIG.songs : [CONFIG.song];
  const currentTrack = tracks[trackIndex] || tracks[0] || CONFIG.song;

  const cover =
    currentTrack.cover || (CONFIG.memories[0] && CONFIG.memories[0].src) || '';
  const bgImage = cover
    ? `url("${encodeURI(cover)}"), radial-gradient(circle at 30% 30%, #ffd1e6, #b48cff 60%, #7b5ad8)`
    : undefined;

  const linerTapProps = usePointerTap(onOpenLiner);

  const canSeek = !fileFailed && !usingSynth && duration > 0;
  const ratioFromClientX = (clientX) => {
    const el = scrubberRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    if (!r.width) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const handleScrubDown = (e) => {
    if (!canSeek) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
    const ratio = ratioFromClientX(e.clientX);
    setDragPct(ratio * 100);
    music.seek(ratio * duration);
  };

  const handleScrubMove = (e) => {
    if (dragPct === null || !canSeek) return;
    e.stopPropagation();
    const ratio = ratioFromClientX(e.clientX);
    setDragPct(ratio * 100);
    music.seek(ratio * duration);
  };

  const handleScrubEnd = () => {
    if (dragPct !== null) setDragPct(null);
  };

  const handleScrubKeyDown = (e) => {
    if (!canSeek) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      music.seek((currentTime || 0) - 5);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      music.seek((currentTime || 0) + 5);
    }
  };

  const pct =
    dragPct !== null
      ? dragPct
      : canSeek
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 38;

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
            {fileFailed ? CONFIG.song.fallbackTitle : currentTrack.title}
          </h4>
          <p id="songArtist" className="track-artist">
            {fileFailed ? CONFIG.song.fallbackArtist : currentTrack.artist}
          </p>

          <div className="track-progress-row">
            <div className="eq" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="track-scrubber-wrap">
              <div
                ref={scrubberRef}
                className={`track-scrubber ${
                  usingSynth || fileFailed ? 'is-synth' : ''
                }`}
                role="slider"
                tabIndex={canSeek ? 0 : -1}
                aria-label="Seek audio position"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration || 0)}
                aria-valuenow={Math.round(currentTime || 0)}
                onPointerDown={handleScrubDown}
                onPointerMove={handleScrubMove}
                onPointerUp={handleScrubEnd}
                onPointerCancel={handleScrubEnd}
                onLostPointerCapture={handleScrubEnd}
                onKeyDown={handleScrubKeyDown}
              >
                <span className="track-scrubber-rail" aria-hidden="true">
                  <span
                    className="track-scrubber-fill"
                    style={{ width: `${pct}%` }}
                  />
                  <span
                    className="track-scrubber-dot"
                    style={{ left: `${pct}%` }}
                  />
                </span>
              </div>
              {!(usingSynth || fileFailed) && (
                <div className="track-times">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
                </div>
              )}
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
              id="restartSongBtn"
              className="restart-song-btn"
              type="button"
              aria-label="Restart song"
              title="Restart song"
              onClick={() => music.restart()}
            >
              ↺
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

      {/* 2-Track Switcher between Happy Birthday (Piano) and Baby (Remix) */}
      {tracks.length > 1 && (
        <div className="track-switcher" role="tablist" aria-label="Choose birthday soundtrack">
          {tracks.map((tr, idx) => {
            const activeTrack = idx === trackIndex;
            return (
              <button
                key={tr.id || idx}
                type="button"
                role="tab"
                aria-selected={activeTrack}
                className={`track-pill ${activeTrack ? 'is-active' : ''}`}
                onClick={() => {
                  vibrate(10);
                  music.selectTrack(idx, true);
                }}
              >
                <span className="track-pill-num">0{idx + 1}</span>
                <span className="track-pill-name">{tr.title}</span>
                {activeTrack && playing && <span className="track-pill-dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Coquette Scrapbook Soundtrack Note Strip (balances left/right page height) */}
      <div className="player-lyric-strip">
        <div className="lyric-strip-header">
          <span className="lyric-pin" aria-hidden="true">🎀</span>
          <span className="lyric-strip-label">SOUNDTRACK DEDICATION</span>
          <span className="lyric-pin" aria-hidden="true">✿</span>
        </div>
        <p className="lyric-strip-quote">
          &ldquo;{currentTrack.linerNotes}&rdquo;
        </p>
        <div className="lyric-mood-tags" aria-hidden="true">
          {(currentTrack.tags || [
            '🎂 Birthday Soundtrack',
            `💖 Track 0${trackIndex + 1} · For ${CONFIG.name}`,
          ]).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
