"use server";
import { z } from "zod";
import { insertAppointment, takenSlots } from "../repo/crm";
import { db } from "../db";

const schema = z.object({
  service: z.enum(["store", "video", "stylist", "bridal", "custom"]),
  storeId: z.string().max(20).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  phone: z.string().regex(/^[+\d][\d\s-]{7,16}$/),
  notes: z.string().max(500).optional(),
  productSlug: z.string().max(80).optional(),
});

export const SLOTS = ["11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];

export async function getAvailability(storeId: string | null, date: string) {
  const taken = await takenSlots(storeId, date);
  return SLOTS.map((t) => ({ time: t, available: !taken.includes(t) }));
}

export async function bookAppointment(input: z.infer<typeof schema>): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: "Please complete all required details." };
  const d = p.data;
  if ((await takenSlots(d.storeId, d.date)).includes(d.time)) return { ok: false, error: "That time was just taken. Please choose another." };
  const product = d.productSlug ? db.products.find((x) => x.slug === d.productSlug) : undefined;
  const apt = await insertAppointment({ service: d.service, storeId: d.service === "video" ? null : d.storeId, date: d.date, time: d.time, name: d.name, email: d.email, phone: d.phone, notes: d.notes, productId: product?.id });
  // Production: dispatch AppointmentBooked → queued email + WhatsApp template confirmation + reminder jobs.
  return { ok: true, id: apt.id };
}
