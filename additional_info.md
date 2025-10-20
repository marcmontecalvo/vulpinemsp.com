# VulpineMSP Blog Authoring & Management Guide

This guide explains how to manage and extend the **Vulpine Solutions blog** hosted under [vulpinemsp.com](https://vulpinemsp.com/), built on **Eleventy (11ty)** and deployed through **Cloudflare Pages**.

It covers:

* Backend systems and folder structure
* Creating new blog posts
* Configuring the blog theme and UI
* Recommended workflows for content management and automation

---

## 🧩 System Architecture

### Static Site Generator: **Eleventy (11ty)**

Eleventy compiles templates and Markdown files into a fully static site. Blog posts are located under `src/posts/` and rendered into `/blog/` using a shared layout (`src/_includes/layouts/post.njk`).

### Hosting: **Cloudflare Pages**

Cloudflare Pages automatically builds and deploys the site on each push to the GitHub repository. The `_headers` file ensures correct MIME types for CSS, JS, and JSON.

### Deployment Summary

* **Build command:** `npx @11ty/eleventy`
* **Output directory:** `dist`
* **Environment:** Node 22+
* **Optional Worker:** `_worker.js` handles dynamic endpoints (e.g., form submissions)

### Data and Content Sources

* **Markdown posts:** `src/posts/*.md`
* **Page templates:** `src/pages/*.njk`
* **Layouts and partials:** `src/_includes/`
* **Static assets:** `src/assets/`

---

## ✍️ Creating a New Blog Post

Each blog post is a single Markdown file under `src/posts/`. Posts are auto-collected into Eleventy's `collections.post` and displayed in the `/blog/` index.

### 1. File Naming Convention

Use lowercase, hyphen-separated filenames for consistency:

```
src/posts/yyyy-mm-dd-title.md
```

Example:

```
src/posts/2025-10-20-cyber-hygiene-basics.md
```

### 2. Front Matter (Metadata)

At the top of each Markdown file, include:

```yaml
---
title: "Cyber Hygiene Basics for SMBs"
date: 2025-10-20
layout: layouts/post.njk
permalink: blog/cyber-hygiene-basics/
tags:
  - post
  - cybersecurity
summary: "Simple daily practices to reduce IT risk in small businesses."
---
```

### 3. Content Formatting

Use standard Markdown for body content:

```markdown
## Why Cyber Hygiene Matters

Regular password rotation and MFA usage can prevent over 90% of credential breaches.

- Use password managers
- Enforce MFA on all accounts
- Audit old accounts quarterly

Read our [Security Baseline](/trust/security-baseline/) for more.
```

### 4. Images

Place all blog images under:

```
src/assets/images/blog/
```

Then reference them with absolute paths:

```markdown
![Firewall Setup](/assets/images/blog/firewall-setup.png)
```

### 5. Commit & Deploy

Once pushed to GitHub (main branch), Cloudflare Pages automatically builds and publishes the new post at:

```
https://vulpinemsp.com/blog/cyber-hygiene-basics/
```

---

## 🎨 Blog UI & Theme Configuration

The site uses the **Flow Blog theme** as a base, customized for Vulpine branding.

### Key Layout Files

| File                               | Purpose                                        |
| ---------------------------------- | ---------------------------------------------- |
| `src/_includes/layouts/post.njk`   | Single post layout with header, date, and body |
| `src/pages/blog.njk`               | Blog index page listing all posts              |
| `src/_includes/partials/head.html` | Global metadata and SEO tags                   |
| `src/_includes/partials/nav.html`  | Global navigation bar                          |
| `src/assets/css/custom.css`        | Custom styling overrides                       |

### Customizations

* Uses **Bootstrap 5** grid and typography.
* Light/dark mode ready (via `custom.css`).
* Blog card previews use the `summary` field from front matter.
* Posts automatically sort by date (newest first).

---

## 🧰 Advanced Configuration

### Pagination (optional)

Eleventy supports pagination to split large post lists into pages. To enable, adjust `src/pages/blog.njk`:

```njk
---
pagination:
  data: collections.post
  size: 10
  reverse: true
permalink: "/blog/{% if pagination.pageNumber > 0 %}page/{{ pagination.pageNumber + 1 }}/{% endif %}"
layout: layout.njk
---
```

### Tags & Collections

Posts with the same tags are grouped automatically. You can create tag landing pages if desired:

```
src/tags/cybersecurity.njk
```

### Author Profiles

You can add author metadata via `_data/authors.json` and include it in post layouts with:

```njk
<p>Written by {{ authors[author].name }}</p>
```

---

## 🧠 Backend Integration Notes

The site’s **backend functionality** (contact forms, lead capture, etc.) runs via Cloudflare Workers:

* `_worker.js` handles API routes like `/api/contact`.
* Responses are sent via Email or Webhook to internal systems.
* No backend database is used — all storage is static or via form submission endpoints.

For blog content, everything is static — there is no CMS dependency. Optional future integration with Notion, Obsidian, or n8n automation can be added to auto-publish Markdown posts.

---

## 🪄 Optional Automation

You can automate blog publishing via:

* **n8n workflows:** to convert Notion/Obsidian notes into Markdown.
* **GitHub Actions:** auto-commit new Markdown from your content repo.
* **Postiz** (if configured): schedule LinkedIn/X announcements for each new post.

---

## ✅ Summary Checklist

| Task           | Description                                          |
| -------------- | ---------------------------------------------------- |
| ✏️ Write Post   | Create `src/posts/yyyy-mm-dd-title.md`               |
| 🧾 Add Metadata | Include `title`, `date`, `layout`, `tags`, `summary` |
| 🖼️ Add Images   | Store under `src/assets/images/blog/`                |
| 💻 Test Locally | Run `npx @11ty/eleventy --serve`                     |
| 🚀 Deploy       | Push to GitHub → Cloudflare Pages auto-builds        |
| 📣 Share        | Use Postiz to promote on social channels             |

---

### Maintainer Notes

* Blog files are version-controlled for transparency.
* All assets must be public and optimized for performance.
* Use `.webp` format for images where possible.
* Run Lighthouse audits after major theme updates.

---

**Vulpine Solutions, LLC — Smart IT. Silent Security.**
