import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="wrap grid min-h-svh place-content-center text-center">
      <p className="mono text-signal-text">GET {"/"}?? → 404</p>
      <h1 className="display mt-6 text-[clamp(4rem,14vw,12rem)]">{t("title")}</h1>
      <p className="text-ink-2 mx-auto mt-4 max-w-md">{t("lead")}</p>
      <Link href="/" className="link-line mx-auto mt-8">
        {t("back")} →
      </Link>
    </section>
  );
}
