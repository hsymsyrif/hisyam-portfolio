"use client";

import { useTranslations } from "next-intl";

/**
 * Runtime errors land here. It never shows the error's message or stack:
 * visitors only get a generic notice and a retry, so nothing internal leaks.
 */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  return (
    <section className="wrap grid min-h-svh place-content-center text-center">
      <p className="mono text-signal-text">500 · {t("code")}</p>
      <h1 className="display mt-6 text-[clamp(3.5rem,12vw,10rem)]">{t("title")}</h1>
      <p className="text-ink-2 mx-auto mt-4 max-w-md">{t("lead")}</p>
      <button type="button" onClick={reset} className="link-line mx-auto mt-8">
        {t("retry")} ↻
      </button>
    </section>
  );
}
