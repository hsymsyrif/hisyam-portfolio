"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { lockScroll } from "@/lib/motion";

/** ⌘K command palette: filter, arrow through and run navigation, actions and links. */
export type Command = { id: string; group: string; label: string; hint: string; run: () => void };

export function Palette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const t = useTranslations("nav");
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? commands.filter((c) => `${c.label} ${c.hint} ${c.group}`.toLowerCase().includes(q))
      : commands;
  }, [commands, query]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    input.current?.focus();
    lockScroll(true);
    return () => {
      lockScroll(false);
      prev?.focus();
    };
  }, []);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    // Let the palette unlock scrolling before the command moves the page.
    requestAnimationFrame(c.run);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => (s + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => (s - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="bg-bg/60 fixed inset-0 z-[92] grid place-items-start px-3 pt-[12svh] backdrop-blur-md"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("palette")}
        onMouseDown={(e) => e.stopPropagation()}
        className="nav-shell beam-border relative mx-auto w-full max-w-xl animate-[fadeUp_0.35s_var(--ease-out-expo)_both] overflow-hidden rounded-3xl"
      >
        <div className="border-line flex items-center gap-3 border-b px-5">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="text-glow size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKey}
            maxLength={64}
            autoComplete="off"
            spellCheck={false}
            placeholder={t("placeholder")}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[sel] ? `cmd-${results[sel]!.id}` : undefined}
            className="text-ink placeholder:text-ink-3 h-16 w-full min-w-0 bg-transparent text-lg focus:outline-none"
          />
          <kbd className="mono text-ink-3 ring-ink/15 rounded-md px-2 py-1 text-[0.625rem] ring-1">
            ESC
          </kbd>
        </div>
        <ul
          ref={list}
          id="palette-list"
          role="listbox"
          className="max-h-[50svh] overflow-y-auto p-2"
        >
          {results.length === 0 && (
            <li className="mono text-ink-3 px-4 py-8 text-center">{t("noResults")}</li>
          )}
          {results.map((c, i) => {
            const header = c.group !== results[i - 1]?.group;
            return (
              <li key={c.id} role="presentation">
                {header && (
                  <p className="mono text-ink-3 px-3 pt-3 pb-1.5 text-[0.625rem]">{c.group}</p>
                )}
                <div
                  id={`cmd-${c.id}`}
                  role="option"
                  aria-selected={i === sel}
                  data-index={i}
                  onMouseMove={() => setSel(i)}
                  onClick={() => run(c)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    i === sel ? "bg-azure/20 text-ink ring-neon/40 ring-1" : "text-ink-2"
                  }`}
                >
                  <span className="mono bg-ink/5 text-glow grid h-7 min-w-7 place-items-center rounded-lg px-1 text-[0.625rem]">
                    {c.hint}
                  </span>
                  <span className="flex-1">{c.label}</span>
                  {i === sel && <span className="mono text-glow text-[0.625rem]">↵</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mono border-line text-ink-3 flex items-center gap-2 border-t px-5 py-3 text-[0.625rem]">
          <kbd className="ring-ink/15 rounded px-1.5 ring-1">↑</kbd>
          <kbd className="ring-ink/15 rounded px-1.5 ring-1">↓</kbd>
          {t("keys")}
        </p>
      </div>
    </div>
  );
}
