import { useLocale, useTranslations } from "next-intl";
import { languages, skillGroups, softSkills, type SkillGroup } from "@/content/profile";
import type { Locale } from "@/i18n/routing";
import { Logo } from "@/components/ui/Logo";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { pad } from "@/lib/format";

const CARD = "glass relative overflow-hidden rounded-3xl p-6 sm:p-7";

/** Thin corner brackets that make each card read like a HUD module. */
function Brackets() {
  const c = "pointer-events-none absolute size-4 border-glow/40";
  return (
    <span aria-hidden="true">
      <span className={`${c} top-3 left-3 border-t border-l`} />
      <span className={`${c} top-3 right-3 border-t border-r`} />
      <span className={`${c} bottom-3 left-3 border-b border-l`} />
      <span className={`${c} right-3 bottom-3 border-r border-b`} />
    </span>
  );
}

function ModuleHead({
  index,
  count,
  unit,
  badge,
}: {
  index: number;
  count: number;
  unit: string;
  badge?: string;
}) {
  return (
    <p className="mono text-ink-3 flex items-center gap-3">
      <span className="text-glow">MOD.{pad(index + 1)}</span>
      <span className="from-line h-px flex-1 bg-linear-to-r to-transparent" />
      {badge && <span className="chip border-neon/50 text-glow">{badge}</span>}
      <span>
        {count} {unit}
      </span>
    </p>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {items.map((s) => (
        <li
          key={s}
          className="group/chip bg-ink/[0.04] ring-ink/10 hover:bg-azure/15 hover:ring-neon/60 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.9375rem] ring-1 transition-all duration-300"
        >
          <span
            aria-hidden="true"
            className="from-neon size-1.5 rounded-full bg-linear-to-br to-[#7b5cff] transition-transform duration-300 group-hover/chip:scale-150"
          />
          {s}
        </li>
      ))}
    </ul>
  );
}

function AppliedAt({ label, places }: { label: string; places: string[] }) {
  return (
    <p className="mono border-line text-ink-3 mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-4">
      <span>{label}</span>
      {places.map((p) => (
        <span key={p} className="text-ink-2">
          / {p}
        </span>
      ))}
    </p>
  );
}

/** The core toolkit orbiting the mark. Decorative: the same items are listed as chips. */
function Orbit({ items }: { items: string[] }) {
  return (
    <div
      aria-hidden="true"
      className="@container relative mx-auto aspect-square w-full max-w-[22rem]"
    >
      {[0, 14, 28].map((inset, i) => (
        <span
          key={inset}
          className={`absolute rounded-full border ${i === 1 ? "border-neon/30 border-dashed" : "border-ink/10"}`}
          style={{ inset: `${inset}%` }}
        />
      ))}
      <span className="absolute inset-[38%] rounded-full bg-[radial-gradient(circle,rgba(61,107,255,0.55),transparent_70%)] blur-xl" />
      <span className="bg-orb absolute inset-[40%] grid place-items-center rounded-full shadow-[0_0_30px_rgba(61,107,255,0.6),inset_0_1px_0_rgba(255,255,255,0.25)]">
        <Logo className="h-1/2 w-auto text-white" />
      </span>
      <div className="absolute inset-0 animate-[spin_60s_linear_infinite]">
        {items.map((s, i) => {
          const a = (i / items.length) * 360;
          return (
            <span
              key={s}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `rotate(${a}deg) translateX(36cqw) rotate(${-a}deg)` }}
            >
              <span className="block -translate-1/2">
                <span className="mono bg-bg/80 text-ink ring-neon/40 block animate-[spin_60s_linear_infinite_reverse] rounded-full px-2.5 py-1 text-[0.625rem] whitespace-nowrap ring-1 backdrop-blur">
                  {s}
                </span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ModuleCard({
  group,
  index,
  unit,
  applied,
  locale,
}: {
  group: SkillGroup;
  index: number;
  unit: string;
  applied: string;
  locale: Locale;
}) {
  return (
    <article data-reveal data-tilt="glow" className={CARD}>
      <Brackets />
      <ModuleHead index={index} count={group.items.length} unit={unit} />
      <h3 className="display mt-5 text-[clamp(2rem,3.2vw,2.75rem)]">{group.title[locale]}</h3>
      <p className="text-ink-2 mt-3">{group.summary[locale]}</p>
      <Chips items={group.items} />
      <AppliedAt label={applied} places={group.usedAt} />
    </article>
  );
}

/** The toolkit as a bento of HUD modules, with integration at the core. */
export function Skills() {
  const t = useTranslations("skills");
  const locale = useLocale() as Locale;
  const [core, ...rest] = skillGroups;
  const toolCount = skillGroups.reduce((n, g) => n + g.items.length, 0);
  const stats = [
    { n: skillGroups.length, label: t("domains") },
    { n: toolCount, label: t("tools") },
    { n: softSkills[locale].length, label: t("traits") },
    { n: languages.length, label: t("languages") },
  ];

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="bg-bg relative z-10 overflow-hidden py-24 md:py-36"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_15%_25%,rgba(30,64,175,0.3),transparent_70%),radial-gradient(40%_35%_at_90%_80%,rgba(96,70,210,0.14),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(127,160,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(127,160,255,0.06)_1px,transparent_1px)] [mask-image:radial-gradient(70%_60%_at_50%_40%,#000,transparent)] [background-size:64px_64px] opacity-40"
      />

      <div className="wrap relative">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <SectionLabel index={6}>{t("label")}</SectionLabel>
            <p
              id="skills-title"
              data-reveal
              data-scramble
              className="display mt-6 text-[clamp(4rem,12vw,12rem)]"
            >
              {t("title")}
            </p>
            <p data-reveal className="text-ink-2 mt-4 max-w-xl text-lg">
              {t("lead")}
            </p>
          </div>
          <dl
            data-reveal
            className="bg-line grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="bg-bg-2 px-5 py-4">
                <dd className="display from-ink to-glow bg-linear-to-br bg-clip-text text-5xl text-transparent tabular-nums">
                  {pad(s.n)}
                </dd>
                <dt className="mono text-ink-3 mt-1">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Core module: integration, with the orbit. */}
          {core && (
            <article data-reveal data-tilt="glow" className={`${CARD} md:col-span-2 lg:row-span-2`}>
              <Brackets />
              <ModuleHead
                index={0}
                count={core.items.length}
                unit={t("toolsUnit")}
                badge={t("core")}
              />
              <div className="mt-5 grid grid-cols-1 items-center gap-8 xl:grid-cols-[1fr_20rem]">
                <div>
                  <h3 className="display from-ink to-glow bg-linear-to-r via-[#b9d9ff] bg-clip-text text-[clamp(2.5rem,4.6vw,4.25rem)] text-transparent">
                    {core.title[locale]}
                  </h3>
                  <p className="text-ink-2 mt-4 max-w-lg text-lg">{core.summary[locale]}</p>
                  <Chips items={core.items} />
                </div>
                <Orbit items={core.items} />
              </div>
              <AppliedAt label={t("appliedAt")} places={core.usedAt} />
            </article>
          )}

          {rest.map((g, i) => (
            <ModuleCard
              key={g.id}
              group={g}
              index={i + 1}
              unit={t("toolsUnit")}
              applied={t("appliedAt")}
              locale={locale}
            />
          ))}

          {/* Working style. */}
          <article data-reveal data-tilt="glow" className={CARD}>
            <Brackets />
            <ModuleHead
              index={rest.length + 1}
              count={softSkills[locale].length}
              unit={t("traits").toLowerCase()}
            />
            <h3 className="display mt-5 text-[clamp(2rem,3.2vw,2.75rem)]">{t("soft")}</h3>
            <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              {softSkills[locale].map((s, i) => (
                <li
                  key={s}
                  className="bg-ink/[0.03] ring-ink/5 flex items-center gap-3 rounded-xl px-3 py-2 ring-1"
                >
                  <span className="mono text-glow text-[0.625rem]">{pad(i + 1)}</span>
                  {s}
                </li>
              ))}
            </ul>
          </article>

          {/* Languages, with a five-step meter. */}
          <article data-reveal data-tilt="glow" className={CARD}>
            <Brackets />
            <ModuleHead
              index={rest.length + 2}
              count={languages.length}
              unit={t("languages").toLowerCase()}
            />
            <h3 className="display mt-5 text-[clamp(2rem,3.2vw,2.75rem)]">{t("languages")}</h3>
            <ul className="mt-6 space-y-5">
              {languages.map((l) => (
                <li key={l.name.en}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-lg">{l.name[locale]}</span>
                    <span className="mono text-ink-3">{l.level[locale]}</span>
                  </div>
                  <div aria-hidden="true" className="mt-2 grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map((k) => (
                      <span
                        key={k}
                        className={`h-1.5 rounded-full ${k < l.bars ? "from-neon to-azure bg-linear-to-r shadow-[0_0_10px_rgba(95,211,255,0.5)]" : "bg-ink/10"}`}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
