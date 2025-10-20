Repository-specific Copilot instructions for vulpinemsp.com

Purpose
- Help an AI coding agent be immediately productive: show the app's shape, where to make changes, and the conventions to follow.

Big-picture architecture (quick)
- Static website with server-side includes (partials) and client-side JavaScript providing dynamic form/checklist UX.
- Primary frontend: HTML in root and `pages/` with shared partials in `partials/` (included via SSI). Example: `index.html` uses `<!--#include virtual="partials/head.html" -->`.
- Checklist app: client-only JS under `pages/forms/js/*.js` (namespace window.VC). The manifest and checklist JSONs live in `pages/forms/checklists/` (see `index.json`, `*.json`).
- Backend/Integration: contact form posts to `/api/contact` (fetch in `assets/js/contact.js`). Nginx proxies `/api/` to a contact API (see `nginx.conf`). A simple Express + Nodemailer implementation is present as `assets/js/server.js` (acts as the backend reference implementation).
- Optional Cloudflare Worker usage: minimal example in `cloudflare-worker.js` — treat as an example stub for offloading submissions/emailing.

Key files & what they show (use these when making changes)
- `index.html` — main landing page and how partials are included.
- `nginx.conf` — routing rules: pretty URLs map `/pages/...`, static caching for `/assets/`, and `/api/` proxy to backend container `vulpinemsp-api`.
- `pages/forms/index.html` — checklist page; script load order matters: `ui.js`, `builder.js`, `fill.js`, `export_data.js`, `export_pdf.js`, `reset.js`, `filters.js`.
- `pages/forms/js/*.js` — client checklist logic (VC namespace). Important modules: `builder.js` (render/load/harvest), `export_data.js` (JSON export), `export_pdf.js` (jsPDF export), `fill.js` (test filler and quick-fill helpers).
- `pages/forms/checklists/*.json` and `index.json` — the content data model: either sections[] or categories+items. `VC.normalize()` handles both shapes.
- `assets/js/contact.js` — client-side contact form handling (posts JSON to `/api/contact`). Note validation, how success modal and reset are done.
- `assets/js/server.js` — reference Express API for `/api/contact` and `/api/health` (requires SMTP env vars to actually send email).

Conventions & small but important patterns
- Global client namespace: window.VC. Look here for globals/state: `VC.state`, `VC.config` and `VC.els` (DOM refs). When adding features prefer extending `VC.*` helpers rather than creating new global objects.
- Checklist data normalization: `VC.normalize(list)` accepts legacy `sections[]`, or the `categories`+`items` shape. When adding a new checklist JSON match either shape or update normalize.
- Evidence vocabulary: canonicalization lives in `VC.EVIDENCE_CANON_MAP` (use `VC.canonEvidenceKeys()` when emitting or validating evidence keys).
- Attachments: toggled by `VC.config.ALLOW_ATTACH` (default true). If you change attachment behavior, update `harvest()` to include base64 or metadata consistently.
- Server-side includes: pages rely on SSI (see `nginx.conf`). Local static previews that don't support SSI will show raw include directives — prefer using an Nginx with ssi enabled for accurate local rendering.

Developer workflows (discovered in repo)
- Static site preview (simple): serve the repo root with any static server for basic HTML/CSS/JS, but SSI partials will not be resolved. Example quick check: use `npx http-server -p 8080` to confirm assets and JS.
- Accurate local preview with partials: run an Nginx instance using `nginx.conf` (or use Docker with nginx and mount the repo). `nginx.conf` expects site files under a `public` root — the repo's `public/` is the intended deployment root.
- Backend contact API (local): run the Express app referenced in `assets/js/server.js` (needs Node, npm, and env vars SMTP_USER, SMTP_PASS, etc.). If you want to run it locally:
  - create package.json and install dependencies: express, nodemailer, cors
  - set SMTP_* environment variables and run `node assets/js/server.js` (listens on PORT or 3001).
- Deploy targets: static hosting (Cloudflare Pages or plain Nginx) for the frontend; `/api/` requests are proxied to a backend service (see `nginx.conf`). The Cloudflare Worker file is a small example for alternative serverless submission handling.

Testing and debugging tips (repo-specific)
- Checklist loading errors often mean incorrect `manifest` path — `builder.js` forms the manifest URL using `VC.config.ROOT` (default `./checklists/`) and expects `index.json` there.
- Script ordering matters on `pages/forms/index.html`. If a new module depends on `VC.onReady` or `VC` helpers, load it after `ui.js` and `builder.js`.
- To inspect a saved checklist export: use the Export JSON button (client-side) which calls `VC.harvest()` -> `buildCanonical()` -> downloads canonical schema.

Integration boundaries to respect
- Frontend <-> Backend: frontend posts JSON to `/api/contact` or relies on fetch to a configured Cloudflare Worker. Do not change the public API paths without updating `nginx.conf` and `assets/js/contact.js`.
- Data model changes (checklists): updating JSON schema requires corresponding changes to `VC.normalize()`, `VC.harvest()`, and export routines in `export_data.js` / `export_pdf.js`.

If you need to change behavior, small checklist before edits
1. Run the site locally to reproduce the issue (use an HTTP server for quick checks; use Nginx for SSI behavior).
2. Confirm whether change affects VC namespace; prefer extending VC helpers.
3. Update `pages/forms/checklists/index.json` only when adding/removing checklists; update `VC.loadManifest()` if path changes.
4. If changing backend endpoints, update `nginx.conf` proxy rules and `assets/js/contact.js`.

Questions or missing info
- I used the Express backend in `assets/js/server.js` as the reference implementation — let me know if the real backend lives elsewhere or if you want me to scaffold a proper `package.json`/start script for local development.

If any section is unclear or you want this tailored for a specific CI/CD or local dev flow, tell me which platform and I'll iterate.
