"use client";

import dynamic from "next/dynamic";
import { Component, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { gsap, scene, ScrollTrigger, scrollToId, useGSAP } from "@/lib/motion";
import { pad } from "@/lib/format";

const LogoScene = dynamic(() => import("@/components/three/LogoScene"), {
  ssr: false,
  loading: () => null,
});

/** Without WebGL the story still reads fine over the plain black background. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const CHAPTERS = ["c1", "c2", "c3", "c4"] as const;
// Background numerals and HUD tags per chapter (language-neutral).
const BIG = ["2020", "50+", "2025", "NOW"];
const TAGS = ["INIT", "SCALE", "INTEGRATE", "LOCK"];

/**
 * The story: four chapters over the fixed 3D logo (LogoScene). Each chapter (and the hero,
 * stage 4) reports how far it has scrolled, which drives the scene.
 */
export function Story() {
  const t = useTranslations("intro");
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    gsap.utils.toArray<HTMLElement>("[data-stage]").forEach((el) => {
      const stage = Number(el.dataset.stage);
      ScrollTrigger.create({
        trigger: el,
        // From the section reaching the top until it has fully left: chapter text is
        // readable over roughly the first 45% of each stage, the rest is the hand-off.
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => (scene.target = stage + self.progress),
        // Fast jumps can skip onUpdate: pin to the edge we just crossed.
        onLeave: () => (scene.target = stage + 1),
        onLeaveBack: () => (scene.target = stage),
      });
    });

    // Past the hero the canvas is covered: hide it and stop rendering.
    ScrollTrigger.create({
      trigger: "#home",
      start: "bottom top",
      onEnter: () => {
        scene.visible = false;
        gsap.set(layer.current, { autoAlpha: 0 });
      },
      onLeaveBack: () => {
        scene.visible = true;
        gsap.set(layer.current, { autoAlpha: 1 });
      },
    });

    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom 60%",
      onToggle: (self) =>
        gsap.to(skip.current, { autoAlpha: self.isActive ? 1 : 0, y: self.isActive ? 0 : 20 }),
    });

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Parallax: each layer drifts at its own speed while its chapter passes.
      gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
        const d = Number(el.dataset.depth);
        gsap.fromTo(
          el,
          { y: d * 320 },
          {
            y: -d * 320,
            ease: "none",
            scrollTrigger: {
              trigger: el.closest("section"),
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
      // Leaving the hero, the two name lines slide apart.
      const name = gsap.utils.toArray<HTMLElement>("#home-title > span");
      const out = { trigger: "#home", start: "top top", end: "bottom top", scrub: true };
      if (name[0]) gsap.to(name[0], { xPercent: -22, ease: "none", scrollTrigger: out });
      if (name[1]) gsap.to(name[1], { xPercent: 22, ease: "none", scrollTrigger: out });

      gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((el) => {
        const words = el.querySelectorAll("[data-word]");
        const kicker = el.querySelector("[data-kicker]");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el.parentElement,
            start: "top 75%",
            end: "bottom 40%",
            scrub: 0.6,
          },
        });
        tl.from(kicker, { y: 30, opacity: 0, duration: 0.15 })
          .from(
            words,
            { yPercent: 110, rotateX: -60, opacity: 0, stagger: 0.04, duration: 0.25 },
            "<",
          )
          .to({}, { duration: 0.4 })
          .to(el, { y: -80, opacity: 0, filter: "blur(8px)", duration: 0.2 });
      });
    });
    return () => mm.revert();
  });

  return (
    <>
      <div ref={layer} aria-hidden="true" className="bg-bg fixed inset-0 z-0 overflow-hidden">
        {/* Navy nebula behind the (transparent) 3D canvas. */}
        <div className="absolute -inset-[10%] animate-[nebula_26s_ease-in-out_infinite_alternate] bg-[radial-gradient(55%_45%_at_22%_28%,rgba(30,64,175,0.4),transparent_70%),radial-gradient(45%_40%_at_80%_68%,rgba(18,130,190,0.22),transparent_70%),radial-gradient(40%_35%_at_85%_18%,rgba(96,70,210,0.2),transparent_70%),radial-gradient(90%_60%_at_50%_105%,rgba(14,34,110,0.7),transparent_70%)]" />
        <SceneBoundary>
          <LogoScene />
        </SceneBoundary>
        {/* Vignette so type over the scene always reads. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(3,8,23,0.85))]" />
      </div>

      <div ref={root} id="story" className="relative z-10">
        {CHAPTERS.map((c, i) => (
          <section
            key={c}
            data-stage={i}
            aria-labelledby={`${c}-title`}
            className="relative h-[170svh] first:h-[150svh]"
          >
            <div className="sticky top-0 flex h-svh flex-col items-center justify-start overflow-hidden px-4 pt-[18svh] text-center">
              {/* Back layer: a huge outlined numeral, slowest. */}
              <span
                data-depth="0.45"
                aria-hidden="true"
                className="display pointer-events-none absolute top-[58%] left-1/2 -translate-1/2 text-[34vw] whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgba(127,160,255,0.16)]"
              >
                {BIG[i]}
              </span>
              {/* Front layer: HUD tags at the edges, fastest. */}
              <div
                data-depth="-0.5"
                aria-hidden="true"
                className="mono text-ink-3 pointer-events-none absolute top-[42%] left-6 hidden flex-col items-start gap-3 md:flex"
              >
                <span className="text-signal-text">CH.{pad(i + 1)} / 04</span>
                <span className="from-signal-text h-20 w-px bg-linear-to-b to-transparent" />
                <span>{TAGS[i]}</span>
              </div>
              <div
                data-depth="-0.3"
                aria-hidden="true"
                className="mono text-ink-3 pointer-events-none absolute top-[48%] right-12 hidden flex-col items-end gap-1.5 md:flex"
              >
                {[0, 1, 2, 3].map((k) => (
                  <span
                    key={k}
                    className={`h-px ${k <= i ? "bg-signal-text w-10" : "bg-line w-5"}`}
                  />
                ))}
                <span className="mt-2">SIGNAL {(i + 1) * 25}%</span>
              </div>
              <div data-chapter className="flex flex-col items-center">
                <p
                  data-kicker
                  className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
                >
                  <span className="bg-signal size-1.5 rounded-full" />
                  <span className="mono text-ink">{t(`${c}kicker`)}</span>
                </p>
                <h2
                  id={`${c}-title`}
                  className="display mt-6 max-w-[14ch] text-[clamp(3.25rem,10vw,9.5rem)] [perspective:800px]"
                >
                  {t(c)
                    .split(" ")
                    .map((w, k) => (
                      <span key={k} className="inline-block overflow-hidden pb-[0.06em] align-top">
                        <span data-word className="inline-block">
                          {w}
                          {" "}
                        </span>
                      </span>
                    ))}
                </h2>
              </div>
            </div>
          </section>
        ))}
      </div>

      <button
        ref={skip}
        type="button"
        onClick={() => scrollToId("home")}
        className="glass invisible fixed right-4 bottom-4 z-[60] inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-mono text-xs tracking-wide uppercase opacity-0 sm:right-6 sm:bottom-6"
      >
        {t("skip")} <span aria-hidden="true">↓</span>
      </button>
    </>
  );
}
