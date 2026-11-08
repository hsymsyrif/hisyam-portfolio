"use client";

import { useTranslations } from "next-intl";
import { socials } from "@/content/profile";
import { scrollToId } from "@/lib/motion";
import { REPLAY_EVENT } from "@/components/intro/Intro";
import { SECTIONS } from "@/content/sections";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="bg-bg relative z-10 pt-10 pb-8">
      <div className="wrap">
        <Wordmark />
        <p className="sr-only">Hisyam</p>

        <div className="border-line mt-16 grid grid-cols-1 gap-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="mono text-ink-3">{t("nav")}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {SECTIONS.map((id) => (
                <li key={id}>
                  <a href={`#${id}`} data-scramble-hover className="link-line">
                    {nav(id)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mono text-ink-3">{t("elsewhere")}</h2>
            <ul className="mt-4 space-y-2">
              {socials.map((s) => (
                <li key={s.id}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="link-line">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2 lg:text-right">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(REPLAY_EVENT))}
              className="link-line mono text-ink-2"
            >
              ↺ {t("replay")}
            </button>
          </div>
        </div>

        <div className="mono text-ink-3 mt-14 flex flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Muhammad Hisyam Syarif</span>
          <button type="button" onClick={() => scrollToId("story")} className="link-line">
            {t("top")} ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
