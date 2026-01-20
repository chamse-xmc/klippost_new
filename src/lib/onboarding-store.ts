import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FollowerRange, Goal, Challenge, HeardFrom } from "@prisma/client";

interface OnboardingState {
  followerRange: FollowerRange | null;
  heardFrom: HeardFrom | null;
  goals: Goal[];
  challenges: Challenge[];
  setFollowerRange: (range: FollowerRange) => void;
  setHeardFrom: (source: HeardFrom) => void;
  setGoals: (goals: Goal[]) => void;
  setChallenges: (challenges: Challenge[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      followerRange: null,
      heardFrom: null,
      goals: [],
      challenges: [],
      setFollowerRange: (followerRange) => set({ followerRange }),
      setHeardFrom: (heardFrom) => set({ heardFrom }),
      setGoals: (goals) => set({ goals }),
      setChallenges: (challenges) => set({ challenges }),
      reset: () => set({ followerRange: null, heardFrom: null, goals: [], challenges: [] }),
    }),
    {
      name: "onboarding-storage",
    }
  )
);
