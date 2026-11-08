/** Page sections in scroll order; ids match the `<section id>` and the `nav.*` message keys. */
export const SECTIONS = [
  "home",
  "about",
  "experience",
  "work",
  "simulator",
  "skills",
  "education",
  "contact",
] as const;

export type SectionId = (typeof SECTIONS)[number];
