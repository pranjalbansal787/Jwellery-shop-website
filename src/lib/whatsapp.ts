/**
 * WhatsApp click-to-chat with prefilled context. The Cloud API integration (templates,
 * automated replies, routing) lives server-side in the Messaging module; the storefront only
 * ever needs this deep link, so it keeps working even if the API is not configured.
 */
export function waLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export interface WaContext {
  productName?: string;
  sku?: string;
  url?: string;
  metal?: string;
  size?: string;
}

export function waMessage(intent: string, brandName: string, ctx?: WaContext) {
  const lines = [`Hello ${brandName}. ${intent}.`];
  if (ctx?.productName) lines.push("", `Piece: ${ctx.productName}`);
  if (ctx?.sku) lines.push(`SKU: ${ctx.sku}`);
  if (ctx?.metal) lines.push(`Metal: ${ctx.metal}`);
  if (ctx?.size) lines.push(`Size: ${ctx.size}`);
  if (ctx?.url) lines.push(`Link: ${ctx.url}`);
  return lines.join("\n");
}
