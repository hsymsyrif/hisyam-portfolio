"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { socials } from "@/content/profile";
import { SECTIONS } from "@/content/sections";
import { lockScroll, ScrollTrigger, scrollToId, useGSAP } from "@/lib/motion";
import { Logo } from "@/components/ui/Logo";
import { REPLAY_EVENT } from "@/components/intro/Intro";
import { pad } from "@/lib/format";
import { CommandDeck } from "./nav/CommandDeck";
import { MenuOverlay } from "./nav/MenuOverlay";
import { Palette, type Command } from "./nav/Palette";
import { decodeTo, useJakartaTime } from "./nav/effects";

const RING = 2 * Math.PI * 22;

/** Fixed command bar: brand pod, desktop link deck or phone section pod, and actions. */
export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const other = locale === "en" ? "id" : "en";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [active, setActive] = useState(-1);
  const pod = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  // Per-section progress lines under the links, and the one in the compact pod.
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const secBar = useRef<HTMLSpanElement>(null);
  const openRef = useRef(false);
  const clock = useJakartaTime(true);

  // Full-screen menu (phones/tablets).
  useEffect(() => {
    openRef.current = open || palette;
    if (!open) return;
    const toggle = button.current;
    lockScroll(true);
    const id = setTimeout(() => firstLink.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
      toggle?.focus();
    };
  }, [open, palette]);

  // ⌘K / Ctrl+K or "/" opens the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.(
        "input, textarea, [contenteditable]",
      );
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(false);
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useGSAP(() => {
    SECTIONS.forEach((id, i) => {
      if (!document.getElementById(id)) return;
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: "top 50%",
        end: "bottom 50%",
        // The nav mounts before the pinned sections; measure after their spacers exist.
        refreshPriority: -1,
        onToggle: (self) => self.isActive && setActive(i),
        onUpdate: (self) => {
          const p = self.progress.toFixed(3);
          bars.current[i]?.style.setProperty("--p", p);
          if (self.isActive) secBar.current?.style.setProperty("--p", p);
        },
        onLeave: () => {
          bars.current[i]?.style.setProperty("--p", "1");
          // A fast jump can skip a section's active state; passing it still makes it the latest one.
          setActive((a) => Math.max(a, i));
        },
        onLeaveBack: () => {
          bars.current[i]?.style.setProperty("--p", "0");
          // Back above this section: the previous one is current again (Numbers sits between About and Experience).
          setActive((a) => (a === i ? i - 1 : a));
        },
      });
    });
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (ring.current) ring.current.style.strokeDashoffset = String(RING * (1 - self.progress));
        pod.current?.style.setProperty("--g", self.progress.toFixed(4));
        // Condense while reading down; open up again on the way back.
        const el = header.current;
        if (!el || openRef.current) return;
        el.dataset.compact = String(
          self.direction === 1 && self.scroll() > window.innerHeight * 0.6,
        );
      },
    });
  });

  // Compact label (phones/tablets) decodes to the new section.
  useEffect(() => {
    if (label.current)
      decodeTo(label.current, (active < 0 ? t("intro") : t(SECTIONS[active]!)).toUpperCase());
  }, [active, t]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    requestAnimationFrame(() => scrollToId(id));
  };

  const commands: Command[] = useMemo(
    () => [
      ...SECTIONS.map((id, i) => ({
        id,
        group: t("groupNavigate"),
        label: t(id),
        hint: pad(i + 1),
        run: () => scrollToId(id),
      })),
      {
        id: "lang",
        group: t("groupActions"),
        label: t("actSwitch"),
        hint: other.toUpperCase(),
        run: () => router.replace("/", { locale: other }),
      },
      {
        id: "replay",
        group: t("groupActions"),
        label: t("actReplay"),
        hint: "↺",
        run: () => window.dispatchEvent(new Event(REPLAY_EVENT)),
      },
      {
        id: "top",
        group: t("groupActions"),
        label: t("actTop"),
        hint: "↑",
        run: () => scrollToId("story"),
      },
      ...[
        ...socials,
        { id: "ieee", label: "IEEE Xplore", href: "https://ieeexplore.ieee.org/document/10956832" },
      ].map((s) => ({
        id: s.id,
        group: t("groupLinks"),
        label: s.label,
        hint: "↗",
        run: () => window.open(s.href, "_blank", "noopener,noreferrer"),
      })),
    ],
    [t, other, router],
  );

  const indexLabel = pad(Math.max(0, active + 1));

  return (
    <>
      <header
        ref={header}
        data-compact="false"
        className="group/nav ease-out-expo pointer-events-none fixed inset-x-0 top-3 z-[70] px-3 transition-[top] duration-500 data-[compact=true]:top-2 sm:top-4"
      >
        <nav
          aria-label={t("primary")}
          className="mx-auto flex max-w-[100rem] items-center justify-between gap-2"
        >
          {/* Pod 1 · brand: logo in a ring that fills with page progress, plus a live readout. */}
          <a
            href="#home"
            onClick={go("home")}
            data-cursor="Home"
            data-magnetic
            className="nav-shell ease-out-expo pointer-events-auto flex h-14 shrink-0 items-center gap-3 rounded-full p-1 transition-all duration-500 group-data-[compact=true]/nav:h-12 sm:pr-5"
          >
            <span className="ease-out-expo relative grid size-12 place-items-center transition-transform duration-500 group-data-[compact=true]/nav:scale-90">
              <svg viewBox="0 0 48 48" aria-hidden="true" className="absolute inset-0 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="22"
                  fill="none"
                  stroke="rgba(127,160,255,0.15)"
                  strokeWidth="2"
                />
                <circle
                  ref={ring}
                  cx="24"
                  cy="24"
                  r="22"
                  fill="none"
                  stroke="url(#nav-ring)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={RING}
                  strokeDashoffset={RING}
                />
                <defs>
                  <linearGradient id="nav-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#5fd3ff" />
                    <stop offset="0.5" stopColor="#3d5bff" />
                    <stop offset="1" stopColor="#7b5cff" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="bg-orb grid size-9 place-items-center rounded-full shadow-[0_0_20px_rgba(61,107,255,0.55),inset_0_1px_0_rgba(255,255,255,0.25)]">
                <Logo className="h-[18px] w-auto text-white" />
              </span>
            </span>
            <span className="hidden leading-none sm:block">
              <span className="display block text-xl tracking-wide">Hisyam</span>
              <span className="mono text-ink-3 mt-1 flex items-center gap-1.5 text-[0.5625rem]">
                <span className="relative flex size-1.5">
                  <span className="bg-neon absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden" />
                  <span className="bg-neon relative size-1.5 rounded-full" />
                </span>
                <span className="text-glow">{t("status").toUpperCase()}</span>
                <span className="tabular-nums">JKT {clock}</span>
              </span>
            </span>
            <span className="sr-only">Muhammad Hisyam Syarif</span>
          </a>

          <CommandDeck active={active} go={go} podRef={pod} bars={bars} />

          {/* Pod 2 · phones/tablets: where you are, with a dot map of every section. */}
          <div
            aria-hidden="true"
            className="nav-shell ease-out-expo pointer-events-auto relative flex h-14 min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-full px-4 transition-all duration-500 group-data-[compact=true]/nav:h-12 sm:max-w-sm sm:flex-none xl:hidden"
          >
            <span className="mono text-ink-3 shrink-0">
              [<span className="text-glow tabular-nums">{indexLabel}</span>]
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span ref={label} className="mono text-ink truncate text-[0.6875rem]">
                {t("intro").toUpperCase()}
              </span>
              <span className="flex items-center gap-1">
                {SECTIONS.map((id, i) => (
                  <span
                    key={id}
                    className={`ease-out-expo relative h-1 overflow-hidden rounded-full transition-all duration-500 ${
                      i === active
                        ? "bg-ink/15 w-8"
                        : i < active
                          ? "bg-neon w-1.5"
                          : "bg-ink/15 w-1.5"
                    }`}
                  >
                    {i === active && (
                      <span
                        ref={secBar}
                        className="from-azure to-neon absolute inset-0 origin-left [transform:scaleX(var(--p,0))] bg-linear-to-r"
                      />
                    )}
                  </span>
                ))}
              </span>
            </span>
          </div>

          {/* Pod 3 · actions. */}
          <div className="nav-shell ease-out-expo pointer-events-auto flex h-14 shrink-0 items-center gap-1 rounded-full p-1 transition-all duration-500 group-data-[compact=true]/nav:h-12">
            <div
              role="group"
              aria-label={t("language")}
              className="mono bg-ink/5 ring-ink/10 relative hidden h-full grid-cols-2 items-center rounded-full p-1 ring-1 sm:grid"
            >
              <span
                aria-hidden="true"
                className={`bg-signal ease-out-expo absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full shadow-[0_0_16px_rgba(42,92,255,0.7)] transition-transform duration-500 ${
                  locale === "id" ? "translate-x-full" : ""
                }`}
              />
              {(["en", "id"] as const).map((l) =>
                l === locale ? (
                  <span
                    key={l}
                    aria-current="true"
                    className="text-signal-ink relative grid h-full min-w-10 place-items-center px-2"
                  >
                    {l.toUpperCase()}
                  </span>
                ) : (
                  <Link
                    key={l}
                    href="/"
                    locale={l}
                    className="text-ink-2 hover:text-ink relative grid h-full min-w-10 place-items-center px-2 transition-colors"
                  >
                    {l.toUpperCase()}
                  </Link>
                ),
              )}
            </div>

            <button
              type="button"
              onClick={() => setPalette(true)}
              data-cursor={t("search")}
              aria-label={`${t("search")} (Ctrl + K)`}
              className="mono text-ink-2 hover:bg-ink/5 hover:text-ink flex h-full items-center gap-2 rounded-full px-3 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <kbd className="ring-ink/15 hidden rounded-md px-1.5 text-[0.625rem] whitespace-nowrap ring-1 md:inline">
                ⌘K
              </kbd>
            </button>

            <button
              ref={button}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-menu"
              data-cursor={open ? t("close") : t("menu")}
              data-magnetic
              className="group bg-ink text-bg flex h-full items-center gap-3 rounded-full pr-1.5 pl-1.5 transition-colors hover:bg-[#cfe6ff] sm:pl-4 xl:hidden"
            >
              <span className="mono hidden sm:inline">{open ? t("close") : t("menu")}</span>
              <span className="sr-only sm:hidden">{open ? t("close") : t("menu")}</span>
              <span
                aria-hidden="true"
                className={`bg-bg ease-out-expo grid size-8 grid-cols-2 place-items-center gap-1 rounded-full p-2 transition-transform duration-500 ${open ? "rotate-45" : "group-hover:rotate-90"}`}
              >
                {[0, 1, 2, 3].map((k) => (
                  <span
                    key={k}
                    className={`ease-out-expo size-1.5 rounded-full transition-all duration-500 ${open ? (k % 3 === 0 ? "bg-glow scale-150" : "bg-ink scale-150") : "bg-ink"}`}
                  />
                ))}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {palette && <Palette commands={commands} onClose={() => setPalette(false)} />}

      <MenuOverlay open={open} active={active} go={go} firstLink={firstLink} />
    </>
  );
}
