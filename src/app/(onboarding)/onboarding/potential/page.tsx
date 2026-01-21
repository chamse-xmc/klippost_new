"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { calculatePotential } from "@/services/potential-calculator";

export default function OnboardingPotentialPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { _hasHydrated, followerRange, heardFrom, goals, challenges, reset } = useOnboardingStore();
  const [potential, setPotential] = useState<ReturnType<typeof calculatePotential> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Only calculate after store has hydrated
    if (_hasHydrated && followerRange && goals.length > 0 && challenges.length > 0) {
      setPotential(calculatePotential(followerRange, goals, challenges));
    }
  }, [_hasHydrated, followerRange, goals, challenges]);

  useEffect(() => {
    // Check for valid session with actual user ID
    if (status === "authenticated") {
      if (!session?.user?.id) {
        // Corrupted session - sign out
        signOut({ redirect: false });
        return;
      }
      // Valid session - save onboarding data or go to dashboard
      if (followerRange && goals.length > 0 && challenges.length > 0) {
        saveOnboardingData();
      } else {
        router.push("/app");
      }
    }
  }, [status, session, followerRange, goals, challenges]);

  const saveOnboardingData = async () => {
    try {
      await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerRange, heardFrom, goals, challenges }),
      });
      reset();
      router.push("/app");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      router.push("/app");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/app" });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const result = await signIn("email", {
        email: email.trim(),
        redirect: false,
        callbackUrl: "/app"
      });

      if (result?.ok) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error("Email sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/challenges");
  };

  // If already authenticated with valid user, show loading (useEffect handles redirect)
  if (status === "authenticated" && session?.user?.id) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Still loading session status
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Wait for store to hydrate before checking data
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If no onboarding data after hydration, redirect to start
  if (!followerRange || goals.length === 0 || challenges.length === 0) {
    router.push("/onboarding");
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Wait for potential to be calculated
  if (!potential) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Email sent confirmation
  if (emailSent) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Check your email
          </h1>
          <p className="text-muted-foreground text-sm">
            We sent a sign-in link to <span className="text-foreground font-medium">{email}</span>
          </p>
        </div>

        {/* Info */}
        <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground space-y-2">
          <p>The link will expire in 24 hours.</p>
          <p>Check your spam folder if you don't see the email.</p>
        </div>

        {/* Back button */}
        <button
          onClick={() => setEmailSent(false)}
          className="w-full py-4 px-6 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all"
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Step 5 of 5</p>
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
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards", opacity: 0 }}>
          {/* Email form */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full py-4 px-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="submit"
              disabled={!email.trim()}
              className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with Email
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-border bg-card hover:bg-muted transition-all font-semibold text-foreground"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" fillOpacity="0.6" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" fillOpacity="0.8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" fillOpacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" fillOpacity="0.7" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handleBack}
            className="w-full py-4 px-6 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
