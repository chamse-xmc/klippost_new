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

    const [videos, total, allAnalyzedVideos] = await Promise.all([
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
      // Get all analyzed videos for improvement stats (without platform filter)
      db.video.findMany({
        where: {
          userId: session.user.id,
          status: "COMPLETED",
          analysis: { isNot: null },
        },
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          analysis: {
            select: {
              viralScore: true,
              hookScore: true,
              bodyScore: true,
              endingScore: true,
            },
          },
        },
      }),
    ]);

    // Calculate improvement stats
    let improvementStats = null;
    if (allAnalyzedVideos.length >= 2) {
      const scores = allAnalyzedVideos
        .filter((v) => v.analysis)
        .map((v) => ({
          viralScore: v.analysis!.viralScore,
          hookScore: v.analysis!.hookScore,
          bodyScore: v.analysis!.bodyScore,
          endingScore: v.analysis!.endingScore,
          date: v.createdAt,
        }));

      if (scores.length >= 2) {
        const firstScore = scores[0].viralScore;
        const recentScores = scores.slice(-3);
        const latestAvg = Math.round(
          recentScores.reduce((sum, s) => sum + s.viralScore, 0) / recentScores.length
        );

        // Calculate improvement percentage
        const improvementPercent = firstScore > 0
          ? Math.round(((latestAvg - firstScore) / firstScore) * 100)
          : 0;

        // Determine trend (compare first half vs second half)
        const midpoint = Math.floor(scores.length / 2);
        const firstHalfAvg = scores.slice(0, midpoint).reduce((sum, s) => sum + s.viralScore, 0) / midpoint;
        const secondHalfAvg = scores.slice(midpoint).reduce((sum, s) => sum + s.viralScore, 0) / (scores.length - midpoint);
        const trend = secondHalfAvg > firstHalfAvg + 5 ? "improving" :
                      secondHalfAvg < firstHalfAvg - 5 ? "declining" : "stable";

        // Calculate area-specific improvements
        const firstHook = scores[0].hookScore;
        const firstBody = scores[0].bodyScore;
        const firstEnding = scores[0].endingScore;
        const latestHookAvg = Math.round(recentScores.reduce((sum, s) => sum + s.hookScore, 0) / recentScores.length);
        const latestBodyAvg = Math.round(recentScores.reduce((sum, s) => sum + s.bodyScore, 0) / recentScores.length);
        const latestEndingAvg = Math.round(recentScores.reduce((sum, s) => sum + s.endingScore, 0) / recentScores.length);

        improvementStats = {
          firstScore,
          latestAvg,
          improvementPercent,
          trend,
          totalVideos: scores.length,
          areaBreakdown: {
            hook: { first: firstHook, latest: latestHookAvg, change: latestHookAvg - firstHook },
            body: { first: firstBody, latest: latestBodyAvg, change: latestBodyAvg - firstBody },
            ending: { first: firstEnding, latest: latestEndingAvg, change: latestEndingAvg - firstEnding },
          },
        };
      }
    }

    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      improvementStats,
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
        bonusAnalyses: true,
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
    const bonusAnalyses = user.bonusAnalyses || 0;

    // Check if user has reached their monthly limit
    if (analysesThisMonth >= limit) {
      // Check if they have bonus analyses available
      if (bonusAnalyses > 0) {
        // Use a bonus analysis
        await db.user.update({
          where: { id: session.user.id },
          data: { bonusAnalyses: { decrement: 1 } },
        });
      } else {
        return NextResponse.json(
          { error: "Monthly analysis limit reached. Please upgrade your plan." },
          { status: 403 }
        );
      }
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
