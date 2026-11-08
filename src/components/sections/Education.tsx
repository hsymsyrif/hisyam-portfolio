"use client";

import { useId, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { certificates, community, education } from "@/content/profile";
import type { Locale } from "@/i18n/routing";
import { gsap, useGSAP } from "@/lib/motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { pad } from "@/lib/format";

const RING = 2 * Math.PI * 42;

/** "GPA 3.68 / 4.00 · Cum Laude" → label, value, max, note. */
function parseScore(text: string) {
  const m = /^(.*?)\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?:\s*·\s*(.+))?$/.exec(text);
  if (!m) return null;
  return { label: m[1]!.trim(), value: Number(m[2]), max: Number(m[3]), note: m[4]?.trim() };
}

/** A ring that fills to the score when it scrolls into view. */
function Gauge({ label, value, max }: { label: string; value: number; max: number }) {
  const grad = useId();
  return (
    <div className="relative grid size-32 shrink-0 place-items-center sm:size-36">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5fd3ff" />
            <stop offset="0.6" stopColor="#3d5bff" />
            <stop offset="1" stopColor="#7b5cff" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(127,160,255,0.12)"
          strokeWidth="6"
        />
        <circle
          data-gauge={value / max}
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={`url(#${grad})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING}
          strokeDashoffset={RING * (1 - value / max)}
          className="drop-shadow-[0_0_6px_rgba(95,211,255,0.6)]"
        />
      </svg>
      <div className="text-center">
        <p className="display text-4xl tabular-nums sm:text-5xl">{value.toFixed(2)}</p>
        <p className="mono text-ink-3 max-w-[9ch] text-[0.5625rem] leading-tight">{label}</p>
        <p className="mono text-ink-3 text-[0.5625rem]">/ {max.toFixed(2)}</p>
      </div>
    </div>
  );
}

export function Education() {
  const t = useTranslations("education");
  const locale = useLocale() as Locale;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The timeline spine draws itself as you read down it.
        gsap.fromTo(
          "[data-spine]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: "[data-timeline]",
              start: "top 70%",
              end: "bottom 60%",
              scrub: true,
            },
          },
        );
        gsap.utils.toArray<SVGCircleElement>("[data-gauge]").forEach((c) => {
          gsap.fromTo(
            c,
            { strokeDashoffset: RING },
            {
              strokeDashoffset: RING * (1 - Number(c.dataset.gauge)),
              duration: 1.8,
              ease: "expo.out",
              scrollTrigger: { trigger: c, start: "top 85%", once: true },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="education"
      aria-labelledby="education-title"
      className="bg-bg relative z-10 overflow-hidden py-24 md:py-36"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_35%_at_85%_15%,rgba(30,64,175,0.32),transparent_70%),radial-gradient(40%_35%_at_10%_85%,rgba(18,130,190,0.14),transparent_70%)]"
      />

      <div className="wrap relative">
        <SectionLabel index={7}>{t("label")}</SectionLabel>
        <p
          id="education-title"
          data-reveal
          data-scramble
          className="display mt-6 text-[clamp(4rem,12vw,12rem)]"
        >
          {t("title")}
        </p>
        <p data-reveal className="text-ink-2 mt-4 max-w-xl text-lg">
          {t("lead")}
        </p>

        {/* Timeline: a glowing spine with one node per school. */}
        <h3 data-reveal className="mono text-ink-3 mt-20">
          {t("record")}
        </h3>
        <ol data-timeline className="relative mt-8 space-y-6 pl-8 md:pl-0">
          <span
            aria-hidden="true"
            className="bg-line absolute top-2 bottom-2 left-[7px] w-px md:left-[calc(14rem+7px)]"
          />
          <span
            data-spine
            aria-hidden="true"
            className="from-neon via-azure absolute top-2 bottom-2 left-[7px] w-px origin-top bg-linear-to-b to-[#7b5cff] shadow-[0_0_12px_rgba(95,211,255,0.7)] md:left-[calc(14rem+7px)]"
          />
          {education.map((e, i) => {
            const score = parseScore(e.score[locale]);
            return (
              <li
                key={e.school}
                data-reveal
                className="relative grid grid-cols-1 gap-4 md:grid-cols-[14rem_1fr] md:gap-0"
              >
                <span
                  aria-hidden="true"
                  className="bg-bg ring-neon absolute top-3 -left-8 grid size-[15px] place-items-center rounded-full ring-1 md:left-[14rem]"
                >
                  <span className="bg-neon size-[7px] rounded-full shadow-[0_0_10px_#5fd3ff]" />
                </span>
                <div className="md:pt-1 md:pr-10">
                  <p className="mono text-glow">EDU.{pad(i + 1)}</p>
                  <p className="display text-ink-2 mt-1 text-4xl tabular-nums md:text-5xl">
                    {e.period}
                  </p>
                </div>
                <article
                  data-tilt="glow"
                  className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8 md:ml-10"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="display text-[clamp(2.25rem,4.5vw,4rem)]">{e.school}</h4>
                      <p className="text-ink-2 mt-2 text-lg">{e.degree[locale]}</p>
                      {score?.note && (
                        <p className="chip from-azure mt-4 border-transparent bg-linear-to-r to-[#7b5cff] text-white">
                          ★ {score.note}
                        </p>
                      )}
                    </div>
                    {score ? (
                      <Gauge label={score.label} value={score.value} max={score.max} />
                    ) : (
                      <p className="chip">{e.score[locale]}</p>
                    )}
                  </div>
                  <ul className="border-line mt-6 grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-2">
                    {e.points[locale].map((p) => (
                      <li key={p} className="text-ink-2 flex gap-3">
                        <svg
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                          className="text-neon mt-1 size-4 shrink-0"
                        >
                          <path
                            d="M3 8.5l3 3 7-7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            );
          })}
        </ol>

        {/* Recognition: credential badges. */}
        <h3 data-reveal className="mono text-ink-3 mt-24">
          {t("certificates")}
        </h3>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {certificates.map((c, i) => {
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className="bg-orb grid size-12 place-items-center rounded-2xl text-sm font-semibold shadow-[0_0_20px_rgba(61,107,255,0.45)]">
                    {pad(i + 1)}
                  </span>
                  <span className="mono text-ink-3">{c.date}</span>
                </div>
                <p className="mono text-glow mt-6">
                  {t("credential")} · {c.issuer}
                </p>
                <p className="mt-2 text-lg leading-snug font-medium">{c.title[locale]}</p>
                {c.href && (
                  <p className="mono text-ink-2 group-hover:text-glow mt-auto pt-6 transition-colors">
                    {t("read")} ↗
                  </p>
                )}
              </>
            );
            const cls = "group glass relative flex h-full flex-col overflow-hidden rounded-3xl p-6";
            return (
              <li key={c.title.en} data-reveal={i * 0.06}>
                {c.href ? (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-tilt
                    className={cls}
                    data-cursor="IEEE"
                  >
                    {body}
                  </a>
                ) : (
                  <div data-tilt className={cls}>
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Community. */}
        <h3 data-reveal className="mono text-ink-3 mt-24">
          {t("community")}
        </h3>
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {community.map((c) => (
            <li key={c.name + c.period} data-reveal>
              <article
                data-tilt="glow"
                className="glass relative h-full overflow-hidden rounded-3xl p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="chip border-neon/50 text-glow">{c.role[locale]}</span>
                  <span className="mono text-ink-3">{c.period}</span>
                </div>
                <h4 className="display mt-5 text-3xl">{c.name}</h4>
                <p className="text-ink-2 mt-3">{c.summary[locale]}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
