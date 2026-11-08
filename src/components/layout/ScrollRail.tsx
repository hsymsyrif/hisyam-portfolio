"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { app, ScrollTrigger, scrollToId } from "@/lib/motion";
import { SECTIONS } from "@/content/sections";
import { pad } from "@/lib/format";

/**
 * Replaces the native scrollbar: a hairline track with section ticks, a
 * glowing blue thumb you can drag, a progress line, and a bubble that shows
 * "042% · Experience" while scrolling or hovering.
 */
export function ScrollRail() {
  const t = useTranslations("nav");
  const rail = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const [ticks, setTicks] = useState<number[]>([]);

  useEffect(() => {
    const el = rail.current;
    const th = thumb.current;
    const fl = fill.current;
    const bb = bubble.current;
    if (!el || !th || !fl || !bb) return;

    let max = 1;
    let ratio = 1;
    let marks: number[] = [];
    let raf = 0;
    let idle = 0;
    let drag: { offset: number } | null = null;

    const scrollTo = (y: number, immediate: boolean) => {
      if (app.lenis) app.lenis.scrollTo(y, { immediate, force: true, duration: 1.2 });
      else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
    };

    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      const H = el.clientHeight;
      const h = Math.max(40, H * ratio);
      const y = p * (H - h);
      th.style.height = `${h}px`;
      th.style.transform = `translateY(${y}px)`;
      fl.style.transform = `scaleY(${(y + h / 2) / H})`;
      bb.style.transform = `translateY(${y + h / 2}px) translateY(-50%)`;
      let active = 0;
      marks.forEach((m, i) => p + 0.002 >= m && (active = i));
      bb.textContent = `${String(Math.round(p * 100)).padStart(3, "0")}% · ${t(SECTIONS[active]!)}`;
      el.querySelectorAll<HTMLElement>("[data-tick]").forEach(
        (n, i) => (n.dataset.active = String(i === active)),
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onScroll = () => {
      schedule();
      el.dataset.scrolling = "true";
      clearTimeout(idle);
      idle = window.setTimeout(() => (el.dataset.scrolling = "false"), 900);
    };
    const measure = () => {
      const doc = document.documentElement.scrollHeight;
      max = Math.max(1, doc - window.innerHeight);
      ratio = window.innerHeight / doc;
      marks = SECTIONS.map((id) => {
        const s = document.getElementById(id);
        return s ? Math.min(1, (s.getBoundingClientRect().top + window.scrollY) / max) : 0;
      });
      setTicks(marks);
      schedule();
    };

    const fromPointer = (e: PointerEvent, offset: number) => {
      const r = el.getBoundingClientRect();
      const h = Math.max(40, r.height * ratio);
      return Math.min(1, Math.max(0, (e.clientY - r.top - offset) / (r.height - h))) * max;
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-tick]")) return;
      e.preventDefault();
      const r = th.getBoundingClientRect();
      const onThumb = e.clientY >= r.top && e.clientY <= r.bottom;
      const offset = onThumb ? e.clientY - r.top : r.height / 2;
      if (!onThumb) scrollTo(fromPointer(e, offset), false);
      drag = { offset };
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "true";
    };
    const onMove = (e: PointerEvent) => {
      if (drag) scrollTo(fromPointer(e, drag.offset), true);
    };
    const onUp = () => {
      drag = null;
      el.dataset.dragging = "false";
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    ScrollTrigger.addEventListener("refresh", measure);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ScrollTrigger.removeEventListener("refresh", measure);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [t]);

  return (
    <div
      ref={rail}
      aria-hidden="true"
      data-scrolling="false"
      data-dragging="false"
      className="group/rail fixed top-24 right-1 bottom-6 z-[60] w-5 touch-none select-none sm:right-2"
    >
      {/* Track and progress line. */}
      <div className="bg-ink/10 absolute inset-y-0 left-1/2 w-px -translate-x-1/2" />
      <div
        ref={fill}
        className="from-signal/0 via-signal/60 to-signal-text absolute inset-y-0 left-1/2 w-px origin-top -translate-x-1/2 scale-y-0 bg-linear-to-b"
      />

      {/* Section ticks: click to jump. */}
      {ticks.map((top, i) => (
        <button
          key={SECTIONS[i]}
          type="button"
          tabIndex={-1}
          data-tick
          data-active="false"
          onClick={() => scrollToId(SECTIONS[i]!)}
          className="group/tick absolute right-0 left-0 flex h-3 -translate-y-1/2 items-center justify-center"
          style={{ top: `${top * 100}%` }}
        >
          <span className="bg-ink/35 group-hover/tick:bg-ink group-data-[active=true]/tick:bg-signal-text h-px w-2 transition-all duration-300 group-hover/tick:w-4 group-data-[active=true]/tick:w-3.5" />
          <span className="mono glass text-ink pointer-events-none absolute right-7 rounded-md px-2 py-1 text-[0.625rem] whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/tick:opacity-100">
            {pad(i + 1)} {t(SECTIONS[i]!)}
          </span>
        </button>
      ))}

      {/* Thumb. */}
      <div
        ref={thumb}
        className="from-signal-text to-signal absolute top-0 left-1/2 w-1 -translate-x-1/2 cursor-grab rounded-full bg-linear-to-b shadow-[0_0_14px_2px_rgba(61,107,255,0.55)] transition-[width] duration-300 group-hover/rail:w-1.5 group-data-[dragging=true]/rail:w-2 group-data-[dragging=true]/rail:cursor-grabbing group-data-[scrolling=true]/rail:w-1.5"
      />

      {/* Position bubble. */}
      <div
        ref={bubble}
        className="mono glass text-ink pointer-events-none absolute top-0 right-7 hidden rounded-md px-2 py-1 text-[0.625rem] whitespace-nowrap tabular-nums opacity-0 transition-opacity duration-300 group-hover/rail:opacity-100 group-data-[dragging=true]/rail:opacity-100 group-data-[scrolling=true]/rail:opacity-100 sm:block"
      />
    </div>
  );
}
