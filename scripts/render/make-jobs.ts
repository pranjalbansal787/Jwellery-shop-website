import { products } from "../../src/data/catalog";
import { writeFileSync } from "node:fs";

const jobs: unknown[] = [];
const W = 800, H = 1000;
for (const p of products) {
  const base = { design: p.design, shape: p.shape, size: p.gemSize };
  for (const metal of p.metals) {
    jobs.push({ id: `${p.slug}--${metal}--${p.defaultGem}--front`, spec: { ...base, metal, gem: p.defaultGem }, view: "front", w: W, h: H });
  }
  for (const gem of p.gems) {
    if (gem === p.defaultGem) continue;
    jobs.push({ id: `${p.slug}--${p.defaultMetal}--${gem}--front`, spec: { ...base, metal: p.defaultMetal, gem }, view: "front", w: W, h: H });
  }
  jobs.push({ id: `${p.slug}--${p.defaultMetal}--${p.defaultGem}--detail`, spec: { ...base, metal: p.defaultMetal, gem: p.defaultGem }, view: "detail", w: W, h: H });
}
writeFileSync("scripts/render/jobs.json", JSON.stringify(jobs, null, 0));
console.log(`${jobs.length} jobs`);
