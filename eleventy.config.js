import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";
import { HtmlBasePlugin } from "@11ty/eleventy";

const require = createRequire(import.meta.url);
const cliPackage = "@tailwindcss/cli/package.json";
const { bin } = require(cliPackage);
const tailwindCli = join(dirname(require.resolve(cliPackage)), bin.tailwindcss);
const stylesheet = "site/assets/site.css";
const publicationDirectory = process.env.IODM_PDF_DIRECTORY || "standards/pdf";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy({ [publicationDirectory]: "standard" });
  eleventyConfig.addWatchTarget(stylesheet);
  eleventyConfig.addGlobalData("deploymentUrl", process.env.PAGES_BASE_URL || "");
  eleventyConfig.addFilter("publicationUrl", (documents, label) => {
    const document = documents.find(document => document.label === label);
    if (!document) throw new Error(`Unknown publication: ${label}`);
    return document.file;
  });

  eleventyConfig.on("eleventy.before", ({ directories, outputMode }) => {
    if (outputMode !== "fs") return;

    if (!existsSync(publicationDirectory)) {
      throw new Error(`Missing publication directory ${publicationDirectory}. Initialize the standards submodule and run ./build.sh.`);
    }

    const documents = JSON.parse(readFileSync("site/_data/documents.json", "utf8"));
    for (const document of documents) {
      const pdf = join(publicationDirectory, basename(document.file));
      if (!existsSync(pdf)) throw new Error(`Missing publication PDF ${pdf}. Run ./build.sh.`);
    }

    execFileSync(process.execPath, [
      tailwindCli,
      "--input", stylesheet,
      "--output", join(directories.output, "assets", "site.css"),
      "--minify",
    ], { stdio: "inherit" });
  });

  return {
    pathPrefix: process.env.PAGES_BASE_PATH || "/",
    dir: {
      input: "site",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
