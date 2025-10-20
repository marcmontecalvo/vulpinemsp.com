# VulpineMSP.com

Public repository for the official **Vulpine Solutions MSP website**
Hosted on **Cloudflare Pages** with optional **Cloudflare Workers** integration for form handling.

© 2025 Vulpine Solutions, LLC. All rights reserved.
The Vulpine Solutions name, logo, and related branding are proprietary.
Source is provided for transparency and educational reference only.
Reproduction of design, content, or brand assets without written consent is prohibited.

---

## 🧬 Overview

This project uses **Eleventy (11ty)** to generate a static website with dynamic behavior provided by client-side JavaScript and Cloudflare Workers.
It serves as both a marketing site and a secure portal for forms and compliance checklists.

**Live URL:** [https://vulpinemsp.com/](https://vulpinemsp.com/)

---

## 📁 Directory Structure

```
.
├── LICENSE
├── README.md
├── _headers                 # Custom headers for Cloudflare Pages (MIME + caching)
├── _worker.js               # Cloudflare Worker for form submission routing
├── cloudflare-worker.js     # (Legacy/experimental) worker version — see “Files to Remove”
├── nginx.conf               # Example Nginx config for local/static hosting
├── package.json / lock      # Eleventy build + dependency management
└── src
    ├── _includes/           # Shared layouts & partials
    │   ├── layout.njk
    │   ├── layoutforms.njk
    │   ├── layouts/post.njk
    │   └── partials/
    │       ├── head.html
    │       ├── nav.html
    │       ├── nav_forms.html
    │       ├── footer.html
    │       └── footer_forms.html
    │
    ├── assets/
    │   ├── css/             # Bootstrap + custom CSS
    │   ├── js/              # Sitewide scripts (custom.js, contact.js, etc.)
    │   ├── images/          # Brand & media assets
    │   └── forms/
    │       ├── js/          # Checklist / form modules (builder, ui, export, etc.)
    │       └── checklists/  # JSON data models for compliance reviews
    │
    ├── pages/
    │   ├── blog.njk         # Blog index
    │   ├── faq.njk
    │   ├── forms.njk        # Form landing page
    │   ├── people/
    │   │   └── about-marc.njk
    │   └── trust/
    │       ├── privacy.njk
    │       ├── security-baseline.njk
    │       └── service-level.njk
    │
    ├── posts/               # Blog content in Markdown
    │   └── hello-world.md
    │
    └── public/              # Favicons, robots.txt, and any extra passthrough files
```

---

## ⚙️ Build & Deployment

### Local Development

```bash
npm install
npx @11ty/eleventy --serve
```

Site builds to `dist/` and runs at [http://localhost:8080](http://localhost:8080) by default.

### Cloudflare Pages

* Build Command: `npx @11ty/eleventy`
* Build Output Dir: `dist`
* Environment: `Node 22+`
* `_headers` ensures correct MIME types for JS/CSS assets.
* `_worker.js` handles dynamic form POSTs and email routing (optional).

---

## 🧩 Eleventy Configuration Highlights

* All static assets live under `src/assets/**`
  → served at `/assets/...`
* Clean permalink structure (`/trust/privacy/`, `/people/about-marc/`, `/forms/main/`)
* `src/pages/**` defines each page; layouts in `_includes/`
* Markdown blog posts auto-collected into `/blog/`
* Forms and checklists use **client-side JS** + JSON data only (no server-side rendering)

---

## 🧠 Checklist & Forms Subsystem

* Core JS: `/assets/forms/main/js/*.js`
* Data: `/assets/forms/main/checklists/*.json`
* Entry page: `/pages/forms/main/` (uses `layoutforms.njk`)
* JSON schema supports sections, categories, and item metadata
* `ui.js` sets `VC.config.ROOT = "/assets/forms/main/checklists/"`
  so all checklists load directly as static JSON.

---

## 🔐 Cloudflare Worker Integration

`_worker.js` routes form submissions (`/api/contact` etc.) and applies:

* CAPTCHA / bot filtering
* Email / Webhook relay
* JSON response formatting

When running locally, these routes are bypassed.

---

## 🚀 Deployment Targets

| Environment | Platform          | Purpose                    |
| ----------- | ----------------- | -------------------------- |
| `main`      | Cloudflare Pages  | Production site            |
| `staging`   | Local / GitHub    | Pre-release validation     |
| `worker`    | Cloudflare Worker | Secure API proxy for forms |

---

## 🧾 License

This project is distributed for transparency and reference only.
All code © 2025 Vulpine Solutions LLC.
No derivative works, redistribution, or reuse of proprietary design or branding elements without written consent.

---

## 🧱 Attribution

Built with:

* [Eleventy (11ty)](https://www.11ty.dev/)
* [Bootstrap 5](https://getbootstrap.com/)
* [Cloudflare Pages & Workers](https://pages.cloudflare.com/)
