"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { calculatePotential } from "@/services/potential-calculator";
import { cn } from "@/lib/utils";

export default function OnboardingPotentialPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { followerRange, goals, challenges, reset } = useOnboardingStore();
  const [potential, setPotential] = useState<ReturnType<typeof calculatePotential> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("test@example.com");

  useEffect(() => {
    if (followerRange && goals.length > 0 && challenges.length > 0) {
      setPotential(calculatePotential(followerRange, goals, challenges));
    }
  }, [followerRange, goals, challenges]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      saveOnboardingData();
    }
  }, [status, session]);

  const saveOnboardingData = async () => {
    try {
      await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerRange, goals, challenges }),
      });
      reset();
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      router.push("/dashboard");
    }
  };

  const handleSignIn = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl: "/onboarding/potential" });
  };

  const handleTestLogin = async () => {
    setIsLoading(true);
    await signIn("credentials", {
      email: testEmail,
      callbackUrl: "/onboarding/potential"
    });
  };

  const handleBack = () => {
    router.push("/onboarding/challenges");
  };

  if (!potential) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Step 4 of 4</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Your growth potential
        </h1>
      </div>

      {/* Potential Card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary bg-card p-6 animate-slide-up">
        {/* Big number */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-primary animate-scale-bounce">
            {potential.improvementPercent}%
          </div>
          <div className="text-muted-foreground text-sm mt-1">potential view increase</div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Expected Views</span>
            <span className="font-bold text-foreground">
              {potential.viewRangeMin.toLocaleString()}-{potential.viewRangeMax.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Creator Type</span>
            <span className="font-bold text-foreground">
              {potential.creatorType}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Focus Area</span>
            <span className="font-bold text-foreground">
              {potential.focusArea}
            </span>
          </div>
        </div>
      </div>

      {/* Auth section */}
      {status === "loading" || isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : status === "unauthenticated" ? (
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards", opacity: 0 }}>
          {/* Test Login */}
          <div className="rounded-xl border-2 border-dashed border-border bg-muted p-4">
            <div className="text-center text-xs font-semibold text-muted-foreground mb-3">
              Dev Mode - Quick Login
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleTestLogin}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Go
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
            </div>
          </div>

          {/* Social buttons */}
          <button
            onClick={() => handleSignIn("google")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-border bg-card hover:bg-muted transition-all font-semibold text-foreground"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" fillOpacity="0.6" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" fillOpacity="0.8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" fillOpacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" fillOpacity="0.7" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <button
            onClick={() => handleSignIn("facebook")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-border bg-card hover:bg-muted transition-all font-semibold text-foreground"
          >
            <svg className="w-5 h-5" fill="currentColor" fillOpacity="0.7" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>

          <button
            onClick={handleBack}
            className="w-full py-4 px-6 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all"
          >
            Back
          </button>
        </div>
      ) : null}
    </div>
  );
}
