import type { ReactNode } from "react";
import { pad } from "@/lib/format";

/** "(01) ABOUT" — the numbered label every section opens with. */
export function SectionLabel({
  index,
  id,
  children,
  tone = "dark",
}: {
  index: number;
  id?: string;
  children: ReactNode;
  tone?: "dark" | "paper" | "signal";
}) {
  const muted = tone === "dark" ? "text-ink-3" : "opacity-60";
  return (
    <h2 id={id} data-reveal className="mono flex items-center gap-3">
      <svg
        viewBox="0 0 24 10"
        className="h-2.5 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M1 5h4l2-4 3 8 3-8 3 8 2-4h5" />
      </svg>
      <span className={muted}>({pad(index)})</span>
      <span data-scramble>{children}</span>
    </h2>
  );
}
