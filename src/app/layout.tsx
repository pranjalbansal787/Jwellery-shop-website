import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { BRAND_COOKIE, THEME_IDS, THEMES, brandCssVars, parseBrand, type ThemeId } from "@/lib/brand";
import { BrandProvider } from "@/components/providers/brand-provider";
import "./globals.css";

// Self-hosted (SIL Open Font License) — no build-time or runtime dependency on Google Fonts.
const cormorant = localFont({
  variable: "--font-cormorant",
  display: "swap",
  src: [
    { path: "../fonts/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../fonts/cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
  ],
});
const dm = localFont({ src: "../fonts/dm-sans-latin-wght-normal.woff2", variable: "--font-dm", display: "swap", weight: "100 1000" });
const playfair = localFont({ src: "../fonts/playfair-display-latin-wght-normal.woff2", variable: "--font-playfair", display: "swap", preload: false, weight: "400 900" });
const inter = localFont({ src: "../fonts/inter-latin-wght-normal.woff2", variable: "--font-inter", display: "swap", preload: false, weight: "100 900" });
const bodoni = localFont({ src: "../fonts/bodoni-moda-latin-wght-normal.woff2", variable: "--font-bodoni", display: "swap", preload: false, weight: "400 900" });
const manrope = localFont({ src: "../fonts/manrope-latin-wght-normal.woff2", variable: "--font-manrope", display: "swap", preload: false, weight: "200 800" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const brand = parseBrand((await cookies()).get(BRAND_COOKIE)?.value);
  return {
    metadataBase: new URL(SITE),
    title: { default: `${brand.name} · ${brand.descriptor}`, template: `%s · ${brand.name}` },
    description: brand.tagline,
    openGraph: { siteName: brand.name, type: "website", locale: "en_IN" },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const jar = await cookies();
  const brand = parseBrand(jar.get(BRAND_COOKIE)?.value);
  return { themeColor: THEMES[brand.theme].background, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const brand = parseBrand(jar.get(BRAND_COOKIE)?.value);
  const previewRaw = jar.get("preview-theme")?.value;
  const preview = (THEME_IDS as readonly string[]).includes(previewRaw ?? "") ? (previewRaw as ThemeId) : null;
  const themeId = preview ?? brand.theme;
  const vars = brandCssVars(brand, preview);
  return (
    <html
      lang="en-IN"
      data-theme={themeId}
      data-scheme={THEMES[themeId].scheme}
      data-motion={brand.motion}
      style={{ ...vars, colorScheme: THEMES[themeId].scheme } as React.CSSProperties}
      className={`${cormorant.variable} ${dm.variable} ${playfair.variable} ${inter.variable} ${bodoni.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body>
        <BrandProvider brand={brand} themeId={themeId} preview={preview}>
          {children}
        </BrandProvider>
      </body>
    </html>
  );
}
