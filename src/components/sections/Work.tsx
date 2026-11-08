"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { projects } from "@/content/profile";
import type { Locale } from "@/i18n/routing";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Logo } from "@/components/ui/Logo";
import { galleryFocus } from "@/components/three/gallery-math";
import { pad } from "@/lib/format";

const CurvedGallery = dynamic(() => import("@/components/three/CurvedGallery"), {
  ssr: false,
  loading: () => null,
});

export function Work() {
  const t = useTranslations("work");
  const locale = useLocale() as Locale;
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const counter = useRef<HTMLSpanElement>(null);
  const focusTitle = useRef<HTMLSpanElement>(null);
  const cards = useMemo(
    () =>
      projects.map((p) => ({
        title: p.title[locale],
        context: p.context,
        year: p.year,
        stack: p.stack,
      })),
    [locale],
  );

  useGSAP(
    () => {
      const show = (p: number) => {
        progress.current = p;
        const i = galleryFocus(p, cards.length);
        if (counter.current) counter.current.textContent = `${pad(i + 1)} / ${pad(cards.length)}`;
        if (focusTitle.current) focusTitle.current.textContent = cards[i]!.title;
      };
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Pinned: scrolling turns the wall, one card at a time.
        ScrollTrigger.create({
          trigger: stage.current,
          start: "top top",
          end: `+=${cards.length * 40}%`,
          pin: true,
          onUpdate: (self) => show(self.progress),
        });
        gsap.from("[data-gallery-head]", {
          y: 60,
          opacity: 0,
          ease: "expo.out",
          scrollTrigger: { trigger: stage.current, start: "top 75%", end: "top 15%", scrub: 1 },
        });
      });
      // Still: park the wall with the second card in focus.
      mm.add("(prefers-reduced-motion: reduce)", () => show(0.3));
      return () => mm.revert();
    },
    { scope: stage, dependencies: [cards] },
  );

  return (
    <section id="work" aria-labelledby="work-title" className="bg-bg relative z-10">
      {/* Curved gallery (decorative: the same projects are listed below as text). */}
      <div ref={stage} className="relative flex h-svh flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_55%,rgba(42,92,255,0.16),transparent_70%)]"
        />
        <div
          data-gallery-head
          className="relative z-10 flex flex-col items-center pt-24 text-center sm:pt-28"
        >
          <SectionLabel index={4}>{t("label")}</SectionLabel>
          <p
            id="work-title"
            data-scramble
            className="display mt-4 text-[clamp(2.75rem,7vw,6.5rem)]"
          >
            {t("title")}
          </p>
        </div>

        <div
          aria-hidden="true"
          className="relative min-h-0 flex-1 [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]"
        >
          <CurvedGallery cards={cards} progress={progress} />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2 pb-10 text-center">
          <p className="mono text-ink-2 flex items-center gap-3">
            <span ref={counter} className="text-signal-text tabular-nums">
              01 / {pad(cards.length)}
            </span>
            <span className="bg-line h-px w-8" />
            <span ref={focusTitle}>{cards[0]?.title}</span>
          </p>
          <p className="text-ink-3 max-w-sm text-sm">{t("sub")}</p>
        </div>
      </div>

      {/* The real content: project cards. */}
      <div className="wrap pt-16 pb-28">
        <div className="border-line flex flex-col gap-6 border-b pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 data-reveal className="mono text-ink-3 flex items-center gap-3">
              <span className="from-neon h-px w-8 bg-linear-to-r to-transparent" />
              {t("listLabel")}
            </h3>
            <p data-reveal className="text-ink-2 mt-4 max-w-xl text-xl leading-snug md:text-2xl">
              {t("listLead")}
            </p>
          </div>
          <p
            data-reveal
            className="display from-ink to-glow bg-linear-to-br bg-clip-text text-6xl text-transparent"
          >
            {pad(projects.length)}{" "}
            <span className="mono text-ink-3 align-middle text-sm">{t("count")}</span>
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => (
            <li key={p.slug} data-reveal={(i % 3) * 0.06}>
              <article
                data-tilt="glow"
                className="group glass ease-out-expo relative flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1"
                style={{ "--accent": p.accent } as React.CSSProperties}
              >
                {/* Visual header: accent glow, faint grid, big index, context icon. */}
                <div className="border-line relative h-36 overflow-hidden border-b">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(70%_90%_at_80%_0%,color-mix(in_oklab,var(--accent)_45%,transparent),transparent_70%),radial-gradient(60%_80%_at_0%_100%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)] transition-opacity duration-500 group-hover:opacity-100 md:opacity-80"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 [background-image:linear-gradient(rgba(127,160,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(127,160,255,0.08)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,#000,transparent)] [background-size:28px_28px] opacity-40"
                  />
                  <span
                    aria-hidden="true"
                    className="display absolute right-5 -bottom-6 text-[7.5rem] leading-none text-transparent [-webkit-text-stroke:1px_color-mix(in_oklab,var(--accent)_55%,transparent)]"
                  >
                    {pad(i + 1)}
                  </span>
                  <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[var(--accent)] to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
                </div>

                {/* Logo tile sits on the seam between header and body, in line with the text below. */}
                <span className="ring-bg absolute top-[7.25rem] left-6 z-10 grid size-14 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_-6px_color-mix(in_oklab,var(--accent)_70%,transparent)] ring-4">
                  {p.icon === "self" ? (
                    <span className="bg-orb grid size-full place-items-center">
                      <Logo className="h-7 w-auto text-white" />
                    </span>
                  ) : p.icon === "github" ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-8 text-[#0d1117]"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
                    </svg>
                  ) : p.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small local logo
                    <img src={p.icon} alt="" className="block size-full object-contain p-2" />
                  ) : (
                    <span className="mono text-xs font-semibold text-[#00629b]">
                      {p.context.split(" ")[0]}
                    </span>
                  )}
                </span>
                <div className="flex flex-1 flex-col p-6 pt-12">
                  <p className="mono text-ink-3 flex flex-wrap items-center gap-2">
                    <span style={{ color: "var(--accent)" }}>{p.context}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.year}</span>
                  </p>
                  <h4 className="display mt-3 text-[clamp(1.75rem,2.4vw,2.25rem)] leading-[0.95] transition-colors duration-300 group-hover:text-[#cfe2ff]">
                    {p.title[locale]}
                  </h4>
                  <p className="text-ink-2 mt-3 text-[0.9375rem] leading-relaxed">
                    {p.summary[locale]}
                  </p>
                  <ul className="mt-5 mb-6 flex flex-wrap gap-1.5">
                    {p.stack.map((st) => (
                      <li
                        key={st}
                        className="bg-ink/[0.05] text-ink-2 ring-ink/10 rounded-full px-2.5 py-1 font-mono text-[0.625rem] tracking-wide uppercase ring-1"
                      >
                        {st}
                      </li>
                    ))}
                  </ul>
                  {/* Footer always sits at the bottom so every card lines up. */}
                  <div className="mono border-line text-ink-3 mt-auto flex items-center justify-between gap-4 border-t pt-4">
                    <span>CASE {pad(i + 1)}</span>
                    {p.link ? (
                      <a
                        href={p.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-line text-glow flex items-center gap-1"
                        data-cursor={t("read")}
                      >
                        {p.link.label[locale]} ↗
                      </a>
                    ) : (
                      <span aria-hidden="true" className="flex gap-1">
                        {[0, 1, 2].map((k) => (
                          <span
                            key={k}
                            className="size-1 rounded-full"
                            style={{ background: "var(--accent)", opacity: 0.3 + k * 0.3 }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
