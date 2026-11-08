import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { MotionRoot } from "@/components/layout/MotionRoot";
import { Cursor } from "@/components/layout/Cursor";
import { Nav } from "@/components/layout/Nav";
import { ScrollRail } from "@/components/layout/ScrollRail";
import { Hud } from "@/components/layout/Hud";
import { MusicDock } from "@/components/layout/MusicDock";
import { Interactions } from "@/components/layout/Interactions";
import "../globals.css";

// Big Shoulders: condensed, built for huge sizes (opsz up to 72). Inter Tight
// for reading, JetBrains Mono for labels that look like logs and endpoints.
const display = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap",
  axes: ["opsz"],
});

const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-sans-face", display: "swap" });

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face",
  display: "swap",
});

/**
 * Runs before paint: marks JS as available so reveal styles and the intro only apply when they can finish,
 * and makes every load (refresh, reopened tab, back/forward cache) start at the top with the intro instead of
 * mid-page: no browser scroll restoration, no #hash jump, top saved on leave, bfcache restores reload.
 */
const initScript = [
  `document.documentElement.classList.add("js")`,
  `history.scrollRestoration="manual"`,
  `if(location.hash)history.replaceState(null,"",location.pathname+location.search)`,
  `scrollTo(0,0)`,
  `addEventListener("pagehide",function(){scrollTo(0,0)})`,
  `addEventListener("pageshow",function(e){if(e.persisted)location.reload()})`,
].join(";");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030817",
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(siteUrl),
    title: t("title"),
    description: t("description"),
    applicationName: "Muhammad Hisyam Syarif",
    authors: [{ name: "Muhammad Hisyam Syarif" }],
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", id: "/id", "x-default": "/en" },
    },
    openGraph: {
      type: "profile",
      locale: locale === "id" ? "id_ID" : "en_US",
      url: `/${locale}`,
      siteName: "Muhammad Hisyam Syarif",
      title: t("title"),
      description: t("description"),
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html
      lang={locale}
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script id="init" strategy="beforeInteractive" nonce={nonce}>
          {initScript}
        </Script>
        <a
          href="#main"
          className="focus:bg-signal focus:text-signal-ink sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2"
        >
          {t("skip")}
        </a>
        <NextIntlClientProvider>
          <Nav />
          <ScrollRail />
          <main id="main">{children}</main>
          <Hud />
          <MusicDock />
          <Cursor />
          <MotionRoot />
          <Interactions />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
