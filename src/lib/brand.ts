/**
 * Brand / theme configuration — the white-label engine.
 *
 * Everything a sales team changes for a client demo lives here and is edited from
 * /admin/brand-settings. No component hardcodes colours, fonts or brand copy.
 * Persistence (MVP): a signed-in-browser cookie, so each salesperson can dress the demo
 * for their prospect. Production: `brands` table keyed by domain (see ARCHITECTURE.md §7).
 */
import { z } from "zod";

export const THEME_IDS = ["midnight-gold", "champagne", "platinum", "emerald", "rose", "sapphire", "ruby"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const FONT_PAIRS = {
  "cormorant-dm": { label: "Cormorant Garamond + DM Sans", display: "var(--font-cormorant)", body: "var(--font-dm)" },
  "playfair-inter": { label: "Playfair Display + Inter", display: "var(--font-playfair)", body: "var(--font-inter)" },
  "bodoni-manrope": { label: "Bodoni Moda + Manrope", display: "var(--font-bodoni)", body: "var(--font-manrope)" },
} as const;
export type FontPairId = keyof typeof FONT_PAIRS;

export interface ThemeTokens {
  label: string;
  scheme: "dark" | "light";
  background: string;
  surface: string;
  surfaceElevated: string;
  foreground: string;
  muted: string;
  accent: string;
  accentMetal: string;
  accentContrast: string;
  stage: string; // backdrop behind product imagery
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  "midnight-gold": { label: "Midnight Gold", scheme: "dark", background: "#0B0D0E", surface: "#121517", surfaceElevated: "#181C1F", foreground: "#F1ECE2", muted: "#9C968B", accent: "#B8925A", accentMetal: "#D8BC8C", accentContrast: "#0B0D0E", stage: "#15181A" },
  champagne: { label: "Champagne", scheme: "light", background: "#F5F0E7", surface: "#EDE6DA", surfaceElevated: "#FBF8F2", foreground: "#1D1A16", muted: "#6E665B", accent: "#8E6A3A", accentMetal: "#B08B55", accentContrast: "#FBF8F2", stage: "#E9E1D3" },
  platinum: { label: "Platinum", scheme: "dark", background: "#0D0F11", surface: "#14171A", surfaceElevated: "#1A1E22", foreground: "#EDEFF1", muted: "#949AA1", accent: "#B7BEC6", accentMetal: "#E1E5E9", accentContrast: "#0D0F11", stage: "#171A1D" },
  emerald: { label: "Emerald", scheme: "dark", background: "#08130F", surface: "#0D1B16", surfaceElevated: "#12231D", foreground: "#EFE9DC", muted: "#94A096", accent: "#C1A266", accentMetal: "#DCC393", accentContrast: "#08130F", stage: "#0F1F19" },
  rose: { label: "Rose", scheme: "light", background: "#F6EEEA", surface: "#EFE3DD", surfaceElevated: "#FCF7F4", foreground: "#2A1F1C", muted: "#7A6660", accent: "#A76E5C", accentMetal: "#C9937F", accentContrast: "#FCF7F4", stage: "#EDDFD8" },
  sapphire: { label: "Sapphire", scheme: "dark", background: "#080C16", surface: "#0E1320", surfaceElevated: "#141A2A", foreground: "#ECEEF4", muted: "#8E96AA", accent: "#AEB8CC", accentMetal: "#D7DEEA", accentContrast: "#080C16", stage: "#10162A" },
  ruby: { label: "Ruby", scheme: "dark", background: "#120A0B", surface: "#1A0F11", surfaceElevated: "#221416", foreground: "#F3E9E4", muted: "#A48F8A", accent: "#C79A5B", accentMetal: "#E0BF8C", accentContrast: "#120A0B", stage: "#1D1113" },
};

export const CURRENCIES = {
  INR: { symbol: "₹", locale: "en-IN", perINR: 1 },
  GBP: { symbol: "£", locale: "en-GB", perINR: 1 / 112 },
  USD: { symbol: "$", locale: "en-US", perINR: 1 / 88 },
  AED: { symbol: "AED ", locale: "en-AE", perINR: 1 / 24 },
  EUR: { symbol: "€", locale: "de-DE", perINR: 1 / 96 },
} as const;
export type CurrencyCode = keyof typeof CURRENCIES;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const brandSchema = z.object({
  name: z.string().min(1).max(40),
  monogram: z.string().min(1).max(3),
  tagline: z.string().max(80),
  descriptor: z.string().max(40),
  theme: z.enum(THEME_IDS),
  accentOverride: hex.nullable(),
  fontPair: z.enum(Object.keys(FONT_PAIRS) as [FontPairId, ...FontPairId[]]),
  buttonRadius: z.enum(["square", "soft", "pill"]),
  currency: z.enum(Object.keys(CURRENCIES) as [CurrencyCode, ...CurrencyCode[]]),
  whatsapp: z.string().regex(/^\d{8,15}$/),
  phone: z.string().max(20),
  email: z.string().email(),
  city: z.string().max(40),
  heroMode: z.enum(["webgl", "editorial"]),
  cursor: z.boolean(),
  motion: z.enum(["full", "subtle", "off"]),
  announcement: z.string().max(120),
});

export type Brand = z.infer<typeof brandSchema>;

export const DEFAULT_BRAND: Brand = {
  name: "Solenne",
  monogram: "S",
  tagline: "Fine jewellery, made by hand since 1987",
  descriptor: "Maison de Joaillerie",
  theme: "midnight-gold",
  accentOverride: null,
  fontPair: "cormorant-dm",
  buttonRadius: "square",
  currency: "INR",
  whatsapp: "919000000000",
  phone: "+91 90000 00000",
  email: "concierge@solenne.example",
  city: "Gurugram",
  heroMode: "webgl",
  cursor: true,
  motion: "full",
  announcement: "Complimentary insured delivery across India · Lifetime cleaning at every boutique",
};

export const BRAND_COOKIE = "brand";

export function parseBrand(raw: string | undefined | null): Brand {
  if (!raw) return DEFAULT_BRAND;
  try {
    const json = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const parsed = brandSchema.partial().safeParse(json);
    return parsed.success ? { ...DEFAULT_BRAND, ...parsed.data } : DEFAULT_BRAND;
  } catch {
    return DEFAULT_BRAND;
  }
}

export function serializeBrand(b: Brand) {
  return Buffer.from(JSON.stringify(b), "utf8").toString("base64url");
}

const RADII = { square: "0px", soft: "4px", pill: "999px" };

function mix(hexA: string, hexB: string, t: number) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

/** CSS custom properties for a brand — injected on <html> during SSR, so there is no theme flash. */
export function brandCssVars(b: Brand, previewTheme?: ThemeId | null): Record<string, string> {
  const t = THEMES[previewTheme ?? b.theme];
  const accent = b.accentOverride ?? t.accent;
  const fonts = FONT_PAIRS[b.fontPair];
  return {
    "--background": t.background,
    "--surface": t.surface,
    "--surface-elevated": t.surfaceElevated,
    "--foreground": t.foreground,
    "--muted": t.muted,
    "--accent": accent,
    "--accent-metal": b.accentOverride ? mix(accent, "#ffffff", 0.3) : t.accentMetal,
    "--accent-contrast": t.accentContrast,
    "--border": mix(t.background, t.foreground, 0.12),
    "--border-strong": mix(t.background, t.foreground, 0.24),
    "--stage": t.stage,
    "--font-display": fonts.display,
    "--font-body": fonts.body,
    "--radius-button": RADII[b.buttonRadius],
    "--motion-scale": b.motion === "full" ? "1" : b.motion === "subtle" ? "0.5" : "0",
  };
}
