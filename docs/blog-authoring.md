# VulpineMSP Blog Authoring & Management Guide

This guide explains how to manage and extend the Vulpine Solutions blog hosted under
<https://vulpinemsp.com>, built on Eleventy (11ty) and deployed through Cloudflare Pages.

—

## What’s Inside

- Backend systems and folder structure
- Creating new blog posts
- Theme/layout touchpoints
- Optional pagination, tags, and author profiles
- Recommended workflows and automation

—

## System Architecture

- Static Site Generator: Eleventy (11ty)
  - Posts in `src/posts/`, rendered with `src/_includes/layouts/post.njk`
- Hosting: Cloudflare Pages
  - Builds on push to `main`; output goes to `_site`
  - `_headers` provides extra MIME/cache hints
- Build summary
  - Build command: `npx @11ty/eleventy`
  - Output directory: `_site`
  - Environment: Node 20+/22+

—

## Content Locations

- Markdown posts: `src/posts/*.md`
- Page templates: `src/pages/*.njk`
- Layouts/partials: `src/_includes/`
- Static assets: `src/assets/`

—

## Create a New Blog Post

- File name
  - `src/posts/yyyy-mm-dd-title.md` (lowercase, hyphen-separated)
- Front matter (minimum)
  - `title`, `date`, `layout: layouts/post.njk`, `permalink`, `tags: [post]`, `summary`
- Example

```yaml
---
title: 'Cyber Hygiene Basics for SMBs'
date: 2025-10-20
layout: layouts/post.njk
permalink: blog/cyber-hygiene-basics/
tags:
  - post
  - cybersecurity
summary: 'Simple daily practices to reduce IT risk in small businesses.'
---
```

- Content formatting
  - Standard Markdown; keep paragraphs short for mobile
- Images
  - Place under `src/assets/images/blog/`
  - Reference with absolute paths, e.g. `![Alt](/assets/images/blog/file.webp)`
- Test locally
  - `npm run dev` or `pnpm dev` → <http://localhost:8080>
- Deploy
  - Push to `main`; Cloudflare Pages builds and deploys automatically

—

## Blog UI & Theme

- Key files
  - `src/_includes/layouts/post.njk` — Single post layout
  - `src/pages/blog.njk` — Blog index page
  - `src/_includes/partials/head.html` — Global metadata and SEO tags
  - `src/_includes/partials/nav.html` — Navigation
  - `src/assets/css/custom.css` — Custom styling
- Notes
  - Bootstrap 5 via CDN
  - Card previews use `summary`
  - Posts sort by date (newest first)

—

## Advanced Options

- Pagination (optional)
  - In `src/pages/blog.njk`, add a pagination block and adjust `permalink` for paged URLs
- Tags & collections
  - Posts with shared tags group automatically; optional tag pages can be added in `src/tags/`
- Author profiles
  - Add `_data/authors.json` and reference in layouts as needed

—

## Curated and Rule‑Based Link Manifest (llms.txt)

- `src/llms.txt.njk` uses `collections.llmsHybrid`:
  - Curated: front‑matter `llms: true`, optional `llmsSection`, `llmsRank`
  - Rules: defined in `src/_data/llms.json` by explicit `paths`, `prefix`, and optional `limit`
- Output: `/llms.txt` (sections then links; curated items are de‑duplicated from rules)

—

## Backend Integration Notes

- Contact form uses Cloudflare Pages Functions
  - Endpoint: `POST /api/contact` (Resend email relay)
  - Health check: `GET /api/health`
- No database; content is static Markdown and assets

—

## Optional Automation

- n8n, GitHub Actions, or other pipelines to push Markdown into `src/posts/`
- After deploy, announce on social channels if desired

—

## Checklist

- Write: `src/posts/yyyy-mm-dd-title.md`
- Add metadata: title, date, layout, tags, summary
- Add images under `src/assets/images/blog/`
- Test locally
- Push to `main` → Cloudflare Pages auto‑builds

—

Maintainer tips

- Prefer `.webp` where possible
- Keep front matter consistent across posts
- Run a quick Lighthouse check after major style/layout changes
