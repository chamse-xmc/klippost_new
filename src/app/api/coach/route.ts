import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription - AI Coach is Pro/Unlimited only
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { subscription: true, goals: true },
    });

    if (!user || user.subscription === "FREE") {
      return NextResponse.json(
        { error: "AI Coach is available for Pro and Unlimited subscribers only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body as {
      message: string;
      conversationHistory: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch user's video analyses
    const videos = await db.video.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
      },
      include: {
        analysis: {
          include: {
            suggestions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 videos for context
    });

    // user.goals already fetched above

    // Build context summary
    const context = buildContextSummary(videos, user?.goals || []);

    // Build the prompt
    const systemPrompt = `You are an AI Coach for a video creator. You help them improve their short-form video content (TikTok, Reels, Shorts).

You have access to their video analysis history:

${context}

Your role:
- Give specific, actionable advice based on their actual data
- Identify patterns in their content (strengths and weaknesses)
- Be encouraging but honest
- Reference specific videos or trends in their data when relevant
- Keep responses concise and practical (2-4 paragraphs max)
- Do NOT use emojis

If they ask about something not related to their video content or performance, politely redirect them back to video coaching topics.`;

    // Build conversation for Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are my AI Coach. Here's your system context: " + systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm your AI Coach and I have access to your video performance data. How can I help you improve your content today?" }],
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role === "user" ? "user" as const : "model" as const,
          parts: [{ text: msg.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Coach error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}

interface VideoWithAnalysis {
  id: string;
  fileName: string;
  platform: string;
  createdAt: Date;
  analysis: {
    viralScore: number;
    hookScore: number;
    bodyScore: number;
    endingScore: number;
    retentionScore: number | null;
    ctaStrength: number | null;
    audioScore: number | null;
    visualScore: number | null;
    hookFeedback: string | null;
    bodyFeedback: string | null;
    endingFeedback: string | null;
    summary: string | null;
    suggestions: { category: string; priority: string; title: string; description: string }[];
  } | null;
}

function buildContextSummary(videos: VideoWithAnalysis[], goals: string[]): string {
  if (videos.length === 0) {
    return "This user hasn't analyzed any videos yet. Encourage them to upload their first video to get started.";
  }

  const analyzedVideos = videos.filter((v) => v.analysis);

  // Calculate averages
  const avgViralScore = Math.round(
    analyzedVideos.reduce((sum, v) => sum + (v.analysis?.viralScore || 0), 0) / analyzedVideos.length
  );
  const avgHookScore = Math.round(
    analyzedVideos.reduce((sum, v) => sum + (v.analysis?.hookScore || 0), 0) / analyzedVideos.length
  );
  const avgBodyScore = Math.round(
    analyzedVideos.reduce((sum, v) => sum + (v.analysis?.bodyScore || 0), 0) / analyzedVideos.length
  );
  const avgEndingScore = Math.round(
    analyzedVideos.reduce((sum, v) => sum + (v.analysis?.endingScore || 0), 0) / analyzedVideos.length
  );

  // Find improvement trend
  const recentVideos = analyzedVideos.slice(0, 5);
  const olderVideos = analyzedVideos.slice(-5);
  const recentAvg = recentVideos.length > 0
    ? Math.round(recentVideos.reduce((sum, v) => sum + (v.analysis?.viralScore || 0), 0) / recentVideos.length)
    : 0;
  const olderAvg = olderVideos.length > 0
    ? Math.round(olderVideos.reduce((sum, v) => sum + (v.analysis?.viralScore || 0), 0) / olderVideos.length)
    : 0;

  // Collect common suggestion categories
  const suggestionCategories: Record<string, number> = {};
  analyzedVideos.forEach((v) => {
    v.analysis?.suggestions.forEach((s) => {
      suggestionCategories[s.category] = (suggestionCategories[s.category] || 0) + 1;
    });
  });
  const topIssues = Object.entries(suggestionCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  // Find best and worst videos
  const sortedByScore = [...analyzedVideos].sort(
    (a, b) => (b.analysis?.viralScore || 0) - (a.analysis?.viralScore || 0)
  );
  const bestVideo = sortedByScore[0];
  const worstVideo = sortedByScore[sortedByScore.length - 1];

  // Build summary
  let summary = `## User's Video Performance Summary

**Total Videos Analyzed:** ${analyzedVideos.length}
**Goals:** ${goals.length > 0 ? goals.join(", ") : "Not set"}

### Average Scores
- Overall Viral Score: ${avgViralScore}/100
- Hook: ${avgHookScore}/100
- Body: ${avgBodyScore}/100
- Ending: ${avgEndingScore}/100

### Trend
- Recent 5 videos average: ${recentAvg}/100
- ${analyzedVideos.length >= 10 ? `Older videos average: ${olderAvg}/100` : "Not enough videos for trend analysis"}
- ${recentAvg > olderAvg ? "Improving!" : recentAvg < olderAvg ? "Declining - needs attention" : "Stable"}

### Common Issues (most frequent suggestion categories)
${topIssues.map((cat) => `- ${cat}`).join("\n")}

### Best Performing Video
- "${bestVideo?.fileName}" scored ${bestVideo?.analysis?.viralScore}/100
${bestVideo?.analysis?.summary ? `- Summary: ${bestVideo.analysis.summary}` : ""}

### Lowest Performing Video
- "${worstVideo?.fileName}" scored ${worstVideo?.analysis?.viralScore}/100
${worstVideo?.analysis?.summary ? `- Summary: ${worstVideo.analysis.summary}` : ""}
`;

  // Add recent video details
  summary += `\n### Recent Videos (last 5)\n`;
  recentVideos.forEach((v, i) => {
    summary += `${i + 1}. "${v.fileName}" - Score: ${v.analysis?.viralScore}/100 (Hook: ${v.analysis?.hookScore}, Body: ${v.analysis?.bodyScore}, Ending: ${v.analysis?.endingScore})\n`;
  });

  return summary;
}
