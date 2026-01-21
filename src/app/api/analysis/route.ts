import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeVideo } from "@/services/video-analyzer";
import { updateUserScore } from "@/services/user-score";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import type { AnalysisMode, SuggestionCategory, Priority } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit by user ID for analysis (expensive AI calls)
    const identifier = getClientIdentifier(request, session.user.id);
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.analysis);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rateLimit.resetIn} seconds.` },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.resetIn.toString(),
          }
        }
      );
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

          // Hook analysis
          hookType: result.hookType,

          // Retention
          retentionScore: result.retentionScore,
          retentionDropoffs: result.retentionDropoffs ? JSON.parse(JSON.stringify(result.retentionDropoffs)) : undefined,

          // CTA
          ctaType: result.ctaType,
          ctaStrength: result.ctaStrength,
          ctaFeedback: result.ctaFeedback,

          // Trends
          trendScore: result.trendScore,
          trendMatches: result.trendMatches ? JSON.parse(JSON.stringify(result.trendMatches)) : undefined,
          trendSuggestions: result.trendSuggestions ? JSON.parse(JSON.stringify(result.trendSuggestions)) : undefined,

          // Engagement predictions
          estimatedLikesMin: result.estimatedLikesMin,
          estimatedLikesMax: result.estimatedLikesMax,
          estimatedCommentsMin: result.estimatedCommentsMin,
          estimatedCommentsMax: result.estimatedCommentsMax,
          estimatedSharesMin: result.estimatedSharesMin,
          estimatedSharesMax: result.estimatedSharesMax,

          // Technical quality
          audioScore: result.audioScore,
          visualScore: result.visualScore,
          audioFeedback: result.audioFeedback,
          visualFeedback: result.visualFeedback,

          // Brand value
          brandValue: result.brandValue,

          suggestions: {
            create: result.suggestions.map((s) => ({
              category: s.category as SuggestionCategory,
              priority: s.priority as Priority,
              title: s.title,
              description: s.description,
              timestamp: s.timestamp != null ? Math.round(Number(s.timestamp)) || null : null,
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

      // Sort suggestions by priority (CRITICAL > HIGH > MEDIUM > LOW)
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const sortedSuggestions = [...analysis.suggestions].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      // Return analysis with all new fields
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
          transcript: analysis.transcript,
          goalAdvice: result.goalAdvice || [],

          // Hook analysis
          hookType: analysis.hookType,

          // Retention
          retentionScore: analysis.retentionScore,
          retentionDropoffs: analysis.retentionDropoffs,

          // CTA
          ctaType: analysis.ctaType,
          ctaStrength: analysis.ctaStrength,
          ctaFeedback: analysis.ctaFeedback,

          // Trends
          trendScore: analysis.trendScore,
          trendMatches: analysis.trendMatches,
          trendSuggestions: analysis.trendSuggestions,

          // Engagement predictions
          estimatedLikesMin: analysis.estimatedLikesMin,
          estimatedLikesMax: analysis.estimatedLikesMax,
          estimatedCommentsMin: analysis.estimatedCommentsMin,
          estimatedCommentsMax: analysis.estimatedCommentsMax,
          estimatedSharesMin: analysis.estimatedSharesMin,
          estimatedSharesMax: analysis.estimatedSharesMax,

          // Technical quality
          audioScore: analysis.audioScore,
          visualScore: analysis.visualScore,
          audioFeedback: analysis.audioFeedback,
          visualFeedback: analysis.visualFeedback,

          // Brand value
          brandValue: analysis.brandValue,

          suggestions: sortedSuggestions.map((s) => ({
            id: s.id,
            suggestion: s.description,
            description: s.description,
            priority: s.priority,
            title: s.title,
            category: s.category,
            timestamp: s.timestamp,
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
