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
  - For inline images with text wrapping, see [Inline Image Placement](#inline-image-placement)
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

## Inline Image Placement

Add images within your blog post content with text wrapping and responsive behavior using simple shortcode syntax.

### Basic Usage

Use paired shortcodes to place images that wrap with text:

```markdown
{% imageRight "./image.png", "Alt text" %}
Caption text with **markdown** support
{% endimageRight %}

Your content continues here and wraps around the image on desktop...
```

### Available Positions

**Float Right** (`imageRight`)
```markdown
{% imageRight "./photo.png", "Alt text" %}
Image caption goes here
{% endimageRight %}

Text wraps to the left of the image on desktop.
```

**Float Left** (`imageLeft`)
```markdown
{% imageLeft "./photo.png", "Alt text" %}
Image caption goes here
{% endimageLeft %}

Text wraps to the right of the image on desktop.
```

**Centered** (`imageCenter`)
```markdown
{% imageCenter "./photo.png", "Alt text" %}
Image caption goes here
{% endimageCenter %}

Image is centered with no text wrapping.
```

### Parameters

1. **Image path** (required): Relative path to image file
   - Place images in same folder as markdown file
   - Use `./filename.png` syntax

2. **Alt text** (required): Descriptive text for accessibility
   - Describes the image content
   - Used by screen readers and when image fails to load

3. **Caption** (between tags): Optional caption text
   - Supports **markdown** formatting (bold, italic, links)
   - Displayed below image in italics
   - Can be left empty if no caption needed

### Examples

**With markdown in caption:**
```markdown
{% imageRight "./security-checklist.png", "Security dashboard" %}
Learn more in our [security guide](/blog/security-basics/)
{% endimageRight %}
```

**Without caption:**
```markdown
{% imageLeft "./logo.png", "Company logo" %}
{% endimageLeft %}
```

**With bold text in caption:**
```markdown
{% imageCenter "./team-photo.png", "Our team" %}
**Meet the team** behind Vulpine Solutions
{% endimageCenter %}
```

### Responsive Behavior

**Desktop (768px and wider)**:
- `imageRight` and `imageLeft` float alongside text (max-width: 400px)
- `imageCenter` displays centered (max-width: 600px)
- Text wraps around floated images

**Mobile (< 768px)**:
- All images stack full-width
- No floating behavior
- Consistent reading experience

### Best Practices

1. **Image Size**: Use images that are 800-1200px wide for best quality
2. **File Format**: Prefer `.webp` for smaller file size, fallback to `.png` or `.jpg`
3. **Alt Text**: Always provide descriptive alt text for accessibility
4. **Caption Length**: Keep captions concise (1-2 sentences)
5. **Placement**: Use floated images for supporting visuals, centered for key images
6. **Spacing**: Shortcodes handle spacing automatically - no need for extra line breaks

### Common Use Cases

**Supporting Screenshot:**
```markdown
#### How to Enable MFA

{% imageRight "./mfa-settings.png", "MFA settings screen" %}
Screenshot showing the MFA toggle in settings
{% endimageRight %}

Navigate to Settings > Security > Multi-Factor Authentication. Toggle the switch to enable...
```

**Before/After Comparison:**
```markdown
{% imageLeft "./before.png", "Before optimization" %}
**Before:** Site loading in 8 seconds
{% endimageLeft %}

After implementing our caching strategy, the same page now loads in under 2 seconds...
```

**Featured Image:**
```markdown
{% imageCenter "./architecture-diagram.png", "System architecture" %}
Complete architecture showing **microservices** and **data flow**
{% endimageCenter %}

This architecture enables horizontal scaling...
```

### Technical Details

- **Implementation**: Eleventy paired shortcodes in `.eleventy.js`
- **Styling**: Responsive CSS in `src/assets/css/custom.css`
- **Classes**: `.img-float-right`, `.img-float-left`, `.img-float-center`
- **Markdown Processing**: Captions rendered with `markdown-it.renderInline()`

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
