import { useTranslations } from "next-intl";
import { socials } from "@/content/profile";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { pad } from "@/lib/format";

const LINKS = [
  ...socials.map((s) => ({ label: s.label, detail: s.handle, href: s.href })),
  {
    label: "IEEE Xplore",
    detail: "ICIMCIS 2024",
    href: "https://ieeexplore.ieee.org/document/10956832",
  },
];

export function Contact() {
  const t = useTranslations("contact");

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="bg-bg relative z-10 py-24 md:py-36"
    >
      <div className="wrap">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionLabel index={8}>{t("label")}</SectionLabel>
          <p data-reveal className="mono text-ink-2 flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="bg-signal absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden" />
              <span className="bg-signal relative size-2 rounded-full" />
            </span>
            {t("status")}
          </p>
        </div>

        <p id="contact-title" className="display mt-10 text-[clamp(4.5rem,15vw,15rem)]">
          <span data-reveal data-scramble className="block">
            {t("title1")}
          </span>
          <span data-reveal="0.1" data-scramble className="text-signal-text block">
            {t("title2")}
          </span>
        </p>

        <div className="mt-16">
          <div>
            <ol>
              {LINKS.map((l, i) => (
                <li key={l.href} data-reveal className="border-line border-t last:border-b">
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-tilt="glow"
                    className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 px-2 py-6"
                  >
                    <span className="mono text-ink-3">{pad(i + 1)}</span>
                    <span>
                      <span
                        data-scramble-hover
                        className="display glitch-hover group-hover:text-signal-text block text-[clamp(2rem,4vw,3.5rem)] transition-colors duration-300"
                      >
                        {l.label}
                      </span>
                      <span className="mono text-ink-3">{l.detail}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="ease-out-expo text-2xl transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            <p data-reveal className="text-ink-2 mt-6">
              {t("reply")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
