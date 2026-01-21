"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FollowerRange, Goal, Challenge } from "@prisma/client";

// Confetti piece component
function ConfettiPiece({ index }: { index: number }) {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1'];
  const color = colors[index % colors.length];

  const config = useState(() => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.5 + Math.random() * 1.5,
    size: 8 + Math.random() * 10,
    rotation: Math.random() * 360,
  }))[0];

  return (
    <div
      className="absolute animate-confetti-fall"
      style={{
        left: `${config.left}%`,
        top: '-20px',
        animationDelay: `${config.delay}s`,
        animationDuration: `${config.duration}s`,
      }}
    >
      <div
        style={{
          width: config.size,
          height: config.size * 0.4,
          backgroundColor: color,
          borderRadius: 2,
          transform: `rotate(${config.rotation}deg)`,
        }}
      />
    </div>
  );
}

function ConfettiCelebration({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(100)].map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  );
}

interface Review {
  id: string;
  content: string;
  rating: number;
  bonusGranted: boolean;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  followerRange: FollowerRange | null;
  goals: Goal[];
  challenges: Challenge[];
  subscription: string;
  bonusAnalyses: number;
  referralCode: string | null;
  review: Review | null;
}

const followerRangeLabels: Record<FollowerRange, string> = {
  UNDER_1K: "Under 1K",
  FROM_1K_10K: "1K - 10K",
  FROM_10K_50K: "10K - 50K",
  FROM_50K_100K: "50K - 100K",
  OVER_100K: "100K+",
};

const goalLabels: Record<Goal, string> = {
  GROW: "Grow audience",
  MONETIZE: "Monetize",
  BRAND_DEALS: "Brand deals",
  GO_VIRAL: "Go viral",
};

const challengeLabels: Record<Challenge, string> = {
  NO_VIEWS: "Low views",
  DONT_KNOW: "Unclear issues",
  HOOKS_NOT_WORKING: "Weak hooks",
  INCONSISTENT: "Inconsistent",
};

const DELETE_REASONS = [
  { value: "not_useful", label: "Not useful for my needs" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "found_alternative", label: "Found a better alternative" },
  { value: "not_accurate", label: "Analysis not accurate enough" },
  { value: "privacy", label: "Privacy concerns" },
  { value: "other", label: "Other reason" },
];

// Component that handles search params (needs Suspense boundary)
function UpgradeHandler({
  onUpgrade,
  onUpgradeSuccess
}: {
  onUpgrade: (plan: "PRO" | "UNLIMITED") => void;
  onUpgradeSuccess: () => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const upgradePlan = searchParams.get("upgrade");
    if (upgradePlan === "pro") {
      onUpgrade("PRO");
    } else if (upgradePlan === "unlimited") {
      onUpgrade("UNLIMITED");
    }

    // Check for successful upgrade return from Stripe
    const upgraded = searchParams.get("upgraded");
    if (upgraded === "true") {
      // Clear the URL param
      window.history.replaceState({}, "", "/settings");
      onUpgradeSuccess();
    }
  }, [searchParams, onUpgrade, onUpgradeSuccess]);

  return null;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Yearly upsell modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<"PRO" | "UNLIMITED" | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Referral state
  const [isCreatingReferral, setIsCreatingReferral] = useState(false);
  const [origin, setOrigin] = useState("");

  // Creator profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFollowerRange, setEditFollowerRange] = useState<FollowerRange | null>(null);
  const [editGoals, setEditGoals] = useState<Goal[]>([]);
  const [editChallenges, setEditChallenges] = useState<Challenge[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Set origin on client
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Handle successful upgrade
  const handleUpgradeSuccess = useCallback(() => {
    setShowCelebration(true);
    setShowUpgradeModal(true);
    queryClient.invalidateQueries({ queryKey: ["user"] });
    setTimeout(() => setShowCelebration(false), 4000);
  }, [queryClient]);

  // Start editing profile
  const handleStartEditProfile = () => {
    setEditFollowerRange(user?.followerRange || null);
    setEditGoals(user?.goals || []);
    setEditChallenges(user?.challenges || []);
    setIsEditingProfile(true);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerRange: editFollowerRange,
          goals: editGoals,
          challenges: editChallenges,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      setIsEditingProfile(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Toggle goal selection
  const toggleGoal = (goal: Goal) => {
    setEditGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  // Toggle challenge selection
  const toggleChallenge = (challenge: Challenge) => {
    setEditChallenges((prev) =>
      prev.includes(challenge) ? prev.filter((c) => c !== challenge) : [...prev, challenge]
    );
  };

  // Submit review for bonus analyses
  const handleSubmitReview = async () => {
    if (reviewContent.length < 100) {
      toast.error("Review must be at least 100 characters");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reviewContent, rating: reviewRating }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }
      const data = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      setShowUpgradeModal(false);
      setReviewContent("");
      toast.success(`Thanks! +${data.bonusAmount} free analyses added!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Show plan selection modal
  const handleShowPlanModal = useCallback((planType: "PRO" | "UNLIMITED") => {
    setSelectedPlanType(planType);
    setBillingCycle("monthly");
    setShowPlanModal(true);
  }, []);

  // Stripe checkout handler
  const handleUpgrade = useCallback(async (plan: "PRO" | "UNLIMITED" | "PRO_YEARLY" | "UNLIMITED_YEARLY") => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, returnUrl: "/settings?upgraded=true" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout session");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
      setIsCheckingOut(false);
    }
  }, []);

  // Proceed with selected plan from modal
  const handleProceedWithPlan = () => {
    if (!selectedPlanType) return;
    const plan = billingCycle === "yearly" ? `${selectedPlanType}_YEARLY` as const : selectedPlanType;
    setShowPlanModal(false);
    handleUpgrade(plan);
  };

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setName(data.name || "");
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setIsEditing(false);
      toast.success("Profile updated");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ name });
  };

  // Create referral code
  const handleCreateReferral = async () => {
    setIsCreatingReferral(true);
    try {
      const res = await fetch("/api/affiliate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create referral code");
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Referral code created!");
    } catch (error) {
      toast.error("Failed to create referral code");
    } finally {
      setIsCreatingReferral(false);
    }
  };

  // Copy referral link
  const handleCopyReferral = () => {
    if (user?.referralCode && origin) {
      const link = `${origin}?ref=${user.referralCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded-lg" />
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Confetti celebration */}
      <ConfettiCelebration show={showCelebration} />

      {/* Handle upgrade URL params */}
      <Suspense fallback={null}>
        <UpgradeHandler onUpgrade={handleUpgrade} onUpgradeSuccess={handleUpgradeSuccess} />
      </Suspense>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Display Name
          </label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl bg-muted border-0 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                !isEditing && "opacity-60"
              )}
            />
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setName(user?.name || "");
                    setIsEditing(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:text-foreground transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:text-foreground transition-all"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
            <p className="font-semibold text-foreground">
              {user?.subscription === "FREE"
                ? "Free"
                : user?.subscription === "PRO"
                ? "Pro"
                : "Unlimited"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.subscription === "FREE"
                ? "3 analyses/month"
                : user?.subscription === "PRO"
                ? "30 analyses/month"
                : "Unlimited analyses"}
            </p>
          </div>
          <span className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider",
            user?.subscription === "FREE"
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          )}>
            {user?.subscription}
          </span>
        </div>
        {user?.subscription === "FREE" && (
          <div className="px-5 pb-5 space-y-2">
            <button
              onClick={() => handleShowPlanModal("PRO")}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                "Upgrade to Pro"
              )}
            </button>
            <button
              onClick={() => handleShowPlanModal("UNLIMITED")}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-all disabled:opacity-50"
            >
              Go Unlimited
            </button>
          </div>
        )}
        {user?.subscription === "PRO" && (
          <div className="px-5 pb-5">
            <button
              onClick={() => handleShowPlanModal("UNLIMITED")}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                "Upgrade to Unlimited"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bonus Analyses */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bonus Analyses</p>
              <p className="font-semibold text-foreground">
                {user?.bonusAnalyses || 0} free analyses available
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Referral */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Invite Friends</p>
              <p className="text-sm text-muted-foreground mb-3">Get +5 free analyses when a friend signs up</p>
              {user?.referralCode ? (
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-sm text-foreground font-mono truncate">
                    {origin}?ref={user.referralCode}
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCreateReferral}
                  disabled={isCreatingReferral}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isCreatingReferral ? "Creating..." : "Get Referral Link"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Creator Profile */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Creator Profile</p>
          {!isEditingProfile && (
            <button
              onClick={handleStartEditProfile}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <>
            {/* Follower Range */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Followers</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(followerRangeLabels) as FollowerRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setEditFollowerRange(range)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      editFollowerRange === range
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    {followerRangeLabels[range]}
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="border-t border-border pt-4 space-y-2">
              <span className="text-sm text-muted-foreground">Goals (select multiple)</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(goalLabels) as Goal[]).map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      editGoals.includes(goal)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    {goalLabels[goal]}
                  </button>
                ))}
              </div>
            </div>

            {/* Challenges */}
            <div className="border-t border-border pt-4 space-y-2">
              <span className="text-sm text-muted-foreground">Challenges (select multiple)</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(challengeLabels) as Challenge[]).map((challenge) => (
                  <button
                    key={challenge}
                    onClick={() => toggleChallenge(challenge)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      editChallenges.includes(challenge)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    {challengeLabels[challenge]}
                  </button>
                ))}
              </div>
            </div>

            {/* Save/Cancel buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:text-foreground transition-all"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Followers</span>
              <span className="text-sm font-medium text-foreground">
                {user?.followerRange ? followerRangeLabels[user.followerRange] : "Not set"}
              </span>
            </div>

            <div className="border-t border-border pt-4">
              <span className="text-sm text-muted-foreground block mb-2">Goals</span>
              <div className="flex flex-wrap gap-2">
                {user?.goals?.length ? (
                  user.goals.map((goal) => (
                    <span key={goal} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground">
                      {goalLabels[goal]}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not set</span>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <span className="text-sm text-muted-foreground block mb-2">Challenges</span>
              <div className="flex flex-wrap gap-2">
                {user?.challenges?.length ? (
                  user.challenges.map((challenge) => (
                    <span key={challenge} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground">
                      {challengeLabels[challenge]}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not set</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Account Actions */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <button
          onClick={async () => {
            await signOut({ callbackUrl: "/" });
          }}
          className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
        >
          <div>
            <p className="font-medium text-foreground">Sign Out</p>
            <p className="text-sm text-muted-foreground">Sign out of your account</p>
          </div>
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className="w-full p-5 flex items-center justify-between hover:bg-destructive/5 transition-colors text-left border-t border-border"
        >
          <div>
            <p className="font-medium text-destructive">Delete Account</p>
            <p className="text-sm text-muted-foreground">Permanently delete all data</p>
          </div>
          <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteDialog(false)}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-slide-up">
            <div>
              <h3 className="text-xl font-bold text-foreground">Delete Account</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This action cannot be undone. Please tell us why you're leaving.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</label>
              <div className="space-y-2">
                {DELETE_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      deleteReason === reason.value
                        ? "border-destructive bg-destructive/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <input
                      type="radio"
                      name="deleteReason"
                      value={reason.value}
                      checked={deleteReason === reason.value}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      className="accent-destructive"
                    />
                    <span className="text-sm text-foreground">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Type <span className="font-mono text-destructive">DELETE</span> to confirm
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteReason("");
                  setDeleteConfirmText("");
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== "DELETE" || !deleteReason || isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const res = await fetch("/api/user", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reason: deleteReason }),
                    });
                    if (!res.ok) throw new Error("Failed to delete account");
                    await signOut({ callbackUrl: "/" });
                  } catch (error) {
                    toast.error("Failed to delete account");
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Celebration Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-slide-up">
            {/* Header with celebration */}
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-2xl font-bold text-foreground">
                Welcome to {user?.subscription === "UNLIMITED" ? "Unlimited" : "Pro"}!
              </h3>
              <p className="text-muted-foreground mt-2">
                Your account has been upgraded. Time to make viral content!
              </p>
            </div>

            {/* Review for bonus - only show if user hasn't reviewed */}
            {!user?.review && (
              <div className="border-t border-border pt-5 space-y-4">
                <div className="text-center">
                  <p className="font-semibold text-foreground">Want 5 extra analyses?</p>
                  <p className="text-sm text-muted-foreground">
                    Write a quick review and get 5 bonus video analyses!
                  </p>
                </div>

                {/* Star Rating */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</label>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 ${star <= reviewRating ? "text-yellow-400" : "text-muted"}`}
                          fill={star <= reviewRating ? "currentColor" : "none"}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Your Review
                  </label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="What do you think of klippost? How has it helped your content?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                  <div className="flex justify-between text-xs">
                    <span className={reviewContent.length >= 100 ? "text-green-500" : "text-muted-foreground"}>
                      {reviewContent.length >= 100 ? (
                        <span className="text-green-500">Ready to submit!</span>
                      ) : (
                        <span>{100 - reviewContent.length} more characters needed</span>
                      )}
                    </span>
                    {reviewContent.length >= 100 && (
                      <span className="text-amber-500 font-medium">+5 free analyses!</span>
                    )}
                  </div>
                </div>

                <button
                  disabled={reviewContent.length < 100 || isSubmittingReview}
                  onClick={handleSubmitReview}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit & Get 5 Free"}
                </button>
              </div>
            )}

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
            >
              {user?.review ? "Start Creating!" : "Maybe Later"}
            </button>
          </div>
        </div>
      )}

      {/* Plan Selection Modal with Yearly Upsell */}
      {showPlanModal && selectedPlanType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPlanModal(false)}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-slide-up">
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">
                {selectedPlanType === "PRO" ? "Pro Plan" : "Unlimited Plan"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose your billing cycle
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 p-1 bg-muted rounded-xl">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                  billingCycle === "monthly"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all relative",
                  billingCycle === "yearly"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                  -17%
                </span>
              </button>
            </div>

            {/* Price Display */}
            <div className="text-center py-4">
              {billingCycle === "monthly" ? (
                <>
                  <div className="text-4xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
                    ${selectedPlanType === "PRO" ? "9" : "29"}
                    <span className="text-lg font-medium text-muted-foreground">/mo</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
                    ${selectedPlanType === "PRO" ? "90" : "290"}
                    <span className="text-lg font-medium text-muted-foreground">/yr</span>
                  </div>
                  <div className="mt-1 text-sm text-green-500 font-medium">
                    Save ${selectedPlanType === "PRO" ? "18" : "58"} per year!
                  </div>
                  <div className="text-xs text-muted-foreground">
                    (${selectedPlanType === "PRO" ? "7.50" : "24.17"}/mo equivalent)
                  </div>
                </>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {selectedPlanType === "PRO" ? "30 analyses/month" : "Unlimited analyses"}
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                AI Coach access
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Goal-based insights
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleProceedWithPlan}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                `Continue with ${billingCycle === "yearly" ? "Yearly" : "Monthly"}`
              )}
            </button>

            <button
              onClick={() => setShowPlanModal(false)}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
