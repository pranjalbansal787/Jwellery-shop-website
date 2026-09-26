import { ImageResponse } from "next/og";
import { cookies } from "next/headers";
import { BRAND_COOKIE, THEMES, parseBrand } from "@/lib/brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon generated from the brand monogram + theme, so it follows white-label settings. */
export default async function Icon() {
  const b = parseBrand((await cookies()).get(BRAND_COOKIE)?.value);
  const t = THEMES[b.theme];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: t.background, color: b.accentOverride ?? t.accent, fontSize: 40, fontFamily: "serif", border: `2px solid ${b.accentOverride ?? t.accent}` }}>
        {b.monogram}
      </div>
    ),
    size,
  );
}
