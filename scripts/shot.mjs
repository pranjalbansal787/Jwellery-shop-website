// Usage: node scripts/shot.mjs <url-path> <width> <out.png> [scrollY] [fullPage]
import { chromium } from "playwright-core";
const [path = "/", width = "1440", out = "shot.png", scrollY = "0", full = "0", height = "900"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: +width, height: +height }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
await page.goto(`http://localhost:${process.env.PORT || 3100}${path}`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);
if (+scrollY) { await page.evaluate((y) => window.scrollTo(0, y), +scrollY); await page.waitForTimeout(1800); }
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await page.screenshot({ path: out, fullPage: full === "1" });
console.log(JSON.stringify({ overflow, errors: errors.slice(0, 12) }, null, 1));
await browser.close();
