import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "id"],
  defaultLocale: "en",
  localePrefix: "always",
  // Always open in English; visitors can switch to Indonesian manually,
  // and no cookie remembers that choice for the next visit.
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
