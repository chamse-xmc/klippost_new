import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FollowerRange, Goal, Challenge } from "@prisma/client";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { followerRange, goals, challenges } = body as {
      followerRange: FollowerRange;
      goals: Goal[];
      challenges: Challenge[];
    };

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        followerRange,
        goals,
        challenges,
        onboardedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding data" },
      { status: 500 }
    );
  }
}
