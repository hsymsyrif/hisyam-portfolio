import { useTranslations } from "next-intl";
import { person } from "@/content/profile";
import { Logo } from "@/components/ui/Logo";
import { WordScrub } from "@/components/ui/WordScrub";
import { SectionLabel } from "@/components/ui/SectionLabel";

const ORGS = [
  "Bank Mandiri",
  "CIMB Niaga",
  "Alfagift",
  "Smartfren",
  "Apple Developer Academy",
  "BINUS University",
  "IEEE",
];

export function About() {
  const t = useTranslations("about");

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="bg-paper text-paper-ink relative z-10 rounded-t-[2rem] pt-24 pb-16 sm:rounded-t-[3rem] md:pt-36"
    >
      <div className="wrap">
        <SectionLabel index={1} id="about-title" tone="paper">
          {t("label")}
        </SectionLabel>
        <WordScrub
          text={t("statement")}
          className="mt-10 max-w-[22ch] text-[clamp(2rem,5.2vw,4.75rem)] leading-[1.04] font-medium tracking-[-0.03em]"
        />

        <div data-reveal className="mt-14 flex items-center gap-4">
          <span className="bg-paper-ink text-signal-text grid size-16 grid-cols-1 place-items-center rounded-full">
            <Logo className="h-8 w-auto" />
          </span>
          <span>
            <span className="block font-semibold">{person.name}</span>
            <span className="mono text-paper-ink-2">{t("sign")}</span>
          </span>
        </div>
      </div>

      {/* Where the work has run, as a slow marquee. Each half holds the list twice so it
          stays wider than any screen (up to 4K); the halves are identical for a seamless -50% loop. */}
      <div
        className="border-paper-line mt-24 overflow-hidden border-y py-6"
        aria-label="Organizations"
      >
        <ul className="flex w-max animate-[marquee_76s_linear_infinite] gap-14 pr-14 motion-reduce:animate-none">
          {[...ORGS, ...ORGS, ...ORGS, ...ORGS].map((o, i) => (
            <li
              key={i}
              aria-hidden={i >= ORGS.length || undefined}
              className="display text-paper-ink/85 flex items-center gap-14 text-[clamp(2rem,4vw,3.5rem)] whitespace-nowrap"
            >
              {o}
              <span className="text-paper-ink/30 text-[0.5em]">✳</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
