/**
 * Natural-language-ish query parsing for jewellery search.
 * "gold ring under 50000" → { metal: yellow, category: rings, maxPrice: 50000 }
 * The parsed intent is sent to the search adapter (demo: in-memory; production: Meilisearch
 * filters + ranking; later: semantic re-ranking). Parsing is deterministic and never invents facts.
 */
import type { GemKey, MetalKey, Occasion } from "./types";

export interface ParsedQuery {
  text: string;
  terms: string[];
  metal?: MetalKey;
  gem?: GemKey;
  categorySlug?: string;
  occasion?: Occasion;
  minPrice?: number;
  maxPrice?: number;
  gender?: "men" | "women";
}

const METALS: [RegExp, MetalKey][] = [
  [/\brose\s*gold\b|\brose\b/, "rose"],
  [/\bwhite\s*gold\b/, "white"],
  [/\bplatinum\b/, "platinum"],
  [/\byellow\s*gold\b|\bgold\b/, "yellow"],
];
const GEMS: [RegExp, GemKey][] = [
  [/\bdiamonds?\b|\bsolitaire\b/, "diamond"],
  [/\bemeralds?\b/, "emerald"],
  [/\brub(y|ies)\b/, "ruby"],
  [/\bsapphires?\b/, "sapphire"],
];
const CATEGORIES: [RegExp, string][] = [
  [/\bengagement\b|\bproposal\b/, "engagement-rings"],
  [/\bwedding\s*(band|ring)s?\b|\beternity\b/, "wedding-bands"],
  [/\bcocktail\b/, "cocktail-rings"],
  [/\brings?\b/, "rings"],
  [/\bear\s*rings?\b|\bearrings?\b|\bstuds?\b|\bhoops?\b|\bdrops?\b/, "earrings"],
  [/\bpendants?\b/, "pendants"],
  [/\bnecklaces?\b|\bchains?\b|\briviere\b/, "necklaces"],
  [/\bbangles?\b|\bkadas?\b|\bcuffs?\b/, "bangles"],
  [/\bbracelets?\b|\btennis\b/, "bracelets"],
  [/\bsignets?\b/, "mens-jewellery"],
];
const OCCASIONS: [RegExp, Occasion][] = [
  [/\banniversary\b/, "anniversary"],
  [/\bgifts?\b|\bpresent\b/, "gifting"],
  [/\bbirthday\b/, "birthday"],
  [/\bdiwali\b|\bfestive\b|\bfestival\b/, "festive"],
  [/\bwedding\b|\bbridal\b/, "wedding"],
  [/\beveryday\b|\bdaily\b/, "everyday"],
];

function toNumber(raw: string, unit?: string) {
  let n = parseFloat(raw.replace(/,/g, ""));
  if (!unit) return n;
  if (/^(k|thousand)$/i.test(unit)) n *= 1000;
  if (/^(l|lakh|lakhs|lac)$/i.test(unit)) n *= 100000;
  return n;
}

export function parseQuery(input: string): ParsedQuery {
  let q = input.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const out: ParsedQuery = { text: input.trim(), terms: [] };

  const price = /(under|below|less than|upto|up to|within|max|over|above|more than|from)\s*(?:rs\.?|inr|₹)?\s*([\d,.]+)\s*(k|thousand|l|lakh|lakhs|lac)?/i.exec(q);
  if (price) {
    const n = toNumber(price[2], price[3]);
    if (/under|below|less|upto|up to|within|max/.test(price[1])) out.maxPrice = n;
    else out.minPrice = n;
    q = q.replace(price[0], " ");
  }
  const between = /between\s*([\d,.]+)\s*(k|l|lakh)?\s*(?:and|-|to)\s*([\d,.]+)\s*(k|l|lakh)?/i.exec(q);
  if (between) {
    out.minPrice = toNumber(between[1], between[2]);
    out.maxPrice = toNumber(between[3], between[4]);
    q = q.replace(between[0], " ");
  }
  if (/\bmen'?s?\b|\bfor him\b|\bhusband\b/.test(q)) out.gender = "men";
  if (/\bwomen'?s?\b|\bfor her\b|\bwife\b/.test(q)) out.gender = "women";

  for (const [re, v] of METALS) if (re.test(q)) { out.metal = v; q = q.replace(re, " "); break; }
  for (const [re, v] of OCCASIONS) if (re.test(q)) { out.occasion = v; break; }
  for (const [re, v] of CATEGORIES) if (re.test(q)) { out.categorySlug = v; q = q.replace(re, " "); break; }
  for (const [re, v] of GEMS) if (re.test(q)) { out.gem = v; q = q.replace(re, " "); break; }

  const STOP = new Set(["a", "an", "the", "for", "with", "in", "and", "of", "my", "her", "him", "to", "rs", "inr", "set", "men", "mens", "women", "womens", "gift", "gifts"]);
  out.terms = q.split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t));
  return out;
}
