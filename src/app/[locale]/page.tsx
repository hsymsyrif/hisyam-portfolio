import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Intro } from "@/components/intro/Intro";
import { Story } from "@/components/intro/Story";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Numbers } from "@/components/sections/Numbers";
import { Experience } from "@/components/sections/Experience";
import { Work } from "@/components/sections/Work";
import { Playground } from "@/components/sections/Playground";
import { Skills } from "@/components/sections/Skills";
import { Education } from "@/components/sections/Education";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";
import { PersonJsonLd } from "@/components/layout/PersonJsonLd";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);

  return (
    <>
      <PersonJsonLd />
      <Intro />
      <Story />
      <Hero />
      <About />
      <Numbers />
      <Experience />
      <Work />
      <Playground />
      <Skills />
      <Education />
      <Contact />
      <Footer />
    </>
  );
}
