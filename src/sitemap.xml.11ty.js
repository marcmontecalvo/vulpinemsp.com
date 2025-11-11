// src/sitemap.xml.11ty.js
import { execSync } from 'node:child_process';
function lastmodISO(item) {
  // Prefer Git commit date; fallback to front-matter "updated" or page.date
  try {
    const p = (item.inputPath || '').replace(/^.\//, '');
    if (p) {
      const iso = execSync(`git log -1 --format=%cI -- "${p}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (iso) return iso;
    }
  } catch {}
  const d = item.data?.updated || item.date || new Date();
  return new Date(d).toISOString();
}

export default class {
  data() {
    return {
      permalink: '/sitemap.xml',
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const siteUrl = (data.site && data.site.url) || '';
    const pages = data.collections.livePages || [];

    const urls = pages.map((item) => {
      const loc = `${siteUrl}${item.url}`;
      const lastmod = lastmodISO(item);
      const changefreq = item.data?.changefreq || 'monthly';
      const priority = item.data?.priority || '0.5';
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    });

    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">`,
      urls.join('\n'),
      `</urlset>`,
      '', // trailing newline
    ].join('\n');
  }
}
