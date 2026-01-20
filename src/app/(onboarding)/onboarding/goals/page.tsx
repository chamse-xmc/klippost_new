"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import type { Goal } from "@prisma/client";

const goalOptions: { value: Goal; label: string; description: string }[] = [
  {
    value: "GROW",
    label: "Grow my audience",
    description: "Get more followers and build a community",
  },
  {
    value: "MONETIZE",
    label: "Make money",
    description: "Turn my content into income",
  },
  {
    value: "BRAND_DEALS",
    label: "Land brand deals",
    description: "Partner with brands I love",
  },
  {
    value: "GO_VIRAL",
    label: "Go viral",
    description: "Create content that blows up",
  },
];

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const { goals, setGoals } = useOnboardingStore();

  const toggleGoal = (goal: Goal) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter((g) => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const handleBack = () => {
    router.push("/onboarding");
  };

  const handleNext = () => {
    if (goals.length > 0) {
      router.push("/onboarding/challenges");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Step 2 of 4</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          What are your goals?
        </h1>
        <p className="text-muted-foreground text-sm">
          Select all that apply
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {goalOptions.map((option, i) => {
          const isSelected = goals.includes(option.value);

          return (
            <button
              key={option.value}
              onClick={() => toggleGoal(option.value)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left",
                "opacity-0 animate-slide-up",
                isSelected
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
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected count */}
      {goals.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {goals.length} goal{goals.length > 1 ? "s" : ""} selected
        </div>
      )}

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
          disabled={goals.length === 0}
          className={cn(
            "flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200",
            goals.length > 0
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
