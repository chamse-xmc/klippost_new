import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/services/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          ) as Stripe.Subscription;

          const priceId = subscription.items.data[0]?.price.id;
          const tier =
            priceId === process.env.STRIPE_PRICE_PRO
              ? "PRO"
              : priceId === process.env.STRIPE_PRICE_UNLIMITED
              ? "UNLIMITED"
              : "FREE";

          const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

          await db.user.update({
            where: { id: userId },
            data: {
              subscription: tier,
              stripeCustomerId: session.customer as string,
              stripeSubId: session.subscription as string,
              subExpiresAt: new Date(periodEnd * 1000),
            },
          });

          // Handle affiliate commission
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { referredBy: true },
          });

          if (user?.referredBy) {
            const affiliate = await db.user.findUnique({
              where: { referralCode: user.referredBy },
            });

            if (affiliate) {
              const amount = subscription.items.data[0]?.price.unit_amount || 0;
              const commission = amount / 100 / 2; // 50% commission

              await db.affiliatePayment.create({
                data: {
                  affiliateId: affiliate.id,
                  referredUserId: userId,
                  originalAmount: amount / 100,
                  commission,
                  stripePaymentId: (session.payment_intent as string) || session.id,
                  status: "PENDING",
                },
              });

              await db.user.update({
                where: { id: affiliate.id },
                data: {
                  affiliatePending: { increment: commission },
                },
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const priceId = subscription.items.data[0]?.price.id;
          const tier =
            priceId === process.env.STRIPE_PRICE_PRO
              ? "PRO"
              : priceId === process.env.STRIPE_PRICE_UNLIMITED
              ? "UNLIMITED"
              : "FREE";

          const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

          await db.user.update({
            where: { id: userId },
            data: {
              subscription: tier,
              subExpiresAt: new Date(periodEnd * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await db.user.update({
            where: { id: userId },
            data: {
              subscription: "FREE",
              stripeSubId: null,
              subExpiresAt: null,
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as { subscription?: string }).subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (userId) {
            // Handle recurring affiliate commission
            const user = await db.user.findUnique({
              where: { id: userId },
              select: { referredBy: true },
            });

            if (user?.referredBy) {
              const affiliate = await db.user.findUnique({
                where: { referralCode: user.referredBy },
              });

              if (affiliate && invoice.amount_paid > 0) {
                const commission = invoice.amount_paid / 100 / 2; // 50% commission
                const paymentIntent = (invoice as { payment_intent?: string }).payment_intent;

                await db.affiliatePayment.create({
                  data: {
                    affiliateId: affiliate.id,
                    referredUserId: userId,
                    originalAmount: invoice.amount_paid / 100,
                    commission,
                    stripePaymentId: paymentIntent || invoice.id,
                    status: "PENDING",
                  },
                });

                await db.user.update({
                  where: { id: affiliate.id },
                  data: {
                    affiliatePending: { increment: commission },
                  },
                });
              }
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
