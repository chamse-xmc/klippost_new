import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const analysis = await db.analysis.findUnique({
      where: { id },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            platform: true,
            thumbnailUrl: true,
            fileName: true,
            createdAt: true,
            userId: true,
          },
        },
        suggestions: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    if (analysis.video.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Sort suggestions by priority (CRITICAL > HIGH > MEDIUM > LOW)
    const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sortedSuggestions = [...analysis.suggestions].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return NextResponse.json({
      ...analysis,
      suggestions: sortedSuggestions.map((s) => ({
        id: s.id,
        suggestion: s.description,
        description: s.description,
        priority: s.priority,
        title: s.title,
        category: s.category,
        timestamp: s.timestamp,
      })),
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
