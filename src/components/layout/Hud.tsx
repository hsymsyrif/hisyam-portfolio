"use client";

import { useEffect, useRef } from "react";

/** Corner brackets and a live readout framing the viewport, like a heads-up display (desktop only). */
export function Hud() {
  const clock = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const tick = () => {
      if (clock.current) clock.current.textContent = `JKT ${fmt.format(new Date())} UTC+7`;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const corner = "absolute size-5 border-signal-text/50";
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-3 z-[55] hidden lg:block">
      <span className={`${corner} top-0 left-0 border-t border-l`} />
      <span className={`${corner} top-0 right-0 border-t border-r`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} right-0 bottom-0 border-r border-b`} />
      <div className="mono text-ink-3 absolute bottom-3 left-7 flex items-center gap-4 text-[0.625rem]">
        <span className="text-signal-text flex items-center gap-1.5">
          <span className="bg-signal-text size-1.5 animate-pulse rounded-full" /> SYS ONLINE
        </span>
        <span ref={clock} className="tabular-nums" />
        <span>6.2088°S 106.8456°E</span>
      </div>
      <div className="mono text-ink-3 absolute top-3 left-7 text-[0.625rem]">HSY//OS v2.0</div>
    </div>
  );
}
