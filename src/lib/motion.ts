"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

/** Shared, mutable runtime state. Read every frame, so it lives outside React. */
export const app = {
  lenis: null as Lenis | null,
  locked: false,
};

/**
 * The 3D scene reads this. `target` is set by scroll: 0–4 are the four story
 * chapters, 4–5 is the hero. `visible` is false once the hero has scrolled away.
 */
export const scene = { target: 0, visible: true };

export const INTRO_KEY = "hs-intro-seen";

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function lockScroll(lock: boolean) {
  app.locked = lock;
  document.documentElement.classList.toggle("is-locked", lock);
  if (lock) app.lenis?.stop();
  else app.lenis?.start();
}

export function scrollToId(id: string, immediate = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (app.lenis) app.lenis.scrollTo(el, { immediate, duration: 1.6, force: true });
  else el.scrollIntoView({ behavior: immediate || prefersReducedMotion() ? "auto" : "smooth" });
}
