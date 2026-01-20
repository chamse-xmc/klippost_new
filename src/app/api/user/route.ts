import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        followerRange: true,
        goals: true,
        challenges: true,
        onboardedAt: true,
        overallScore: true,
        title: true,
        videosAnalyzed: true,
        subscription: true,
        analysesThisMonth: true,
        analysesResetAt: true,
        referralCode: true,
        affiliateEarnings: true,
        affiliatePending: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, followerRange, goals, challenges } = body;

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(followerRange && { followerRange }),
        ...(goals && { goals }),
        ...(challenges && { challenges }),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    // Log the deletion reason for analytics
    console.log(`User ${session.user.id} deleting account. Reason: ${reason}`);

    // Delete all user data in order (due to foreign key constraints)
    // Delete analyses and suggestions first
    await db.suggestion.deleteMany({
      where: { analysis: { video: { userId: session.user.id } } },
    });

    await db.analysis.deleteMany({
      where: { video: { userId: session.user.id } },
    });

    // Delete videos
    await db.video.deleteMany({
      where: { userId: session.user.id },
    });

    // Delete sessions and accounts
    await db.session.deleteMany({
      where: { userId: session.user.id },
    });

    await db.account.deleteMany({
      where: { userId: session.user.id },
    });

    // Finally delete the user
    await db.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
