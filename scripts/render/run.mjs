// Renders procedural jewellery into public/renders as transparent WebP studio shots.
// Usage: node scripts/render/run.mjs [jobs.json]
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
execSync("npx esbuild scripts/render/entry.ts --bundle --format=iife --outfile=scripts/render/.bundle.js --log-level=warning", { cwd: root, stdio: "inherit" });
const jobsFile = process.argv[2] ?? path.join(root, "scripts/render/jobs.json");
const jobs = JSON.parse(readFileSync(jobsFile, "utf8"));
const outDir = path.join(root, "public/renders");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
await page.setContent(`<html><body style="margin:0;background:transparent"><script>${readFileSync(path.join(root, "scripts/render/.bundle.js"), "utf8")}</script></body></html>`);
await page.waitForFunction(() => window.ready === true);
let n = 0;
for (const job of jobs) {
  const file = path.join(outDir, `${job.id}.webp`);
  if (existsSync(file) && !process.env.FORCE) continue;
  const data = await page.evaluate(({ spec, view, w, h }) => window.renderJewel(spec, view, w, h), job);
  writeFileSync(file, Buffer.from(data.split(",")[1], "base64"));
  n++;
  if (n % 10 === 0) console.log(`rendered ${n}`);
}
console.log(`done: ${n} new renders`);
await browser.close();
