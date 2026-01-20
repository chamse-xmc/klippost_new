"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import type { HeardFrom } from "@prisma/client";

const sourceOptions: { value: HeardFrom; label: string; description: string }[] = [
  {
    value: "TIKTOK",
    label: "TikTok",
    description: "Saw it on my For You page",
  },
  {
    value: "YOUTUBE",
    label: "YouTube",
    description: "Found it in a video",
  },
  {
    value: "INSTAGRAM",
    label: "Instagram",
    description: "Discovered through Reels or posts",
  },
  {
    value: "TWITTER",
    label: "Twitter / X",
    description: "Saw a tweet about it",
  },
  {
    value: "FRIEND",
    label: "A friend",
    description: "Someone recommended it to me",
  },
  {
    value: "GOOGLE",
    label: "Google search",
    description: "Found it while searching",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Somewhere else",
  },
];

export default function OnboardingSourcePage() {
  const router = useRouter();
  const { heardFrom, setHeardFrom } = useOnboardingStore();

  const handleSelect = (value: HeardFrom) => {
    setHeardFrom(value);
  };

  const handleBack = () => {
    router.push("/onboarding");
  };

  const handleNext = () => {
    if (heardFrom) {
      router.push("/onboarding/goals");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Step 2 of 5</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Where did you hear about us?
        </h1>
        <p className="text-muted-foreground text-sm">
          This helps us understand our community
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {sourceOptions.map((option, i) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left",
              "opacity-0 animate-slide-up",
              heardFrom === option.value
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            )}
            style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
          >
            <div className="flex-1">
              <div className="font-medium text-foreground">{option.label}</div>
              <div className="text-sm text-muted-foreground">{option.description}</div>
            </div>
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                heardFrom === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {heardFrom === option.value && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleBack}
          className="flex-1 py-4 px-6 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!heardFrom}
          className={cn(
            "flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200",
            heardFrom
              ? "bg-primary hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
