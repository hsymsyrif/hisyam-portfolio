"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { NODES, SCENARIOS, type NodeId, type Step, type StepKind } from "@/content/playground";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { pad } from "@/lib/format";

type NodeState = "idle" | "busy" | "ok" | "err";
type Pos = { x: number; y: number };

/** Node positions in % of the stage: a row on wide screens, a column on phones. */
const LAYOUT: Record<"wide" | "tall", Record<NodeId, Pos>> = {
  wide: {
    app: { x: 12, y: 38 },
    gateway: { x: 37, y: 38 },
    esb: { x: 62, y: 38 },
    core: { x: 88, y: 38 },
    merchant: { x: 62, y: 80 },
  },
  tall: {
    app: { x: 30, y: 14 },
    gateway: { x: 30, y: 38 },
    esb: { x: 30, y: 62 },
    core: { x: 30, y: 87 },
    merchant: { x: 74, y: 62 },
  },
};
const EDGES: [NodeId, NodeId][] = [
  ["app", "gateway"],
  ["gateway", "esb"],
  ["esb", "core"],
  ["esb", "merchant"],
];

const KIND_COLOR: Record<StepKind, string> = {
  req: "#5fd3ff",
  res: "#6fe3a0",
  cb: "#a99bff",
  err: "#ff6b8a",
  wait: "#ffd36f",
};

const ICONS: Record<NodeId, React.ReactNode> = {
  app: <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2" />,
  gateway: <path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3zM9 12l2 2 4-4" />,
  esb: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="5" cy="6" r="1.8" />
      <circle cx="19" cy="6" r="1.8" />
      <circle cx="5" cy="18" r="1.8" />
      <circle cx="19" cy="18" r="1.8" />
      <path d="m6.5 7.2 3.6 3.1M17.5 7.2l-3.6 3.1M6.5 16.8l3.6-3.1M17.5 16.8l-3.6-3.1" />
    </>
  ),
  core: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.6" />
      <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </>
  ),
  merchant: (
    <path d="M4 9 5.5 4h13L20 9M4 9h16M4 9v1a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0V9M5 12v8h14v-8M10 20v-5h4v5" />
  ),
};

/** JSON with keys, strings, numbers and booleans tinted. */
function Json({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2);
  const parts = text.split(
    /("(?:\\.|[^"\\])*"(?:\s*:)?|\b-?\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g,
  );
  return (
    <pre className="text-ink-3 overflow-x-auto font-mono text-[0.75rem] leading-relaxed">
      {parts.map((p, i) => {
        if (!p) return null;
        const cls = /^".*":$/.test(p.replace(/\s/g, ""))
          ? "text-glow"
          : p.startsWith('"')
            ? "text-[#dbe6ff]"
            : /^(true|false|null)$/.test(p)
              ? "text-[#ffd36f]"
              : /^-?\d/.test(p)
                ? "text-[#a99bff]"
                : "";
        return (
          <span key={i} className={cls}>
            {p}
          </span>
        );
      })}
    </pre>
  );
}

type LogEntry = { at: number; step: Step; index: number };

export function Playground() {
  const t = useTranslations("playground");
  const locale = useLocale() as Locale;
  const [scenario, setScenario] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [states, setStates] = useState<Record<NodeId, NodeState>>({
    app: "idle",
    gateway: "idle",
    esb: "idle",
    core: "idle",
    merchant: "idle",
  });
  const [edge, setEdge] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const packet = useRef<HTMLSpanElement>(null);
  const run = useRef(0); // bumped to cancel a run in flight
  const logBox = useRef<HTMLOListElement>(null);

  const wide = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 640px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true,
  );

  useEffect(() => {
    logBox.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [log.length]);

  const layout = LAYOUT[wide ? "wide" : "tall"];
  const steps = SCENARIOS[scenario]!.steps;

  const reset = () => {
    run.current++;
    gsap.killTweensOf(packet.current);
    if (packet.current) packet.current.style.opacity = "0";
    setRunning(false);
    setStates({ app: "idle", gateway: "idle", esb: "idle", core: "idle", merchant: "idle" });
    setEdge(null);
    setLog([]);
    setSelected(null);
  };

  const send = async () => {
    reset();
    const id = ++run.current;
    const calm = prefersReducedMotion();
    setRunning(true);
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;
      if (run.current !== id) return;
      const a = layout[step.from];
      const b = layout[step.to];
      setStates((s) => ({ ...s, [step.from]: "busy" }));
      setEdge(step.from === step.to ? null : [step.from, step.to].sort().join("-"));
      const el = packet.current;
      if (el) {
        el.style.background = KIND_COLOR[step.kind];
        el.style.boxShadow = `0 0 16px ${KIND_COLOR[step.kind]}`;
        // Long waits (timeouts, backoff) are compressed so the demo keeps moving.
        const dur = calm ? 0 : Math.min(1.5, Math.max(0.45, step.ms / 400)) / speed;
        await gsap.fromTo(
          el,
          { left: `${a.x}%`, top: `${a.y}%`, opacity: 1, scale: step.kind === "wait" ? 2.4 : 1 },
          {
            left: `${b.x}%`,
            top: `${b.y}%`,
            scale: 1,
            duration: dur,
            ease: step.kind === "wait" ? "sine.inOut" : "power2.inOut",
          },
        );
      }
      if (run.current !== id) return;
      const at = steps.slice(0, i + 1).reduce((n, st) => n + st.ms, 0);
      setLog((l) => [...l, { at, step, index: i }]);
      setSelected(i);
      setStates((s) => ({
        ...s,
        [step.from]: step.kind === "err" ? "err" : s[step.from] === "busy" ? "ok" : s[step.from],
        [step.to]:
          step.kind === "err"
            ? "err"
            : step.kind === "res" || step.status === "200"
              ? "ok"
              : "busy",
      }));
      await new Promise((r) => setTimeout(r, calm ? 0 : 160 / speed));
    }
    if (packet.current) gsap.to(packet.current, { opacity: 0, duration: 0.3 });
    setEdge(null);
    setRunning(false);
  };

  // A new scenario starts from a clean slate.
  const pick = (i: number) => {
    reset();
    setScenario(i);
  };

  const done = log.length === steps.length && !running;
  const last = log[log.length - 1]?.step;
  const total = log.reduce((n, e) => n + e.step.ms, 0);
  const hops = log.filter((e) => e.step.kind !== "wait").length;
  const retries = log.filter((e) => e.step.kind === "wait").length;
  const shown = selected !== null ? steps[selected] : undefined;
  const fmt = (ms: number) =>
    ms >= 1000 ? `${(ms / 1000).toFixed(ms % 1000 ? 1 : 0)} s` : `${ms} ms`;
  const resultColor =
    !done || !last ? "text-ink-3" : last.kind === "err" ? "text-[#ff8aa2]" : "text-[#6fe3a0]";

  return (
    <section
      id="simulator"
      aria-labelledby="simulator-title"
      className="bg-bg relative z-10 overflow-x-clip py-24 md:py-36"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_35%_at_85%_20%,rgba(30,64,175,0.3),transparent_70%),radial-gradient(35%_30%_at_10%_80%,rgba(18,130,190,0.14),transparent_70%)]"
      />

      <div className="wrap relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel index={5}>{t("label")}</SectionLabel>
            <p
              id="simulator-title"
              data-reveal
              data-scramble
              className="display mt-6 text-[clamp(3.5rem,9vw,9rem)]"
            >
              {t("title")}
            </p>
            <p data-reveal className="text-ink-2 mt-4 max-w-2xl text-lg">
              {t("lead")}
            </p>
          </div>
          <p
            data-reveal
            className="mono flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-[0.625rem] text-[#ffd36f] ring-1 ring-[#ffd36f]/30 lg:self-end"
          >
            <span className="size-1.5 rounded-full bg-[#ffd36f]" /> {t("simulated")}
          </p>
        </div>

        {/* Scenario picker. */}
        <div
          role="radiogroup"
          aria-label={t("scenario")}
          className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={i === scenario}
              onClick={() => pick(i)}
              className={`glass relative rounded-2xl p-4 text-left transition-all duration-300 ${
                i === scenario
                  ? "ring-neon/70 shadow-[0_0_28px_-6px_rgba(95,211,255,0.5)] ring-1"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <span className="mono text-glow text-[0.625rem]">SCN.{pad(i + 1)}</span>
              <span className="mt-1 block font-semibold">{s.title[locale]}</span>
              <span className="text-ink-3 mt-1 block text-sm leading-snug">
                {s.summary[locale]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Stage. */}
          <div className="glass relative overflow-hidden rounded-3xl">
            <div className="border-line flex flex-wrap items-center gap-2 border-b p-3 sm:p-4">
              <button
                type="button"
                onClick={send}
                disabled={running}
                data-cursor="Send"
                className="bg-signal text-signal-ink flex h-11 items-center gap-2 rounded-full px-5 font-semibold shadow-[0_0_20px_rgba(42,92,255,0.5)] transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
              >
                <span aria-hidden="true">{running ? "◌" : "▶"}</span>
                {running ? t("running") : done ? t("again") : t("run")}
              </button>
              <div
                role="group"
                aria-label={t("speed")}
                className="mono bg-ink/5 ring-ink/10 flex h-11 items-center rounded-full p-1 ring-1"
              >
                {[1, 2, 4].map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={v === speed}
                    onClick={() => setSpeed(v)}
                    className={`grid h-9 min-w-10 place-items-center rounded-full px-2 text-xs transition-colors ${v === speed ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"}`}
                  >
                    {v}×
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={reset}
                className="mono text-ink-2 ring-ink/10 hover:text-ink ml-auto h-11 rounded-full px-4 ring-1 transition-colors"
              >
                ↺ {t("reset")}
              </button>
            </div>

            <div className="relative aspect-[3/4] sm:aspect-[16/9]">
              <div
                aria-hidden="true"
                className="absolute inset-0 [background-image:radial-gradient(rgba(127,160,255,0.18)_1px,transparent_1px)] [background-size:22px_22px] opacity-50"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full"
              >
                {EDGES.map(([a, b]) => {
                  const key = [a, b].sort().join("-");
                  const on = edge === key;
                  return (
                    <line
                      key={key}
                      x1={layout[a].x}
                      y1={layout[a].y}
                      x2={layout[b].x}
                      y2={layout[b].y}
                      stroke={on ? "#8fe4ff" : "rgba(127,160,255,0.25)"}
                      strokeWidth={on ? 2 : 1.2}
                      strokeDasharray="4 5"
                      vectorEffect="non-scaling-stroke"
                      className={on ? "animate-[dash_0.6s_linear_infinite]" : ""}
                    />
                  );
                })}
              </svg>

              {NODES.map((n) => {
                const st = states[n.id];
                const p = layout[n.id];
                const ring =
                  st === "busy"
                    ? "ring-neon shadow-[0_0_30px_-4px_rgba(95,211,255,0.7)]"
                    : st === "ok"
                      ? "ring-[#6fe3a0]/80 shadow-[0_0_24px_-6px_rgba(111,227,160,0.6)]"
                      : st === "err"
                        ? "ring-[#ff6b8a] shadow-[0_0_30px_-4px_rgba(255,107,138,0.7)]"
                        : "ring-ink/15";
                return (
                  <div
                    key={n.id}
                    className={`bg-bg-2/90 absolute w-[8.25rem] -translate-1/2 rounded-2xl p-2.5 ring-1 backdrop-blur transition-all duration-300 sm:w-[8.5rem] lg:w-[10rem] ${ring}`}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-azure/20 text-glow grid size-8 shrink-0 place-items-center rounded-lg">
                        <svg
                          viewBox="0 0 24 24"
                          className="size-[18px]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          {ICONS[n.id]}
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[0.8125rem] leading-tight font-semibold">
                          {n.label}
                        </span>
                        <span className="mono text-ink-3 block truncate text-[0.5625rem]">
                          {n.sub[locale]}
                        </span>
                      </span>
                    </div>
                    <span className="mono text-ink-3 mt-1.5 flex items-center gap-1.5 text-[0.5625rem]">
                      <span
                        className={`size-1.5 rounded-full ${
                          st === "busy"
                            ? "bg-neon animate-pulse"
                            : st === "ok"
                              ? "bg-[#6fe3a0]"
                              : st === "err"
                                ? "bg-[#ff6b8a]"
                                : "bg-ink/25"
                        }`}
                      />
                      {st.toUpperCase()}
                    </span>
                  </div>
                );
              })}

              <span
                ref={packet}
                aria-hidden="true"
                className="absolute z-10 size-3 -translate-1/2 rounded-full opacity-0"
              />

              {!log.length && !running && (
                <p className="mono text-ink-3 absolute inset-x-0 top-3 px-4 text-center text-[0.625rem] sm:top-auto sm:bottom-4">
                  {t("idle")}
                </p>
              )}
            </div>

            {/* Metrics. */}
            <dl className="border-line bg-line grid grid-cols-2 gap-px border-t sm:grid-cols-4">
              {[
                [t("total"), fmt(total)],
                [t("hops"), String(hops)],
                [t("retries"), String(retries)],
                // The outcome only shows once the run has finished.
                [t("result"), done && last ? (last.status ?? "OK") : running ? "…" : "—"],
              ].map(([k, v], i) => (
                <div key={k} className="bg-bg-2/80 px-4 py-3">
                  <dt className="mono text-ink-3 text-[0.625rem]">{k}</dt>
                  <dd
                    className={`display mt-0.5 text-2xl tabular-nums ${i === 3 ? resultColor : ""}`}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Log + inspector. */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="glass flex min-h-0 flex-col overflow-hidden rounded-3xl">
              <p className="mono border-line text-ink-3 flex items-center justify-between border-b px-4 py-3">
                <span className="flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${running ? "bg-neon animate-pulse" : "bg-ink/25"}`}
                  />
                  {t("log")}
                </span>
                <span className="text-[0.625rem]">
                  {log.length}/{steps.length}
                </span>
              </p>
              <ol
                ref={logBox}
                aria-live="polite"
                className="h-56 space-y-1 overflow-y-auto p-2 lg:h-64"
              >
                {log.map((e) => (
                  <li key={e.index}>
                    <button
                      type="button"
                      onClick={() => setSelected(e.index)}
                      aria-pressed={selected === e.index}
                      className={`grid w-full animate-[fadeUp_0.35s_var(--ease-out-expo)_both] grid-cols-[3.75rem_1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-[0.6875rem] transition-colors ${
                        selected === e.index ? "bg-azure/20 ring-neon/40 ring-1" : "hover:bg-ink/5"
                      }`}
                    >
                      <span className="text-ink-3 tabular-nums">+{fmt(e.at)}</span>
                      <span className="min-w-0 truncate">
                        <span className="text-ink-3">
                          {e.step.from}→{e.step.to}{" "}
                        </span>
                        <span className="text-ink">{e.step.call}</span>
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[0.625rem]"
                        style={{
                          color: KIND_COLOR[e.step.kind],
                          background: `${KIND_COLOR[e.step.kind]}1f`,
                        }}
                      >
                        {e.step.status ?? e.step.kind.toUpperCase()}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="glass overflow-hidden rounded-3xl">
              <p className="mono border-line text-ink-3 border-b px-4 py-3">{t("inspector")}</p>
              <div className="p-4">
                {shown ? (
                  <>
                    <p className="text-ink-2 text-sm">{shown.note[locale]}</p>
                    <div className="bg-bg/70 ring-ink/10 mt-3 max-h-56 overflow-y-auto rounded-xl p-3 ring-1">
                      <Json value={shown.payload} />
                    </div>
                  </>
                ) : (
                  <p className="mono text-ink-3 text-[0.6875rem]">{t("pick")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
