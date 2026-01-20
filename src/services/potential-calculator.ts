import type { FollowerRange, Goal, Challenge } from "@prisma/client";

interface PotentialResult {
  improvementPercent: number;
  viewRangeMin: number;
  viewRangeMax: number;
  creatorType: string;
  focusArea: string;
}

const baseViewsByFollowers: Record<FollowerRange, { min: number; max: number }> = {
  UNDER_1K: { min: 200, max: 2000 },
  FROM_1K_10K: { min: 1000, max: 10000 },
  FROM_10K_50K: { min: 5000, max: 50000 },
  FROM_50K_100K: { min: 20000, max: 150000 },
  OVER_100K: { min: 50000, max: 500000 },
};

const creatorTypes: Record<FollowerRange, string> = {
  UNDER_1K: "Emerging Creator",
  FROM_1K_10K: "Rising Star",
  FROM_10K_50K: "Growing Influencer",
  FROM_50K_100K: "Established Creator",
  OVER_100K: "Major Influencer",
};

const focusAreas: Record<Challenge, string> = {
  NO_VIEWS: "Hook optimization and content discovery",
  DONT_KNOW: "Full content audit and strategy",
  HOOKS_NOT_WORKING: "First 3 seconds optimization",
  INCONSISTENT: "Content consistency and formula refinement",
};

export function calculatePotential(
  followerRange: FollowerRange,
  goals: Goal[],
  challenges: Challenge[]
): PotentialResult {
  const baseViews = baseViewsByFollowers[followerRange];

  // Calculate improvement based on challenges
  let improvementMultiplier = 1.5; // Base improvement

  if (challenges.includes("HOOKS_NOT_WORKING")) {
    improvementMultiplier += 0.5; // Hook fixes have high impact
  }
  if (challenges.includes("NO_VIEWS")) {
    improvementMultiplier += 0.3;
  }
  if (challenges.includes("INCONSISTENT")) {
    improvementMultiplier += 0.4;
  }
  if (challenges.includes("DONT_KNOW")) {
    improvementMultiplier += 0.3;
  }

  // Boost for monetization goals
  if (goals.includes("MONETIZE") || goals.includes("BRAND_DEALS")) {
    improvementMultiplier += 0.2;
  }

  const improvementPercent = Math.round((improvementMultiplier - 1) * 100);

  // Calculate view range with improvement
  const viewRangeMin = Math.round(baseViews.min * improvementMultiplier);
  const viewRangeMax = Math.round(baseViews.max * improvementMultiplier);

  // Determine primary focus area
  const primaryChallenge = challenges[0] || "DONT_KNOW";
  const focusArea = focusAreas[primaryChallenge];

  return {
    improvementPercent,
    viewRangeMin,
    viewRangeMax,
    creatorType: creatorTypes[followerRange],
    focusArea,
  };
}
