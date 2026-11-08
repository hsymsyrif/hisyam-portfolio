"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion";

/*
 * Mouse users get a HUD cursor:
 * - an exact centre dot and a lagging reticle (rotating ring, ticks, x/y readout)
 *   that grows and shows a label over anything with data-cursor;
 * - a full-screen canvas behind it: a glowing comet trail, sparks thrown off by
 *   fast moves, a grid that lights up around the pointer like a scanner, and a
 *   shockwave ring on every click.
 * Touch devices and reduced-motion users keep the native cursor and nothing else.
 */

const TRAIL = 26;
const GRID = 44;

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
};
type Ring = { x: number; y: number; r: number; life: number };

export function Cursor() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reticle = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const coords = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const ret = reticle.current;
    const dt = dot.current;
    const text = label.current;
    const xy = coords.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ret || !dt || !text || !xy || !ctx) return;
    const fine = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!fine.matches) return;

    document.documentElement.classList.add("fx-cursor");
    const rx = gsap.quickTo(ret, "x", { duration: 0.35, ease: "power3" });
    const ry = gsap.quickTo(ret, "y", { duration: 0.35, ease: "power3" });

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const mouse = { x: w / 2, y: h / 2, px: w / 2, py: h / 2, seen: false };
    const trail = Array.from({ length: TRAIL }, () => ({ x: w / 2, y: h / 2 }));
    const sparks: Spark[] = [];
    const rings: Ring[] = [];
    let energy = 0; // how lit the scanner grid is; rises with movement, decays when still
    let raf = 0;
    let last = performance.now();
    let current = "";

    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!mouse.seen) {
        mouse.seen = true;
        trail.forEach((p) => ((p.x = mouse.x), (p.y = mouse.y)));
        ret.style.opacity = "1";
        dt.style.opacity = "1";
      }
      dt.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
      rx(mouse.x);
      ry(mouse.y);
      xy.textContent = `X${String(Math.round(mouse.x)).padStart(4, "0")} · Y${String(Math.round(mouse.y)).padStart(4, "0")}`;

      const speed = Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py);
      energy = Math.min(1, energy + speed / 120);
      const n = Math.min(4, Math.floor(speed / 14));
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.4 + Math.random() * 1.6;
        sparks.push({
          x: mouse.x,
          y: mouse.y,
          vx: Math.cos(a) * v - (mouse.x - mouse.px) * 0.04,
          vy: Math.sin(a) * v - (mouse.y - mouse.py) * 0.04,
          life: 0,
          max: 0.5 + Math.random() * 0.6,
          size: 0.8 + Math.random() * 1.8,
        });
      }
      mouse.px = mouse.x;
      mouse.py = mouse.y;

      const target = (e.target as Element | null)?.closest?.("[data-cursor], a, button");
      const next = target ? (target.getAttribute("data-cursor") ?? "") : "";
      const active = String(Boolean(target));
      if (next !== current || ret.dataset.active !== active) {
        current = next;
        text.textContent = next;
        ret.dataset.active = active;
        ret.dataset.label = String(Boolean(next));
      }
      kick();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      rings.push({ x: e.clientX, y: e.clientY, r: 4, life: 1 });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const v = 2 + Math.random() * 2.5;
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 0,
          max: 0.7,
          size: 1.6,
        });
      }
      energy = 1;
      ret.dataset.press = "true";
      kick();
    };
    const onUp = () => (ret.dataset.press = "false");
    const onLeave = () => {
      ret.style.opacity = "0";
      dt.style.opacity = "0";
      mouse.seen = false;
    };

    function frame(now: number) {
      const step = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx!.clearRect(0, 0, w, h);
      energy = Math.max(0, energy - step * 0.9);

      // Scanner grid: only the cells around the pointer, brighter while moving.
      if (mouse.seen && energy > 0.01) {
        const R = 190;
        const g = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, R);
        g.addColorStop(0, `rgba(127,160,255,${0.32 * energy})`);
        g.addColorStop(1, "rgba(127,160,255,0)");
        ctx!.strokeStyle = g;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        for (let x = Math.floor((mouse.x - R) / GRID) * GRID; x <= mouse.x + R; x += GRID) {
          ctx!.moveTo(x + 0.5, mouse.y - R);
          ctx!.lineTo(x + 0.5, mouse.y + R);
        }
        for (let y = Math.floor((mouse.y - R) / GRID) * GRID; y <= mouse.y + R; y += GRID) {
          ctx!.moveTo(mouse.x - R, y + 0.5);
          ctx!.lineTo(mouse.x + R, y + 0.5);
        }
        ctx!.stroke();
        ctx!.fillStyle = g;
        for (let x = Math.floor((mouse.x - R) / GRID) * GRID; x <= mouse.x + R; x += GRID) {
          for (let y = Math.floor((mouse.y - R) / GRID) * GRID; y <= mouse.y + R; y += GRID) {
            ctx!.fillRect(x - 1, y - 1, 3, 3);
          }
        }
      }

      // Comet trail: each point chases the one ahead of it.
      let moving = false;
      trail[0]!.x += (mouse.x - trail[0]!.x) * 0.55;
      trail[0]!.y += (mouse.y - trail[0]!.y) * 0.55;
      for (let i = 1; i < TRAIL; i++) {
        const p = trail[i]!;
        const q = trail[i - 1]!;
        p.x += (q.x - p.x) * 0.42;
        p.y += (q.y - p.y) * 0.42;
      }
      const tail = trail[TRAIL - 1]!;
      if (Math.hypot(tail.x - mouse.x, tail.y - mouse.y) > 0.6) moving = true;
      if (mouse.seen) {
        ctx!.lineCap = "round";
        ctx!.lineJoin = "round";
        ctx!.shadowColor = "rgba(61,107,255,0.9)";
        ctx!.shadowBlur = 16;
        for (let i = 1; i < TRAIL; i++) {
          const k = 1 - i / TRAIL;
          ctx!.strokeStyle = `rgba(61,107,255,${k * 0.85})`;
          ctx!.lineWidth = k * 7;
          ctx!.beginPath();
          ctx!.moveTo(trail[i - 1]!.x, trail[i - 1]!.y);
          ctx!.lineTo(trail[i]!.x, trail[i]!.y);
          ctx!.stroke();
        }
        ctx!.shadowBlur = 0;
        for (let i = 1; i < TRAIL / 2; i++) {
          const k = 1 - i / (TRAIL / 2);
          ctx!.strokeStyle = `rgba(220,230,255,${k * 0.9})`;
          ctx!.lineWidth = k * 2;
          ctx!.beginPath();
          ctx!.moveTo(trail[i - 1]!.x, trail[i - 1]!.y);
          ctx!.lineTo(trail[i]!.x, trail[i]!.y);
          ctx!.stroke();
        }
      }

      // Sparks.
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]!;
        s.life += step;
        if (s.life >= s.max) {
          sparks.splice(i, 1);
          continue;
        }
        s.vx *= 0.94;
        s.vy *= 0.94;
        s.x += s.vx;
        s.y += s.vy;
        const a = 1 - s.life / s.max;
        ctx!.fillStyle = `rgba(${Math.random() > 0.5 ? "127,160,255" : "235,240,255"},${a})`;
        ctx!.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      }

      // Click shockwaves.
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]!;
        r.life -= step * 1.8;
        r.r += step * 260;
        if (r.life <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx!.strokeStyle = `rgba(127,160,255,${r.life})`;
        ctx!.lineWidth = 2 * r.life;
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // Keep animating only while something is still moving.
      if (moving || sparks.length || rings.length || energy > 0.01)
        raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        ctx!.clearRect(0, 0, w, h);
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("fx-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[94] size-full mix-blend-screen"
      />
      <div
        ref={dot}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[96] opacity-0"
      >
        <span className="block size-1.5 -translate-1/2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(127,160,255,0.9)]" />
      </div>
      <div
        ref={reticle}
        aria-hidden="true"
        data-active="false"
        data-label="false"
        data-press="false"
        className="group/cursor pointer-events-none fixed top-0 left-0 z-[95] opacity-0 transition-opacity duration-300"
      >
        <div className="ease-out-expo relative -translate-1/2 transition-transform duration-300 group-data-[press=true]/cursor:scale-75">
          {/* Rotating dashed ring with four ticks. */}
          <svg
            viewBox="0 0 48 48"
            className="text-signal-text ease-out-expo size-10 animate-[spin_6s_linear_infinite] transition-all duration-500 group-data-[active=true]/cursor:size-16 group-data-[label=true]/cursor:opacity-0"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="24" cy="24" r="20" strokeWidth="1" strokeDasharray="10 6" opacity="0.8" />
            <path d="M24 0v6M24 42v6M0 24h6M42 24h6" strokeWidth="1.5" />
          </svg>
          <span
            ref={label}
            className="mono bg-signal text-signal-ink absolute top-1/2 left-1/2 -translate-1/2 rounded-full px-3 py-1.5 text-[0.625rem] whitespace-nowrap opacity-0 shadow-[0_0_24px_rgba(61,107,255,0.7)] transition-opacity duration-300 group-data-[label=true]/cursor:opacity-100"
          />
          <span
            ref={coords}
            className="mono text-signal-text/80 absolute top-full left-1/2 mt-1 -translate-x-1/2 text-[0.5625rem] whitespace-nowrap transition-opacity group-data-[active=true]/cursor:opacity-0"
          />
        </div>
      </div>
    </>
  );
}
