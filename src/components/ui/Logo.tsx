import { LOGO_PATH, LOGO_VIEWBOX } from "./logo-path";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={LOGO_PATH} />
    </svg>
  );
}
