import { NextResponse } from "next/server";
import { listProducts } from "@/server/repo/catalog";
import { toCard } from "@/lib/card";

/** Card projections by id — used by client-only lists (wishlist, recently viewed). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 60);
  const products = await listProducts({ ids });
  return NextResponse.json(products.map(toCard));
}
