import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import site from "./src/_data/site.js";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Scene prototypes are served by the dev server only; production builds leave them out.
  if (process.env.ELEVENTY_RUN_MODE === "build") eleventyConfig.ignores.add("src/proto/**");
  eleventyConfig.addPassthroughCopy({
    "node_modules/swup/dist/Swup.umd.js": "assets/vendor/swup.js",
    "node_modules/@swup/head-plugin/dist/index.umd.js": "assets/vendor/swup-head.js",
  });

  // Local images in markdown get width/height (no layout shift) and modern formats.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    widths: [720, 1440],
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 720px) 720px, 100vw" },
    },
  });

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/writing/**/*.md").filter((p) => !p.data.draft).reverse(),
  );

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/writing/feed.xml",
    collection: { name: "posts", limit: 20 },
    metadata: {
      language: "en",
      title: `${site.name}: Writing`,
      subtitle: site.description,
      base: site.url,
      author: { name: site.name },
    },
  });

  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("year", (date) => new Date(date).getUTCFullYear());
  eleventyConfig.addFilter("readableDate", (date) =>
    new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
  );
  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString().slice(0, 10));

  return {
    dir: { input: "src", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
