import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeVideo } from "@/services/video-analyzer";
import { updateUserScore } from "@/services/user-score";
import type { AnalysisMode, SuggestionCategory, Priority } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, mode } = body as { videoId: string; mode: AnalysisMode };

    // Get the video and user's goals
    const [video, user] = await Promise.all([
      db.video.findUnique({
        where: { id: videoId },
        select: {
          id: true,
          fileUrl: true,
          platform: true,
          userId: true,
          status: true,
        },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: {
          goals: true,
        },
      }),
    ]);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (video.status !== "PENDING") {
      return NextResponse.json(
        { error: "Video already analyzed" },
        { status: 400 }
      );
    }

    // Update video status
    await db.video.update({
      where: { id: videoId },
      data: { status: "PROCESSING" },
    });

    try {
      // Analyze the video with user's goals
      const result = await analyzeVideo(
        video.fileUrl,
        video.platform,
        mode,
        user?.goals || []
      );

      // Create analysis and suggestions
      const analysis = await db.analysis.create({
        data: {
          videoId,
          mode,
          viralScore: result.viralScore,
          hookScore: result.hookScore,
          bodyScore: result.bodyScore,
          endingScore: result.endingScore,
          viewsMin: result.viewsMin,
          viewsMax: result.viewsMax,
          hookFeedback: result.hookFeedback,
          bodyFeedback: result.bodyFeedback,
          endingFeedback: result.endingFeedback,
          summary: result.summary,
          transcript: result.transcript,
          rawResponse: JSON.parse(JSON.stringify(result)),
          suggestions: {
            create: result.suggestions.map((s) => ({
              category: s.category as SuggestionCategory,
              priority: s.priority as Priority,
              title: s.title,
              description: s.description,
              timestamp: s.timestamp,
            })),
          },
        },
        include: {
          suggestions: true,
        },
      });

      // Update video status
      const updatedVideo = await db.video.update({
        where: { id: videoId },
        data: { status: "COMPLETED" },
        select: {
          id: true,
          title: true,
          fileName: true,
          platform: true,
          thumbnailUrl: true,
          createdAt: true,
        },
      });

      // Update user's analysis count and overall score
      await db.user.update({
        where: { id: session.user.id },
        data: {
          analysesThisMonth: { increment: 1 },
          videosAnalyzed: { increment: 1 },
        },
      });

      await updateUserScore(session.user.id);

      // Return analysis with goalAdvice from rawResponse
      return NextResponse.json({
        analysis: {
          id: analysis.id,
          viralScore: analysis.viralScore,
          hookScore: analysis.hookScore,
          bodyScore: analysis.bodyScore,
          endingScore: analysis.endingScore,
          expectedViewsMin: analysis.viewsMin,
          expectedViewsMax: analysis.viewsMax,
          hookFeedback: analysis.hookFeedback,
          bodyFeedback: analysis.bodyFeedback,
          endingFeedback: analysis.endingFeedback,
          summary: analysis.summary,
          goalAdvice: result.goalAdvice || [],
          suggestions: analysis.suggestions.map((s) => ({
            id: s.id,
            suggestion: s.description,
            priority: s.priority,
            title: s.title,
            category: s.category,
          })),
        },
        video: updatedVideo,
      });
    } catch (analysisError) {
      // Delete the video if analysis fails
      await db.video.delete({
        where: { id: videoId },
      });
      throw analysisError;
    }
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze video" },
      { status: 500 }
    );
  }
}
