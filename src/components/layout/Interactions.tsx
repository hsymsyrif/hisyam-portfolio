"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

/*
 * Page-wide, attribute-driven effects (delegated, so elements that mount later
 * work too):
 *   data-tilt          holographic card: tilts toward the pointer, glare + lit edge follow it
 *   data-tilt="glow"   glare + lit edge only, no tilt (for wide rows)
 *   data-magnetic      pulled a little toward the pointer
 *   data-scramble      text decodes from random glyphs when it scrolls into view
 *   data-scramble-hover  text re-decodes on hover
 */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";

function scramble(el: HTMLElement, duration = 900) {
  const target = el.dataset.text ?? el.textContent ?? "";
  el.dataset.text = target;
  if (el.dataset.busy === "1") return;
  el.dataset.busy = "1";
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const settled = Math.floor(p * target.length);
    el.textContent = target
      .split("")
      .map((c, i) =>
        i < settled || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      )
      .join("");
    if (p < 1) requestAnimationFrame(step);
    else {
      el.textContent = target;
      el.dataset.busy = "0";
    }
  };
  requestAnimationFrame(step);
}

export function Interactions() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const fine = window.matchMedia("(pointer: fine)").matches;

    // Decode on enter.
    const triggers = gsap.utils.toArray<HTMLElement>("[data-scramble]").map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => scramble(el, 1100),
      }),
    );

    if (!fine) return () => triggers.forEach((t) => t.kill());

    let tilted: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;

    const release = (el: HTMLElement | null, kind: "tilt" | "magnet") => {
      if (!el) return;
      if (kind === "tilt") {
        el.style.setProperty("--glare", "0");
        if (el.dataset.tilt !== "glow")
          gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
      } else {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target as Element | null;

      const tilt = target?.closest?.<HTMLElement>("[data-tilt]") ?? null;
      if (tilt !== tilted) {
        release(tilted, "tilt");
        tilted = tilt;
      }
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        tilt.style.setProperty("--mx", `${e.clientX - r.left}px`);
        tilt.style.setProperty("--my", `${e.clientY - r.top}px`);
        tilt.style.setProperty("--glare", "1");
        if (tilt.dataset.tilt !== "glow") {
          gsap.to(tilt, {
            rotateX: (0.5 - py) * 10,
            rotateY: (px - 0.5) * 12,
            transformPerspective: 900,
            duration: 0.5,
            ease: "power3.out",
          });
        }
      }

      const mag = target?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
      if (mag !== magnet) {
        release(magnet, "magnet");
        magnet = mag;
      }
      if (mag) {
        const r = mag.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(mag, { x: dx * 0.3, y: dy * 0.4, duration: 0.4, ease: "power3.out" });
      }
    };

    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-scramble-hover]");
      if (el && !el.contains(e.relatedTarget as Node | null)) scramble(el, 500);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    return () => {
      triggers.forEach((t) => t.kill());
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  return null;
}
