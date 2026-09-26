import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const schema = z.object({ name: z.string().max(40).regex(/^[a-z_0-9]+$/), props: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional() });

// Naive in-memory rate limit per IP (production: Redis sliding window at the edge/API gateway).
const hits = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.t < 60000) {
    if (++h.n > 120) return new NextResponse(null, { status: 429 });
  } else hits.set(ip, { n: 1, t: now });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  db.events.unshift({ name: parsed.data.name, props: parsed.data.props ?? {}, at: new Date().toISOString() });
  db.events.length = Math.min(db.events.length, 5000);
  return new NextResponse(null, { status: 204 });
}
