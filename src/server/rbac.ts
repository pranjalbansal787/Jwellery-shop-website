import "server-only";
import { cookies, headers } from "next/headers";

export const PERMISSIONS = [
  "product.create", "product.update", "product.publish", "pricing.modify", "inventory.modify",
  "order.view", "order.update", "order.refund", "customer.view", "customer.export",
  "appointment.manage", "enquiry.manage", "promotion.publish", "content.edit", "brand.manage",
  "user.manage", "audit.view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = {
  super_admin: { label: "Super Admin", person: "Aarav Mehta", can: [...PERMISSIONS] },
  catalog_manager: { label: "Catalog Manager", person: "Neha Kaul", can: ["product.create", "product.update", "product.publish", "pricing.modify", "inventory.modify", "order.view"] },
  order_manager: { label: "Order Manager", person: "Kunal Arora", can: ["order.view", "order.update", "order.refund", "customer.view"] },
  customer_support: { label: "Customer Support", person: "Priya Nair", can: ["order.view", "customer.view", "appointment.manage", "enquiry.manage"] },
  content_editor: { label: "Content Editor", person: "Ishita Rao", can: ["content.edit", "brand.manage"] },
} satisfies Record<string, { label: string; person: string; can: Permission[] }>;
export type RoleId = keyof typeof ROLES;

export const ROLE_COOKIE = "admin-role";

/**
 * Demo session. Production: Laravel Sanctum session + MFA, role/permission tables (spatie/laravel-permission),
 * with every check enforced server-side in Policies. The UI uses the same permission names.
 */
export async function getAdminSession() {
  const jar = await cookies();
  const raw = jar.get(ROLE_COOKIE)?.value as RoleId | undefined;
  const role: RoleId = raw && raw in ROLES ? raw : "super_admin";
  const def = ROLES[role];
  return { role, label: def.label, name: def.person, permissions: def.can as readonly Permission[] };
}

export async function can(p: Permission) {
  const s = await getAdminSession();
  return s.permissions.includes(p);
}

export async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
    userAgent: (h.get("user-agent") || "unknown").slice(0, 120),
  };
}
