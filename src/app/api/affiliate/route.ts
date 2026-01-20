import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCode: true,
        affiliateEarnings: true,
        affiliatePending: true,
        referrals: {
          select: {
            id: true,
            createdAt: true,
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payments = await db.affiliatePayment.findMany({
      where: { affiliateId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        originalAmount: true,
        commission: true,
        status: true,
        createdAt: true,
        paidAt: true,
      },
    });

    const stats = {
      referralCode: user.referralCode,
      totalReferrals: user.referrals.length,
      activeSubscribers: user.referrals.filter(
        (r: { subscription: string }) => r.subscription !== "FREE"
      ).length,
      totalEarnings: user.affiliateEarnings,
      pendingEarnings: user.affiliatePending,
      recentPayments: payments,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Get affiliate stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate stats" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has a referral code
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true, name: true },
    });

    if (user?.referralCode) {
      return NextResponse.json({ referralCode: user.referralCode });
    }

    // Generate a unique referral code
    const baseName = user?.name?.split(" ")[0]?.toUpperCase() || "REF";
    let referralCode = `${baseName}${nanoid(4).toUpperCase()}`;

    // Make sure it's unique
    let exists = await db.user.findUnique({
      where: { referralCode },
    });

    while (exists) {
      referralCode = `${baseName}${nanoid(4).toUpperCase()}`;
      exists = await db.user.findUnique({
        where: { referralCode },
      });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { referralCode },
    });

    return NextResponse.json({ referralCode });
  } catch (error) {
    console.error("Create referral code error:", error);
    return NextResponse.json(
      { error: "Failed to create referral code" },
      { status: 500 }
    );
  }
}
