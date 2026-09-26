/**
 * DEMO CATALOGUE — all names, SKUs, prices, certificates and stock levels below are
 * generated demonstration data (isDemo: true). Replace via the Admin or the Laravel seeders.
 */
import type { Badge, Category, Collection, DesignKey, GemKey, GemShape, Gender, MetalKey, Occasion, Product, Purity, StockStatus, Variant } from "@/lib/types";
import { renderPath } from "@/lib/media";

export const categories: Category[] = [
  { id: "cat-rings", slug: "rings", name: "Rings", parentId: null, position: 1, published: true, heroDesign: "solitaire", description: "Solitaires, bands and statement rings, each set and finished by hand." },
  { id: "cat-engagement", slug: "engagement-rings", name: "Engagement Rings", parentId: "cat-rings", position: 1, published: true, heroDesign: "halo", description: "Certified centre stones in settings designed to be worn for a lifetime." },
  { id: "cat-wedding", slug: "wedding-bands", name: "Wedding Bands", parentId: "cat-rings", position: 2, published: true, heroDesign: "eternity", description: "Court bands, eternity rings and matching pairs." },
  { id: "cat-cocktail", slug: "cocktail-rings", name: "Cocktail Rings", parentId: "cat-rings", position: 3, published: true, heroDesign: "cocktail", description: "Coloured stones with presence, framed in diamonds." },
  { id: "cat-earrings", slug: "earrings", name: "Earrings", parentId: null, position: 2, published: true, heroDesign: "drops", description: "Studs, drops and hoops, from everyday to evening." },
  { id: "cat-necklaces", slug: "necklaces", name: "Necklaces", parentId: null, position: 3, published: true, heroDesign: "riviere", description: "Rivières and statement necklaces graduated by hand." },
  { id: "cat-pendants", slug: "pendants", name: "Pendants", parentId: "cat-necklaces", position: 1, published: true, heroDesign: "pendant", description: "A single stone, suspended on a fine chain." },
  { id: "cat-bracelets", slug: "bracelets", name: "Bracelets", parentId: null, position: 4, published: true, heroDesign: "tennis", description: "Tennis bracelets and line bracelets with hidden clasps." },
  { id: "cat-bangles", slug: "bangles", name: "Bangles", parentId: "cat-bracelets", position: 1, published: true, heroDesign: "bangle", description: "Kadas and bangles in 18K and 22K gold." },
  { id: "cat-men", slug: "mens-jewellery", name: "Men's Jewellery", parentId: null, position: 5, published: true, heroDesign: "signet", description: "Signets, bands and cuffs with a quieter point of view." },
];

type Row = {
  slug: string; name: string; subtitle: string; design: DesignKey; cat: string; colls: string[];
  metals: MetalKey[]; gem: GemKey; gems?: GemKey[]; shape?: GemShape; size?: number; price: number;
  badges?: Badge[]; status?: StockStatus; gender?: Gender; occ: Occasion[]; purities?: Purity[];
  carat?: number; compareAt?: number; daysAgo: number;
};

const rows: Row[] = [
  // Engagement
  { slug: "elan-solitaire-ring", name: "Élan Solitaire Ring", subtitle: "1.00 ct round brilliant, six-prong", design: "solitaire", cat: "cat-engagement", colls: ["eternal", "bridal-2027"], metals: ["yellow", "white", "rose", "platinum"], gem: "diamond", price: 645000, badges: ["BESTSELLER"], occ: ["engagement"], carat: 1.0, daysAgo: 210 },
  { slug: "aurore-oval-solitaire", name: "Aurore Oval Solitaire", subtitle: "1.10 ct oval, hidden basket", design: "solitaire", cat: "cat-engagement", colls: ["eternal"], metals: ["white", "yellow", "rose"], gem: "diamond", shape: "oval", size: 1.05, price: 585000, occ: ["engagement"], carat: 1.1, daysAgo: 160 },
  { slug: "lumiere-pear-solitaire", name: "Lumière Pear Solitaire", subtitle: "0.90 ct pear, knife-edge band", design: "solitaire", cat: "cat-engagement", colls: ["eternal", "bridal-2027"], metals: ["rose", "yellow", "white"], gem: "diamond", shape: "pear", price: 495000, badges: ["NEW"], occ: ["engagement"], carat: 0.9, daysAgo: 12 },
  { slug: "odette-emerald-cut-ring", name: "Odette Emerald-Cut Ring", subtitle: "1.50 ct step-cut, four claws", design: "solitaire", cat: "cat-engagement", colls: ["eternal"], metals: ["platinum", "white", "yellow"], gem: "diamond", shape: "emerald", size: 1.1, price: 725000, badges: ["EXCLUSIVE", "MADE TO ORDER"], status: "made_to_order", occ: ["engagement"], carat: 1.5, daysAgo: 95 },
  { slug: "seraphine-halo-ring", name: "Seraphine Halo Ring", subtitle: "0.70 ct centre, pavé halo and shoulders", design: "halo", cat: "cat-engagement", colls: ["eternal", "bridal-2027"], metals: ["white", "yellow", "rose", "platinum"], gem: "diamond", price: 385000, badges: ["BESTSELLER"], occ: ["engagement"], carat: 1.05, daysAgo: 240 },
  { slug: "isadora-oval-halo", name: "Isadora Oval Halo", subtitle: "0.90 ct oval within a floating halo", design: "halo", cat: "cat-engagement", colls: ["eternal"], metals: ["white", "rose", "yellow"], gem: "diamond", shape: "oval", price: 440000, occ: ["engagement"], carat: 1.25, daysAgo: 130 },
  { slug: "vesper-cushion-halo", name: "Vesper Cushion Halo", subtitle: "0.80 ct cushion, micro-pavé", design: "halo", cat: "cat-engagement", colls: ["bridal-2027"], metals: ["platinum", "white", "yellow"], gem: "diamond", shape: "cushion", price: 365000, badges: ["NEW"], occ: ["engagement"], carat: 1.1, daysAgo: 8 },
  { slug: "trinity-three-stone-ring", name: "Trinity Three-Stone Ring", subtitle: "Past, present and future, 1.20 ctw", design: "three-stone", cat: "cat-engagement", colls: ["eternal"], metals: ["yellow", "white", "platinum"], gem: "diamond", price: 415000, occ: ["engagement", "anniversary"], carat: 1.2, daysAgo: 180 },
  { slug: "aria-three-stone-oval", name: "Aria Three-Stone Oval", subtitle: "Oval centre with round sides, 1.60 ctw", design: "three-stone", cat: "cat-engagement", colls: ["bridal-2027"], metals: ["white", "rose"], gem: "diamond", shape: "oval", price: 520000, badges: ["LIMITED"], status: "low_stock", occ: ["engagement", "anniversary"], carat: 1.6, daysAgo: 40 },
  { slug: "celine-petite-solitaire", name: "Céline Petite Solitaire", subtitle: "0.50 ct round, slim band", design: "solitaire", cat: "cat-engagement", colls: ["everyday", "gifts"], metals: ["yellow", "rose", "white"], gem: "diamond", size: 0.8, price: 195000, occ: ["engagement", "birthday"], carat: 0.5, daysAgo: 70 },
  // Wedding
  { slug: "eterna-court-band", name: "Eterna Court Band", subtitle: "3.5 mm comfort-fit court band", design: "band", cat: "cat-wedding", colls: ["eternal", "everyday"], metals: ["yellow", "white", "rose", "platinum"], gem: "none", price: 58000, purities: ["18K", "22K"], occ: ["wedding"], daysAgo: 300 },
  { slug: "ophelia-eternity-band", name: "Ophelia Eternity Band", subtitle: "Full eternity, 2.00 ctw", design: "eternity", cat: "cat-wedding", colls: ["eternal", "bridal-2027"], metals: ["platinum", "white", "yellow", "rose"], gem: "diamond", price: 245000, badges: ["BESTSELLER"], occ: ["wedding", "anniversary"], carat: 2.0, daysAgo: 220 },
  { slug: "marlowe-eternity-band", name: "Marlowe Slim Eternity", subtitle: "Shared-claw eternity, 1.10 ctw", design: "eternity", cat: "cat-wedding", colls: ["everyday"], metals: ["rose", "yellow", "white"], gem: "diamond", size: 0.8, price: 135000, occ: ["wedding", "anniversary"], carat: 1.1, daysAgo: 60 },
  { slug: "aeon-wedding-band", name: "Aeon Wedding Band", subtitle: "5 mm flat court band", design: "band", cat: "cat-wedding", colls: ["eternal"], metals: ["platinum", "white", "yellow"], gem: "none", price: 72000, gender: "men", occ: ["wedding"], daysAgo: 280 },
  { slug: "soleil-ruby-eternity", name: "Soleil Ruby Eternity", subtitle: "Burmese-type rubies, 1.80 ctw", design: "eternity", cat: "cat-wedding", colls: ["festive-edit", "colour-stories"], metals: ["yellow", "rose"], gem: "ruby", price: 210000, occ: ["anniversary", "festive"], daysAgo: 25 },
  // Cocktail
  { slug: "verdance-emerald-cocktail", name: "Verdance Emerald Cocktail Ring", subtitle: "3.10 ct Colombian emerald, diamond frame", design: "cocktail", cat: "cat-cocktail", colls: ["colour-stories", "heritage"], metals: ["yellow", "white"], gem: "emerald", shape: "emerald", price: 325000, badges: ["EXCLUSIVE"], status: "low_stock", occ: ["festive", "anniversary"], daysAgo: 50 },
  { slug: "nocturne-sapphire-cocktail", name: "Nocturne Sapphire Cocktail Ring", subtitle: "2.60 ct oval sapphire", design: "cocktail", cat: "cat-cocktail", colls: ["colour-stories"], metals: ["white", "platinum", "yellow"], gem: "sapphire", shape: "oval", price: 295000, occ: ["anniversary", "gifting"], daysAgo: 85 },
  { slug: "maharani-ruby-cocktail", name: "Maharani Ruby Cocktail Ring", subtitle: "Cushion ruby in 22K gold", design: "cocktail", cat: "cat-cocktail", colls: ["heritage", "festive-edit"], metals: ["yellow", "rose"], gem: "ruby", shape: "cushion", price: 275000, purities: ["18K", "22K"], occ: ["festive", "wedding"], daysAgo: 30 },
  { slug: "celeste-colour-solitaire", name: "Celeste Colour Solitaire", subtitle: "1.20 ct oval, choose your stone", design: "solitaire", cat: "cat-cocktail", colls: ["colour-stories", "gifts"], metals: ["white", "yellow", "rose"], gem: "sapphire", gems: ["sapphire", "emerald", "ruby"], shape: "oval", price: 185000, badges: ["NEW"], occ: ["birthday", "gifting"], daysAgo: 5 },
  { slug: "nuit-sapphire-halo", name: "Nuit Sapphire Halo", subtitle: "Oval sapphire, diamond halo", design: "halo", cat: "cat-cocktail", colls: ["colour-stories"], metals: ["white", "platinum"], gem: "sapphire", shape: "oval", price: 265000, occ: ["engagement", "anniversary"], daysAgo: 110 },
  // Earrings
  { slug: "seraphina-drop-earrings", name: "Seraphina Drop Earrings", subtitle: "Pear drops beneath brilliant studs", design: "drops", cat: "cat-earrings", colls: ["bridal-2027"], metals: ["white", "yellow", "rose"], gem: "diamond", price: 215000, occ: ["wedding", "festive"], carat: 1.6, daysAgo: 45 },
  { slug: "aurelia-diamond-studs", name: "Aurelia Diamond Studs", subtitle: "1.00 ctw, six-claw martini setting", design: "studs", cat: "cat-earrings", colls: ["everyday", "gifts"], metals: ["white", "yellow", "rose", "platinum"], gem: "diamond", price: 125000, badges: ["BESTSELLER"], occ: ["everyday", "gifting", "birthday"], carat: 1.0, daysAgo: 260 },
  { slug: "lumen-cushion-studs", name: "Lumen Cushion Studs", subtitle: "0.80 ctw cushion cut", design: "studs", cat: "cat-earrings", colls: ["everyday"], metals: ["white", "rose"], gem: "diamond", shape: "cushion", price: 98000, occ: ["everyday", "gifting"], carat: 0.8, daysAgo: 150 },
  { slug: "verde-emerald-drops", name: "Verde Emerald Drops", subtitle: "Pear emeralds, diamond halo", design: "drops", cat: "cat-earrings", colls: ["colour-stories"], metals: ["yellow", "white"], gem: "emerald", gems: ["emerald", "sapphire", "ruby"], price: 165000, occ: ["festive", "gifting"], daysAgo: 20 },
  { slug: "halcyon-pave-hoops", name: "Halcyon Pavé Hoops", subtitle: "Front-facing pavé, 0.60 ctw", design: "hoops", cat: "cat-earrings", colls: ["everyday"], metals: ["rose", "yellow", "white"], gem: "diamond", price: 145000, badges: ["NEW"], occ: ["everyday", "gifting"], carat: 0.6, daysAgo: 3 },
  { slug: "golden-hour-hoops", name: "Golden Hour Hoops", subtitle: "Polished 18K hoops, 22 mm", design: "hoops", cat: "cat-earrings", colls: ["everyday", "gifts"], metals: ["yellow", "rose", "white"], gem: "none", price: 62000, occ: ["everyday", "gifting"], daysAgo: 190 },
  { slug: "odile-sapphire-studs", name: "Odile Sapphire Studs", subtitle: "Oval sapphires, 1.40 ctw", design: "studs", cat: "cat-earrings", colls: ["colour-stories", "gifts"], metals: ["white", "yellow"], gem: "sapphire", shape: "oval", price: 88000, occ: ["gifting", "birthday"], daysAgo: 100 },
  { slug: "rani-ruby-drops", name: "Rani Ruby Drops", subtitle: "Ruby pear drops in 22K gold", design: "drops", cat: "cat-earrings", colls: ["heritage", "festive-edit"], metals: ["yellow"], gem: "ruby", price: 138000, purities: ["22K"], occ: ["festive", "wedding"], daysAgo: 35 },
  { slug: "amour-ruby-studs", name: "Amour Ruby Studs", subtitle: "Round rubies, 0.90 ctw", design: "studs", cat: "cat-earrings", colls: ["gifts", "festive-edit"], metals: ["rose", "yellow"], gem: "ruby", price: 72000, occ: ["gifting", "anniversary"], daysAgo: 15 },
  // Pendants & necklaces
  { slug: "celeste-emerald-pendant", name: "Celeste Emerald Pendant", subtitle: "Pear emerald on a fine cable chain", design: "pendant", cat: "cat-pendants", colls: ["colour-stories", "gifts"], metals: ["yellow", "white", "rose"], gem: "emerald", gems: ["emerald", "sapphire", "ruby", "diamond"], price: 142000, badges: ["BESTSELLER"], occ: ["gifting", "birthday"], daysAgo: 140 },
  { slug: "larme-diamond-drop", name: "Larme Diamond Drop", subtitle: "0.75 ct pear, bezel-framed", design: "pendant", cat: "cat-pendants", colls: ["eternal", "gifts"], metals: ["white", "yellow", "rose", "platinum"], gem: "diamond", price: 195000, badges: ["BESTSELLER"], occ: ["gifting", "anniversary"], carat: 0.75, daysAgo: 230 },
  { slug: "solene-solitaire-pendant", name: "Solène Solitaire Pendant", subtitle: "0.40 ct round, everyday weight", design: "pendant", cat: "cat-pendants", colls: ["everyday", "gifts"], metals: ["yellow", "rose", "white"], gem: "diamond", shape: "round", size: 0.8, price: 115000, occ: ["everyday", "gifting"], carat: 0.4, daysAgo: 75 },
  { slug: "azure-sapphire-pendant", name: "Azure Sapphire Pendant", subtitle: "Oval sapphire, whisper chain", design: "pendant", cat: "cat-pendants", colls: ["colour-stories"], metals: ["white", "yellow"], gem: "sapphire", shape: "oval", price: 128000, occ: ["gifting", "birthday"], daysAgo: 55 },
  { slug: "petite-etoile-pendant", name: "Petite Étoile Pendant", subtitle: "0.20 ct round, 40 cm chain", design: "pendant", cat: "cat-pendants", colls: ["gifts", "everyday"], metals: ["rose", "yellow", "white"], gem: "diamond", shape: "round", size: 0.62, price: 68000, occ: ["gifting", "birthday"], carat: 0.2, daysAgo: 18 },
  { slug: "regalia-riviere-necklace", name: "Regalia Rivière Necklace", subtitle: "Graduated brilliants, 12.40 ctw", design: "riviere", cat: "cat-necklaces", colls: ["bridal-2027", "eternal"], metals: ["white", "platinum"], gem: "diamond", price: 950000, badges: ["LIMITED", "MADE TO ORDER"], status: "made_to_order", occ: ["wedding"], carat: 12.4, daysAgo: 90 },
  { slug: "padmini-emerald-riviere", name: "Padmini Emerald Rivière", subtitle: "Emerald centre drops, diamond line", design: "riviere", cat: "cat-necklaces", colls: ["heritage", "colour-stories"], metals: ["yellow", "white"], gem: "emerald", price: 780000, badges: ["EXCLUSIVE"], status: "low_stock", occ: ["wedding", "festive"], daysAgo: 65 },
  { slug: "ember-ruby-riviere", name: "Ember Ruby Rivière", subtitle: "Rubies graduating into brilliants", design: "riviere", cat: "cat-necklaces", colls: ["festive-edit", "heritage"], metals: ["yellow", "rose"], gem: "ruby", price: 690000, status: "preorder", occ: ["festive", "wedding"], daysAgo: 10 },
  // Bracelets & bangles
  { slug: "aurelia-tennis-bracelet", name: "Aurelia Diamond Tennis Bracelet", subtitle: "46 brilliants, 4.60 ctw", design: "tennis", cat: "cat-bracelets", colls: ["eternal", "gifts"], metals: ["white", "yellow", "rose", "platinum"], gem: "diamond", price: 385000, badges: ["BESTSELLER"], occ: ["anniversary", "gifting"], carat: 4.6, daysAgo: 250 },
  { slug: "riviera-sapphire-tennis", name: "Riviera Sapphire Tennis Bracelet", subtitle: "Alternating sapphires and brilliants", design: "tennis", cat: "cat-bracelets", colls: ["colour-stories"], metals: ["white", "yellow"], gem: "sapphire", price: 320000, occ: ["anniversary", "gifting"], daysAgo: 120 },
  { slug: "kalista-emerald-tennis", name: "Kalista Emerald Tennis Bracelet", subtitle: "Emeralds and brilliants, hidden clasp", design: "tennis", cat: "cat-bracelets", colls: ["colour-stories", "festive-edit"], metals: ["yellow", "rose"], gem: "emerald", price: 340000, badges: ["NEW"], occ: ["festive", "anniversary"], daysAgo: 6 },
  { slug: "surya-gold-kada", name: "Surya Gold Kada", subtitle: "Solid 22K gold, hand-polished", design: "bangle", cat: "cat-bangles", colls: ["heritage", "festive-edit"], metals: ["yellow"], gem: "none", price: 285000, purities: ["22K"], gender: "unisex", occ: ["festive", "wedding"], daysAgo: 200 },
  { slug: "zenith-diamond-bangle", name: "Zenith Diamond Bangle", subtitle: "Channel-set brilliants, 1.80 ctw", design: "bangle", cat: "cat-bangles", colls: ["eternal"], metals: ["white", "yellow", "rose"], gem: "diamond", price: 225000, occ: ["anniversary", "festive"], carat: 1.8, daysAgo: 170 },
  { slug: "anaya-ruby-bangle", name: "Anaya Ruby Bangle", subtitle: "Rubies set in 22K gold", design: "bangle", cat: "cat-bangles", colls: ["heritage", "festive-edit"], metals: ["yellow"], gem: "ruby", price: 260000, purities: ["22K"], occ: ["festive", "wedding"], daysAgo: 28 },
  { slug: "stellar-pave-bangle", name: "Stellar Pavé Bangle", subtitle: "Slim pavé bangle in rose gold", design: "bangle", cat: "cat-bangles", colls: ["everyday"], metals: ["rose", "white", "yellow"], gem: "diamond", price: 195000, badges: ["NEW"], occ: ["everyday", "gifting"], carat: 1.2, daysAgo: 2 },
  // Men
  { slug: "regent-signet-ring", name: "Regent Signet Ring", subtitle: "Oval face, engravable", design: "signet", cat: "cat-men", colls: ["heritage"], metals: ["yellow", "white"], gem: "none", price: 85000, gender: "men", occ: ["everyday", "gifting"], daysAgo: 115 },
  { slug: "sovereign-diamond-signet", name: "Sovereign Diamond Signet", subtitle: "Signet with a single flush brilliant", design: "signet", cat: "cat-men", colls: ["heritage"], metals: ["yellow", "platinum"], gem: "diamond", price: 115000, gender: "men", status: "out_of_stock", occ: ["gifting"], carat: 0.3, daysAgo: 135 },
  { slug: "atlas-mens-band", name: "Atlas Men's Band", subtitle: "6 mm brushed court band", design: "band", cat: "cat-men", colls: ["everyday"], metals: ["platinum", "white", "yellow"], gem: "none", size: 1, price: 78000, gender: "men", occ: ["wedding", "everyday"], daysAgo: 155 },
  { slug: "vanguard-cuff", name: "Vanguard Cuff", subtitle: "Architectural white-gold cuff", design: "bangle", cat: "cat-men", colls: ["everyday"], metals: ["white", "yellow"], gem: "none", price: 165000, gender: "men", occ: ["gifting"], daysAgo: 80 },
  // Heritage
  { slug: "heirloom-emerald-three-stone", name: "Heirloom Emerald Three-Stone", subtitle: "Emerald centre, brilliant sides", design: "three-stone", cat: "cat-cocktail", colls: ["heritage", "colour-stories"], metals: ["yellow", "white"], gem: "emerald", shape: "emerald", price: 395000, occ: ["anniversary", "engagement"], daysAgo: 42 },
  { slug: "mira-everyday-eternity", name: "Mira Everyday Eternity", subtitle: "Petite eternity for stacking", design: "eternity", cat: "cat-wedding", colls: ["everyday", "gifts"], metals: ["yellow", "rose", "white"], gem: "diamond", size: 0.7, price: 85000, occ: ["everyday", "gifting", "birthday"], carat: 0.6, daysAgo: 22 },
];

import { RING_SIZES } from "@/lib/ring-size";
export { RING_SIZES };
const BANGLE_SIZES = ["2.2", "2.4", "2.6", "2.8"];
const BRACELET_SIZES = ["16 cm", "17 cm", "18 cm", "19 cm"];

const METAL_CODE: Record<MetalKey, string> = { yellow: "YG", white: "WG", rose: "RG", platinum: "PT" };
const GEM_CODE: Record<GemKey, string> = { diamond: "D", emerald: "E", ruby: "R", sapphire: "S", none: "X" };
const WEIGHTS: Record<DesignKey, number> = {
  solitaire: 3.4, halo: 4.1, band: 5.2, eternity: 3.1, "three-stone": 4.4, cocktail: 6.8, signet: 11.5,
  tennis: 14.2, bangle: 24.5, pendant: 3.8, studs: 2.2, drops: 4.6, hoops: 5.4, riviere: 32,
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

function roundPrice(n: number) {
  return Math.round(n / 500) * 500;
}

const COLOUR = ["F", "G", "E", "F", "G", "H"];
const CLARITY = ["VS1", "VVS2", "VS2", "VVS1", "VS1"];

const NOW = new Date("2026-09-26T10:00:00+05:30").getTime();

function build(row: Row, index: number): Product {
  const id = `prd-${String(index + 1).padStart(3, "0")}`;
  const prefix = row.slug.split("-").slice(0, 2).map((w) => w.slice(0, 3).toUpperCase()).join("");
  const sku = `SLN-${prefix}-${String(1001 + index)}`;
  const gems = row.gems ?? [row.gem];
  const purities: Purity[] = row.purities ?? ["18K", "14K"];
  const variants: Variant[] = [];
  const isRing = ["solitaire", "halo", "band", "eternity", "three-stone", "cocktail", "signet"].includes(row.design);
  for (const metal of row.metals) {
    const metalPurities: Purity[] = metal === "platinum" ? ["PT950"] : purities;
    for (const purity of metalPurities) {
      for (const g of gems) {
        const f =
          (metal === "platinum" ? 1.14 : 1) *
          (purity === "14K" ? 0.9 : purity === "22K" ? (row.purities?.length === 1 ? 1 : 1.08) : 1) *
          (g === row.gem ? 1 : g === "diamond" ? 1.22 : 0.96);
        const price = roundPrice(row.price * f);
        const h = hash(`${row.slug}${metal}${purity}${g}`);
        const baseStock = row.status === "out_of_stock" ? 0 : row.status === "made_to_order" || row.status === "preorder" ? 0 : row.status === "low_stock" ? 1 + (h % 2) : 2 + (h % 9);
        variants.push({
          id: `${id}-${METAL_CODE[metal]}${purity}-${GEM_CODE[g]}`.toLowerCase(),
          sku: `${sku}-${METAL_CODE[metal]}${purity.replace("PT950", "950")}-${GEM_CODE[g]}`,
          metal, purity, gem: g, price,
          compareAt: row.compareAt,
          stock: baseStock,
          weightGrams: Math.round(WEIGHTS[row.design] * (row.size ?? 1) * (metal === "platinum" ? 1.6 : purity === "22K" ? 1.12 : 1) * 10) / 10,
          leadDays: row.status === "made_to_order" ? 28 : row.status === "preorder" ? 21 : baseStock > 0 ? 3 : 14,
        });
      }
    }
  }
  const h = hash(row.slug);
  const shape = row.shape ?? (row.design === "pendant" ? "pear" : "round");
  const diamond =
    row.gem === "diamond" && row.carat
      ? {
          totalCarat: row.carat,
          shape,
          colour: COLOUR[h % COLOUR.length],
          clarity: CLARITY[h % CLARITY.length],
          cut: "Excellent",
          certificate: (row.carat >= 0.9 ? (h % 2 ? "GIA" : "IGI") : "IGI") as "GIA" | "IGI",
          certificateNo: `${row.carat >= 0.9 && h % 2 ? "2" : "LG"}${String(h).slice(0, 9)}`,
        }
      : null;
  const gemName = { emerald: "emerald", ruby: "ruby", sapphire: "sapphire", diamond: "diamond", none: "" }[row.gem];
  return {
    id,
    slug: row.slug,
    sku,
    name: row.name,
    subtitle: row.subtitle,
    description:
      row.gem === "none"
        ? `${row.name} is finished entirely by hand in our atelier: cast, filed, and polished in stages until the surface carries light without a single tool mark. BIS hallmarked, and made to be worn every day.`
        : `${row.name} centres on a hand-selected ${gemName}${diamond ? `, ${diamond.totalCarat.toFixed(2)} ct total, ${diamond.colour} colour and ${diamond.clarity} clarity` : ""}. Every claw is shaped and set by a single master setter, then inspected under magnification before it leaves the atelier.`,
    story:
      "Designed in our studio and made by a team of eleven craftspeople. From wax model to final polish, each piece takes between nine and twenty-eight days.",
    categoryId: row.cat,
    collectionIds: row.colls,
    gender: row.gender ?? "women",
    occasions: row.occ,
    design: row.design,
    defaultMetal: row.metals[0],
    defaultGem: row.gem,
    shape,
    gemSize: row.size ?? 1,
    metals: row.metals,
    purities,
    gems,
    sizes: isRing ? RING_SIZES : row.design === "bangle" ? BANGLE_SIZES : row.design === "tennis" ? BRACELET_SIZES : null,
    engravable: isRing || row.design === "bangle" || row.design === "tennis",
    variants,
    diamond,
    gemstoneNote: row.gem !== "diamond" && row.gem !== "none" ? `Natural ${gemName}, minor oil treatment disclosed where applicable. Origin report available on request.` : null,
    badges: row.badges ?? [],
    status: row.status ?? "in_stock",
    visibility: "published",
    hallmark: "BIS Hallmarked · HUID",
    rating: h % 5 === 0 ? null : { average: 4.6 + (h % 4) / 10, count: 6 + (h % 70) },
    createdAt: new Date(NOW - row.daysAgo * 86400000).toISOString(),
    isDemo: true,
  };
}

export const products: Product[] = rows.map(build);

const byColl = (slug: string) => products.filter((p) => p.collectionIds.includes(slug)).map((p) => p.id);
const heroOf = (slug: string) => {
  const p = products.find((x) => x.slug === slug)!;
  return renderPath(p.slug, p.defaultMetal, p.defaultGem, "front");
};

export const collections: Collection[] = [
  { id: "eternal", slug: "the-eternal-collection", name: "The Eternal Collection", kicker: "Signature", description: "Our founding designs. Solitaires, eternity bands and tennis bracelets drawn with the fewest possible lines.", published: true, position: 1, heroImage: heroOf("elan-solitaire-ring"), productIds: byColl("eternal") },
  { id: "bridal-2027", slug: "bridal-2027", name: "Bridal 2027", kicker: "New season", description: "Pear, oval and cushion centres, and a rivière made for the wedding day itself.", published: true, position: 2, heroImage: heroOf("vesper-cushion-halo"), productIds: byColl("bridal-2027") },
  { id: "colour-stories", slug: "colour-stories", name: "Colour Stories", kicker: "Gemstones", description: "Colombian emeralds, rubies and sapphires chosen one stone at a time.", published: true, position: 3, heroImage: heroOf("verdance-emerald-cocktail"), productIds: byColl("colour-stories") },
  { id: "heritage", slug: "heritage", name: "Heritage", kicker: "22K gold", description: "Kadas, rubies and signets that borrow from the family vault.", published: true, position: 4, heroImage: heroOf("surya-gold-kada"), productIds: byColl("heritage") },
  { id: "festive-edit", slug: "festive-edit", name: "The Festive Edit", kicker: "Diwali 2026", description: "Warm gold and red stones for the season of lights.", published: true, position: 5, heroImage: heroOf("maharani-ruby-cocktail"), productIds: byColl("festive-edit") },
  { id: "everyday", slug: "everyday-fine", name: "Everyday Fine", kicker: "Daily wear", description: "Pieces light enough to forget you are wearing them.", published: true, position: 6, heroImage: heroOf("halcyon-pave-hoops"), productIds: byColl("everyday") },
  { id: "gifts", slug: "gifts", name: "Gifts", kicker: "For someone", description: "Considered gifts, wrapped by hand with a handwritten card.", published: true, position: 7, heroImage: heroOf("larme-diamond-drop"), productIds: byColl("gifts") },
];
