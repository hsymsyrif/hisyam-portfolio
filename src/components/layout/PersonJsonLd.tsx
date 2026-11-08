import { headers } from "next/headers";
import { person, socials } from "@/content/profile";
import { siteUrl } from "@/lib/site";

/** Structured data so search engines understand who this site is about. */
export async function PersonJsonLd() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.role.en,
    worksFor: { "@type": "Organization", name: "PT Bank Mandiri (Persero) Tbk." },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Bina Nusantara University" },
    url: siteUrl,
    sameAs: socials.map((s) => s.href),
  };
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // Write "<" as the JSON escape (backslash + u003c) so no value can ever close the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll("<", String.fromCharCode(92) + "u003c"),
      }}
    />
  );
}
