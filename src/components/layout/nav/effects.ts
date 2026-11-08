"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_#";

/** Swap an element's text through a short character scramble. */
export function decodeTo(el: HTMLElement, text: string) {
  if (prefersReducedMotion()) {
    el.textContent = text;
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / 450);
    const settled = Math.floor(p * text.length);
    el.textContent = text
      .split("")
      .map((c, i) =>
        i < settled || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      )
      .join("");
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function useJakartaTime(withSeconds: boolean) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      ...(withSeconds ? { second: "2-digit" } : {}),
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, withSeconds ? 1000 : 15_000);
    return () => clearInterval(id);
  }, [withSeconds]);
  return time;
}
