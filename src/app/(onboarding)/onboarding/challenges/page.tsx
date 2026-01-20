"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import type { Challenge } from "@prisma/client";

const challengeOptions: { value: Challenge; label: string; description: string }[] = [
  {
    value: "NO_VIEWS",
    label: "Videos don't get views",
    description: "My content isn't reaching people",
  },
  {
    value: "DONT_KNOW",
    label: "I don't know what's wrong",
    description: "Something's off but I can't figure it out",
  },
  {
    value: "HOOKS_NOT_WORKING",
    label: "Hooks aren't working",
    description: "People scroll past my videos",
  },
  {
    value: "INCONSISTENT",
    label: "Inconsistent results",
    description: "Some videos do well, others flop",
  },
];

export default function OnboardingChallengesPage() {
  const router = useRouter();
  const { challenges, setChallenges } = useOnboardingStore();

  const toggleChallenge = (challenge: Challenge) => {
    if (challenges.includes(challenge)) {
      setChallenges(challenges.filter((c) => c !== challenge));
    } else {
      setChallenges([...challenges, challenge]);
    }
  };

  const handleNext = () => {
    if (challenges.length > 0) {
      router.push("/onboarding/potential");
    }
  };

  const handleBack = () => {
    router.push("/onboarding/goals");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Step 4 of 5</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          What's holding you back?
        </h1>
        <p className="text-muted-foreground text-sm">
          Select all that apply
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {challengeOptions.map((option, i) => {
          const isSelected = challenges.includes(option.value);

          return (
            <button
              key={option.value}
              onClick={() => toggleChallenge(option.value)}
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
      {challenges.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {challenges.length} challenge{challenges.length > 1 ? "s" : ""} selected
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
          disabled={challenges.length === 0}
          className={cn(
            "flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200",
            challenges.length > 0
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
