import { useSyncExternalStore } from 'react';
import { CONFIG } from '../config';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

class MusicEngine {
  constructor() {
    this.listeners = new Set();
    this.el = typeof Audio !== 'undefined' ? new Audio() : null;
    this.ctx = null;
    this.master = null;
    this.lullaby = null;
    this.fileFailed = false;
    this.usingSynth = false;
    this.playing = false;
    this.muted = false;
    this.fadeRaf = 0;
    this._snapshot = this._buildState();

    if (this.el) {
      this.el.loop = true;
      this.el.preload = 'auto';
      this.el.playsInline = true;

      if (CONFIG.song.src) {
        this.el.addEventListener('error', () => this.markFileFailed());
        this.el.src = CONFIG.song.src;
        try {
          this.el.load();
        } catch (_) {
          /* ignore */
        }
      } else {
        this.fileFailed = true;
      }

      this.el.addEventListener('pause', () => {
        if (!this.usingSynth && this.playing && !this.el.ended) {
          this.playing = false;
          this.emit();
        }
      });

      this.el.addEventListener('play', () => {
        if (!this.usingSynth && !this.playing) {
          this.playing = true;
          this.emit();
        }
      });
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx || !this.usingSynth) return;
        if (document.hidden) {
          this.ctx.suspend().catch(() => {});
        } else if (this.playing) {
          this.ctx.resume().catch(() => {});
        }
      });
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof window !== 'undefined' && window.MediaMetadata) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: CONFIG.song.title,
          artist: CONFIG.song.artist,
          album: `For ${CONFIG.name} 💜`,
        });
        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
      } catch (_) {
        /* ignore */
      }
    }
  }

  _buildState() {
    return {
      playing: this.playing,
      muted: this.muted,
      usingSynth: this.usingSynth,
      fileFailed: this.fileFailed,
    };
  }

  emit() {
    this._snapshot = this._buildState();
    this.listeners.forEach((fn) => fn());
  }

  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this._snapshot;

  markFileFailed() {
    if (this.fileFailed) return;
    this.fileFailed = true;
    if (this.playing && !this.usingSynth) this.startSynth();
    this.emit();
  }

  fadeInElement() {
    if (!this.el) return;
    cancelAnimationFrame(this.fadeRaf);
    const target = clamp(CONFIG.song.volume ?? 0.7, 0, 1);
    try {
      this.el.volume = 0;
    } catch (_) {
      return;
    }
    const t0 = performance.now();
    const step = (now) => {
      const k = clamp((now - t0) / 2500, 0, 1);
      try {
        this.el.volume = target * k;
      } catch (_) {
        return;
      }
      if (k < 1) this.fadeRaf = requestAnimationFrame(step);
    };
    this.fadeRaf = requestAnimationFrame(step);
  }

  unlock() {
    try {
      if (typeof navigator !== 'undefined' && navigator.audioSession) {
        navigator.audioSession.type = 'playback';
      }
    } catch (_) {
      /* ignore */
    }
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        this.master.connect(this.ctx.destination);
        const buf = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.master);
        src.start(0);
      } catch (_) {
        this.ctx = null;
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  midi(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  bell(freq, t, vel = 0.2, decay = 1.6, dest = this.master) {
    if (!this.ctx || !dest) return;
    const out = this.ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    out.connect(dest);
    [
      [1, 1],
      [2.005, 0.32],
      [3.01, 0.12],
    ].forEach(([mult, amp]) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq * mult;
      g.gain.value = amp;
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + decay + 0.05);
    });
  }

  createLullaby() {
    const ctx = this.ctx;
    const master = this.master;
    const bus = ctx.createGain();
    bus.gain.value = 0.0001;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3400;
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.43;
    const fb = ctx.createGain();
    fb.gain.value = 0.33;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    bus.connect(lp);
    lp.connect(master);
    lp.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(master);

    const chords = [
      [53, 57, 60, 64],
      [50, 53, 57, 60],
      [46, 50, 53, 57],
      [48, 53, 55, 60],
    ];
    const arp = [0, 1, 2, 3, 2, 1, 2, 3];
    const melody = [76, 77, 79, 81, 84, 81, 79, 77, 76, 72];
    const eighth = 60 / 72 / 2;
    let step = 0;
    let next = 0;
    let timer = 0;
    let stopTimer = 0;

    const pad = (notes, t, dur) => {
      notes.forEach((n) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        o.type = 'triangle';
        o.frequency.value = this.midi(n - 12);
        f.type = 'lowpass';
        f.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.028, t + 1.1);
        g.gain.setValueAtTime(0.028, t + dur - 0.8);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
        o.connect(f).connect(g).connect(bus);
        o.start(t);
        o.stop(t + dur + 0.7);
      });
    };

    const schedule = (i, t) => {
      const bar = Math.floor(i / 8) % chords.length;
      const chord = chords[bar];
      const pos = i % 8;
      if (pos === 0) pad(chord, t, eighth * 8);
      this.bell(this.midi(chord[arp[pos]] + 12), t, pos === 0 ? 0.13 : 0.085, 1.5, bus);
      if ((pos === 0 || pos === 5) && Math.random() < 0.6) {
        this.bell(
          this.midi(melody[Math.floor(Math.random() * melody.length)]),
          t + 0.01,
          0.06,
          2.2,
          bus
        );
      }
    };

    const tick = () => {
      const now = ctx.currentTime;
      if (next < now - 0.05) next = now + 0.05;
      while (next < now + 0.3) {
        schedule(step, next);
        next += eighth;
        step++;
      }
    };

    return {
      start: () => {
        clearTimeout(stopTimer);
        bus.gain.cancelScheduledValues(ctx.currentTime);
        bus.gain.setTargetAtTime(0.9, ctx.currentTime, 0.9);
        if (!timer) {
          next = ctx.currentTime + 0.08;
          tick();
          timer = setInterval(tick, 60);
        }
      },
      stop: () => {
        bus.gain.cancelScheduledValues(ctx.currentTime);
        bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
        clearTimeout(stopTimer);
        stopTimer = setTimeout(() => {
          clearInterval(timer);
          timer = 0;
        }, 1400);
      },
    };
  }

  startSynth() {
    if (!this.unlock()) {
      this.playing = false;
      this.emit();
      return;
    }
    if (!this.lullaby) this.lullaby = this.createLullaby();
    this.usingSynth = true;
    try {
      this.el && this.el.pause();
    } catch (_) {
      /* ignore */
    }
    this.lullaby.start();
  }

  play() {
    this.unlock();
    this.playing = true;
    if (!this.fileFailed && this.el) {
      this.usingSynth = false;
      this.el.muted = this.muted;
      let p;
      try {
        p = this.el.play();
      } catch (_) {
        this.markFileFailed();
      }
      this.fadeInElement();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          if (err && err.name === 'NotAllowedError') {
            this.playing = false;
            this.emit();
            return;
          }
          if (this.el.error || (err && err.name === 'NotSupportedError')) {
            this.markFileFailed();
          }
        });
      }
    } else {
      this.startSynth();
    }
    this.emit();
  }

  pause() {
    this.playing = false;
    if (this.usingSynth && this.lullaby) {
      this.lullaby.stop();
    } else {
      try {
        this.el && this.el.pause();
      } catch (_) {
        /* ignore */
      }
    }
    this.emit();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  setMuted(m) {
    this.muted = m;
    if (this.el) this.el.muted = m;
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.08);
    }
    this.emit();
  }

  toggleMute() {
    const next = !this.muted;
    this.setMuted(next);
    if (!next) this.unlock();
  }

  chime() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime + 0.02;
    [84, 88, 91, 96, 100].forEach((n, i) =>
      this.bell(this.midi(n), t + i * 0.085, 0.16, 2.4)
    );
    this.bell(this.midi(108), t + 0.5, 0.05, 2.8);
  }

  sparkle() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime + 0.02;
    [91, 96, 100, 103].forEach((n, i) =>
      this.bell(this.midi(n), t + i * 0.06, 0.09, 1.6)
    );
  }

  whoosh() {
    if (!this.unlock()) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.6);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(300, t + 0.5);
    bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + 0.6);
  }
}

export const music = new MusicEngine();

export function useMusic() {
  return useSyncExternalStore(music.subscribe, music.getSnapshot, music.getSnapshot);
}
