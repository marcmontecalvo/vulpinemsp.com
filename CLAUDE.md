# CLAUDE.md - AI Assistant Guide for VulpineMSP.com

This document provides comprehensive guidance for AI assistants working with the VulpineMSP.com
codebase. It covers repository structure, development workflows, conventions, and best practices.

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Blog Post Management](#blog-post-management)
- [Common Tasks](#common-tasks)
- [Testing and Validation](#testing-and-validation)
- [Deployment](#deployment)
- [Important Conventions](#important-conventions)
- [Common Pitfalls](#common-pitfalls)

## Project Overview

**What:** VulpineMSP.com is a static website for Vulpine Solutions, an MSP (Managed Service
Provider) company.

**How:** Built with Eleventy 3.x static site generator, deployed on Cloudflare Pages with serverless
functions.

**Live URL:** https://vulpinemsp.com

**Primary Content:** Marketing pages, blog posts, trust center, interactive forms, and contact form.

## Repository Structure

```
vulpinemsp.com/
├── .eleventy.js              # Eleventy configuration (filters, collections, hooks)
├── package.json              # Node.js dependencies and scripts (ES Modules)
├── _headers                  # Cloudflare Pages HTTP headers config
├── docs/
│   └── blog-authoring.md     # Blog creation guide for humans
├── functions/
│   └── api/
│       ├── contact.js        # Serverless contact form handler (Resend email)
│       └── health.js         # Health check endpoint
├── src/                      # Source files (input directory)
│   ├── _data/
│   │   ├── site.json         # Global site metadata (url, name)
│   │   ├── llms.json         # Rule-based sections for llms.txt
│   │   └── sitemap.json      # Sitemap exclusion rules
│   ├── _includes/
│   │   ├── layouts/
│   │   │   └── post.njk      # Blog post layout template
│   │   ├── partials/
│   │   │   ├── head.html     # HTML head with meta tags
│   │   │   ├── nav.html      # Navigation component
│   │   │   └── footer.html   # Footer component
│   │   ├── layout.njk        # Base page layout
│   │   └── layoutforms.njk   # Forms-specific layout
│   ├── assets/
│   │   ├── css/              # Stylesheets (custom.css, bootstrap-custom.css)
│   │   ├── js/               # JavaScript (contact.js, custom.js)
│   │   ├── images/           # Image assets
│   │   └── forms/            # Forms application (~2200 lines)
│   ├── pages/
│   │   ├── blog.njk          # Blog index page
│   │   ├── faq.njk           # FAQ page
│   │   ├── feed.xml.njk      # RSS feed
│   │   └── trust/            # Trust center pages
│   ├── posts/
│   │   └── YYYY-MM-DD-slug/  # Blog posts in date-prefixed folders
│   │       ├── YYYY-MM-DD-slug.md    # Post content
│   │       └── [assets]              # Images, videos, PDFs
│   ├── public/               # Files copied to root (robots.txt, favicon.ico)
│   ├── index.njk             # Homepage
│   ├── llms.txt.njk          # AI assistant manifest
│   └── sitemap.xml.11ty.js   # Sitemap generator
└── _site/                    # Build output (gitignored)
```

### Key Configuration Files

- **`.eleventy.js`**: Main Eleventy configuration
- **`package.json`**: Dependencies, scripts, and ESLint config
- **`.prettierrc`**: Code formatting rules
- **`.markdownlint.json`**: Markdown linting rules
- **`.editorconfig`**: Editor settings (indent, line endings)
- **`eslint.config.js`**: JavaScript linting rules (flat config format)

## Technology Stack

### Core Framework

- **Eleventy 3.x** - Static site generator
- **Node.js 20+** - Runtime environment
- **ES Modules** - All JavaScript uses `import/export` syntax

### Template Engines

- **Nunjucks (.njk)** - Primary templating language
- **Markdown (.md)** - Blog posts and content pages
- **JavaScript (.11ty.js)** - Dynamic templates (sitemap)

### Frontend

- **Bootstrap 5** - CSS framework (loaded via CDN)
- **Vanilla JavaScript** - No framework, custom scripts
- **Plausible Analytics** - Privacy-focused analytics

### Backend/Serverless

- **Cloudflare Pages** - Hosting and deployment
- **Cloudflare Pages Functions** - Serverless API endpoints
- **Resend API** - Transactional email service

### Package Management

- **npm** and **pnpm** - Both supported (npm used by Cloudflare Pages)
- Lock files: `package-lock.json` and `pnpm-lock.yaml`

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install
# OR
pnpm install

# Start development server (http://localhost:8080)
npm run dev
# OR
pnpm dev

# Build for production
npm run build
# OR
pnpm build
```

### Testing Cloudflare Functions Locally

Eleventy's dev server doesn't execute Cloudflare Pages Functions. To test them:

```bash
# Terminal 1: Build and watch for changes
npx @11ty/eleventy --watch

# Terminal 2: Run Wrangler dev server
npx wrangler pages dev _site
```

Create a `.dev.vars` file for local environment variables:

```
RESEND_API_KEY=your_api_key_here
CONTACT_FROM=noreply@vulpinemsp.com
CONTACT_TO=contact@vulpinemsp.com
```

## Code Quality Standards

### Linting and Formatting

```bash
# Run all linters and checks
npm run lint

# Format all files
npm run format

# Check formatting without changes
npm run format:check

# Lint JavaScript only
npm run lint:js

# Lint Markdown only
npm run lint:md
```

### Prettier Configuration

- **Print width:** 100 characters
- **Quote style:** Single quotes
- **Trailing commas:** ES5
- **Semicolons:** Always
- **Prose wrap:** Always (for Markdown)

### ESLint Rules

- **ES version:** Latest
- **Module type:** ES Modules
- **Unused variables:** Warning (allow `_` prefix)
- **Undefined variables:** Error
- **Console statements:** Allowed
- **Globals:** `document`, `window`, `navigator`, `fetch`, `bootstrap`, `IMask`, etc.

### Markdown Rules

- **Line length:** 100 characters (headings: 120)
- **HTML in Markdown:** Allowed (MD033)
- **Duplicate headings:** Allowed (MD024)
- **First line heading:** Not required (MD041)

### EditorConfig Settings

- **Indent:** 2 spaces
- **Charset:** UTF-8
- **Line endings:** LF
- **Trim trailing whitespace:** Yes (in Markdown too)
- **Insert final newline:** Yes

## Blog Post Management

### Creating a New Blog Post

Blog posts follow a strict date-prefixed folder convention that is critical to understand.

#### Folder Structure

Each post lives in its own folder with a date prefix:

```
src/posts/2025-11-12-holiday-cyber-scams/
├── 2025-11-12-holiday-cyber-scams.md
├── phishing-email.png
├── security-tips.webp
└── checklist.pdf
```

#### Important: Date Prefix Stripping

The build process (`eleventy.before` hook in `.eleventy.js:13-33`) automatically:

1. Finds all media files in `src/posts/**/*.{png,jpg,jpeg,webp,gif,mp4,mov,pdf,zip}`
2. Copies them to `_site/blog/`
3. **Strips the `YYYY-MM-DD-` prefix from folder names**

Example transformation:

```
src/posts/2025-11-12-holiday-cyber-scams/image.png
→ _site/blog/holiday-cyber-scams/image.png
```

#### Post File Naming

- Filename: `YYYY-MM-DD-slug.md`
- Folder: `YYYY-MM-DD-slug/`
- Both must match exactly

#### Required Front Matter

```yaml
---
title: 'Your Post Title' # Required: Post title
date: 2025-11-12 # Required: Publication date (YYYY-MM-DD)
layout: layouts/post.njk # Required: Always use this layout
permalink: blog/slug/ # Required: Must match folder without date prefix
tags: # Required: Must include 'post' tag
  - post # Required: Includes post in blog collection
  - cybersecurity # Optional: Additional tags
summary: 'Brief description for previews and meta tags.' # Required: For cards and SEO
---
```

#### Optional Front Matter

```yaml
author: 'Marc Montecalvo' # Author name
updated: 2025-11-13 # Last update date for SEO freshness
cover: # Hero image for post
  src: ./image.webp # Relative path to image in post folder
  alt: 'Image description'
  focal: center # or 'top', 'bottom'
llms: true # Include in llms.txt curated section
llmsSection: 'Security' # Group in llms.txt section
llmsRank: 10 # Sort order (lower = earlier)
sitemapExclude: true # Exclude from sitemap
eleventyExcludeFromCollections: true # Exclude from all collections
draft: true # Hide in production (but show in dev)
```

#### Image References

When referencing images in Markdown, use **relative paths** starting with `./`:

```markdown
![Phishing email example](./phishing-email.png)

<!-- The build process converts this to: -->
<!-- <img src="/blog/holiday-cyber-scams/phishing-email.png"> -->
```

**Never** use absolute paths like `/assets/images/blog/` for post assets.

#### Step-by-Step Process

1. Create folder: `src/posts/YYYY-MM-DD-your-slug/`
2. Create post file: `src/posts/YYYY-MM-DD-your-slug/YYYY-MM-DD-your-slug.md`
3. Add required front matter
4. Write content in Markdown
5. Add images/assets to the same folder
6. Reference images with relative paths: `./image.png`
7. Test locally: `npm run dev`
8. Verify at: `http://localhost:8080/blog/your-slug/`

### Updating Existing Posts

1. Locate the post folder: `src/posts/YYYY-MM-DD-slug/`
2. Edit the Markdown file
3. Update `updated` field in front matter to current date
4. Test changes locally
5. Commit and push

## Common Tasks

### Add a New Page

1. Create file: `src/pages/your-page.njk`
2. Add front matter with `permalink`
3. Choose layout: `layout: layout.njk` or custom
4. Write content using Nunjucks/HTML
5. Update navigation if needed: `src/_includes/partials/nav.html`

### Modify Site Metadata

Edit `src/_data/site.json`:

```json
{
  "url": "https://vulpinemsp.com",
  "name": "Vulpine Solutions"
}
```

Access in templates: `{{ site.url }}`, `{{ site.name }}`

### Update Navigation

Edit `src/_includes/partials/nav.html`

### Modify Styles

- **Custom CSS:** `src/assets/css/custom.css`
- **Bootstrap overrides:** `src/assets/css/bootstrap-custom.css`
- **CDN Bootstrap:** Loaded in `src/_includes/partials/head.html`

### Add Custom Filters

Edit `.eleventy.js`:

```javascript
eleventyConfig.addFilter('yourFilter', function (value) {
  // Transform value
  return transformedValue;
});
```

### Create Collections

Edit `.eleventy.js`:

```javascript
eleventyConfig.addCollection('yourCollection', function (collectionApi) {
  return collectionApi.getFilteredByTag('yourTag').sort((a, b) => {
    return b.date - a.date; // Newest first
  });
});
```

### Manage llms.txt

The site generates `/llms.txt` (AI assistant manifest) using a hybrid approach:

1. **Curated items:** Pages with `llms: true` in front matter
   - Grouped by `llmsSection`
   - Sorted by `llmsRank` (lower = earlier)
2. **Rule-based sections:** Defined in `src/_data/llms.json`

Edit `src/_data/llms.json`:

```json
{
  "sections": [
    {
      "title": "Section Name",
      "paths": ["/exact/path/", "/another/path/"],
      "prefix": "/blog/",
      "limit": 10
    }
  ]
}
```

Template: `src/llms.txt.njk` (uses `collections.llmsHybrid`)

### Configure Sitemap

Exclude pages from sitemap in three ways:

1. **Per-page:** Add `sitemapExclude: true` to front matter
2. **Exact paths:** Add to `src/_data/sitemap.json` → `excludeExact` array
3. **Path prefixes:** Add to `src/_data/sitemap.json` → `excludePrefixes` array

Sitemap uses git-based last modified dates via `gitLastModISO` filter.

### Update HTTP Headers

Edit `_headers` file (Cloudflare Pages format):

```
/path/to/file
  Cache-Control: max-age=3600
  X-Custom-Header: value
```

Current headers include security headers and cache strategies:

- HTML: `no-cache`
- API: `no-store`
- CSS/JS: 7 days
- Images: 30 days
- XML/txt: 1-24 hours

## Testing and Validation

### Pre-Commit Checklist

1. **Lint and format:**
   ```bash
   npm run lint
   ```
2. **Build successfully:**
   ```bash
   npm run build
   ```
3. **Test locally:**
   ```bash
   npm run dev
   # Visit http://localhost:8080
   ```
4. **Verify changes:**
   - Check affected pages render correctly
   - Test responsive design (mobile/tablet/desktop)
   - Validate links work
   - Check images load with correct paths
5. **Review git diff:**
   ```bash
   git diff
   ```

### Manual Testing Areas

**For Blog Posts:**

- Post appears at `/blog/slug/` (without date prefix)
- Images load correctly
- Post appears in `/blog/` index
- RSS feed updated: `/feed.xml`
- Sitemap updated: `/sitemap.xml` (if not excluded)

**For Contact Form:**

- Form submits successfully
- Email received via Resend
- Validation errors display correctly
- Honeypot field works (reject if filled)

**For Navigation:**

- All links work
- Mobile menu functions
- Active page highlighted

### Automated Testing

**Current Status:** No test framework configured yet.

**Test script:** `npm test` currently echoes "(no tests yet)"

**Recommendation:** Before significant changes, consider adding:

- Unit tests for JavaScript functions
- Integration tests for Eleventy build
- Visual regression tests for UI changes

## Deployment

### Cloudflare Pages Configuration

- **Platform:** Cloudflare Pages
- **Production branch:** `main`
- **Build command:** `npx @11ty/eleventy`
- **Output directory:** `_site`
- **Node version:** 20+ or 22+
- **Package manager:** npm (due to `package-lock.json` presence)

### Environment Variables

Set in Cloudflare Pages → Settings → Environment variables and secrets:

- **`RESEND_API_KEY`** (Secret) - API key for Resend email service
- **`CONTACT_FROM`** (Plaintext) - Default sender email (fallback: `noreply@vulpinemsp.com`)
- **`CONTACT_TO`** (Plaintext) - Recipient email (fallback: `contact@vulpinemsp.com`)
- **`SITE_NAME`** (Plaintext, optional) - Site name for reference

### Deployment Process

1. Push changes to `main` branch
2. Cloudflare Pages automatically builds
3. Build runs: `npx @11ty/eleventy`
4. Output from `_site/` deployed to CDN
5. Functions from `functions/` deployed as serverless endpoints
6. Live at: `https://vulpinemsp.com` and `*.pages.dev`

### Git Workflow

**Branch Naming:**

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Claude AI sessions: `claude/claude-md-*` (auto-generated)

**Commit Messages:**

- Use conventional commit format when possible
- Be descriptive: explain WHY, not just WHAT
- Reference issue numbers if applicable

**Merging:**

- Feature branches merge to `main` via pull request
- `main` auto-deploys to production
- Test locally before pushing to `main`

## Important Conventions

### Naming Conventions

- **Files:** `kebab-case.ext`
- **Folders:** `kebab-case/`
- **URLs:** `/kebab-case/` (no trailing slash in permalinks)
- **Blog posts:** `YYYY-MM-DD-kebab-case`
- **Layouts:** `layouts/name.njk`
- **Partials:** `partials/name.html`
- **Data files:** `lowercase.json`

### Code Style

- **Indentation:** 2 spaces
- **Line endings:** LF
- **Quotes:** Single quotes in JavaScript
- **Semicolons:** Always in JavaScript
- **ES Modules:** Use `import/export`, not `require/module.exports`

### Template Syntax

- **Variables:** `{{ variable }}`
- **Filters:** `{{ value | filterName }}`
- **Conditionals:** `{% if condition %} ... {% endif %}`
- **Loops:** `{% for item in collection %} ... {% endfor %}`
- **Comments:** `{# comment #}`

### Front Matter

- **Format:** YAML between `---` delimiters
- **Dates:** `YYYY-MM-DD` format
- **Booleans:** `true` or `false` (lowercase)
- **Arrays:** Use YAML list syntax
- **Strings:** Quote if containing special characters

### Asset Paths

- **Blog post assets:** Relative paths `./image.png`
- **Global assets:** Absolute paths `/assets/css/custom.css`
- **Static files:** Copy to `src/public/` → output to root
- **Passthroughs:** Defined in `.eleventy.js`

### Git-Based Metadata

The site uses git to determine last modified dates for SEO:

- Filter: `gitLastModISO` (`.eleventy.js:58-71`)
- Falls back to: `updated` → `date` → current date
- Used in: Sitemap, meta tags
- Requires: Clean git history

## Common Pitfalls

### Blog Post Issues

1. **Wrong folder structure:** Post must be in `YYYY-MM-DD-slug/` folder
2. **Wrong filename:** Must match folder: `YYYY-MM-DD-slug.md`
3. **Missing `post` tag:** Post won't appear in blog index without `tags: [post]`
4. **Wrong permalink:** Must be `blog/slug/` (without date prefix)
5. **Absolute image paths:** Use relative `./` paths, not `/assets/`
6. **Date format errors:** Use `YYYY-MM-DD`, not `MM/DD/YYYY`
7. **Missing required front matter:** `title`, `date`, `layout`, `permalink`, `tags`, `summary` all
   required

### Build Errors

1. **ES Module syntax errors:** File must use `import/export`, not `require`
2. **Missing dependencies:** Run `npm install` after pulling changes
3. **Nunjucks template errors:** Check for unmatched `{% %}` tags
4. **Missing layouts:** Ensure `layout` path is correct
5. **Passthrough issues:** Assets must be in `src/assets/` or `src/public/`

### Git Issues

1. **Modified `_site/`:** This directory is gitignored, don't commit it
2. **Missing `.gitignore` entries:** Check for `node_modules/`, `_site/`, `.dev.vars`
3. **Large file commits:** Images should be optimized (prefer .webp)
4. **Incorrect line endings:** Use LF, not CRLF (configured in `.editorconfig`)

### Deployment Issues

1. **Build fails on Cloudflare:** Check build logs, ensure dependencies in `package.json`
2. **Functions not working:** Verify environment variables are set
3. **404 errors:** Check permalink format and ensure pages are in collections
4. **Cache issues:** Wait for Cloudflare CDN cache to clear (~5 minutes)
5. **Email not sending:** Verify `RESEND_API_KEY` is set correctly

### Performance Issues

1. **Large images:** Optimize and convert to .webp
2. **Too many assets:** Consider lazy loading images
3. **Heavy JavaScript:** Keep client-side JS minimal
4. **CDN not used:** Ensure deploying through Cloudflare Pages

### Security Issues

1. **API keys in code:** Never commit secrets, use environment variables
2. **Missing honeypot:** Contact form has `website` field that must be empty
3. **CORS misconfiguration:** Functions handle CORS automatically
4. **Unvalidated input:** Contact form validates all inputs server-side
5. **Missing security headers:** Defined in `_headers` file

## Quick Reference

### File Paths

| Purpose | Location | Output |
| --- | --- | --- |
| Homepage | `src/index.njk` | `/index.html` |
| Blog index | `src/pages/blog.njk` | `/blog/index.html` |
| Blog post | `src/posts/YYYY-MM-DD-slug/*.md` | `/blog/slug/index.html` |
| Trust pages | `src/pages/trust/*.njk` | `/trust/*/index.html` |
| Sitemap | `src/sitemap.xml.11ty.js` | `/sitemap.xml` |
| RSS feed | `src/pages/feed.xml.njk` | `/feed.xml` |
| llms.txt | `src/llms.txt.njk` | `/llms.txt` |
| Contact API | `functions/api/contact.js` | `/api/contact` |
| Health check | `functions/api/health.js` | `/api/health` |

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production

# Code Quality
npm run lint             # Run all linters
npm run format           # Format all files
npm run format:check     # Check formatting
npm run lint:js          # Lint JavaScript
npm run lint:md          # Lint Markdown

# Testing
npm test                 # Run tests (none configured yet)

# Git
git status               # Check status
git diff                 # View changes
git log --oneline -10    # Recent commits
```

### Important Files to Review

- **`.eleventy.js`** - Understand filters and collections
- **`package.json`** - Know available scripts
- **`docs/blog-authoring.md`** - Detailed blog guide
- **`README.md`** - Project overview for humans
- **`_headers`** - HTTP headers configuration

## Additional Resources

- **Eleventy Docs:** https://www.11ty.dev/docs/
- **Nunjucks Docs:** https://mozilla.github.io/nunjucks/
- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Resend API Docs:** https://resend.com/docs

## Summary for AI Assistants

When working with this codebase:

1. **Always run linters** before committing: `npm run lint`
2. **Test locally** before pushing: `npm run dev`
3. **Follow blog post conventions** strictly (date-prefixed folders, relative image paths)
4. **Use ES Modules** syntax exclusively
5. **Validate front matter** for required fields
6. **Check build output** in `_site/` to verify correct paths
7. **Review git diff** to catch unintended changes
8. **Optimize images** to .webp format when possible
9. **Never commit secrets** - use environment variables
10. **Document significant changes** in commit messages

This codebase is well-organized, follows modern static site patterns, and leverages Cloudflare's
edge infrastructure. Understanding the blog post folder structure and build hooks is essential for
successful contributions.

---

**Last Updated:** 2025-11-14 **Maintainer:** Vulpine Solutions **Version:** 1.0.0
