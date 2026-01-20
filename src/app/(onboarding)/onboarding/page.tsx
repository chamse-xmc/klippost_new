"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";

const followerRanges = [
  { value: "UNDER_1K", label: "Under 1K", description: "Just getting started" },
  { value: "FROM_1K_10K", label: "1K - 10K", description: "Building momentum" },
  { value: "FROM_10K_50K", label: "10K - 50K", description: "Growing fast" },
  { value: "FROM_50K_100K", label: "50K - 100K", description: "Established creator" },
  { value: "OVER_100K", label: "100K+", description: "Major influence" },
] as const;

export default function OnboardingFollowersPage() {
  const router = useRouter();
  const { followerRange, setFollowerRange } = useOnboardingStore();

  const handleSelect = (value: typeof followerRanges[number]["value"]) => {
    setFollowerRange(value);
  };

  const handleNext = () => {
    if (followerRange) {
      router.push("/onboarding/goals");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Step 1 of 4</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          How many followers do you have?
        </h1>
        <p className="text-muted-foreground text-sm">
          This helps us personalize your experience
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {followerRanges.map((range, i) => (
          <button
            key={range.value}
            onClick={() => handleSelect(range.value)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left",
              "opacity-0 animate-slide-up",
              followerRange === range.value
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            )}
            style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
          >
            <div className="flex-1">
              <div className="font-medium text-foreground">{range.label}</div>
              <div className="text-sm text-muted-foreground">{range.description}</div>
            </div>
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                followerRange === range.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {followerRange === range.value && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Continue button */}
      <button
        onClick={handleNext}
        disabled={!followerRange}
        className={cn(
          "w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200",
          followerRange
            ? "bg-primary hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        Continue
      </button>
    </div>
  );
}
