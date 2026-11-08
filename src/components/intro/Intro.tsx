"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  app,
  gsap,
  INTRO_KEY,
  lockScroll,
  prefersReducedMotion,
  ScrollTrigger,
  useGSAP,
} from "@/lib/motion";
import { person } from "@/content/profile";
import type { Locale } from "@/i18n/routing";
import { LOGO_PARTS, LOGO_VIEWBOX } from "@/components/ui/logo-path";

type Phase = "boot" | "gate" | "connect" | "done";

export const REPLAY_EVENT = "intro:replay";

/** How far apart the two halves start, in logo units (viewBox is 1311 × 1939). */
const SEP = 230;
const HOLD_SECONDS = 1.4;
/** Ticks in the progress ring around the mark. */
const TICKS = 72;

function seen() {
  try {
    return window.localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Preloader and gate built from the logo itself: its two halves are drawn as
 * lines of light while the site loads, then the visitor holds to pull them
 * together. When they lock, the mark fills, flashes and the camera flies
 * through it into the site. Returning visitors (and reduced motion) get the
 * connection played automatically.
 */
export function Intro() {
  const t = useTranslations("intro");
  const locale = useLocale() as Locale;
  const logs = t.raw("logs") as string[];
  const [phase, setPhase] = useState<Phase>("boot");
  const [pct, setPct] = useState(0);
  const [hidden, setHidden] = useState(false);
  // Bumped on replay so the name animates in again.
  const [run, setRun] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const partA = useRef<SVGGElement>(null);
  const partB = useRef<SVGGElement>(null);
  const beam = useRef<SVGLineElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const holdButton = useRef<HTMLButtonElement>(null);
  const charge = useRef<gsap.core.Tween | null>(null);
  // Live values the halves are drawn from; tweened by GSAP, painted by paint().
  const st = useRef({ sep: SEP, draw: 0, fill: 0, charge: 0 });

  const paint = () => {
    const s = st.current;
    const sep = s.sep * (1 - s.charge * s.charge);
    // Shake a little as the halves get close, like two magnets resisting.
    const jitter = s.charge > 0.6 && s.charge < 1 ? (Math.random() - 0.5) * 6 * s.charge : 0;
    partA.current?.setAttribute("transform", `translate(${-sep * 0.7 + jitter} ${-sep + jitter})`);
    partB.current?.setAttribute("transform", `translate(${sep * 0.7 - jitter} ${sep - jitter})`);
    for (const g of [partA.current, partB.current]) {
      const path = g?.firstElementChild as SVGPathElement | null;
      if (!path) continue;
      path.style.strokeDashoffset = String(1 - s.draw);
      path.style.fillOpacity = String(s.fill);
    }
    if (beam.current) beam.current.style.opacity = String(s.charge * (1 - s.fill));
    if (bar.current) bar.current.style.transform = `scaleX(${s.charge})`;
  };

  // Boot: lock the page at the top, draw the halves while counting, then gate or auto-connect.
  // The count holds at 88% until the page has really loaded (fonts + window load, capped at 3 s).
  useEffect(() => {
    if (phase !== "boot") return;
    ScrollTrigger.clearScrollMemory("manual");
    app.lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    lockScroll(true);
    const quick = prefersReducedMotion() || seen();
    Object.assign(st.current, { sep: SEP, draw: 0, fill: 0, charge: 0 });
    paint();
    const counter = { v: 0 };
    const onUpdate = () => {
      st.current.draw = counter.v / 100;
      paint();
      setPct(Math.round(counter.v));
    };
    const tweens = [
      gsap.to(counter, { v: 88, duration: quick ? 0.7 : 2, ease: "power2.out", onUpdate }),
    ];
    const loaded = new Promise<void>((done) => {
      if (document.readyState === "complete") return done();
      window.addEventListener("load", () => done(), { once: true });
      // The hidden music iframe can hold `load` back; never make the visitor wait on it.
      setTimeout(done, 3000);
    });
    let cancelled = false;
    Promise.all([tweens[0]!.then(), loaded, document.fonts?.ready]).then(() => {
      if (cancelled) return;
      tweens.push(
        gsap.to(counter, {
          v: 100,
          duration: 0.4,
          ease: "power1.in",
          onUpdate,
          onComplete: () => setPhase(quick ? "connect" : "gate"),
        }),
      );
    });
    return () => {
      cancelled = true;
      tweens.forEach((tw) => tw.kill());
    };
  }, [phase]);

  const startHold = () => {
    if (phase !== "gate") return;
    charge.current?.kill();
    charge.current = gsap.to(st.current, {
      charge: 1,
      duration: HOLD_SECONDS * (1 - st.current.charge),
      ease: "none",
      onUpdate: paint,
      onComplete: () => setPhase("connect"),
    });
  };
  const stopHold = () => {
    if (phase !== "gate") return;
    charge.current?.kill();
    charge.current = gsap.to(st.current, {
      charge: 0,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: paint,
    });
  };

  useEffect(() => {
    if (phase !== "gate") return;
    holdButton.current?.focus();
    const down = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        startHold();
      }
    };
    const up = (e: KeyboardEvent) => (e.key === " " || e.key === "Enter") && stopHold();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // startHold/stopHold only touch refs and read `phase`, which is the dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Footer "watch again" brings the whole intro back.
  useEffect(() => {
    const replay = () => {
      try {
        window.localStorage.removeItem(INTRO_KEY);
      } catch {
        /* storage blocked: the gate simply shows again next time too */
      }
      if (root.current) {
        gsap.set(root.current, { clearProps: "opacity,visibility" });
        gsap.set(root.current.querySelectorAll("[data-hud]"), { clearProps: "opacity" });
      }
      if (mark.current) gsap.set(mark.current, { clearProps: "scale,opacity" });
      setPct(0);
      setRun((r) => r + 1);
      setHidden(false);
      setPhase("boot");
    };
    window.addEventListener(REPLAY_EVENT, replay);
    return () => window.removeEventListener(REPLAY_EVENT, replay);
  }, []);

  useGSAP(
    () => {
      if (phase === "gate") {
        gsap.from("[data-gate]", {
          y: 24,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "expo.out",
        });
      }
      if (phase !== "connect") return;
      charge.current?.kill();
      const s = st.current;
      const tl = gsap.timeline({
        onUpdate: paint,
        onComplete: () => {
          try {
            window.localStorage.setItem(INTRO_KEY, "1");
          } catch {
            /* ignore */
          }
          setPhase("done");
        },
      });
      tl.to(s, { charge: 1, duration: 0.7 * (1 - s.charge), ease: "power3.in" })
        .to(s, { fill: 1, duration: 0.18 })
        .fromTo(
          "[data-flash]",
          { opacity: 0.9 },
          { opacity: 0, duration: 0.7, ease: "power2.out" },
          "<",
        )
        .fromTo(
          "[data-shock]",
          { scale: 0.2, opacity: 1 },
          { scale: 3.2, opacity: 0, duration: 1, ease: "expo.out" },
          "<",
        )
        .to(
          root.current!.querySelectorAll("[data-gate], [data-hud]"),
          { opacity: 0, duration: 0.3 },
          "<",
        )
        // Fly through the mark into the site.
        .to(mark.current, { scale: 28, duration: 1.2, ease: "expo.in" }, "+=0.15")
        .to(root.current, { autoAlpha: 0, duration: 0.45, ease: "power1.in" }, "-=0.45");
    },
    { dependencies: [phase], scope: root },
  );

  useEffect(() => {
    if (phase !== "done") return;
    const unlock = setTimeout(() => lockScroll(false), 100);
    const hide = setTimeout(() => setHidden(true), 400);
    return () => {
      clearTimeout(unlock);
      clearTimeout(hide);
    };
  }, [phase]);

  const gate = phase === "gate";
  // Boot log: each stage finishes at an equal share of the count; the current one blinks.
  const share = 100 / logs.length;
  const step = Math.min(logs.length - 1, Math.floor(pct / share));
  const lit = Math.round((pct / 100) * TICKS);

  return (
    <div
      ref={root}
      className="intro bg-bg fixed inset-0 z-[80] overflow-hidden"
      style={{ display: hidden ? "none" : undefined }}
      role="dialog"
      aria-modal="true"
      aria-label="Intro"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-[10%] animate-[nebula_26s_ease-in-out_infinite_alternate] bg-[radial-gradient(55%_45%_at_22%_28%,rgba(30,64,175,0.4),transparent_70%),radial-gradient(45%_40%_at_80%_68%,rgba(18,130,190,0.22),transparent_70%),radial-gradient(40%_35%_at_85%_18%,rgba(96,70,210,0.2),transparent_70%),radial-gradient(90%_60%_at_50%_105%,rgba(14,34,110,0.7),transparent_70%)]"
      />
      {/* Faint grid, a blue core glow behind the mark, and CRT scanlines. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 [background-image:linear-gradient(rgba(127,160,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(127,160,255,0.07)_1px,transparent_1px)] [mask-image:radial-gradient(circle_at_center,#000_10%,transparent_65%)] [background-size:56px_56px] opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute top-[42%] left-1/2 size-[90vmin] -translate-1/2 rounded-full bg-[radial-gradient(circle,rgba(42,92,255,0.24),transparent_62%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0_1px,transparent_1px_3px)]"
      />

      {/* HUD frame: corner brackets and a status bar. */}
      <div data-hud aria-hidden="true" className="pointer-events-none absolute inset-3 sm:inset-5">
        {[
          "top-0 left-0 border-t border-l",
          "top-0 right-0 border-t border-r",
          "bottom-0 left-0 border-b border-l",
          "right-0 bottom-0 border-r border-b",
        ].map((c) => (
          <span key={c} className={`border-glow/50 absolute size-5 ${c}`} />
        ))}
      </div>
      <div
        data-hud
        className="mono text-ink-2 absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-6 sm:p-9"
      >
        <span className="flex items-center gap-2">
          <span className="bg-neon size-1.5 animate-pulse rounded-full" />
          {gate ? t("ready") : t("booting")}
        </span>
        <span className="text-ink-3">{t("exe")} · v2.0</span>
      </div>

      {/* The mark (two halves, HUD rings, a tick ring that fills with the count) and the name. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[calc(min(32svh,17rem,50vw)*0.42)] px-4 pb-[18svh]">
        <div
          ref={mark}
          className="relative grid [aspect-ratio:1] h-[min(32svh,17rem,50vw)] place-items-center"
        >
          <svg
            data-hud
            aria-hidden="true"
            viewBox="0 0 200 200"
            className="absolute inset-[-30%] -rotate-90"
          >
            {Array.from({ length: TICKS }, (_, i) => (
              <line
                key={i}
                x1="100"
                y1="3"
                x2="100"
                y2={i % 6 === 0 ? 10 : 7}
                transform={`rotate(${(i / TICKS) * 360} 100 100)`}
                stroke={i < lit ? "var(--glow)" : "rgba(127,160,255,0.18)"}
                strokeWidth={i % 6 === 0 ? 1 : 0.6}
                className="transition-[stroke] duration-200"
              />
            ))}
          </svg>
          <svg
            data-hud
            aria-hidden="true"
            viewBox="0 0 200 200"
            className="text-signal-text absolute inset-[-14%]"
          >
            <g className="origin-center animate-[spin_14s_linear_infinite]">
              <circle
                cx="100"
                cy="100"
                r="96"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.35"
                strokeWidth="0.4"
                strokeDasharray="2 6"
              />
              <path
                d="M100 2v6M100 192v6M2 100h6M192 100h6"
                stroke="currentColor"
                strokeWidth="0.8"
              />
            </g>
            <g className="origin-center animate-[spin_22s_linear_infinite_reverse]">
              <circle
                cx="100"
                cy="100"
                r="86"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.5"
                strokeWidth="0.5"
                strokeDasharray="40 18 6 18"
              />
            </g>
          </svg>
          <div
            data-shock
            aria-hidden="true"
            className="border-signal-text absolute inset-0 rounded-full border-2 opacity-0"
          />
          <svg
            aria-hidden="true"
            viewBox={`${-SEP} ${-SEP} ${LOGO_VIEWBOX.width + SEP * 2} ${LOGO_VIEWBOX.height + SEP * 2}`}
            className="relative h-full overflow-visible drop-shadow-[0_0_18px_rgba(90,170,255,0.6)]"
          >
            <defs>
              {/* Cyan → cobalt → violet: the same duotone as the 3D mark. */}
              <linearGradient id="logo-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--neon)" />
                <stop offset="0.5" stopColor="var(--azure)" />
                <stop offset="1" stopColor="#7b5cff" />
              </linearGradient>
            </defs>
            <line
              ref={beam}
              x1={LOGO_VIEWBOX.width * 0.3}
              y1={LOGO_VIEWBOX.height * 0.42}
              x2={LOGO_VIEWBOX.width * 0.7}
              y2={LOGO_VIEWBOX.height * 0.58}
              stroke="var(--glow)"
              strokeWidth="26"
              strokeLinecap="round"
              opacity="0"
              className="[filter:blur(6px)]"
            />
            {LOGO_PARTS.map((d, i) => (
              <g key={i} ref={i === 0 ? partA : partB}>
                <path
                  d={d}
                  pathLength={1}
                  fill="url(#logo-fill)"
                  stroke="#a9dcff"
                  strokeWidth="9"
                  strokeDasharray="1"
                  style={{ strokeDashoffset: 1, fillOpacity: 0 }}
                />
              </g>
            ))}
          </svg>
        </div>

        <div key={run} data-hud className="text-center">
          <p className="display text-[clamp(1.75rem,5.5vw,3.5rem)] leading-none tracking-wide">
            <span className="sr-only">{person.name}</span>
            <span aria-hidden="true">
              {[...person.name.toUpperCase()].map((c, i) => (
                <span
                  key={i}
                  className="inline-block animate-[fadeUp_0.9s_var(--ease-out-expo)_both] whitespace-pre"
                  style={{ animationDelay: `${300 + i * 35}ms` }}
                >
                  {c}
                </span>
              ))}
            </span>
          </p>
          <p
            className="mono text-ink-3 mt-3 animate-[fadeUp_0.9s_var(--ease-out-expo)_both]"
            style={{ animationDelay: "1.1s" }}
          >
            {person.role[locale]} <span className="text-glow">·</span> {person.company}
          </p>
        </div>
      </div>

      {/* Boot readout: stage log, big counter and a progress line. */}
      {phase === "boot" && (
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7 sm:px-9 sm:pb-9">
          <div className="flex items-end justify-between gap-6">
            <ul aria-hidden="true" className="mono min-w-0 space-y-1.5 text-[0.6875rem]">
              {logs.map((line, i) => (
                <li
                  key={line}
                  className={`items-center gap-3 ${i === step ? "flex" : "hidden sm:flex"} ${
                    i > step ? "opacity-30" : i === step && pct < 100 ? "text-ink" : "text-ink-2"
                  }`}
                >
                  <span className="text-glow">›</span>
                  <span className="truncate">{line}</span>
                  {i < step || pct === 100 ? (
                    <span className="text-neon">OK</span>
                  ) : i === step ? (
                    <span className="text-glow animate-[blink_0.8s_steps(1)_infinite]">▌</span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p
              aria-live="polite"
              className="display shrink-0 text-[clamp(4.5rem,13vw,10rem)] leading-[0.78] tabular-nums"
            >
              <span className="sr-only">{t("loading")} </span>
              {String(pct).padStart(3, "0")}
              <span className="text-glow text-[0.32em]">%</span>
            </p>
          </div>
          <div aria-hidden="true" className="bg-ink/10 relative mt-5 h-px">
            <span
              className="from-azure via-neon absolute inset-0 origin-left bg-linear-to-r to-[#b9a8ff]"
              style={{ transform: `scaleX(${pct / 100})` }}
            />
            <span
              className="absolute top-1/2 size-1.5 -translate-1/2 rounded-full bg-white shadow-[0_0_12px_3px_var(--neon)]"
              style={{ left: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {gate && (
        <div className="absolute inset-x-0 bottom-[7svh] flex flex-col items-center gap-5 px-4 text-center">
          <p data-gate className="mono text-ink-2">
            {t("gateTitle")}
          </p>
          <button
            data-gate
            ref={holdButton}
            type="button"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            onContextMenu={(e) => e.preventDefault()}
            data-cursor="Hold"
            className="glass relative inline-flex min-h-14 touch-none items-center gap-3 overflow-hidden rounded-full px-7 font-mono text-sm tracking-[0.18em] uppercase select-none"
          >
            <span
              ref={bar}
              aria-hidden="true"
              className="bg-signal absolute inset-0 origin-left scale-x-0"
            />
            <span className="relative flex items-center gap-3">
              <span className="relative flex size-2">
                <span className="bg-signal-text absolute inset-0 animate-ping rounded-full motion-reduce:hidden" />
                <span className="bg-signal-text relative size-2 rounded-full" />
              </span>
              {t("gateButton")}
            </span>
          </button>
          <p data-gate className="mono text-ink-3 text-[0.625rem]">
            {t("gateHint")}
          </p>
        </div>
      )}

      <div
        data-flash
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#cfdbff] opacity-0"
      />
    </div>
  );
}
