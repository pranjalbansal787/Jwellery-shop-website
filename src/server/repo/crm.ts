import "server-only";
import { db } from "../db";
import type { Appointment, Enquiry } from "@/lib/types";

export async function listCustomers() {
  return db.customers.map((c) => {
    const orders = db.orders.filter((o) => o.customerId === c.id && o.status !== "cancelled");
    const ltv = orders.reduce((s, o) => s + (o.status === "refunded" ? 0 : o.total), 0);
    return { ...c, orders: orders.length, ltv, aov: orders.length ? Math.round(ltv / orders.length) : 0, lastOrder: orders[0]?.createdAt ?? null };
  });
}

export async function getCustomer(id: string) {
  const all = await listCustomers();
  const c = all.find((x) => x.id === id);
  if (!c) return null;
  return {
    ...c,
    orderList: db.orders.filter((o) => o.customerId === id),
    appointments: db.appointments.filter((a) => a.email === c.email),
    enquiries: db.enquiries.filter((e) => e.name === c.name),
  };
}

export async function listAppointments() {
  return [...db.appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export async function insertAppointment(a: Omit<Appointment, "id" | "status" | "createdAt">) {
  const apt: Appointment = { ...a, id: `apt-${Date.now().toString(36)}`, status: "requested", createdAt: new Date().toISOString() };
  db.appointments.push(apt);
  return apt;
}

export async function setAppointmentStatus(id: string, status: Appointment["status"]) {
  const a = db.appointments.find((x) => x.id === id);
  if (!a) return null;
  const before = a.status;
  a.status = status;
  return { a, before };
}

/** Slots already taken for a store/date, so the booking UI never offers a double booking. */
export async function takenSlots(storeId: string | null, date: string) {
  return db.appointments.filter((a) => a.storeId === storeId && a.date === date && a.status !== "cancelled").map((a) => a.time);
}

export async function listEnquiries() {
  return db.enquiries;
}

export async function insertEnquiry(e: Omit<Enquiry, "id" | "status" | "unread" | "createdAt">) {
  const enq: Enquiry = { ...e, id: `enq-${Date.now().toString(36)}`, status: "open", unread: 1, createdAt: new Date().toISOString() };
  db.enquiries.unshift(enq);
  return enq;
}

export async function updateEnquiry(id: string, patch: Partial<Pick<Enquiry, "status" | "assignee" | "unread">>) {
  const e = db.enquiries.find((x) => x.id === id);
  if (!e) return null;
  Object.assign(e, patch);
  return e;
}

export async function listStores() {
  return db.stores;
}

export async function getStore(slug: string) {
  return db.stores.find((s) => s.slug === slug) ?? null;
}

export async function recentSearches() {
  return db.searches;
}
