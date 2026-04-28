# Yonder Art Land — Site

Astro 4 + Tailwind 3 + React 18 + Supabase + Resend. Sibling repo to `reliquary`. Source archive of the previous WordPress site lives in `yonder-reference/`.

## Stack (matches DCLT pattern)

- Astro 4.16, static output
- Tailwind 3.4 via `@astrojs/tailwind`, JS config (`tailwind.config.mjs`)
- React 18 islands via `@astrojs/react`
- Supabase JS client for forms (subscribe, future)
- Leaflet + react-leaflet for the mural map
- Resend for transactional + newsletter sends (placeholder until API key wired)
- TypeScript strict
- Path aliases: `@/`, `@components/`, `@layouts/`, `@content/`, `@data/`, `@lib/`, `@styles/`

## Current state (2026-04-28)

WP migration done. Subscribe flow wired up end-to-end. Templates still
render text-only (no images yet).

- Layout shell: Base.astro, Header, Footer, SubscribeForm
- Pages: `/`, `/about` (hand-written content, real copy), `/contact`, `/shop`, `/krampusnacht-2026`, `/projects`, `/projects/[slug]`, `/subscribed`
- Content collections: `projects` (59 entries) and `essays` (5 entries) — schema in `src/content/config.ts`
- 433 images under `public/images/<year>/<month>/` (~452 MB), referenced from frontmatter (`featured_image`, `gallery`) and inline body markdown as `/images/...`
- Tailwind tokens: placeholder yonder-ink + yonder-bone scales, flat accents (brick, moss, brass, smoke, parchment) — refine when palette is decided
- Fonts: system fallbacks — Adobe Fonts integration TBD
- Supabase project `wfksfzajjvzyerxrjrvh` (yonderartland org), separate from DCLT
- Cloudflare Pages deploy at `yonder-site.pages.dev`, builds on push to `main`
- Resend account live, `yonderartland.com` verified

## Migration (done 2026-04-28)

Migration scripts live in `yonder-reference/` (archive-only, ungitted):
`populate_project_bodies.py`, `scaffold_orphan_stubs.py`,
`rescue_park_of_flowers.py`, `match_images.py`, `backfill_geo.py`,
`migrate_to_site.py`. All idempotent — re-runnable if `yonderartland.sql`
ever gets re-exported.

Final state delivered: 64 stubs (59 projects + 5 essays), 433 unique
image sources, lat/lng/address backfilled for 45 stubs. `pnpm build`
clean at 66 pages.

## Subscribe flow (done 2026-04-28)

Form (footer + krampusnacht-2026 page) → Supabase Edge Function
`subscribe` → Cloudflare Turnstile verify → DB upsert into `subscribers`
→ Resend confirmation email → user clicks link → `confirm-subscription`
edge function flips `confirmed_at`, sends welcome email, redirects to
`/subscribed`.

Secrets in **Supabase Edge Function Secrets**: `RESEND_API_KEY`,
`FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, `SITE_URL`. Public values in
`.env` (also Cloudflare Pages env vars): `PUBLIC_SUPABASE_URL`,
`PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`.

`subscribe` deployed with `--no-verify-jwt` (the new `sb_publishable_`
key system isn't a JWT, so gateway-level verification can't pass).
Function does its own validation: Turnstile, honeypot, email format, DB
constraints.

## Next yards (in order)

1. Render `featured_image` hero + `gallery` grid on `/projects/[slug]`
2. Update `/projects` index tiles to use `featured_image` as background
3. Build `/essays/index.astro` + `/essays/[slug].astro` (5 essays unrendered today)
4. Refine palette + fonts (real values for `yonder-*` Tailwind tokens; pick serif body + display sans)
5. Migrate shop products to Stripe Checkout
6. Port mural discovery / Leaflet map to `/murals`
7. **After DNS cutover** — verify full subscribe → confirm → welcome flow on `yonderartland.com`. Then either delete the `SITE_URL` Supabase secret (defaults to `https://yonderartland.com`) or set it explicitly to that URL.
8. (Future) Build `unsubscribe` edge function + link in dispatch emails before list goes live for real.

## Ship target

- Stretch: 2026-06-01 (matches Krampusnacht production-calendar marker for "mailing list growth campaign in motion")
- Realistic: 2026-06-15
- Soft cap: 2026-07-01

## Working notes

- Border radius default to 0 (matches DCLT; vitrine aesthetic)
- Black background by default (matches existing yonderartland.com)
- "Vitrine, not cabinet" — atmosphere through type/photography/voice; structure stays digital-native

## Naming

**Default to "Yonder."** "Yonder Art Land" is reserved for three contexts:
1. `<title>` tags + meta descriptions (SEO — "Yonder" alone is too generic to rank)
2. Footer + structured data — *Yonder Art Land · 321 Steele Street · Algoma, WI 54201*
3. First intro on `/about` — once, then "Yonder" thereafter

Everything else — headers, nav, hero copy, body prose, email from-name, subject lines, button labels — uses "Yonder." Domain stays `yonderartland.com` (artifact of availability; locals just say Yonder).

Full rule lives in `reliquary/creative/yonder-aesthetic.md`. Maxim: *long form for files, short form for friends.*

When writing or editing copy, default to the short form unless one of the three exceptions clearly applies.
