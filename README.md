# RISA

The website of **สมาคมส่งเสริมการวิจัยและมาตรฐานทางอุตสาหกรรม** (Research and Industry
Standards Advancement Association) — a bilingual Thai/English site with an
inline editing mode and an admin console, so the office can maintain every
string, image and list on the public pages without a developer.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, design tokens in `src/app/globals.css` |
| Database | PostgreSQL 17, queried directly with [`postgres`](https://github.com/porsager/postgres) |
| Auth | `jose` sessions in an httpOnly cookie, `bcryptjs` password hashes |
| Editor | TipTap for rich text, Radix UI primitives, `lucide-react` icons |
| Map | MapLibre GL with plain OpenStreetMap raster tiles — no API key |
| Uploads | Local disk in dev; [Vercel Blob](https://vercel.com/docs/vercel-blob) when deployed (see **Uploads** below) |

Locale lives in the URL (`/th/...`, `/en/...`). `src/proxy.ts` redirects bare
paths to the visitor's locale and sets an `x-risa-locale` header, which is how
server components resolve TH/EN without prop-drilling a `locale` everywhere.

## Prerequisites

- Node 22
- pnpm 11 (`corepack enable`)
- PostgreSQL 17

```bash
brew install postgresql@17
brew services start postgresql@17
```

## First run

```bash
pnpm install
cp .env.example .env.local     # then fill in SESSION_SECRET: openssl rand -hex 32
createdb risa
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`pnpm db:seed` creates the admin account and **prints the generated password
once** — copy it before the terminal scrolls away. Set `ADMIN_USERNAME` /
`ADMIN_PASSWORD` in the environment to choose them yourself instead. If an admin
user already exists the seed leaves it alone.

### Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | 32+ random chars, signs the session cookie |
| `NEXT_PUBLIC_SITE_URL` | Absolute base URL used by `sitemap.xml` and `robots.txt` |
| `RISA_CODEX_ENABLED` | Optional. Set to `1` only after approving separate OpenAI API billing; unset keeps in-page AI disabled. |
| `RISA_OPENAI_API_KEY` | Optional private server-side OpenAI API key for the admin-only AI chat. Never use a `NEXT_PUBLIC_` prefix or expose it in the browser. |

The `/admin/codex` page is restricted to the `admin` role. Its task templates and
copy-to-Codex handoff work without either optional variable. The in-page chat
requires **both** variables, uses the Responses API with `gpt-6-sol`, and is
separately billed by OpenAI. It is a distinct assistant, not a connection to
an existing Codex desktop conversation. It can draft and review text but has
no tools to edit or publish website content. No API calls occur while the
feature is disabled. Set a spending limit in the OpenAI Platform before
enabling it, and deploy the variables only to the intended Vercel environment.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Applies every file in `supabase/migrations/` in order |
| `pnpm db:seed` | Upserts the content registry and seeds demo collection rows |
| `pnpm db:reset` | Drops the public schema, then migrate + seed |
| `pnpm check:content-keys` | Cross-checks registry ↔ code ↔ `content_blocks` |

`db:migrate` and `db:reset` shell out to `psql` and read `DATABASE_URL` from the
environment, so run them as `DATABASE_URL=... pnpm db:migrate` or export it
first — unlike the `tsx` scripts, they do not read `.env.local` themselves.

## The content model

Editable content comes in two layers.

**1. The registry** (`src/content/registry.ts`) — every fixed string and image on
the site: headings, eyebrows, button labels, SEO titles. Each entry is one
`BlockDef` with a key, a Thai and an English value, an admin-facing label, and a
type (`text`, `richtext`, `image`, `url`, `number`, `icon`). `pnpm db:seed`
upserts these into the `content_blocks` table; it refreshes the label, type and
grouping every time, but only writes a value into a row that is new or blank, so
edits made in the admin console survive a re-seed.

**2. Collections** — the repeatable records that grow over time: `news`,
`activities`, `committee_members`, `research_items`, `awards`, `job_posts`,
`gallery_albums`, `documents`, `locations`, `partners`, `stats`,
`timeline_events`, `nav_items`, `footer_links`, plus `list_items` for the short
bulleted lists declared in `LIST_DEFS`. These are ordinary tables, read through
`src/lib/queries.ts` and managed in the admin console.

### Adding a new editable string

1. Add one line to the right section of `src/content/registry.ts`.
2. Run `pnpm db:seed`.
3. Render it: `<Editable k="about.vision.title" as="h2" />`.

`pnpm check:content-keys` guards the three-way match: a key used in code but
absent from the registry fails the check, and it also lists registry keys no
page references and registry keys the database has not been seeded with.

Nothing on the public pages should be a hard-coded string — if you are typing
Thai copy into a `.tsx` file, it belongs in the registry instead.

## Inline edit mode

Sign in at `/admin`, then toggle edit mode. The layout sets
`data-edit-mode="on"` on `<body>`, which outlines every `[data-editable]`
element; clicking one opens an editor in place (plain input, TipTap for
`richtext`, or the media picker for `image`), and saving posts a server action
that writes the block and revalidates the page. Empty blocks show their admin
label as a placeholder so nothing is invisible. With edit mode off, `<Editable>`
renders a plain element and ships no client JavaScript.

## Uploads

`src/lib/storage.ts` picks its backend at runtime by whether
`BLOB_READ_WRITE_TOKEN` is set:

- **Unset** (local dev by default) — writes to `public/uploads/<yyyy-mm>/` on
  local disk and returns a `/uploads/...` URL. Fine for development, but
  **does not survive on serverless hosts** — Vercel gives each deployment an
  ephemeral filesystem, so files written this way in production vanish on the
  next deploy.
- **Set** — uploads go to [Vercel Blob](https://vercel.com/docs/vercel-blob)
  instead, and every URL stored in the `media` table becomes an absolute Blob
  CDN URL. Nothing else in the app changes — every reader treats `url` as an
  opaque string either way.

To exercise Blob locally: add Blob storage to the linked Vercel project, then
`vercel env pull .env.local` to fetch the token. In production on Vercel, the
token is provisioned automatically once Blob storage is attached to the
project — no manual configuration needed.

## Moving to Supabase (database)

The migrations in `supabase/migrations/` are plain SQL and apply unchanged.

1. Run them against the Supabase project (`supabase db push`, or `pnpm
   db:migrate` with `DATABASE_URL` pointed at the project's connection
   string).
2. Point `DATABASE_URL` at the Supabase connection string. Use the pooled
   connection for serverless runtimes. `postgres.js` reads `sslmode` from the
   URL itself, so no extra SSL configuration is needed.
3. Run `pnpm db:seed` once to populate `content_blocks` and create the admin
   user.

File storage is independent of this — see **Uploads** above.
