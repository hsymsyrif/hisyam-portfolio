"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { app, gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/motion";

/**
 * Smooth scroll (Lenis driven by the GSAP ticker so ScrollTrigger and Lenis
 * share one clock) plus the page-wide "[data-reveal]" entrance.
 */
export function MotionRoot() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: { offset: -80 } });
    app.lenis = lenis;
    if (app.locked) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      app.lenis = null;
    };
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const delay = Number(el.dataset.reveal) || 0;
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 48,
            rotateX: -24,
            transformPerspective: 900,
            transformOrigin: "50% 100%",
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.1,
            delay,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          },
        );
      });
    });
    // Fonts and lazy 3D change layout height after first paint.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
  });

  return <div aria-hidden="true" className="grain" />;
}
