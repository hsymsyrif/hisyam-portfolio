"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SECTIONS } from "@/content/sections";
import { pad } from "@/lib/format";

/** Label whose letters roll up to a lit copy on hover or keyboard focus. */
function Roll({ text }: { text: string }) {
  return (
    <span className="relative inline-flex overflow-hidden leading-[1.25]">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="flex">
        {[...text].map((c, k) => (
          <span
            key={k}
            className="ease-out-expo relative inline-block transition-transform duration-500 group-hover/link:-translate-y-full group-focus-visible/link:-translate-y-full motion-reduce:transition-none"
            style={{ transitionDelay: `${k * 16}ms` }}
          >
            <span className="block whitespace-pre">{c}</span>
            <span className="text-glow absolute top-full left-0 block whitespace-pre">{c}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Desktop link bar: cursor spotlight, hover lens, sliding active capsule, rolling labels, a progress
 * line per section, page progress along the base (`--g` on `podRef`), and a preview card on hover.
 * The parent writes `--p` into each `bars[i]` and `--g` into `podRef` from its scroll triggers.
 */
export function CommandDeck({
  active,
  go,
  podRef,
  bars,
}: {
  active: number;
  go: (id: string) => (e: React.MouseEvent) => void;
  podRef: React.RefObject<HTMLDivElement | null>;
  bars: React.RefObject<(HTMLSpanElement | null)[]>;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const deck = useRef<HTMLDivElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({ x: 0, w: 0 });
  // Hovered/focused link: its index, lens box, the card's centre and the deck width (for clamping).
  const [lens, setLens] = useState({ i: -1, on: false, x: 0, w: 0, cx: 0, dw: 0 });

  // Sliding capsule under the active link; labels change width with the locale.
  useEffect(() => {
    const measure = () => {
      const el = links.current[active];
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : { x: 0, w: 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, locale]);

  const aim = (i: number, el: HTMLAnchorElement) => {
    const a = el.getBoundingClientRect();
    const d = deck.current!.getBoundingClientRect();
    setLens({
      i,
      on: true,
      x: el.offsetLeft,
      w: el.offsetWidth,
      cx: a.left + a.width / 2 - d.left,
      dw: d.width,
    });
  };

  return (
    <div
      ref={deck}
      className="pointer-events-auto relative hidden xl:block"
      onPointerLeave={() => setLens((l) => ({ ...l, on: false }))}
    >
      <div
        ref={podRef}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
          e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
        }}
        className="nav-shell beam-border group/pod ease-out-expo relative flex h-14 items-center overflow-hidden rounded-full px-1.5 transition-all duration-500 group-data-[compact=true]/nav:h-12"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/pod:opacity-100"
          style={{
            background:
              "radial-gradient(140px circle at var(--mx, 50%) var(--my, 50%), rgba(95,211,255,0.18), transparent 70%)",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-[navsweep_7s_ease-in-out_infinite] bg-linear-to-r from-transparent via-white/[0.07] to-transparent motion-reduce:hidden"
        />
        {/* Overall page progress along the base, with a glowing head. */}
        <span
          aria-hidden="true"
          className="bg-ink/[0.06] pointer-events-none absolute inset-x-6 bottom-0 h-px"
        >
          <span className="from-azure via-neon absolute inset-0 origin-left [transform:scaleX(var(--g,0))] bg-linear-to-r to-[#b9a8ff]" />
          <span className="absolute top-1/2 [left:calc(var(--g,0)*100%)] size-1.5 -translate-1/2 rounded-full bg-white shadow-[0_0_10px_2px_#5fd3ff]" />
        </span>

        <ul className="relative flex items-center">
          {/* Hover lens: a light outline that glides to whatever the pointer is over. */}
          <span
            aria-hidden="true"
            className="bg-ink/[0.05] ring-glow/30 ease-out-expo absolute inset-y-1.5 rounded-full ring-1 transition-all duration-300"
            style={{
              transform: `translateX(${lens.x}px)`,
              width: lens.w,
              opacity: lens.on && lens.i !== active ? 1 : 0,
            }}
          />
          {/* Active section: a glass capsule with a lit top edge. */}
          <span
            aria-hidden="true"
            className="from-azure/45 to-azure/10 ring-neon/45 ease-out-expo absolute inset-y-1 rounded-full bg-linear-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_24px_rgba(61,107,255,0.45)] ring-1 transition-all duration-500"
            style={{ transform: `translateX(${pill.x}px)`, width: pill.w, opacity: pill.w ? 1 : 0 }}
          >
            <span className="absolute inset-x-3 -top-px h-px bg-linear-to-r from-transparent via-[#bfeeff] to-transparent" />
          </span>
          {SECTIONS.map((id, i) => (
            <li key={id}>
              <a
                ref={(el) => void (links.current[i] = el)}
                href={`#${id}`}
                onClick={go(id)}
                onPointerEnter={(e) => aim(i, e.currentTarget)}
                onFocus={(e) => aim(i, e.currentTarget)}
                onBlur={() => setLens((l) => ({ ...l, on: false }))}
                aria-current={i === active ? "location" : undefined}
                aria-describedby={lens.on && lens.i === i ? "nav-preview" : undefined}
                className={`group/link mono relative flex h-11 items-center gap-1.5 rounded-full px-3 text-[0.6875rem] whitespace-nowrap transition-colors group-data-[compact=true]/nav:h-10 ${
                  i === active ? "text-ink" : "text-ink-3 hover:text-ink"
                }`}
              >
                <span
                  className={`hidden 2xl:inline ${i === active ? "text-glow" : "text-ink-3/60"}`}
                >
                  {pad(i + 1)}
                </span>
                <Roll text={t(id)} />
                <span
                  aria-hidden="true"
                  className="bg-ink/[0.06] absolute inset-x-3 bottom-1.5 h-px overflow-hidden rounded-full"
                >
                  <span
                    ref={(el) => void (bars.current[i] = el)}
                    className="from-azure to-neon block h-full origin-left [transform:scaleX(var(--p,0))] bg-linear-to-r"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Preview card under the hovered link. */}
      <div
        id="nav-preview"
        role="tooltip"
        className={`nav-shell ease-out-expo pointer-events-none absolute top-full mt-3 w-72 -translate-x-1/2 overflow-hidden rounded-2xl p-4 transition-[opacity,transform,left] duration-500 ${
          lens.on ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-95 opacity-0"
        }`}
        style={{ left: Math.min(Math.max(lens.cx, 144), lens.dw - 144) }}
      >
        <span
          aria-hidden="true"
          className="via-glow absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent to-transparent"
        />
        <span
          aria-hidden="true"
          className="absolute -top-10 -right-10 size-32 rounded-full bg-[radial-gradient(circle,rgba(61,91,255,0.45),transparent_70%)]"
        />
        {lens.i >= 0 && (
          <>
            <p className="mono text-ink-3 relative flex items-center justify-between text-[0.625rem]">
              <span>
                <span className="text-glow">{pad(lens.i + 1)}</span> / {pad(SECTIONS.length)}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`size-1.5 rounded-full ${lens.i === active ? "bg-neon animate-pulse" : lens.i < active ? "bg-signal-text" : "bg-ink/30"}`}
                />
                {lens.i === active
                  ? t("stateNow")
                  : lens.i < active
                    ? t("stateDone")
                    : t("stateNext")}
              </span>
            </p>
            <p className="display relative mt-2 text-3xl leading-none">{t(SECTIONS[lens.i]!)}</p>
            <p className="text-ink-2 relative mt-2 text-sm">{t(`desc.${SECTIONS[lens.i]!}`)}</p>
            <p className="mono text-glow relative mt-3 flex items-center gap-2 text-[0.625rem]">
              <kbd className="ring-glow/40 rounded px-1.5 ring-1">↵</kbd>
              {t("jump")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
