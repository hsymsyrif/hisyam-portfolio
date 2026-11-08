"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

/*
 * The name as a field of code-filled pixels, drawn on canvas:
 * - scrolling in, the pixels fly in from a scatter and lock into the letters;
 * - the cursor pushes pixels away, heats them blue and scrambles their code;
 * - a click (or tap) sends a shockwave ring through the whole word;
 * - when nobody touches it, a scan line sweeps across every few seconds.
 */

const FONT: Record<string, string[]> = {
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
};
const WORD = "HISYAM";
const COLS = WORD.length * 6 - 1;
const ROWS = 7;
const GAP = 0.14; // gap as a fraction of a cell
const CHARS = "{}<>/;:01=+_[]#$";
const INK = [242, 241, 236];
const BLUE = [42, 92, 255];
const GLOW = "rgba(61,107,255,0.9)";

type Pixel = {
  col: number;
  row: number;
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  sx: number; // scatter offset (assemble animation)
  sy: number;
  spin: number;
  heat: number;
  text: string;
};

const randomText = () =>
  Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function buildPixels(): Pixel[] {
  const r = seeded(9);
  const out: Pixel[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let c = 0; c < COLS; c++) {
      const letter = WORD[Math.floor(c / 6)]!;
      const col = c % 6;
      if (col < 5 && FONT[letter]![row]![col] === "1") {
        out.push({
          col: c,
          row,
          hx: 0,
          hy: 0,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          sx: (r() - 0.5) * 2,
          sy: (r() - 0.5) * 2,
          spin: (r() - 0.5) * 4,
          heat: 0,
          text: Array.from({ length: 4 }, () => CHARS[Math.floor(r() * CHARS.length)]).join(""),
        });
      }
    }
  }
  return out;
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const mixc = (a: number[], b: number[], t: number) =>
  `rgb(${Math.round(a[0]! + (b[0]! - a[0]!) * t)},${Math.round(a[1]! + (b[1]! - a[1]!) * t)},${Math.round(a[2]! + (b[2]! - a[2]!) * t)})`;

export function Wordmark() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!box || !cv || !ctx) return;

    const calm = prefersReducedMotion();
    const pixels = buildPixels();
    const pointer = { x: -1e4, y: -1e4, active: false };
    const rings: { x: number; y: number; r: number; life: number }[] = [];
    let cell = 0;
    let pad = 0;
    let width = 0;
    let height = 0;
    let assemble = calm ? 1 : 0;
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let scrambleClock = 0;
    let scanClock = 0;
    const family = getComputedStyle(cv).fontFamily;

    const layout = () => {
      width = box.clientWidth;
      cell = width / (COLS + (COLS - 1) * GAP);
      pad = cell * 1.6;
      height = ROWS * cell + (ROWS - 1) * cell * GAP + pad * 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(width * dpr);
      cv.height = Math.round(height * dpr);
      cv.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const p of pixels) {
        p.hx = p.col * cell * (1 + GAP) + cell / 2;
        p.hy = pad + p.row * cell * (1 + GAP) + cell / 2;
        if (p.x === 0 && p.y === 0) {
          p.x = p.hx;
          p.y = p.hy;
        }
      }
      draw(0);
    };

    const ping = (x: number, y: number) => {
      rings.push({ x, y, r: 0, life: 1 });
      for (const p of pixels) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.exp(-d / (cell * 9)) * cell * 1.6;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
        p.heat = Math.max(p.heat, Math.exp(-d / (cell * 14)));
      }
    };

    function draw(dt: number) {
      ctx!.clearRect(0, 0, width, height);
      const scramble = (scrambleClock += dt) > 0.06;
      if (scramble) scrambleClock = 0;
      scanClock += dt;
      const scanX = ((scanClock % 5.5) / 3.2) * (width + cell * 8) - cell * 4;
      const R = cell * 4.5;

      for (const p of pixels) {
        // Where this pixel wants to be: its letter slot, or the scatter while assembling.
        const t = ease(assemble * 1.7 - (p.col / COLS) * 0.7);
        const tx = p.hx + p.sx * width * 0.5 * (1 - t);
        const ty = p.hy + p.sy * height * 1.2 * (1 - t);

        if (!calm) {
          p.vx += (tx - p.x) * 0.09;
          p.vy += (ty - p.y) * 0.09;
          let target = 0;
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < R) {
              const k = 1 - d / R;
              p.vx += (dx / d) * k * k * cell * 0.55;
              p.vy += (dy / d) * k * k * cell * 0.55;
              target = k;
            }
          }
          // Idle scan line: a soft band of heat sweeping left to right.
          if (!pointer.active && scanX > -cell * 4 && scanX < width + cell * 4) {
            target = Math.max(target, Math.exp(-Math.pow((p.x - scanX) / (cell * 1.4), 2)) * 0.55);
          }
          p.vx *= 0.8;
          p.vy *= 0.8;
          p.x += p.vx;
          p.y += p.vy;
          p.heat += (target - p.heat) * (target > p.heat ? 0.35 : 0.06);
          if (scramble && p.heat > 0.3) p.text = randomText();
        } else {
          p.x = p.hx;
          p.y = p.hy;
        }

        const s = cell * (1 + p.heat * 0.18);
        const tilt = (1 - t) * p.spin + p.vx * 0.02;
        const alpha = 0.15 + 0.85 * t;
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(tilt);
        if (p.heat > 0.05) {
          ctx!.shadowColor = GLOW;
          ctx!.shadowBlur = p.heat * cell * 1.1;
        }
        ctx!.fillStyle = mixc(INK, BLUE, Math.min(1, p.heat * 1.3));
        ctx!.beginPath();
        ctx!.roundRect(-s / 2, -s / 2, s, s, s * 0.14);
        ctx!.fill();
        ctx!.shadowBlur = 0;
        // The code texture inside each pixel.
        ctx!.fillStyle = p.heat > 0.3 ? "rgba(255,255,255,0.85)" : "rgba(3,8,23,0.32)";
        ctx!.font = `500 ${s * 0.3}px ${family}`;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText(p.text.slice(0, 2), 0, -s * 0.17);
        ctx!.fillText(p.text.slice(2), 0, s * 0.19);
        ctx!.restore();
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]!;
        ring.r += dt * width * 0.9;
        ring.life -= dt * 1.1;
        if (ring.life <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx!.strokeStyle = `rgba(61,107,255,${ring.life * 0.8})`;
        ctx!.lineWidth = cell * 0.12 * ring.life;
        ctx!.beginPath();
        ctx!.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx!.stroke();
      }
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
      if (visible && !calm) raf = requestAnimationFrame(loop);
    };

    const toLocal = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    const onDown = (e: PointerEvent) => {
      if (calm) return;
      const p = toLocal(e);
      ping(p.x, p.y);
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(box);
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      cancelAnimationFrame(raf);
      if (visible && !calm) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(cv);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("pointerdown", onDown);

    // Assemble as the footer scrolls into view.
    const st = calm
      ? null
      : ScrollTrigger.create({
          trigger: box,
          start: "top bottom",
          end: "bottom 85%",
          scrub: true,
          onUpdate: (self) => (assemble = self.progress),
        });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      st?.kill();
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div ref={wrap} className="relative">
      <canvas
        ref={canvas}
        aria-hidden="true"
        data-cursor="Ping"
        className="block w-full touch-pan-y font-mono"
      />
      <p className="mono text-ink-3 pointer-events-none mt-2 text-center" aria-hidden="true">
        ( hover · click to ping )
      </p>
    </div>
  );
}
