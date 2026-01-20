import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Platform } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const platform = searchParams.get("platform") as Platform | null;

    const where = {
      userId: session.user.id,
      ...(platform && { platform }),
    };

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          analysis: {
            select: {
              id: true,
              viralScore: true,
              hookScore: true,
              bodyScore: true,
              endingScore: true,
              viewsMin: true,
              viewsMax: true,
              summary: true,
              hookFeedback: true,
              bodyFeedback: true,
              endingFeedback: true,
              suggestions: {
                select: {
                  id: true,
                  description: true,
                  priority: true,
                },
              },
            },
          },
        },
      }),
      db.video.count({ where }),
    ]);

    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get videos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription limits
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscription: true,
        analysesThisMonth: true,
        analysesResetAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if we need to reset the monthly count
    const now = new Date();
    const resetAt = user.analysesResetAt;
    let analysesThisMonth = user.analysesThisMonth;

    if (!resetAt || now >= resetAt) {
      // Reset the count
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await db.user.update({
        where: { id: session.user.id },
        data: {
          analysesThisMonth: 0,
          analysesResetAt: nextReset,
        },
      });
      analysesThisMonth = 0;
    }

    // Check limits based on subscription
    const limits = {
      FREE: 3,
      PRO: 30,
      UNLIMITED: Infinity,
    };

    const limit = limits[user.subscription];
    if (analysesThisMonth >= limit) {
      return NextResponse.json(
        { error: "Monthly analysis limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileUrl, fileName, fileSize, platform, thumbnailUrl } = body;

    const video = await db.video.create({
      data: {
        fileUrl,
        fileName,
        fileSize,
        platform,
        thumbnailUrl,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Create video error:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
