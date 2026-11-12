import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { isReducedMotion } from '../utils/confetti';

const COLORS = [
  '242,115,156', // strawberry rose
  '219,152,70',  // warm honey gold
  '174,128,230', // pastel lilac
  '247,148,185', // soft blush pink
  '232,135,112', // warm peach coral
];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function makeSprite(rgb, star) {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, `rgba(${rgb},0.95)`);
  grd.addColorStop(0.22, `rgba(${rgb},0.65)`);
  grd.addColorStop(0.5, `rgba(${rgb},0.18)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  if (star) {
    g.fillStyle = `rgba(${rgb},0.95)`;
    g.beginPath();
    g.moveTo(32, 3);
    g.quadraticCurveTo(34.5, 29.5, 61, 32);
    g.quadraticCurveTo(34.5, 34.5, 32, 61);
    g.quadraticCurveTo(29.5, 34.5, 3, 32);
    g.quadraticCurveTo(29.5, 29.5, 32, 3);
    g.fill();
  }
  return c;
}

export const StardustCanvas = forwardRef(function StardustCanvas(_, ref) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);

  useImperativeHandle(ref, () => ({
    burst(x, y, n = 10) {
      if (isReducedMotion()) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.8 + Math.random() * 2.4;
        sparksRef.current.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 0.6,
          life: 1,
          decay: 0.012 + Math.random() * 0.02,
          size: 6 + Math.random() * 10,
          c: 1 + Math.floor(Math.random() * (COLORS.length - 1)),
        });
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = isReducedMotion();

    const dotSprites = COLORS.map((c) => makeSprite(c, false));
    const starSprites = COLORS.map((c) => makeSprite(c, true));

    const pointer = { x: -9999, y: -9999 };
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles = [];
    let shooting = null;
    let nextShooting = performance.now() + 5000;
    let last = performance.now();
    let running = true;
    let rafId = 0;

    function makeParticle(randomY) {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -12,
        depth,
        r: 0.5 + depth * 1.7,
        vy: 0.12 + depth * 0.5,
        vx: 0,
        px: 0,
        py: 0,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.004 + Math.random() * 0.012,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.015 + Math.random() * 0.045,
        star: depth > 0.82,
        c: Math.floor(Math.random() * COLORS.length),
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(clamp((w * h) / 8500, 55, 180) * (reduced ? 0.4 : 1));
      while (particles.length < target) particles.push(makeParticle(true));
      if (particles.length > target) particles.length = target;
    }

    function burstLocal(x, y, n = 8) {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.8 + Math.random() * 2.4;
        sparksRef.current.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 0.6,
          life: 1,
          decay: 0.012 + Math.random() * 0.02,
          size: 6 + Math.random() * 10,
          c: 1 + Math.floor(Math.random() * (COLORS.length - 1)),
        });
      }
    }

    function frame(now) {
      if (!running) return;
      const dt = clamp((now - last) / 16.667, 0.2, 3);
      last = now;
      ctx.clearRect(0, 0, w, h);

      const R = 120;
      for (const p of particles) {
        p.sway += p.swaySpeed * dt;
        p.tw += p.twSpeed * dt;

        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = Math.pow(1 - d / R, 2) * 1.4 * (0.5 + p.depth);
          p.px += (dx / d) * f * dt;
          p.py += (dy / d) * f * 0.7 * dt;
        }
        p.px *= Math.pow(0.92, dt);
        p.py *= Math.pow(0.92, dt);

        p.x += (Math.sin(p.sway) * 0.28 * (0.4 + p.depth) + p.px) * dt;
        p.y += (p.vy + p.py) * dt;

        if (p.y > h + 14) Object.assign(p, makeParticle(false));
        if (p.x < -14) p.x = w + 12;
        else if (p.x > w + 14) p.x = -12;

        const tw = 0.55 + 0.45 * Math.sin(p.tw);
        ctx.globalAlpha = (0.35 + p.depth * 0.6) * tw;
        if (p.star) {
          const s = p.r * 9;
          ctx.drawImage(starSprites[p.c], p.x - s / 2, p.y - s / 2, s, s);
        } else {
          const s = p.r * 7;
          ctx.drawImage(dotSprites[p.c], p.x - s / 2, p.y - s / 2, s, s);
        }
      }

      if (sparksRef.current.length) {
        sparksRef.current = sparksRef.current.filter((s) => s.life > 0);
        for (const s of sparksRef.current) {
          s.vx *= Math.pow(0.96, dt);
          s.vy = s.vy * Math.pow(0.96, dt) + 0.03 * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= s.decay * dt;
          ctx.globalAlpha = Math.max(0, s.life);
          const size = s.size * (0.6 + s.life * 0.4);
          ctx.drawImage(starSprites[s.c], s.x - size / 2, s.y - size / 2, size, size);
        }
      }

      if (!reduced) {
        if (!shooting && now > nextShooting) {
          shooting = {
            x: w * (0.35 + Math.random() * 0.65),
            y: h * Math.random() * 0.35,
            vx: -(7 + Math.random() * 4),
            vy: 2.6 + Math.random() * 1.8,
            life: 1,
          };
        }
        if (shooting) {
          const s = shooting;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= 0.014 * dt;
          const tx = s.x - s.vx * 14;
          const ty = s.y - s.vy * 14;
          const grd = ctx.createLinearGradient(s.x, s.y, tx, ty);
          grd.addColorStop(0, 'rgba(242,115,156,0.85)');
          grd.addColorStop(1, 'rgba(219,152,70,0)');
          ctx.globalAlpha = Math.max(0, s.life);
          ctx.strokeStyle = grd;
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          if (s.life <= 0 || s.x < -50 || s.y > h + 50) {
            shooting = null;
            nextShooting = now + 6000 + Math.random() * 9000;
          }
        }
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(frame);
    }

    const setPointer = (x, y) => {
      pointer.x = x;
      pointer.y = y;
    };
    const clearPointer = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const onPointerMove = (e) => setPointer(e.clientX, e.clientY);
    const onPointerDown = (e) => {
      setPointer(e.clientX, e.clientY);
      burstLocal(e.clientX, e.clientY, 8);
    };
    const onPointerUp = (e) => {
      if (e.pointerType !== 'mouse') setTimeout(clearPointer, 250);
    };
    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (t) setPointer(t.clientX, t.clientY);
    };
    const onTouchEnd = () => setTimeout(clearPointer, 250);
    const onVisibility = () => {
      running = !document.hidden;
      if (running) {
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('pointerleave', clearPointer);
    window.addEventListener('blur', clearPointer);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    rafId = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('pointerleave', clearPointer);
      window.removeEventListener('blur', clearPointer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas id="stardust" ref={canvasRef} className="stardust" aria-hidden="true" />;
});
