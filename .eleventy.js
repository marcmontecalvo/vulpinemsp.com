module.exports = function (eleventyConfig) {
    // Copy through static assets (no processing)
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy({ "src/public": "." }); // copies into site root
    eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-rss"));

    return {
        dir: {
            input: "src",
            includes: "_includes",
            data: "_data",
            output: "dist"
        },
        // Use Nunjucks for HTML & Markdown templates
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
        templateFormats: ["njk", "md", "html"]
    };
};
