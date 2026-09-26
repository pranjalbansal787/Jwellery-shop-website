import "server-only";
import { db } from "../db";

export type HomeSectionId = (typeof db.homeSections)[number]["id"];

export async function getHomeSections() {
  return db.homeSections;
}

export async function saveHomeSections(order: { id: string; enabled: boolean }[]) {
  const map = new Map(db.homeSections.map((s) => [s.id, s]));
  const next = order.map((o) => ({ ...map.get(o.id)!, enabled: o.enabled })).filter((s) => s.id);
  db.homeSections.splice(0, db.homeSections.length, ...next);
  return db.homeSections;
}
