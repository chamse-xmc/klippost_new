import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user's videos (cascades to analyses and suggestions)
    await db.video.deleteMany({
      where: { userId },
    });

    // Delete affiliate payments
    await db.affiliatePayment.deleteMany({
      where: { affiliateId: userId },
    });

    // Reset user subscription and related fields
    await db.user.update({
      where: { id: userId },
      data: {
        subscription: "FREE",
        stripeCustomerId: null,
        stripeSubId: null,
        subExpiresAt: null,
        bonusAnalyses: 0,
        affiliatePending: 0,
        affiliatePaid: 0,
      },
    });

    return NextResponse.json({ success: true, message: "Account reset successfully" });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset account" },
      { status: 500 }
    );
  }
}
