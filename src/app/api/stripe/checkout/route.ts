import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession, PLANS } from "@/services/stripe";

// Use NEXTAUTH_URL for consistent base URL (works in prod and dev)
function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, returnUrl } = body as { plan: "PRO" | "UNLIMITED" | "PRO_YEARLY" | "UNLIMITED_YEARLY"; returnUrl?: string };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const baseUrl = getBaseUrl();

    // Use custom returnUrl if provided (must start with /), otherwise default to /app
    const successPath = returnUrl && returnUrl.startsWith("/") ? returnUrl : "/app?upgraded=true";
    const cancelPath = returnUrl && returnUrl.startsWith("/") ? returnUrl.split("?")[0] + "?canceled=true" : "/app?canceled=true";

    const checkoutSession = await createCheckoutSession(
      session.user.id,
      session.user.email,
      PLANS[plan].priceId,
      `${baseUrl}${successPath}`,
      `${baseUrl}${cancelPath}`
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
