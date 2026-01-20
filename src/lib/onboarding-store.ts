import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FollowerRange, Goal, Challenge } from "@prisma/client";

interface OnboardingState {
  followerRange: FollowerRange | null;
  goals: Goal[];
  challenges: Challenge[];
  setFollowerRange: (range: FollowerRange) => void;
  setGoals: (goals: Goal[]) => void;
  setChallenges: (challenges: Challenge[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      followerRange: null,
      goals: [],
      challenges: [],
      setFollowerRange: (followerRange) => set({ followerRange }),
      setGoals: (goals) => set({ goals }),
      setChallenges: (challenges) => set({ challenges }),
      reset: () => set({ followerRange: null, goals: [], challenges: [] }),
    }),
    {
      name: "onboarding-storage",
    }
  )
);
