# Muhammad Hisyam Syarif — Portfolio v2 "Hello, Production"

A scroll-driven story portfolio: preloader → logo gate (hold to connect the two halves) → four
chapters over a 3D city of blocks → hero, about, numbers, experience trace, project ring,
skills terminal, education, contact and a pixel wordmark footer.

## Stack

- Next.js (App Router) + TypeScript, Tailwind CSS v4
- GSAP + ScrollTrigger for pinned/scrubbed motion, Lenis for smooth scroll
- React Three Fiber / three.js for the logo scene (`src/components/three/LogoScene.tsx`)
- next-intl for English (`/en`) and Indonesian (`/id`)

## Run

```bash
npm install
npm run dev
```

## Project structure

```
src/
  app/            routes, layout, error pages, globals.css (colour tokens + utilities)
  content/        profile.ts (all portfolio data), sections.ts (section ids/order), playground.ts
  components/
    intro/        preloader, logo gate, story chapters
    layout/       Nav (+ nav/: CommandDeck, MenuOverlay, Palette, effects), Footer, MusicDock, Cursor…
    sections/     one file per page section
    three/        R3F scenes (logo, curved gallery)
    ui/           small shared pieces (Logo, SectionLabel, WordScrub)
  lib/            motion.ts (GSAP/Lenis setup, scroll helpers), format.ts, site.ts
  i18n/           next-intl routing
messages/         en.json, id.json
```

## Editing content

- Portfolio data: `src/content/profile.ts`
- Interface text: `messages/en.json`, `messages/id.json`
- Adding a section: add its id to `src/content/sections.ts`, a `nav.<id>` and `nav.desc.<id>` message, and a `<section id>`.
- Stats on the numbers deck: `VALUES` in `src/components/sections/Numbers.tsx`
- Colours: use the tokens in `globals.css` (`text-glow`, `bg-neon`, `from-azure`, `text-signal-text`, `bg-orb`…) instead of hex values.
- Before committing: `npm run lint && npm run typecheck && npx prettier --check .`

## Notes

- Returning visitors skip the gate (`localStorage` key `hs-intro-seen`); the footer can replay it.
- `prefers-reduced-motion` skips the gate, smooth scroll and scrubbed animations.
- Strict CSP with per-request nonce lives in `src/proxy.ts`.

## Security

The site is static: no database, login, API routes, forms or uploads, so there is no server-side input to attack.

- **Secrets:** none in the code. The only env var is `NEXT_PUBLIC_SITE_URL` (public by design). `.env*`, keys and
  certificates are git-ignored; only `.env.example` is committed. Never put a secret in a `NEXT_PUBLIC_*` variable.
- **Headers** (`next.config.ts` + `src/proxy.ts`): nonce CSP with `strict-dynamic` (no `unsafe-eval` in production),
  HSTS, `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `form-action 'none'`, `nosniff`, COOP/CORP, Permissions-Policy.
  `X-Powered-By` is off and browser source maps are not shipped.
- **Errors:** `src/app/[locale]/error.tsx` and `src/app/global-error.tsx` show a generic page, never the error message or stack.
- **XSS:** React escapes all text; the only raw HTML is the JSON-LD block, which escapes `<`. The YouTube `postMessage`
  listener checks origin and source. External links use `rel="noopener noreferrer"`.
- **Dependencies:** `npm audit --omit=dev` is clean. Re-run it before each deploy.
- If a backend is ever added (contact form, admin, DB): validate on the server, use parameterised queries, hash passwords
  with argon2/bcrypt, use httpOnly + Secure + SameSite cookies, check roles on every server request, rate-limit, and
  scan/limit uploads. None of that exists today.

## Integration Simulator

`src/components/sections/Playground.tsx` simulates a payment through App → API Gateway → ESB → Core Banking (+ merchant callback).
Scenarios live in `src/content/playground.ts`; every value there is made up and only illustrates the flow.

## Music dock

`src/components/layout/MusicDock.tsx` plays a random wave to earth song (official, embeddable uploads listed at the top of the file)
in YouTube's privacy-enhanced player (`youtube-nocookie.com`). It autoplays muted when the page opens (browsers block sound before
the visitor interacts), unmutes on the first click, tap or key press, and shuffles to another song when one ends. Volume (saved in `localStorage` as `hs-music-volume`) and mute
are sent with the YouTube IFrame API's postMessage commands (`playVideo`, `setVolume`, `mute`, …) instead of loading YouTube's
script, so the CSP stays strict; `src/proxy.ts` allows frames from `https://www.youtube-nocookie.com` only. Only a small audio
pill is shown; the video frame is rendered invisibly. That goes against YouTube's embed terms (the player should stay visible),
so YouTube could stop it playing at any time.
