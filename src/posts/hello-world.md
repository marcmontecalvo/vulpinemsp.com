---
title: 'How to Create and Publish Blog Posts on VulpineMSP.com'
date: 2025-10-20
updated: 2025-11-01 # used for freshness (optional)
author: "Marc Montecalvo"
layout: layouts/post.njk
permalink: blog/how-to-create-posts/
summary:
  'A complete walkthrough for creating, formatting, and publishing new blog posts on Vulpine
  Solutions’ Cloudflare-hosted Eleventy blog.'
tags:
  - post
  - tutorial
cover:
  src: "./assets/images/cover-photo.png" # optional
  alt: "Descriptive alt text"
  focal: "center" # optional note for art direction
eleventyExcludeFromCollections: false
llms: false # include in curated section
llmsSection: Guides # which section to group under
llmsRank: 10 # lower shows earlier (optional)
sitemapExclude: true
---

## Introduction

Creating a new post on **[VulpineMSP.com](https://vulpinemsp.com)** is quick and efficient thanks to
our Eleventy (11ty) static site generator and Cloudflare Pages workflow. This guide walks you
through each step — from writing Markdown to verifying the deployment.

---

## Step 1: Create the Markdown File

All blog posts live under:

```bash
src/posts/
```

Each post is a Markdown file (`.md`) that Eleventy converts into a static HTML page.

### Naming Convention

Use a simple, lowercase, hyphen-separated filename that includes the date:

```bash
src/posts/2025-10-20-how-to-create-posts.md
```

This naming pattern ensures chronological sorting and easy organization.

---

## Step 2: Add Front Matter

At the top of the file, include **YAML front matter** to tell Eleventy how to render the post:

```yaml
---
title: 'How to Create and Publish Blog Posts on VulpineMSP.com'
date: 2025-10-20
layout: layouts/post.njk
permalink: blog/how-to-create-posts/
tags:
  - post
  - tutorial
  - internal
summary:
  'A complete walkthrough for creating, formatting, and publishing new blog posts on Vulpine
  Solutions’ Cloudflare-hosted Eleventy blog.'
---
```

**Required fields:**

- `title` → The post’s title displayed in listings.
- `date` → Publication date used for sorting.
- `layout` → Always use `layouts/post.njk`.
- `permalink` → Defines the final URL.
- `tags` → Include `post` plus any topic-specific tags.
- `summary` → Short description for previews and meta tags.

## Step 3: Write Your Content

Write your article using standard Markdown syntax.

### Example Structure

````markdown
## Why We Use Markdown

Markdown keeps the writing process simple and portable. It focuses on content instead of formatting,
ensuring consistency across posts.

### Formatting Tips

- Use `##` for subheadings.
- Use backticks (```) for code snippets.
- Use `[links](https://example.com)` for references.
- Keep paragraphs concise — they improve mobile readability.
````

### Adding Images

Place all blog images inside:

```bash
src/assets/images/blog/
```

Then reference them using absolute URLs:

```markdown
![Vulpine Blog Guide](/assets/images/blog/blog-guide-screenshot.png)
```

Images should be optimized as `.webp` files whenever possible.

## Step 4: Test Locally

Run Eleventy in development mode:

```bash
npx @11ty/eleventy --serve
```

Your local server will start at [http://localhost:8080](http://localhost:8080). Verify:

- The post appears under `/blog/`
- Links and images load correctly
- Layout matches your expectations

## Step 5: Commit and Push

Once satisfied with the content:

```bash
git add src/posts/2025-10-20-how-to-create-posts.md
git commit -m "Add blog post: How to create posts"
git push origin main
```

Cloudflare Pages will automatically build and deploy the update.

Check the live URL:

[https://vulpinemsp.com/blog/how-to-create-posts/](https://vulpinemsp.com/blog/how-to-create-posts/)

## Step 6: Announce the Post

After deployment, share the post on your preferred platforms:

- **LinkedIn:** Tag @VulpineSolutions and use `#SmartITSilentSecurity`
- **X / Twitter:** Include a short tip or quote from the post
- **Postiz:** Schedule automated cross-platform publishing

## Step 7: Maintain and Update

If you discover a typo or want to expand content:

- Edit the same Markdown file
- Update the `date` if it’s a significant revision
- Commit and push again — Cloudflare will redeploy automatically

For SEO, consider adding an `updated:` field in front matter for major edits.

## Pro Tips

- Use short, descriptive filenames (avoid underscores)
- Keep front matter consistent across posts
- Add relevant `tags` — they enable future topic grouping
- Reuse components like callouts or tables from previous posts for consistent style

## Conclusion

By following this workflow, you ensure that every blog post on [**VulpineMSP.com**](VulpineMSP.com)
is cleanly structured, search-friendly, and deploys automatically through Cloudflare Pages. No CMS
required — just fast, secure, and predictable publishing.

**Smart IT. Silent Security.**




# Project Instructions for Astro/Tailwind Rebuild

## 1. Role & Mission

You are a **senior front‑end engineer** rebuilding my website from scratch using **Astro + Tailwind**, deployed on **Cloudflare Pages** (with **Workers/Pages Functions** only when needed). Do not reuse Bootstrap or SSI markup. Instead, model the content and design patterns, then implement clean, modern components, layouts, and collections.

**Goals:** accessibility (WCAG 2.1 AA), performance, maintainability, developer experience, and SEO.

---

## 2. Freshness Rule (Critical)

All information must reflect the **latest stable versions as of the day of work**—no legacy APIs or outdated packages.

* Validate versions via MCP servers and official docs before proposing commands or configs.
* Prefer stable over beta/nightly.

**Primary Docs:**
Astro → https://docs.astro.build/llms-full.txt
Cloudflare Docs → https://developers.cloudflare.com/llms.txt
Tailwind → https://tailwindcss.com/docs and https://tailwindcss.com/docs/installation/framework-guides/astro
---