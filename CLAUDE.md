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

Scaffold only. No real content migrated yet.

- Layout shell: Base.astro, Header, Footer, SubscribeForm
- Page stubs: `/`, `/about`, `/contact`, `/shop`, `/krampusnacht-2026`, `/projects`, `/projects/[slug]`
- Content collection schema: `src/content/config.ts` — matches frontmatter from yonder-reference (title, date, slug, status, categories, latitude, longitude, address, hero_quote)
- No projects in `src/content/projects/` yet — migration script TBD
- Tailwind tokens: placeholder yonder-ink + yonder-bone scales, flat accents (brick, moss, brass, smoke, parchment) — refine when palette is decided
- Fonts: system fallbacks — Adobe Fonts integration TBD

## Migration plan from yonder-reference

The `yonder-reference/` sibling has:
- `yonderartland.sql` — 9 MB WP database dump (source of truth)
- `content/projects/` — 47 project markdown stubs with frontmatter, mostly empty bodies
- `content/images/<year>/<month>/` — ~5,886 images organized by year/month, NOT linked to projects
- `posts_metadata_complete.json` — categories, lat/lon, hero_quotes for ~22 posts

To do (migration scripts TBD):
1. Re-extract post bodies from SQL → populate empty markdown bodies
2. Backfill categories + lat/lon from posts_metadata_complete.json
3. Match images to projects (use WP attachment metadata)
4. Move populated `content/projects/` into `src/content/projects/`

## Next yards (in order)

1. Build runs cleanly (`pnpm dev`)
2. Wire `/api/subscribe` to Resend + Supabase (needs API key + Supabase project)
3. Migrate project content from yonder-reference (extraction script)
4. Migrate shop products to Stripe Checkout
5. Build mural map page (port from existing Leaflet tool)
6. Deploy to Cloudflare Pages

## Ship target

- Stretch: 2026-06-01 (matches Krampusnacht production-calendar marker for "mailing list growth campaign in motion")
- Realistic: 2026-06-15
- Soft cap: 2026-07-01

## Working notes

- Border radius default to 0 (matches DCLT; vitrine aesthetic)
- Black background by default (matches existing yonderartland.com)
- "Vitrine, not cabinet" — atmosphere through type/photography/voice; structure stays digital-native
