import "server-only";
/**
 * Payment adapter layer. The checkout only talks to `PaymentGateway`; providers are chosen
 * by brand configuration (Razorpay / Cashfree / PayU for India, Stripe / PayPal internationally).
 * Card data never touches our servers: providers host the card/UPI UI and we verify signed
 * webhooks server-side before marking an order paid.
 */
export type PaymentMethod = "upi" | "card" | "netbanking" | "emi" | "payment_link" | "store";

export interface PaymentIntent { id: string; provider: string; amount: number; currency: string; status: "created" | "captured" | "failed" }

export interface PaymentGateway {
  readonly name: string;
  createIntent(amount: number, currency: string, meta: Record<string, string>): Promise<PaymentIntent>;
  /** Verifies the provider's signature (e.g. Razorpay HMAC of order_id|payment_id) server-side. */
  verify(intentId: string, payload: Record<string, string>): Promise<boolean>;
}

/** Demo gateway: deterministic approval so sales demos never depend on a sandbox account. */
class DemoGateway implements PaymentGateway {
  readonly name = "Demo gateway";
  async createIntent(amount: number, currency: string): Promise<PaymentIntent> {
    return { id: `pi_demo_${Date.now().toString(36)}`, provider: this.name, amount, currency, status: "created" };
  }
  async verify(): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 900)); // simulate provider round-trip
    return true;
  }
}

export function getGateway(): PaymentGateway {
  // Production: switch on brand.payments.provider → new RazorpayGateway(keys) etc.
  return new DemoGateway();
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Credit / debit card",
  netbanking: "Net banking",
  emi: "EMI",
  payment_link: "Payment link on WhatsApp",
  store: "Pay at boutique on pickup",
};
