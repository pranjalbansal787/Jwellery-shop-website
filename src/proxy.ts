import { NextResponse, type NextRequest } from "next/server";
import { THEME_IDS } from "@/lib/brand";

/**
 * ?previewTheme=champagne  → previews a preset for this browser session without saving it.
 * ?previewTheme=off        → clears the preview.
 * Production: gated behind an authorised admin session (see ARCHITECTURE.md §12).
 */
export function proxy(req: NextRequest) {
  const preview = req.nextUrl.searchParams.get("previewTheme");
  if (preview === null) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.searchParams.delete("previewTheme");
  const res = NextResponse.redirect(url);
  if (preview === "off") res.cookies.delete("preview-theme");
  else if ((THEME_IDS as readonly string[]).includes(preview)) res.cookies.set("preview-theme", preview, { path: "/", sameSite: "lax", httpOnly: true });
  return res;
}

export const config = { matcher: ["/((?!_next|api|renders|favicon).*)"] };
