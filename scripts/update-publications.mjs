import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const [, , pdfDirectory] = process.argv;
if (!pdfDirectory) {
  throw new Error("Usage: node scripts/update-publications.mjs <pdf-directory>");
}

const documentsPath = "site/_data/documents.json";
const sitePath = "site/_data/site.json";
const documents = JSON.parse(readFileSync(documentsPath, "utf8"));
const site = JSON.parse(readFileSync(sitePath, "utf8"));
const pdfNames = readdirSync(pdfDirectory);

for (const document of documents) {
  const prefix = `${document.label}-v`;
  const matches = pdfNames.filter(name => name.startsWith(prefix) && name.endsWith(".pdf"));
  if (matches.length !== 1) {
    throw new Error(`Expected one generated PDF for ${document.label}, found ${matches.length}.`);
  }

  const [filename] = matches;
  document.file = `/standard/${filename}`;
  if (document.label === "IODM-001") {
    site.version = filename.slice(prefix.length, -".pdf".length);
  }
}

writeFileSync(documentsPath, JSON.stringify(documents, null, 2) + "\n");
writeFileSync(sitePath, JSON.stringify(site, null, 2) + "\n");
