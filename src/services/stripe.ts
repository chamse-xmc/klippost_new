import Stripe from "stripe";

// Initialize Stripe only if key is available
const stripeKey = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeKey ? new Stripe(stripeKey) : null;

export const PLANS = {
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO!,
    price: 9,
    analyses: 30,
  },
  UNLIMITED: {
    name: "Unlimited",
    priceId: process.env.STRIPE_PRICE_UNLIMITED!,
    price: 29,
    analyses: Infinity,
  },
  PRO_YEARLY: {
    name: "Pro (Yearly)",
    priceId: process.env.STRIPE_PRICE_PRO_YEARLY!,
    price: 90, // $7.50/mo equivalent, saves $18
    analyses: 30,
  },
  UNLIMITED_YEARLY: {
    name: "Unlimited (Yearly)",
    priceId: process.env.STRIPE_PRICE_UNLIMITED_YEARLY!,
    price: 290, // $24.17/mo equivalent, saves $58
    analyses: Infinity,
  },
} as const;

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment.");
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}
