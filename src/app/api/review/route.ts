import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const MIN_REVIEW_LENGTH = 100;
const REVIEW_BONUS_ANALYSES = 5;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const review = await db.review.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Get review error:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
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

    const body = await request.json();
    const { content, rating } = body as { content: string; rating: number };

    // Validate content length
    if (!content || content.trim().length < MIN_REVIEW_LENGTH) {
      return NextResponse.json(
        { error: `Review must be at least ${MIN_REVIEW_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user already has a review
    const existingReview = await db.review.findUnique({
      where: { userId: session.user.id },
    });

    if (existingReview) {
      // Update existing review (no additional bonus)
      const review = await db.review.update({
        where: { userId: session.user.id },
        data: {
          content: content.trim(),
          rating,
        },
      });

      return NextResponse.json({ review, bonusGranted: false });
    }

    // Create new review and grant bonus
    const [review] = await db.$transaction([
      db.review.create({
        data: {
          userId: session.user.id,
          content: content.trim(),
          rating,
          bonusGranted: true,
        },
      }),
      db.user.update({
        where: { id: session.user.id },
        data: {
          bonusAnalyses: { increment: REVIEW_BONUS_ANALYSES },
        },
      }),
    ]);

    return NextResponse.json({
      review,
      bonusGranted: true,
      bonusAmount: REVIEW_BONUS_ANALYSES,
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
