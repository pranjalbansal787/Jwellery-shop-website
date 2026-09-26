import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const pages = ["/", "/shop/rings", "/products/elan-solitaire-ring", "/configure", "/appointments", "/checkout", "/stores", "/admin", "/admin/orders", "/admin/brand-settings"];
const widths = [320, 375, 430, 768, 1024, 1280, 1728, 1920];
const bad = [];
for (const w of widths) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const path of pages) {
    await p.goto("http://localhost:3100" + path, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(400);
    const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (o > 0) bad.push(`${w} ${path} +${o}`);
  }
  await p.close();
}
console.log(bad.length ? bad.join("\n") : "no horizontal overflow");
await b.close();
