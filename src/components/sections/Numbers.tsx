"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { pad } from "@/lib/format";

const YEARS = new Date().getFullYear() - 2020;

// Paired by index with numbers.items in the messages.
const VALUES = [
  { n: 50, suffix: "+", code: "CLT" },
  { n: 15, suffix: "", code: "BNK" },
  { n: 7, suffix: "", code: "ORG" },
  { n: YEARS, suffix: "+", code: "YRS" },
  { n: 10, suffix: "", code: "MNT" },
  { n: 1, suffix: "", code: "PUB" },
  { n: 3.68, suffix: "", code: "GPA", decimals: 2 },
];

const CYAN = "#5fd3ff";
const BLUE = "#3d5bff";

/* Small animated readouts, one per metric. [data-viz-item] pops in, [data-viz-draw] draws on. */

function Viz({ i }: { i: number }) {
  const item = { "data-viz-item": "" };
  const draw = (len = 1) => ({
    "data-viz-draw": len,
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 0,
  });
  switch (i) {
    case 0: // 50 clients: a 10 × 5 matrix lighting up.
      return (
        <>
          {Array.from({ length: 50 }, (_, k) => (
            <circle
              key={k}
              {...item}
              cx={21 + (k % 10) * 22}
              cy={36 + Math.floor(k / 10) * 22}
              r={5}
              fill={k % 7 === 3 ? "#ffffff" : CYAN}
            />
          ))}
        </>
      );
    case 1: {
      // 15 projects stacked over 6 months.
      const per = [2, 3, 2, 3, 2, 3];
      return (
        <>
          {per.map((c, m) => (
            <g key={m}>
              {Array.from({ length: c }, (_, b) => (
                <rect
                  key={b}
                  {...item}
                  x={22 + m * 35}
                  y={122 - b * 22}
                  width={26}
                  height={16}
                  rx={4}
                  fill={b === c - 1 ? CYAN : BLUE}
                />
              ))}
              <text
                x={35 + m * 35}
                y={156}
                textAnchor="middle"
                className="fill-ink-3 font-mono text-[9px]"
              >
                M{m + 1}
              </text>
            </g>
          ))}
        </>
      );
    }
    case 2: {
      // 7 organisations orbiting a core.
      const nodes = Array.from({ length: 7 }, (_, k) => {
        const a = (k / 7) * Math.PI * 2 - Math.PI / 2;
        return [120 + Math.cos(a) * 58, 80 + Math.sin(a) * 58] as const;
      });
      return (
        <g
          className="animate-[spin_40s_linear_infinite] motion-reduce:animate-none"
          style={{ transformOrigin: "120px 80px" }}
        >
          <circle
            cx={120}
            cy={80}
            r={58}
            fill="none"
            stroke={CYAN}
            strokeOpacity={0.25}
            strokeDasharray="3 5"
          />
          {nodes.map(([x, y], k) => (
            <path
              key={`l${k}`}
              {...draw()}
              d={`M120 80L${x} ${y}`}
              stroke={CYAN}
              strokeOpacity={0.45}
            />
          ))}
          <circle cx={120} cy={80} r={15} fill={BLUE} />
          <circle cx={120} cy={80} r={22} fill="none" stroke={BLUE} strokeOpacity={0.5} />
          {nodes.map(([x, y], k) => (
            <circle key={k} {...item} cx={x} cy={y} r={8} fill={k === 0 ? "#ffffff" : CYAN} />
          ))}
        </g>
      );
    }
    case 3: {
      // A timeline from 2020 to now.
      const n = YEARS + 1;
      const x = (k: number) => 22 + (k * 196) / (n - 1);
      return (
        <>
          <path d="M22 84H218" stroke={CYAN} strokeOpacity={0.15} strokeWidth={2} />
          <path {...draw()} d="M22 84H218" stroke={CYAN} strokeWidth={2} />
          {Array.from({ length: n }, (_, k) => (
            <g key={k}>
              <circle
                {...item}
                cx={x(k)}
                cy={84}
                r={k === n - 1 ? 8 : 5}
                fill={k === n - 1 ? "#ffffff" : CYAN}
              />
              <text
                x={x(k)}
                y={k % 2 ? 62 : 112}
                textAnchor="middle"
                className="fill-ink-3 font-mono text-[9px]"
              >
                {`'${pad(20 + k)}`}
              </text>
            </g>
          ))}
          <circle
            cx={x(n - 1)}
            cy={84}
            r={14}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={0.5}
            className="origin-center animate-ping [transform-box:fill-box] motion-reduce:hidden"
          />
        </>
      );
    }
    case 4: // 10 students.
      return (
        <>
          {Array.from({ length: 10 }, (_, k) => {
            const cx = 32 + (k % 5) * 44;
            const cy = 46 + Math.floor(k / 5) * 62;
            return (
              <g key={k} {...item}>
                <circle cx={cx} cy={cy} r={8} fill={k === 4 ? "#ffffff" : CYAN} />
                <path d={`M${cx - 14} ${cy + 30}a14 14 0 0 1 28 0`} fill={BLUE} />
              </g>
            );
          })}
        </>
      );
    case 5: // One published paper.
      return (
        <>
          <rect
            x={66}
            y={14}
            width={108}
            height={136}
            rx={10}
            fill="rgba(61,91,255,0.12)"
            stroke={CYAN}
            strokeOpacity={0.5}
          />
          {[0.8, 0.95, 0.6, 0.9, 0.75, 0.85, 0.5].map((w, k) => (
            <rect
              key={k}
              {...item}
              x={80}
              y={32 + k * 14}
              width={80 * w}
              height={5}
              rx={2.5}
              fill={k === 0 ? "#ffffff" : CYAN}
              fillOpacity={k === 0 ? 1 : 0.6}
            />
          ))}
          <g {...item}>
            <circle cx={170} cy={128} r={22} fill={BLUE} stroke="#ffffff" strokeOpacity={0.6} />
            <text
              x={170}
              y={132}
              textAnchor="middle"
              className="fill-white font-mono text-[10px] font-bold"
            >
              IEEE
            </text>
          </g>
        </>
      );
    default: {
      // GPA on a 270° gauge.
      const share = 0.75 * (3.68 / 4);
      return (
        <g transform="rotate(135 120 86)">
          <circle
            cx={120}
            cy={86}
            r={62}
            fill="none"
            stroke={CYAN}
            strokeOpacity={0.15}
            strokeWidth={10}
            pathLength={1}
            strokeDasharray="0.75 1"
            strokeLinecap="round"
          />
          <circle
            data-viz-draw={share}
            cx={120}
            cy={86}
            r={62}
            fill="none"
            stroke="url(#gpa)"
            strokeWidth={10}
            pathLength={1}
            strokeDasharray={`${share} 1`}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gpa" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={BLUE} />
              <stop offset="1" stopColor={CYAN} />
            </linearGradient>
          </defs>
        </g>
      );
    }
  }
}

/**
 * The metrics as a deck of holographic telemetry cards. On desktop the section
 * pins and the deck travels sideways, each card turning on a curve as it passes
 * and playing its readout when it arrives; on phones the cards stack.
 */
export function Numbers() {
  const t = useTranslations("numbers");
  const items = t.raw("items") as string[];
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-metric]");

      const play = (card: HTMLElement) => {
        const num = card.querySelector<HTMLElement>("[data-count]")!;
        const end = Number(num.dataset.count);
        const decimals = Number(num.dataset.decimals ?? 0);
        const v = { n: 0 };
        gsap.to(v, {
          n: end,
          duration: 1.8,
          ease: "expo.out",
          onUpdate: () => void (num.textContent = v.n.toFixed(decimals)),
        });
        gsap.fromTo(
          card.querySelectorAll("[data-viz-item]"),
          { opacity: 0.12, scale: 0.4, transformOrigin: "50% 50%" },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(2)",
            stagger: { each: 0.03, from: "start" },
          },
        );
        card.querySelectorAll<SVGElement>("[data-viz-draw]").forEach((el) => {
          const len = Number(el.dataset.vizDraw);
          gsap.fromTo(
            el,
            { strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 1.6, ease: "expo.out" },
          );
        });
        gsap.fromTo(
          card.querySelector("[data-meter]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.6, ease: "expo.out" },
        );
      };

      const reset = (card: HTMLElement) => {
        card.querySelector<HTMLElement>("[data-count]")!.textContent = "0";
        gsap.set(card.querySelectorAll("[data-viz-item]"), {
          opacity: 0.12,
          scale: 0.4,
          transformOrigin: "50% 50%",
        });
        card
          .querySelectorAll<SVGElement>("[data-viz-draw]")
          .forEach((el) => gsap.set(el, { strokeDashoffset: el.dataset.vizDraw }));
        gsap.set(card.querySelector("[data-meter]"), { scaleX: 0 });
      };

      const mm = gsap.matchMedia();

      // Desktop: pinned sideways travel.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const dist = () => el.scrollWidth - window.innerWidth;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        tl.to(el, { x: () => -dist() }, 0)
          .to("[data-numbers-ghost]", { x: () => -dist() * 0.35 }, 0)
          .fromTo("[data-numbers-rail]", { scaleX: 0 }, { scaleX: 1 }, 0)
          .to("[data-numbers-head]", { left: "100%" }, 0);

        cards.forEach((card) => {
          reset(card);
          // Turn on a concave curve: facing in from the right, square at the centre, away to the left.
          gsap.fromTo(
            card,
            { rotateY: -26, scale: 0.88, transformPerspective: 1300 },
            {
              keyframes: { "50%": { rotateY: 0, scale: 1 }, "100%": { rotateY: 26, scale: 0.88 } },
              ease: "none",
              scrollTrigger: {
                trigger: card,
                containerAnimation: tl,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
          ScrollTrigger.create({
            trigger: card,
            containerAnimation: tl,
            start: "left 82%",
            once: true,
            onEnter: () => play(card),
          });
        });
      });

      // Phones: stacked, each card plays as it scrolls in.
      mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
        cards.forEach((card) => {
          reset(card);
          ScrollTrigger.create({
            trigger: card,
            start: "top 80%",
            once: true,
            onEnter: () => play(card),
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="numbers"
      aria-labelledby="numbers-title"
      className="bg-bg relative z-10 overflow-hidden md:h-svh"
    >
      {/* Atmosphere: glows, a moving perspective floor, and a giant ghost line behind the deck. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_20%_40%,rgba(42,92,255,0.32),transparent_70%),radial-gradient(45%_45%_at_85%_70%,rgba(95,211,255,0.14),transparent_70%),radial-gradient(40%_40%_at_60%_0%,rgba(123,92,255,0.18),transparent_70%)]" />
        <div className="absolute inset-x-[-20%] bottom-[-8%] h-[55%] [perspective:600px]">
          <div className="size-full origin-bottom [transform:rotateX(62deg)] animate-[floor_6s_linear_infinite] [background-image:linear-gradient(rgba(95,211,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(95,211,255,0.22)_1px,transparent_1px)] [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)] [background-size:56px_56px] opacity-60 motion-reduce:animate-none" />
        </div>
        <p
          data-numbers-ghost
          className="display absolute bottom-[6vh] left-[4vw] text-[clamp(8rem,26vw,30rem)] leading-none whitespace-nowrap text-transparent opacity-50 [-webkit-text-stroke:1px_rgba(127,160,255,0.22)]"
        >
          2020 → NOW · 2020 → NOW
        </p>
      </div>

      <div
        ref={track}
        className="relative flex flex-col gap-6 px-[clamp(1rem,4vw,3rem)] py-24 md:h-full md:w-max md:flex-row md:items-center md:gap-7 md:py-0 md:pr-[12vw]"
      >
        {/* Intro panel. */}
        <div className="flex flex-col justify-center md:w-[40vw] md:min-w-[26rem] md:pr-10">
          <SectionLabel index={2}>{t("label")}</SectionLabel>
          <p
            id="numbers-title"
            className="display mt-6 text-[clamp(4.5rem,10vw,10.5rem)] leading-[0.85]"
          >
            <span className="block">{t("title1")}</span>
            <span className="from-glow via-signal-text block bg-linear-to-r to-[#7b5cff] bg-clip-text text-transparent">
              {t("title2")}
            </span>
          </p>
          <p className="text-ink-2 mt-6 max-w-md text-lg">{t("lead")}</p>
          <p className="mono text-glow mt-8 hidden items-center gap-3 md:flex">
            <span className="bg-neon/25 relative h-px w-16 overflow-hidden">
              <span className="bg-neon absolute inset-y-0 left-0 w-1/2 animate-[scan_1.8s_ease-in-out_infinite] motion-reduce:animate-none" />
            </span>
            {t("scroll")}
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:flex md:gap-7">
          {VALUES.map((v, i) => (
            <li
              key={v.code}
              data-metric
              className={`group ring-signal-text/20 relative flex flex-col overflow-hidden rounded-[2rem] bg-linear-to-b from-[#0e1d4a]/80 to-[#060d24]/90 p-6 shadow-[0_30px_80px_-30px_rgba(42,92,255,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 backdrop-blur-md md:h-[min(68vh,36rem)] md:w-[clamp(18rem,23vw,24rem)] md:shrink-0 ${
                i % 2 ? "md:mt-[8vh]" : "md:mb-[8vh]"
              }`}
            >
              {/* Top light and corner ticks. */}
              <span
                aria-hidden="true"
                className="via-glow absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent to-transparent"
              />
              <span
                aria-hidden="true"
                className="border-glow/50 absolute top-4 right-4 size-3 border-t border-r"
              />
              <span
                aria-hidden="true"
                className="border-glow/50 absolute bottom-4 left-4 size-3 border-b border-l"
              />

              <p className="mono text-ink-3 flex items-center justify-between text-[0.625rem]">
                <span>
                  <span className="text-glow">{pad(i + 1)}</span> / {pad(VALUES.length)}
                </span>
                <span className="ring-neon/30 flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1">
                  <span className="bg-neon size-1 animate-pulse rounded-full" />
                  {v.code}
                </span>
              </p>

              <div
                aria-hidden="true"
                className="relative my-4 grid min-h-36 flex-1 place-items-center"
              >
                <span className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(61,91,255,0.35),transparent_70%)] blur-xl" />
                <svg
                  viewBox="0 0 240 160"
                  className="relative w-full max-w-[17rem] overflow-visible"
                >
                  <Viz i={i} />
                </svg>
              </div>

              <p className="display to-glow bg-linear-to-br from-white via-[#dce9ff] bg-clip-text text-[clamp(4rem,6.4vw,6.75rem)] leading-[0.85] text-transparent tabular-nums">
                <span data-count={v.n} data-decimals={v.decimals}>
                  {v.n.toFixed(v.decimals ?? 0)}
                </span>
                {v.suffix && <span className="text-neon">{v.suffix}</span>}
              </p>
              <p className="mono text-ink-2 mt-3">{items[i]}</p>
              <span
                aria-hidden="true"
                className="bg-ink/10 mt-5 block h-0.5 overflow-hidden rounded-full"
              >
                <span
                  data-meter
                  className="from-azure to-neon block h-full origin-left bg-linear-to-r"
                />
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Desktop: a 2020 → now rail that fills as the deck travels. */}
      <div
        aria-hidden="true"
        className="mono text-ink-3 pointer-events-none absolute right-[clamp(1rem,4vw,3rem)] bottom-7 left-[max(30rem,36vw)] hidden items-center gap-4 text-[0.625rem] md:flex"
      >
        <span>2020</span>
        <span className="bg-ink/10 relative h-px flex-1">
          <span
            data-numbers-rail
            className="from-azure to-neon absolute inset-0 origin-left bg-linear-to-r"
          />
          <span
            data-numbers-head
            className="absolute top-1/2 left-0 size-2.5 -translate-1/2 rounded-full bg-white shadow-[0_0_14px_#5fd3ff]"
          />
        </span>
        <span className="text-glow">NOW</span>
      </div>
    </section>
  );
}
