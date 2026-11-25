import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const cliPackage = "@tailwindcss/cli/package.json";
const { bin } = require(cliPackage);
const tailwindCli = join(dirname(require.resolve(cliPackage)), bin.tailwindcss);
const stylesheet = "site/assets/site.css";
const publicationDirectory = "standards/pdf";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ [publicationDirectory]: "standard" });
  eleventyConfig.addWatchTarget(stylesheet);

  eleventyConfig.on("eleventy.before", ({ directories, outputMode }) => {
    if (outputMode !== "fs") return;

    if (!existsSync(publicationDirectory)) {
      throw new Error("Initialize the standards submodule with git submodule update --init.");
    }

    execFileSync(process.execPath, [
      tailwindCli,
      "--input", stylesheet,
      "--output", join(directories.output, "assets", "site.css"),
      "--minify",
    ], { stdio: "inherit" });
  });

  return {
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
