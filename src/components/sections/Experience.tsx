"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { experiences, person } from "@/content/profile";
import type { Locale } from "@/i18n/routing";
import { app, gsap, ScrollTrigger, useGSAP } from "@/lib/motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Logo } from "@/components/ui/Logo";
import { pad } from "@/lib/format";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "Aug 2026" → months since year 0. Anything else ("Present") → this month. */
function toMonth(part: string, now: number) {
  const m = /([a-z]{3})\w*\s+(\d{4})/i.exec(part);
  if (!m) return now;
  return Number(m[2]) * 12 + Math.max(0, MONTHS.indexOf(m[1]!.toLowerCase()));
}

/** Colour per kind of role, so the timeline reads at a glance. */
const KIND: Record<string, string> = {
  "Full-time": "from-neon to-azure",
  Freelance: "from-[#9f8bff] to-[#5b4bff]",
  Internship: "from-[#6fe3d0] to-[#2a9dff]",
  Program: "from-[#ffd36f] to-[#ff8a5b]",
  Mentor: "from-[#ff8ad8] to-[#8a6bff]",
};

type Row = {
  company: string;
  logo?: string;
  icon?: string;
  mark: string;
  brand: string;
  title: string;
  kind: string;
  kindLabel: string;
  location: string;
  period: string;
  points: string[];
  tags: string[];
  current: boolean;
  start: number;
  end: number;
  months: number;
};

/** The company's logo file if there is one, otherwise a monogram in its brand colour. */
function CompanyLogo({
  row,
  large = false,
}: {
  row: Pick<Row, "logo" | "icon" | "mark" | "brand">;
  large?: boolean;
}) {
  const box = large ? "size-14 rounded-2xl text-2xl" : "size-4 rounded-[5px] text-[0.5rem]";
  // Large: the full logo on a white card wide enough for wordmarks. Small: the symbol only.
  const src = large ? row.logo : (row.icon ?? row.logo);
  if (src) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-white ${
          large
            ? "h-14 w-24 rounded-xl p-2 shadow-[0_0_22px_rgba(95,211,255,0.2)]"
            : "size-4 rounded-[5px]"
        }`}
      >
        {/* max-w/max-h keep any aspect ratio (wordmark or square icon) fully inside the box. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- small local logo, sized by its box */}
        <img src={src} alt="" className="block max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${box} grid shrink-0 place-items-center text-white ring-1 ring-white/15`}
      style={{
        background: `linear-gradient(135deg, ${row.brand}, color-mix(in oklab, ${row.brand} 40%, #030817))`,
        boxShadow: large
          ? `0 0 22px color-mix(in oklab, ${row.brand} 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)`
          : undefined,
      }}
    >
      {row.mark === "self" ? (
        <Logo className="h-1/2 w-auto" />
      ) : (
        <span className="display leading-none tracking-wide">{row.mark}</span>
      )}
    </span>
  );
}

export function Experience() {
  const t = useTranslations("experience");
  const locale = useLocale() as Locale;
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pin = useRef<ScrollTrigger | null>(null);

  const { rows, axis, maxMonths } = useMemo(() => {
    const d = new Date();
    const now = d.getFullYear() * 12 + d.getMonth();
    const rows: Row[] = experiences.flatMap((exp) =>
      exp.roles.map((role) => {
        const [from = "", to = ""] = role.period.en.split("–").map((s) => s.trim());
        const start = toMonth(from, now);
        const end = Math.max(start + 1, toMonth(to, now) + 1);
        return {
          company: exp.company,
          logo: exp.logo,
          icon: exp.icon,
          mark: exp.mark,
          brand: exp.brand,
          title: role.title,
          kind: exp.type.en,
          kindLabel: t(`types.${exp.type.en}` as "types.Full-time"),
          location: exp.location[locale],
          period: role.period[locale],
          points: role.points[locale],
          tags: role.tags,
          current: Boolean(exp.current) || /present/i.test(to),
          start,
          end,
          months: end - start,
        };
      }),
    );
    const min = Math.min(...rows.map((r) => r.start));
    const max = Math.max(...rows.map((r) => r.end));
    const years: number[] = [];
    for (let y = Math.ceil(min / 12); y * 12 <= max; y++) years.push(y);
    return { rows, axis: { min, max, years }, maxMonths: Math.max(...rows.map((r) => r.months)) };
  }, [locale, t]);

  const pct = (m: number) => ((m - axis.min) / (axis.max - axis.min)) * 100;
  const dur = (m: number) => {
    const y = Math.floor(m / 12);
    const mo = m % 12;
    return [y && `${y} ${t("yr")}`, mo && `${mo} ${t("mo")}`].filter(Boolean).join(" ");
  };
  const companies = new Set(rows.map((r) => r.company)).size;
  const years = Math.floor((axis.max - axis.min) / 12);

  const select = (i: number) => {
    const st = pin.current;
    // Desktop: scroll the pinned console to that role so scroll and selection agree.
    if (st) {
      const y = st.start + ((i + 0.5) / rows.length) * (st.end - st.start);
      if (app.lenis) app.lenis.scrollTo(y, { duration: 1 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    } else {
      setActive(i);
      const card = document.getElementById(`exp-${i}`);
      if (card && app.lenis) app.lenis.scrollTo(card, { offset: -90 });
      else card?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (min-height: 720px)", () => {
        pin.current = ScrollTrigger.create({
          trigger: stage.current,
          start: "top top",
          end: `+=${rows.length * 65}%`,
          pin: true,
          onUpdate: (self) => {
            const i = Math.min(rows.length - 1, Math.floor(self.progress * rows.length));
            if (i !== activeRef.current) {
              activeRef.current = i;
              setActive(i);
            }
          },
        });
        return () => {
          pin.current = null;
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [rows.length] },
  );

  const r = rows[active] ?? rows[0]!;

  const timeline = (compact: boolean) => (
    <div className="glass relative overflow-hidden rounded-3xl p-4 sm:p-6">
      <div className="mono text-ink-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-glow">TIMELINE · {rows.length} SPANS</span>
        <span className="hidden flex-wrap gap-3 sm:flex">
          {Object.keys(KIND)
            .filter((k) => rows.some((row) => row.kind === k))
            .map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full bg-linear-to-r ${KIND[k]}`} />
                {t(`types.${k}` as "types.Full-time")}
              </span>
            ))}
        </span>
      </div>
      <div className="relative mt-4 ml-6">
        <div aria-hidden="true" className="absolute inset-0">
          {axis.years.map((y) => (
            <span
              key={y}
              className="border-line absolute inset-y-0 border-l border-dashed"
              style={{ left: `${pct(y * 12)}%` }}
            >
              <span className="mono text-ink-3 absolute -top-0.5 left-1 text-[0.5625rem]">{y}</span>
            </span>
          ))}
          {/* Playhead on the active role. */}
          <span
            className="bg-glow ease-out-expo absolute inset-y-0 w-px shadow-[0_0_12px_#5fd3ff] transition-[left] duration-700"
            style={{ left: `${pct((r.start + r.end) / 2)}%` }}
          />
        </div>
        <ul className={`relative pt-6 ${compact ? "space-y-1" : "space-y-1.5"}`}>
          {rows.map((row, i) => (
            <li key={i} className="relative h-4">
              <span
                className={`absolute top-1/2 -left-6 -translate-y-1/2 transition-opacity ${i === active ? "opacity-100" : "opacity-60"}`}
              >
                <CompanyLogo row={row} />
              </span>
              <button
                type="button"
                onClick={() => select(i)}
                aria-label={`${row.title}, ${row.company}, ${row.period}`}
                aria-pressed={i === active}
                className="absolute inset-y-0 rounded-full"
                style={{
                  left: `${pct(row.start)}%`,
                  width: `max(0.6rem, ${pct(row.end) - pct(row.start)}%)`,
                }}
              >
                <span
                  className={`block h-full rounded-full bg-linear-to-r ${KIND[row.kind] ?? KIND["Full-time"]} transition-all duration-500 ${
                    i === active
                      ? "opacity-100 shadow-[0_0_14px_rgba(95,211,255,0.6)]"
                      : "opacity-30 hover:opacity-70"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const detail = (row: Row, index: number) => (
    <article className="glass console:grid console:grid-cols-2 console:gap-10 relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(61,107,255,0.28),transparent_70%)]"
      />
      <div className="console:gap-6 relative grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="mono text-ink-3 flex flex-wrap items-center gap-3">
            <span className="text-glow">
              {t("log").toUpperCase()} {pad(index + 1)}/{pad(rows.length)}
            </span>
            <span
              className={`chip border-transparent bg-linear-to-r ${KIND[row.kind] ?? KIND["Full-time"]} text-white`}
            >
              {row.kindLabel}
            </span>
            {row.current && (
              <span className="text-glow flex items-center gap-1.5">
                <span className="bg-neon size-1.5 animate-pulse rounded-full" /> {t("now")}
              </span>
            )}
          </p>
          {/* Company card: logo + name, kept apart from the title below. */}
          <div className="bg-ink/[0.04] ring-ink/10 mt-5 flex items-center gap-4 rounded-2xl p-2 pr-4 ring-1">
            <CompanyLogo row={row} large />
            <div className="min-w-0">
              <p className="mono text-ink-3 text-[0.625rem]">{t("company")}</p>
              <p className="text-ink mt-0.5 leading-snug">{row.company}</p>
            </div>
          </div>
          <h3 className="display from-ink to-glow console:text-[clamp(2.25rem,3.6vw,3.5rem)] mt-6 bg-linear-to-r via-[#cfe2ff] bg-clip-text text-[clamp(2.5rem,5vw,4.75rem)] text-transparent">
            {row.title}
          </h3>
          <dl className="mono text-ink-2 console:grid-cols-1 console:gap-2 mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["◷", row.period],
              ["⌖", row.location],
              ["⧗", dur(row.months)],
            ].map(([icon, v]) => (
              <div
                key={icon}
                className="bg-ink/[0.04] ring-ink/10 flex items-center gap-2 rounded-xl px-3 py-2 ring-1"
              >
                <span aria-hidden="true" className="text-glow">
                  {icon}
                </span>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Duration ring: this role against the longest one. */}
        <div
          aria-hidden="true"
          className="console:size-28 relative mx-auto grid size-36 place-items-center md:mx-0"
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(127,160,255,0.12)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#exp-ring)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - row.months / maxMonths)}
              className="ease-out-expo transition-[stroke-dashoffset] duration-1000"
            />
          </svg>
          <div className="text-center">
            <p className="display text-5xl tabular-nums">{row.months}</p>
            <p className="mono text-ink-3 text-[0.625rem]">{t("months")}</p>
          </div>
        </div>
      </div>

      <div className="border-line console:mt-0 console:grid-cols-1 console:gap-6 console:border-t-0 console:border-l console:pt-0 console:pl-10 relative mt-8 grid grid-cols-1 gap-8 border-t pt-6 lg:grid-cols-[1fr_16rem]">
        <div>
          <h4 className="mono text-ink-3">{t("highlights")}</h4>
          <ol className="mt-4 space-y-3">
            {row.points.map((p, k) => (
              <li
                key={p}
                className="text-ink-2 flex animate-[fadeUp_0.6s_var(--ease-out-expo)_both] gap-4"
                style={{ animationDelay: `${k * 70}ms` }}
              >
                <span className="mono text-glow mt-0.5">{pad(k + 1)}</span>
                {p}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h4 className="mono text-ink-3">{t("focus")}</h4>
          <ul className="mt-4 flex flex-wrap gap-2">
            {row.tags.map((tag) => (
              <li
                key={tag}
                className="bg-azure/15 ring-neon/40 rounded-full px-3 py-1 text-sm ring-1"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );

  return (
    <section
      ref={root}
      id="experience"
      aria-labelledby="experience-title"
      className="bg-bg relative z-10 overflow-x-clip"
    >
      {/* Shared gradient for every duration ring. */}
      <svg aria-hidden="true" className="absolute size-0">
        <defs>
          <linearGradient id="exp-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5fd3ff" />
            <stop offset="1" stopColor="#7b5cff" />
          </linearGradient>
        </defs>
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_35%_at_10%_10%,rgba(30,64,175,0.3),transparent_70%),radial-gradient(40%_30%_at_90%_60%,rgba(96,70,210,0.12),transparent_70%)]"
      />

      <div className="wrap relative pt-24 md:pt-36">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <SectionLabel index={3}>{t("label")}</SectionLabel>
            <p
              id="experience-title"
              data-reveal
              data-scramble
              className="display mt-6 text-[clamp(4rem,12vw,12rem)]"
            >
              {t("title")}
            </p>
            <p data-reveal className="text-ink-2 mt-4 max-w-xl text-lg">
              {t("hint")}
            </p>
          </div>
          <dl
            data-reveal
            className="bg-line grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
          >
            {[
              [pad(years) + "+", t("years")],
              [pad(rows.length), t("roles")],
              [pad(companies), t("orgs")],
              [person.company, t("current")],
            ].map(([v, label]) => (
              <div key={label} className="bg-bg-2 px-5 py-4">
                {/* Numbers stay big; the company name wraps at a smaller size instead of overflowing. */}
                <dd
                  className={`display from-ink to-glow bg-linear-to-br bg-clip-text text-transparent ${
                    /^\d/.test(v ?? "") ? "text-4xl" : "text-[1.75rem] leading-none text-balance"
                  }`}
                >
                  {v}
                </dd>
                <dt className="mono text-ink-3 mt-1">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Desktop: a pinned console that steps through the roles as you scroll. */}
      <div
        ref={stage}
        className="console:flex console:h-svh console:flex-col console:justify-center relative hidden"
      >
        <div className="wrap w-full space-y-4 pt-20">
          {timeline(true)}
          <div key={active} className="animate-[fadeUp_0.5s_var(--ease-out-expo)_both]">
            {detail(r, active)}
          </div>
        </div>
      </div>

      {/* Phones and tablets: the timeline, then every role as its own card. */}
      <div className="wrap console:hidden relative space-y-4 pt-12 pb-24">
        {timeline(false)}
        {rows.map((row, i) => (
          <div key={i} id={`exp-${i}`} data-reveal>
            {detail(row, i)}
          </div>
        ))}
      </div>
      <div className="console:block hidden pb-24" />
    </section>
  );
}
