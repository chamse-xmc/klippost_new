import { db } from "@/lib/db";
import type { CreatorTitle } from "@prisma/client";

// Weighting: Most recent = 40%, previous = 30%, older = 20%, rest = 10%
const WEIGHTS = [0.4, 0.3, 0.2, 0.1];

export async function updateUserScore(userId: string): Promise<{
  overallScore: number;
  title: CreatorTitle;
}> {
  // Get user's most recent analyses
  const analyses = await db.analysis.findMany({
    where: {
      video: {
        userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      viralScore: true,
    },
  });

  if (analyses.length === 0) {
    return { overallScore: 0, title: "NEWBIE" };
  }

  // Calculate weighted score
  let totalWeight = 0;
  let weightedSum = 0;

  analyses.forEach((analysis, index) => {
    const weight = index < WEIGHTS.length ? WEIGHTS[index] : 0.1;
    weightedSum += analysis.viralScore * weight;
    totalWeight += weight;
  });

  const overallScore = Math.round(weightedSum / totalWeight);
  const title = getTitle(overallScore);

  // Update user
  await db.user.update({
    where: { id: userId },
    data: {
      overallScore,
      title,
      videosAnalyzed: { increment: 0 }, // Will be handled separately
    },
  });

  return { overallScore, title };
}

export function getTitle(score: number): CreatorTitle {
  if (score >= 80) return "VIRAL_LEGEND";
  if (score >= 60) return "INFLUENCER";
  if (score >= 40) return "RISING_STAR";
  if (score >= 20) return "CREATOR";
  return "NEWBIE";
}

export function getTitleDisplay(title: CreatorTitle): string {
  const displays: Record<CreatorTitle, string> = {
    NEWBIE: "Newbie",
    CREATOR: "Creator",
    RISING_STAR: "Rising Star",
    INFLUENCER: "Influencer",
    VIRAL_LEGEND: "Viral Legend",
  };
  return displays[title];
}

export function getTitleColor(title: CreatorTitle): string {
  const colors: Record<CreatorTitle, string> = {
    NEWBIE: "text-gray-500",
    CREATOR: "text-blue-500",
    RISING_STAR: "text-purple-500",
    INFLUENCER: "text-orange-500",
    VIRAL_LEGEND: "text-yellow-500",
  };
  return colors[title];
}
