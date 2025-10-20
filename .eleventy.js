module.exports = function (eleventyConfig) {
  // Copy global static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/public": "." });

  // Friendly date filter used by post layout
  eleventyConfig.addFilter("fmtDate", function (value, locale = "en-US", options) {
    try {
      const d = new Date(value);
      const fmt = options || { year: "numeric", month: "short", day: "2-digit" };
      return d.toLocaleDateString(locale, fmt);
    } catch {
      return String(value);
    }
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "dist",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};