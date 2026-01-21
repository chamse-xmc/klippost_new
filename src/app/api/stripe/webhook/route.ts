import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/services/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
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

        console.log("Checkout completed - userId:", userId, "subscription:", session.subscription);

        if (userId && session.subscription) {
          try {
            console.log("Retrieving subscription from Stripe...");
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            ) as Stripe.Subscription;

            const priceId = subscription.items.data[0]?.price.id;
            console.log("Price ID:", priceId, "Expected PRO:", process.env.STRIPE_PRICE_PRO, "Expected UNLIMITED:", process.env.STRIPE_PRICE_UNLIMITED);

            const tier =
              priceId === process.env.STRIPE_PRICE_PRO || priceId === process.env.STRIPE_PRICE_PRO_YEARLY
                ? "PRO"
                : priceId === process.env.STRIPE_PRICE_UNLIMITED || priceId === process.env.STRIPE_PRICE_UNLIMITED_YEARLY
                ? "UNLIMITED"
                : "FREE";

            console.log("Determined tier:", tier);

            // Access current_period_end from subscription object
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const periodEnd = (subscription as any).current_period_end as number | undefined;
            console.log("Period end timestamp:", periodEnd);

            console.log("Updating user in database...");
            await db.user.update({
              where: { id: userId },
              data: {
                subscription: tier,
                stripeCustomerId: session.customer as string,
                stripeSubId: session.subscription as string,
                subExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
              },
            });
            console.log("User updated successfully");

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
          } catch (dbError) {
            console.error("Error in checkout handler:", dbError);
            throw dbError;
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
            priceId === process.env.STRIPE_PRICE_PRO || priceId === process.env.STRIPE_PRICE_PRO_YEARLY
              ? "PRO"
              : priceId === process.env.STRIPE_PRICE_UNLIMITED || priceId === process.env.STRIPE_PRICE_UNLIMITED_YEARLY
              ? "UNLIMITED"
              : "FREE";

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const periodEnd = (subscription as any).current_period_end as number | undefined;

          await db.user.update({
            where: { id: userId },
            data: {
              subscription: tier,
              subExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
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
