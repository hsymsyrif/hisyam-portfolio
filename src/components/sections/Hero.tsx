import { useTranslations } from "next-intl";
import { person } from "@/content/profile";
import { Logo } from "@/components/ui/Logo";
export function Hero() {
  const t = useTranslations("hero");

  return (
    <section
      id="home"
      data-stage={4}
      aria-labelledby="home-title"
      className="relative z-10 flex min-h-[115svh] flex-col justify-end overflow-x-clip pt-28 pb-10"
    >
      {/* Fades the block field into the page so the type stays readable. */}
      <div
        aria-hidden="true"
        className="from-bg via-bg/75 pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[75%] bg-linear-to-t to-transparent"
      />
      <div className="wrap grid grid-cols-1 items-end gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <p data-reveal className="mono text-ink-2 flex items-center gap-2">
            <span className="bg-signal size-1.5 rounded-full" />
            {t("role")} · {person.company}
          </p>
          <h1 id="home-title" className="display mt-5 text-[clamp(4.5rem,17vw,16rem)]">
            <span data-reveal="0.05" data-scramble className="block">
              Hisyam
            </span>
            <span
              data-reveal="0.12"
              data-scramble
              className="block text-transparent [-webkit-text-stroke:1.5px_var(--ink)]"
            >
              Syarif
            </span>
          </h1>
        </div>

        <div data-reveal="0.2" className="flex flex-col gap-4">
          <p className="text-ink-2 max-w-sm text-lg leading-snug">{t("lead")}</p>

          {/* A live-looking response: the person, as an API would return it. */}
          <div
            data-tilt
            className="glass overflow-hidden rounded-2xl font-mono text-[0.75rem] leading-relaxed"
          >
            <div className="border-line text-ink-3 flex items-center justify-between border-b px-4 py-2.5">
              <span>
                <span className="text-signal-text">GET</span> /v1/hisyam
              </span>
              <span className="text-signal-text">200 OK</span>
            </div>
            <pre className="text-ink-2 overflow-x-auto px-4 py-3">
              {`{
  "role": "${person.role.en}",
  "company": "${person.company}",
  "based": "Jakarta, ID",
  "since": 2020,
  "status": "connected"
}`}
            </pre>
          </div>

          <a
            href="#contact"
            data-cursor="Say hi"
            data-magnetic
            className="glass group hover:border-signal/60 flex items-center gap-4 rounded-2xl p-2 pr-5 transition-colors"
          >
            <span className="bg-signal text-signal-ink grid size-14 shrink-0 grid-cols-1 place-items-center rounded-xl">
              <Logo className="h-8 w-auto" />
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">{t("cta")}</span>
              <span className="mono text-ink-3">{t("ctaSub")}</span>
            </span>
            <span
              aria-hidden="true"
              className="ml-auto transition-transform duration-500 group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        </div>
      </div>
      <p aria-hidden="true" className="mono wrap text-ink-3 mt-10 flex items-center gap-3">
        <span className="bg-line h-px w-10" /> {t("scroll")}
      </p>
    </section>
  );
}
