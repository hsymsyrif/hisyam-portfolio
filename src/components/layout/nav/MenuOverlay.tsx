"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { person, socials } from "@/content/profile";
import { SECTIONS } from "@/content/sections";
import { pad } from "@/lib/format";
import { useJakartaTime } from "./effects";

/** Full-screen menu (phones/tablets): a circle growing out of the menu button. */
export function MenuOverlay({
  open,
  active,
  go,
  firstLink,
}: {
  open: boolean;
  active: number;
  go: (id: string) => (e: React.MouseEvent) => void;
  firstLink: React.RefObject<HTMLAnchorElement | null>;
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("contact");
  const locale = useLocale() as Locale;
  const time = useJakartaTime(false);

  return (
    <div
      id="site-menu"
      inert={!open}
      aria-hidden={!open}
      data-open={open}
      className="group/menu bg-bg ease-out-expo fixed inset-0 z-[65] overflow-y-auto transition-[clip-path] duration-700 [clip-path:circle(0%_at_calc(100%_-_3rem)_2.5rem)] data-[open=true]:[clip-path:circle(150%_at_calc(100%_-_3rem)_2.5rem)] xl:hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_20%_30%,rgba(30,64,175,0.45),transparent_70%),radial-gradient(40%_40%_at_85%_75%,rgba(96,70,210,0.22),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(127,160,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(127,160,255,0.06)_1px,transparent_1px)] [background-size:64px_64px] opacity-50"
      />

      <div className="wrap relative grid min-h-full grid-cols-1 gap-10 pt-28 pb-10">
        <ol className="grid grid-cols-1 gap-1">
          {SECTIONS.map((id, i) => (
            <li
              key={id}
              className="ease-out-expo translate-y-8 opacity-0 transition-all duration-700 group-data-[open=true]/menu:translate-y-0 group-data-[open=true]/menu:opacity-100"
              style={{ transitionDelay: open ? `${150 + i * 55}ms` : "0ms" }}
            >
              <a
                ref={i === 0 ? firstLink : undefined}
                href={`#${id}`}
                onClick={go(id)}
                className="group border-line/60 flex items-center gap-5 border-b py-1.5"
              >
                <span className={`mono w-8 ${i === active ? "text-glow" : "text-ink-3"}`}>
                  {pad(i + 1)}
                </span>
                <span className="ease-out-expo flex min-w-0 flex-col transition-transform duration-500 group-hover:translate-x-3">
                  <span
                    data-scramble-hover
                    className={`display inline-block text-[clamp(2.5rem,min(9vw,8svh),4.5rem)] leading-[0.95] ${i === active ? "text-glow" : ""}`}
                  >
                    {t(id)}
                  </span>
                  <span className="mono text-ink-3 mt-1 truncate text-[0.625rem]">
                    {t(`desc.${id}`)}
                  </span>
                </span>
                <span aria-hidden="true" className="text-ink-3 ml-auto text-2xl">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ol>

        <aside className="glass ease-out-expo translate-y-8 rounded-3xl p-6 opacity-0 transition-all delay-300 duration-700 group-data-[open=true]/menu:translate-y-0 group-data-[open=true]/menu:opacity-100">
          <p className="mono text-glow flex items-center gap-2">
            <span className="bg-neon size-1.5 animate-pulse rounded-full" /> {tc("status")}
          </p>
          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="mono text-ink-3">{t("currently")}</dt>
              <dd className="mt-1">
                {person.role[locale]} · {person.company}
              </dd>
            </div>
            <div>
              <dt className="mono text-ink-3">{t("localTime")}</dt>
              <dd className="display mt-1 text-3xl tabular-nums">
                {time} <span className="mono text-ink-3 text-sm">JKT</span>
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <div
              role="group"
              aria-label={t("language")}
              className="mono bg-ink/5 ring-ink/10 flex h-11 items-center rounded-full p-1 ring-1 sm:hidden"
            >
              {(["en", "id"] as const).map((l) =>
                l === locale ? (
                  <span
                    key={l}
                    aria-current="true"
                    className="bg-signal text-signal-ink grid h-9 min-w-10 place-items-center rounded-full px-2"
                  >
                    {l.toUpperCase()}
                  </span>
                ) : (
                  <Link
                    key={l}
                    href="/"
                    locale={l}
                    className="text-ink-2 grid h-9 min-w-10 place-items-center rounded-full px-2"
                  >
                    {l.toUpperCase()}
                  </Link>
                ),
              )}
            </div>
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mono ring-ink/15 hover:bg-ink hover:text-bg inline-flex min-h-11 items-center gap-2 rounded-full px-4 ring-1 transition-colors"
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
