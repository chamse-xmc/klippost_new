import type { CreatorTitle } from "@prisma/client";

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
