// Copies the word list from the main wwordy project, so the bot and the app stay the same.
//   npm run sync-words -- ../wwordy
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const from = process.argv[2];
if (!from) {
  console.error("Usage: npm run sync-words -- <path to the wwordy project>");
  process.exit(1);
}
for (const f of ["level-data-a.js", "level-data-b.js"]) {
  const src = join(from, "src", "core", f);
  if (!existsSync(src)) {
    console.error(`✖ Not found: ${src}`);
    process.exit(1);
  }
  copyFileSync(src, join("src", "data", f));
  console.log(`✔ ${f}`);
}
console.log("Done. Run `npm test` to check the word list is still valid.");
