import "server-only";
import { db } from "../db";
import { getAdminSession, requestMeta } from "../rbac";

export async function recordAudit(action: string, resource: string, before?: unknown, after?: unknown, actorOverride?: string) {
  const s = await getAdminSession();
  const meta = await requestMeta();
  db.audit.unshift({
    id: `aud-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    actor: actorOverride ?? `${s.name} (${s.label})`,
    action,
    resource,
    before,
    after,
    ...meta,
    at: new Date().toISOString(),
  });
}

export async function listAudit() {
  return db.audit;
}
