import type { Order } from "@/lib/types";
import { IconCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const STANDARD = [
  ["placed", "Order placed"], ["payment_confirmed", "Payment confirmed"], ["quality_check", "Quality check"], ["packaged", "Packaged"],
  ["dispatched", "Dispatched"], ["out_for_delivery", "Out for delivery"], ["delivered", "Delivered"],
] as const;
const MADE_TO_ORDER = [
  ["placed", "Order placed"], ["payment_confirmed", "Design confirmed"], ["crafting", "Crafting"], ["stone_setting", "Stone setting"],
  ["polishing", "Polishing"], ["quality_check", "Quality check"], ["dispatched", "Dispatched"], ["delivered", "Delivered"],
] as const;

export function OrderTimeline({ order }: { order: Order }) {
  const steps = order.madeToOrder ? MADE_TO_ORDER : STANDARD;
  const reached = new Map(order.timeline.map((e) => [e.status, e.at]));
  const cancelled = order.status === "cancelled" || order.status === "refunded";
  let current = 0;
  steps.forEach(([s], i) => { if (reached.has(s)) current = i; });
  return (
    <ol className="relative">
      {steps.map(([s, label], i) => {
        const done = i <= current && !cancelled ? true : reached.has(s);
        const at = reached.get(s);
        return (
          <li key={s} className="relative flex gap-5 pb-7 last:pb-0">
            {i < steps.length - 1 && <span className={cn("absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px", i < current && !cancelled ? "bg-accent" : "bg-line")} />}
            <span className={cn("relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", done ? "border-accent bg-accent text-on-accent" : i === current + 1 && !cancelled ? "border-fg" : "border-line-strong")}>
              {done ? <IconCheck size={12} /> : null}
            </span>
            <div className="-mt-0.5">
              <p className={cn("text-[14px]", !done && "text-muted")}>{label}{i === current && !cancelled && order.status !== "delivered" && <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-accent">Current</span>}</p>
              {at && <p className="text-[12px] text-muted">{new Date(at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="mt-6 border-l border-[var(--danger)] pl-4 text-[13.5px]">
          This order was {order.status}. {order.timeline.find((e) => e.status === order.status)?.note}
        </li>
      )}
    </ol>
  );
}
