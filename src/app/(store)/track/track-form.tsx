"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyOrderAccess } from "@/server/actions/checkout";

export function TrackForm({ defaultNumber = "" }: { defaultNumber?: string }) {
  const [state, action, pending] = useActionState(verifyOrderAccess, {});
  const router = useRouter();
  useEffect(() => { if (state.number) router.push(`/order/${state.number}`); }, [state.number, router]);
  return (
    <form action={action} className="grid gap-5">
      <label><span className="text-[11.5px] uppercase tracking-[0.14em] text-muted">Order number</span><input name="number" defaultValue={defaultNumber} required placeholder="SLN-260400" className="field uppercase" /></label>
      <label><span className="text-[11.5px] uppercase tracking-[0.14em] text-muted">Email used at checkout</span><input name="email" type="email" required autoComplete="email" className="field" /></label>
      {state.error && <p className="text-[13px] text-[var(--danger)]" role="alert">{state.error}</p>}
      <button className="btn btn-primary w-fit" disabled={pending}>{pending ? "Checking…" : "Track order"}</button>
    </form>
  );
}
