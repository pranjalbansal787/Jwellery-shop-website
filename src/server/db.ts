import "server-only";
/**
 * Demo data store.
 *
 * An in-process store seeded from src/data. It stands in for the Laravel API during the MVP:
 * only server code touches it (repositories in src/server/repo, server actions, and admin read
 * models), never client components. Swapping to the Laravel API replaces this module and the
 * repositories with `fetch(process.env.API_URL + ...)` calls; UI code does not change.
 * State persists for the lifetime of the server process (resets on restart/redeploy).
 */
import { categories, collections, products } from "@/data/catalog";
import { appointments, auditLog, customers, enquiries, orders, stores } from "@/data/seed";

function createDb() {
  return {
    products: structuredClone(products),
    categories: structuredClone(categories),
    collections: structuredClone(collections),
    stores: structuredClone(stores),
    customers: structuredClone(customers),
    orders: structuredClone(orders),
    appointments: structuredClone(appointments),
    enquiries: structuredClone(enquiries),
    audit: structuredClone(auditLog),
    searches: [] as { q: string; results: number; at: string }[],
    homeSections: [
      { id: "hero", label: "Hero · WebGL scroll story", enabled: true },
      { id: "collections", label: "Featured collections", enabled: true },
      { id: "new-arrivals", label: "New arrivals rail", enabled: true },
      { id: "craftsmanship", label: "Craftsmanship story", enabled: true },
      { id: "spotlight", label: "Interactive 3D spotlight", enabled: true },
      { id: "categories", label: "Shop by category", enabled: true },
      { id: "occasions", label: "Occasions, recipients & gift finder", enabled: true },
      { id: "bestsellers", label: "Bestsellers rail", enabled: true },
      { id: "concierge", label: "Appointments & concierge", enabled: true },
      { id: "boutiques", label: "Boutiques", enabled: true },
      { id: "trust", label: "Trust & services", enabled: true },
    ],
    events: [] as { name: string; props: Record<string, unknown>; at: string }[],
  };
}

type Db = ReturnType<typeof createDb>;
const g = globalThis as unknown as { __jewelDb?: Db };
export const db: Db = g.__jewelDb ?? (g.__jewelDb = createDb());
