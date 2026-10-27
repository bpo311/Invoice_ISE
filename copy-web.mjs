// Copies the web app into dist/ for Capacitor, excluding native/tooling files.
import { cpSync, rmSync, mkdirSync, readdirSync } from "node:fs";

const EXCLUDE = new Set([
  "node_modules", "ios", "dist", ".git", ".github",
  "package.json", "package-lock.json", "capacitor.config.json",
  "copy-web.mjs", ".gitignore",
  "sw.js" // service worker is unnecessary inside the native shell
]);

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const entry of readdirSync(".")) {
  if (EXCLUDE.has(entry)) continue;
  cpSync(entry, `dist/${entry}`, { recursive: true });
}
console.log("Copied web app to dist/");
