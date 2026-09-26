/**
 * Analytics event bus. Components call track(); adapters fan out.
 * Adapters: GA4 (dataLayer), Meta Pixel (fbq), and first-party server events (/api/events)
 * which feed the admin analytics. Each adapter is enabled by config, never hardcoded in UI.
 */
export type AnalyticsEvent =
  | "product_viewed" | "variant_selected" | "try_on_started" | "try_on_completed" | "size_guide_opened"
  | "wishlist_added" | "cart_added" | "checkout_started" | "purchase_completed" | "whatsapp_clicked"
  | "appointment_booked" | "viewer_3d_opened" | "search_performed" | "gift_finder_completed";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer?.push({ event, ...props });
    window.fbq?.("trackCustom", event, props);
    const body = JSON.stringify({ name: event, props });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  } catch {
    /* analytics must never break the experience */
  }
}
