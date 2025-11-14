// ...top of file
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { glob } from 'glob';
import markdownIt from 'markdown-it';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItIconTasks from './lib/markdown-it-icon-tasks.js';

export default function (eleventyConfig) {
  // Configure markdown-it with task lists plugin
  // IMPORTANT: Icon tasks plugin must run BEFORE task-lists plugin
  const md = markdownIt({
    html: true,
    breaks: false,
    linkify: true
  }).use(markdownItIconTasks)
    .use(markdownItTaskLists, {
    enabled: true
  });

  eleventyConfig.setLibrary('md', md);

  // Image float paired shortcodes for blog posts
  // Usage: {% imageRight "./file.png", "Alt text" %}Caption text{% endimageRight %}
  function createImageFloat(position) {
    return function(caption, src, alt = '') {
      // Render caption with markdown support (bold, italic, links)
      const captionHtml = md.renderInline(caption.trim());

      return `<figure class="img-float-${position}">
  <img src="${src}" alt="${alt}" class="figure-img img-fluid rounded shadow-sm">
  <figcaption class="figure-caption">${captionHtml}</figcaption>
</figure>`;
    };
  }

  eleventyConfig.addPairedShortcode('imageRight', createImageFloat('right'));
  eleventyConfig.addPairedShortcode('imageLeft', createImageFloat('left'));
  eleventyConfig.addPairedShortcode('imageCenter', createImageFloat('center'));

  // existing passthroughs
  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy({ 'src/public': '.' });

  // Copy post assets to blog directory, stripping date prefixes from folder names
  eleventyConfig.on('eleventy.before', async () => {
    const assetFiles = await glob('src/posts/**/*.{png,jpg,jpeg,webp,gif,mp4,mov,pdf,zip}');
    for (const srcPath of assetFiles) {
      // Normalize path separators for cross-platform support
      const normalizedPath = srcPath.replace(/\\/g, '/');
      // Extract the folder structure: src/posts/2025-11-12-holiday-cyber-scams/image.png
      const relativePath = normalizedPath.replace('src/posts/', '');
      // Strip date prefix (YYYY-MM-DD-) from folder name
      const destPath = relativePath.replace(/^\d{4}-\d{2}-\d{2}-/, '');
      const outputPath = path.join('_site', 'blog', ...destPath.split('/'));

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Copy the file
      fs.copyFileSync(srcPath, outputPath);
    }
  });
  eleventyConfig.setDataDeepMerge(true);

  // existing date filter
  eleventyConfig.addFilter('fmtDate', function (value, locale = 'en-US', options) {
    try {
      const d = new Date(value);
      const fmt = options || { year: 'numeric', month: 'short', day: '2-digit' };
      return d.toLocaleDateString(locale, fmt);
    } catch {
      return String(value);
    }
  });

  // Add unique filter for arrays
  eleventyConfig.addFilter('unique', function (array) {
    return [...new Set(array)];
  });

  // Add limit filter for arrays
  eleventyConfig.addFilter('limit', function (array, limit) {
    return array.slice(0, limit);
  });

  // Git last-modified → ISO (as before)
  eleventyConfig.addFilter('gitLastModISO', (page) => {
    try {
      const filePath = page.inputPath?.replace(/^.\//, '') || '';
      if (filePath) {
        const iso = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        if (iso) return iso;
      }
    } catch {}
    const d = page.data?.updated || page.date || new Date();
    return new Date(d).toISOString();
  });

  // Live pages for sitemap (unchanged logic)
  eleventyConfig.addCollection('livePages', (collection) => {
    const isProd =
      process.env.ELEVENTY_ENV === 'production' || process.env.NODE_ENV === 'production';

    // load sitemap exclusions (safe if file missing)
    let excludePrefixes = [],
      excludeExact = [];
    try {
      const cfg = require(path.join(process.cwd(), 'src/_data/sitemap.json'));
      excludePrefixes = Array.isArray(cfg.excludePrefixes) ? cfg.excludePrefixes : [];
      excludeExact = Array.isArray(cfg.excludeExact) ? cfg.excludeExact : [];
    } catch {}

    return collection.getAll().filter((item) => {
      if (isProd && (item.data?.draft === true || item.data?.eleventyExcludeFromCollections))
        return false;

      const u = item.url || '';
      if (!u) return false;
      if (u.includes('404')) return false;
      if (u.endsWith('feed.xml')) return false;

      if (item.data?.sitemapExclude === true) return false; // per-page off
      if (excludeExact.includes(u)) return false; // exact match
      if (excludePrefixes.some((p) => u.startsWith(p))) return false; // prefix match

      return true;
    });
  });

  // NEW: single hybrid collection that returns { curated, rules }
  eleventyConfig.addCollection('llmsHybrid', (collectionApi) => {
    const all = collectionApi.getAll().filter((p) => p.url);

    // --- Curated (front-matter flags) ---
    const curatedRaw = all
      .filter((p) => p.data?.llms === true)
      .map((p) => ({
        ...p,
        _section: p.data.llmsSection || 'General',
        _rank: Number.isFinite(p.data.llmsRank) ? p.data.llmsRank : 1000,
        _lastmod: p.data.updated || p.date,
      }))
      .sort((a, b) => a._rank - b._rank || b._lastmod - a._lastmod);

    // Group curated by section
    const groupedCuratedMap = new Map();
    for (const p of curatedRaw) {
      const key = p._section;
      if (!groupedCuratedMap.has(key)) groupedCuratedMap.set(key, []);
      groupedCuratedMap.get(key).push(p);
    }
    const curated = Array.from(groupedCuratedMap.entries()).map(([title, items]) => ({
      title,
      items,
    }));

    // Keep a set of URLs already printed by curated
    const seen = new Set(curatedRaw.map((p) => p.url));

    // --- Rule-based sections from src/_data/llms.json ---
    let rules = [];
    try {
      const cfg = require(path.join(process.cwd(), 'src/_data/llms.json'));
      const sections = Array.isArray(cfg.sections) ? cfg.sections : [];
      rules = sections.map((sec) => {
        let set = [];
        if (sec.paths?.length) {
          set = set.concat(all.filter((p) => sec.paths.includes(p.url)));
        }
        if (sec.prefix) {
          set = set.concat(all.filter((p) => p.url.startsWith(sec.prefix)));
        }
        // unique within this section
        const uniq = [];
        const localSeen = new Set();
        for (const p of set) {
          if (!localSeen.has(p.url)) {
            localSeen.add(p.url);
            uniq.push(p);
          }
        }
        // newest first
        uniq.sort((a, b) => (b.data.updated || b.date) - (a.data.updated || a.date));
        // filter out anything already in curated
        const filtered = uniq.filter((p) => !seen.has(p.url));
        if (sec.limit) filtered.splice(sec.limit);
        return { title: sec.title || 'General', items: filtered };
      });
    } catch {
      // no rules config; leave empty
      rules = [];
    }

    return [{ curated, rules }]; // array with one object for easy access in templates
  });

  return {
    dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    templateFormats: ['njk', 'md', 'html', '11ty.js'],
  };
}
