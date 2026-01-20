import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession, PLANS } from "@/services/stripe";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, returnUrl } = body as { plan: "PRO" | "UNLIMITED"; returnUrl?: string };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { origin } = new URL(request.url);
    const successUrl = returnUrl ? `${origin}${returnUrl}` : `${origin}/dashboard?success=true`;

    const checkoutSession = await createCheckoutSession(
      session.user.id,
      session.user.email,
      PLANS[plan].priceId,
      successUrl,
      `${origin}/dashboard?canceled=true`
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
