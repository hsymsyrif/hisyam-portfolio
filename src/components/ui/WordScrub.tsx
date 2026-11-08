"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion";

const ICONS: Record<string, React.ReactNode> = {
  api: <path d="M8 6 3 12l5 6M16 6l5 6-5 6M13.5 4l-3 16" />,
  db: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </>
  ),
  bank: <path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />,
};

/**
 * A statement that lights up word by word as it scrolls past. "[api]" style
 * tokens become small icon tiles inside the sentence.
 */
export function WordScrub({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-w]",
          { opacity: 0.14 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 80%",
              end: "bottom 45%",
              scrub: true,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <p ref={ref} className={className}>
      {text.split(" ").map((word, i) => {
        const icon = /^\[(\w+)\]$/.exec(word)?.[1];
        if (icon && ICONS[icon]) {
          return (
            <span
              key={i}
              data-w
              aria-hidden="true"
              className="bg-paper-ink text-signal-text mx-[0.12em] inline-grid size-[0.95em] translate-y-[0.08em] place-items-center rounded-[0.22em] align-baseline"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-[0.6em]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONS[icon]}
              </svg>
            </span>
          );
        }
        return (
          <span key={i} data-w>
            {word}{" "}
          </span>
        );
      })}
    </p>
  );
}
