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
  - Optional: `cover` (for cover image and social sharing), `author`, `blogUrl`
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
author: 'Your Name'
cover:
  src: './cover-image.png'
  alt: 'Cybersecurity checklist illustration'
  caption: 'Optional caption text'
---
```

- Content formatting
  - Standard Markdown; keep paragraphs short for mobile
- Task lists & icons
  - See [Task Lists & Icons](#task-lists--icons) section below for details
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
  - `src/pages/blog.njk` — Blog index page with search and tag filtering
  - `src/_includes/partials/head.html` — Global metadata, SEO, and Open Graph tags
  - `src/_includes/partials/nav.html` — Navigation
  - `src/assets/css/custom.css` — Custom styling
- Features
  - Bootstrap 5 via CDN
  - Card previews use `summary`
  - Posts sort by date (newest first)
  - Multi-select tag filtering with toggle (AND logic)
  - Real-time search across titles, descriptions, and tags
  - Social sharing buttons (Twitter/X, LinkedIn, Facebook, Email, Copy Link)
  - Open Graph and Twitter Card meta tags for rich social previews
  - Cover images automatically included in social sharing

—

## Task Lists & Icons

The blog supports enhanced task list syntax with both standard checkboxes and custom Bootstrap icons.

### Standard Checkboxes

Use standard markdown task list syntax for interactive checkboxes:

```markdown
- [ ] Unchecked item
- [x] Checked item
```

Renders as:
- ☐ Unchecked item
- ☑ Checked item

### Custom Icon Syntax

Use custom syntax to render Bootstrap icons instead of checkboxes:

#### Available Icon Types

**Default Tasks** (`[#]`)
```markdown
- [#] Pending task
- [#x] Completed task
```
- Unchecked: Gray circle icon
- Checked: Green checkmark icon
- Use for: Standard to-do items

**Important Tasks** (`[@]`)
```markdown
- [@] Important item
- [@x] Important completed
```
- Unchecked: Orange exclamation circle
- Checked: Orange checkmark
- Use for: High-priority items

**Critical Alerts** (`[!]`)
```markdown
- [!] Critical warning
- [!x] Critical resolved
```
- Unchecked: Red warning triangle
- Checked: Red checkmark
- Use for: Security alerts, urgent issues

### Example in Blog Post

```markdown
## Security Checklist

- [x] Enable two-factor authentication
- [ ] Update all passwords
- [#] Review access permissions
- [@] Configure backup schedule
- [!] Patch critical vulnerabilities
```

### Extending with New Icons

To add new icon types, edit `lib/markdown-it-icon-tasks.js`:

1. Open the file and locate the `iconMap` object
2. Add a new entry with your chosen character:

```javascript
const iconMap = options.iconMap || {
  // Existing icons...
  '$': {  // New icon using $ character
    unchecked: '<i class="bi bi-currency-dollar text-info"></i>',
    checked: '<i class="bi bi-check-circle-fill text-info"></i>',
    className: 'task-list-item icon-task-item icon-task-billing'
  }
};
```

3. Use in markdown: `- [$] Billing item`

**Available Bootstrap Icons**: Browse all icons at <https://icons.getbootstrap.com/>

**CSS Customization**: Add custom styles in `src/assets/css/custom.css` under the `.markdown-content .task-list-item` section.

### Technical Details

- Implementation: Custom `markdown-it` plugin (`lib/markdown-it-icon-tasks.js`)
- Styling: Bootstrap Icons v1.11.3
- CSS: `src/assets/css/custom.css`
- Configuration: `.eleventy.js` markdown-it setup

—

## Social Sharing & Open Graph

Every blog post includes automatic social media optimization with Open Graph and Twitter Card meta tags.

### Cover Images for Social Sharing

Add a cover image to your post's front matter:

```yaml
cover:
  src: './cover-image.png'
  alt: 'Image description'
  caption: 'Optional caption for the post'
```

**Image Requirements**:
- Recommended size: 1200x630px (og:image standard)
- Format: PNG, JPG, or WebP
- Place image in the same folder as your markdown file
- Use relative path `./filename.png` in front matter

**What Happens**:
- Image displays at top of blog post
- Automatically included in Open Graph `og:image` tag
- Shows as preview when shared on Facebook, LinkedIn, Twitter
- Falls back to `/assets/images/og-default.png` if no cover specified

### Share Button

Each post includes a share button with options for:
- Copy link to clipboard
- Share on X (Twitter)
- Share on LinkedIn
- Share on Facebook
- Share via Email

The share functionality uses the post's `title`, `summary`, and URL automatically.

### Testing Social Sharing

**Before Production**:
- Social media platforms cannot access `localhost` URLs
- Meta tags will be configured correctly but won't show previews locally

**After Deployment**:
- Test with Facebook Sharing Debugger: <https://developers.facebook.com/tools/debug/>
- Test with LinkedIn Post Inspector: <https://www.linkedin.com/post-inspector/>
- Test with Twitter Card Validator: <https://cards-dev.twitter.com/validator>

### Custom URL Override

To use a custom URL for social sharing (different from page URL):

```yaml
blogUrl: 'https://vulpinemsp.com/blog/custom-url/'
```

This overrides the auto-generated URL in Open Graph tags.

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

## Publishing Checklist

Before publishing a new post:

- [ ] Create file: `src/posts/yyyy-mm-dd-title.md`
- [ ] Add metadata: title, date, layout, tags, summary
- [ ] Add cover image if desired (with `cover:` front matter)
- [ ] Add any additional images under `src/assets/images/blog/`
- [ ] Test locally with `npm run dev`
- [ ] Review post on `localhost:8080`
- [ ] Push to `main` → Cloudflare Pages auto‑builds
- [ ] Verify on production site
- [ ] Test social sharing (Facebook, LinkedIn, Twitter)

—

Maintainer tips

- Prefer `.webp` where possible
- Keep front matter consistent across posts
- Run a quick Lighthouse check after major style/layout changes
