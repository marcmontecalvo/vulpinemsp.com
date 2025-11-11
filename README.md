# VulpineMSP.com

Public repo for the Vulpine Solutions website. The site is built with Eleventy (11ty), deployed on
Cloudflare Pages, and uses Cloudflare Pages Functions to handle the contact form via Resend.

Live site: [https://vulpinemsp.com](https://vulpinemsp.com)

## Overview

- Static site built with Eleventy 3.x (Nunjucks templates + Markdown)
- Automatic deploys from GitHub → Cloudflare Pages (production branch: `main`)
- Contact form posts to a Pages Function (`/api/contact`) that sends email through Resend
- Simple health probe at `/api/health`

## Tech Stack

- Eleventy 3.x (`@11ty/eleventy`)
- Nunjucks templates under `src/_includes/`
- Bootstrap 5 (CDN) and custom styles under `src/assets/css/`
- Cloudflare Pages + Pages Functions (`functions/api/*`)
- Resend email API for contact submissions
- Plausible analytics (loaded in `src/_includes/partials/head.html`)
- Custom Eleventy config in `.eleventy.js` (filters, collections, passthroughs)

## Directory Map

- `functions/api/contact.js` — Cloudflare Pages Function that validates input and sends email via
  Resend
- `functions/api/health.js` — Simple `{ ok: true }` status endpoint
- `src/index.njk` — Homepage with sections for services, about, and contact
- `src/pages/*.njk` — Additional pages (`/blog`, `/trust/*`, `/people/*`, `/forms`)
- `src/posts/*.md` — Blog posts (rendered with `layouts/post.njk`)
- `src/_includes/` — Layouts and partials (head, nav, footer)
- `src/_data/` — Site-wide data (`site.json`, `sitemap.json`)
- `src/assets/` — CSS, JS, images, and forms UI assets
- `src/sitemap.xml.11ty.js` — Generates `sitemap.xml` during build
- `src/llms.txt.njk` — Builds a curated/rule-based link manifest using `collections.llmsHybrid`
- `_headers` — Extra headers for Cloudflare Pages (MIME/cache hints)

## Prerequisites

- Node.js 20+ (22+ also fine)
- npm or pnpm (repo includes both `package-lock.json` and `pnpm-lock.yaml`)

## Install & Run Locally

- Using npm
  - `npm install`
  - `npm run dev` → serves Eleventy at <http://localhost:8080>
- Using pnpm
  - `pnpm install`
  - `pnpm dev` → serves Eleventy at <http://localhost:8080>
  - Alternative: `pnpm eleventy --serve`

Notes

- Eleventy’s dev server does not execute Cloudflare Pages Functions. To test functions locally:
  1. Terminal A: `npx @11ty/eleventy --watch`
  2. Terminal B: `npx wrangler pages dev _site`
- For Wrangler local env, create a `.dev.vars` file with the bindings in the “Environment” section
  below.

## Build & Deploy (Cloudflare Pages)

- Build command: `npx @11ty/eleventy`
- Output directory: `_site`
- Production branch: `main`
- Automatic deployments: enabled
- Pages will publish to the assigned `*.pages.dev` preview URL and to `vulpinemsp.com` on success

Environment (Pages → Settings → Variables and Secrets)

- `RESEND_API_KEY` (Secret) — API key for Resend
- `CONTACT_FROM` (Plaintext) — default sender address (fallback: `noreply@vulpinemsp.com`)
- `CONTACT_TO` (Plaintext) — recipient address (fallback: `contact@vulpinemsp.com`)
- `SITE_NAME` (Plaintext, optional) — informational only

## Contact Form API

- Endpoint: `POST /api/contact`
- Body (JSON):
  - `firstName` (required)
  - `lastName` (required)
  - `email` (required, validated)
  - `company` (optional)
  - `phone` (optional)
  - `extension` (optional)
  - `message` (required)
  - `website` (honeypot; leave empty)
- Behavior: Validates input, builds text/HTML email, and sends via Resend using `CONTACT_FROM`,
  `CONTACT_TO`, and `RESEND_API_KEY`.
- CORS: Allowed for the request origin; `OPTIONS` is handled for preflight.
- Success response: `{ ok: true, ... }` (returns upstream status/body for transparency)

Health Check

- `GET /api/health` → `{ ok: true }`

Client Integration

- The homepage contact form posts JSON to `/api/contact` (`src/assets/js/contact.js`).

## Blog Authoring

- Location: `src/posts/*.md`
- Minimum front matter:
  - `title`, `date`, `layout: layouts/post.njk`, `permalink`, `tags: [post]`, `summary`
- Blog index template: `src/pages/blog.njk`
- RSS-like feed: `src/pages/feed.xml.njk`
- Optional curated sections: set `llms: true`, `llmsSection`, and `llmsRank` in front matter to
  include a post in the curated portion of `llms.txt`.
- Full guide: `docs/blog-authoring.md`

## Eleventy Configuration Notes

- `.eleventy.js` adds:
  - `fmtDate` filter used by blog and post templates
  - `gitLastModISO` filter for last-modified timestamps
  - `livePages` collection used by the sitemap generator
  - `llmsHybrid` collection that merges curated front-matter with rule-based sections from
    `src/_data/llms.json`
  - Passthrough copies for `src/assets` and `src/public`

## Development Tips

- Linting/testing are not configured; keep changes small and verify locally.
- The `_headers` file is optional on Pages; it’s included as a safety net for MIME/cache hints.
- There is a sample Express server at `src/assets/js/server.js` that is not used in production
  (Pages Functions are used instead).

Cloudflare build command

- It’s fine to keep `npx @11ty/eleventy` (or `npm run build`). Using `pnpm` on Pages requires Pages
  to use pnpm as the package manager; because this repo contains both `package-lock.json` and
  `pnpm-lock.yaml`, Pages will default to npm. Unless you remove `package-lock.json` and switch
  Pages to pnpm, stick with `npx @11ty/eleventy`.

## License & Branding

- Code: MIT license (see `LICENSE`).
- Brand assets, copy, and design elements are proprietary to Vulpine Solutions and not licensed for
  reuse.
