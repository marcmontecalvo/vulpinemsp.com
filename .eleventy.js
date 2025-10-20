module.exports = function (eleventyConfig) {
    // Copy static assets straight through
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy({ "src/public": "." });

    // Simple date formatting filter (avoids Nunjucks 'date' filter dependency)
    eleventyConfig.addFilter("fmtDate", function (value, locale = "en-US", options) {
        try {
            const d = new Date(value);
            // default: "Oct 20, 2025"
            const fmt = options || { year: "numeric", month: "short", day: "2-digit" };
            return d.toLocaleDateString(locale, fmt);
        } catch (e) {
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
