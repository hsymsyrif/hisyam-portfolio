"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/** Official uploads from the wave to earth YouTube channel that allow embedding (checked via oEmbed). */
const TRACKS = [
  { id: "Q49pnA4jsp8", title: "love." },
  { id: "RxiTWxP9Xf4", title: "homesick" },
  { id: "53Ot9E5QG_I", title: "heaven and hell" },
  { id: "WySinJBB8OY", title: "you" },
  { id: "Kpg-OVlruxU", title: "bad (live)" },
  { id: "yQZcg09CZFg", title: "sunny days (live)" },
];

const ORIGIN = "https://www.youtube-nocookie.com";
const VOLUME_KEY = "hs-music-volume";

const pick = (not?: number) => {
  let i = Math.floor(Math.random() * TRACKS.length);
  if (i === not) i = (i + 1) % TRACKS.length;
  return i;
};

function readVolume() {
  try {
    const v = Number(window.localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && v > 0 && v <= 100 ? v : 60;
  } catch {
    return 60;
  }
}

/**
 * Audio-only music pill. A YouTube privacy-enhanced embed plays the songs from
 * an invisible frame, driven with the IFrame API's postMessage protocol (no
 * external script, so the CSP stays strict). It autoplays muted; browsers block
 * sound until the visitor interacts, so it unmutes on the first click, tap or
 * key press (e.g. "Hold to connect" in the intro), then shuffles on.
 * Hiding the player goes against YouTube's embed terms; the owner chose this knowingly.
 */
export function MusicDock() {
  const t = useTranslations("music");
  const [track, setTrack] = useState(-1);
  // The iframe is created once with the first song; later songs load through commands.
  const [initial, setInitial] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(60);
  const [muted, setMuted] = useState(false);
  // Browsers only autoplay muted; sound comes on at the first interaction.
  const [autoMuted, setAutoMuted] = useState(true);
  const frame = useRef<HTMLIFrameElement>(null);
  const state = useRef({
    current: -1,
    started: false,
    ready: false,
    wantPlay: false,
    lastState: -2,
  });

  const send = (func: string, args: unknown[] = []) =>
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args, id: 1, channel: "widget" }),
      ORIGIN,
    );

  const play = () => {
    if (state.current.ready) send("playVideo");
    else state.current.wantPlay = true;
  };

  const pause = () => {
    state.current.wantPlay = false;
    send("pauseVideo");
  };

  const next = () => {
    const i = pick(state.current.current);
    state.current.current = i;
    state.current.started = true;
    setTrack(i);
    send("loadVideoById", [TRACKS[i]!.id]);
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    send("setVolume", [v]);
    if (v > 0 && muted) {
      send("unMute");
      setMuted(false);
    }
    try {
      window.localStorage.setItem(VOLUME_KEY, String(v));
    } catch {
      /* storage blocked: the volume just isn't remembered */
    }
  };

  const toggleMute = () => {
    const on = muted || autoMuted;
    send(on ? "unMute" : "mute");
    setMuted(!on);
    setAutoMuted(false);
  };

  useEffect(() => {
    // Random first song, chosen on the client so every visit differs.
    const first = pick();
    state.current.current = first;
    const raf = requestAnimationFrame(() => {
      setInitial(first);
      setTrack(first);
      setVolume(readVolume());
    });

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ORIGIN || e.source !== frame.current?.contentWindow) return;
      let data: { event?: string; info?: unknown };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!data || typeof data !== "object") return;
      const st = state.current;
      if (data.event === "onReady" || (data.event === "initialDelivery" && !st.ready)) {
        st.ready = true;
        send("setVolume", [readVolume()]);
        // The visitor interacted before the player was ready: the sound was already allowed.
        if (st.started) send("unMute");
        if (st.wantPlay) {
          st.wantPlay = false;
          send("playVideo");
        }
      }
      // State arrives as onStateChange or inside infoDelivery, depending on the player build.
      const info = data.info as { playerState?: number } | number | undefined;
      const s =
        data.event === "onStateChange"
          ? (info as number)
          : typeof info === "object"
            ? info?.playerState
            : undefined;
      if (typeof s === "number" && s !== st.lastState) {
        st.lastState = s;
        setPlaying(s === 1);
        // 0 = ended: shuffle on to another song.
        if (s === 0) {
          const i = pick(st.current);
          st.current = i;
          setTrack(i);
          send("loadVideoById", [TRACKS[i]!.id]);
        }
      }
    };
    window.addEventListener("message", onMessage);

    // First interaction anywhere turns the sound on (the gate's hold counts).
    // Scrolling doesn't count: browsers don't treat it as permission for sound.
    const EVENTS = ["pointerdown", "keydown", "touchend"] as const;
    const stop = () =>
      EVENTS.forEach((ev) => window.removeEventListener(ev, start, { capture: true }));
    function start() {
      const st = state.current;
      stop();
      if (st.started) return;
      st.started = true;
      send("unMute");
      send("setVolume", [readVolume()]);
      setAutoMuted(false);
      play();
    }
    EVENTS.forEach((ev) => window.addEventListener(ev, start, { capture: true }));
    return () => {
      cancelAnimationFrame(raf);
      stop();
      window.removeEventListener("message", onMessage);
    };
    // send/play only touch refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The embed only talks back after it is told someone is listening.
  const onFrameLoad = () => {
    state.current.ready = false;
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
      ORIGIN,
    );
  };

  const title = track >= 0 ? TRACKS[track]!.title : "wave to earth";
  const src =
    initial >= 0
      ? `${ORIGIN}/embed/${TRACKS[initial]!.id}?enablejsapi=1&autoplay=1&mute=1&playsinline=1&rel=0&iv_load_policy=3&modestbranding=1&origin=${encodeURIComponent(
          typeof window === "undefined" ? "" : window.location.origin,
        )}`
      : undefined;

  const iconBtn =
    "grid size-8 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:text-ink";
  const level = muted || autoMuted ? 0 : volume;

  return (
    <div id="music-dock" className="fixed bottom-4 left-4 z-[60] lg:bottom-12 lg:left-7">
      {/* The player itself is kept rendered at a playable size but invisible: only the audio is used. */}
      {src && (
        <iframe
          ref={frame}
          title={`wave to earth · ${title} (YouTube)`}
          src={src}
          onLoad={onFrameLoad}
          width="200"
          height="200"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none fixed top-0 left-0 -z-10 size-[200px] border-0 opacity-0"
        />
      )}

      <div className="nav-shell beam-border flex h-12 max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full py-1.5 pr-3 pl-1.5">
        <button
          type="button"
          onClick={playing ? pause : play}
          aria-label={playing ? t("pause") : t("play")}
          className="bg-ink text-bg grid size-9 shrink-0 place-items-center rounded-full transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
          </svg>
        </button>

        {/* Equaliser: moves while sound is actually on. */}
        <span aria-hidden="true" className="ml-1.5 flex h-4 shrink-0 items-end gap-[3px]">
          {[0.9, 0.5, 1, 0.65].map((h, i) => (
            <span
              key={i}
              className={`from-azure to-neon w-[3px] origin-bottom rounded-full bg-linear-to-t ${playing && level > 0 ? "animate-[eq_0.9s_ease-in-out_infinite_alternate]" : "opacity-50"}`}
              style={{ height: `${h * 100}%`, animationDelay: `${i * -0.22}s` }}
            />
          ))}
        </span>

        <p
          className="mono text-ink-2 mx-2 max-w-[9rem] min-w-0 truncate text-[0.625rem] sm:max-w-[12rem]"
          aria-live="polite"
        >
          {autoMuted ? (
            <span className="text-glow">{t("tap")}</span>
          ) : (
            <>
              {title} <span className="text-ink-3">· wave to earth</span>
            </>
          )}
        </p>

        <button
          type="button"
          onClick={next}
          aria-label={t("shuffle")}
          data-cursor={t("shuffle")}
          className={iconBtn}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted || autoMuted ? t("unmute") : t("mute")}
          aria-pressed={muted || autoMuted}
          className={iconBtn}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 5 6 9H3v6h3l5 4V5z" />
            {level === 0 ? (
              <path d="m22 9-6 6M16 9l6 6" />
            ) : (
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            )}
          </svg>
        </button>
        <label className="hidden items-center sm:flex">
          <span className="sr-only">{t("volume")}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={level}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="music-range h-8 w-20"
            style={{ "--fill": `${level}%` } as React.CSSProperties}
          />
        </label>
      </div>
    </div>
  );
}
