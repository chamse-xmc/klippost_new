"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTitleDisplay } from "@/lib/title-utils";
import type { FollowerRange, Goal, Challenge, CreatorTitle } from "@prisma/client";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  followerRange: FollowerRange | null;
  goals: Goal[];
  challenges: Challenge[];
  overallScore: number;
  title: CreatorTitle;
  videosAnalyzed: number;
  subscription: string;
  analysesThisMonth: number;
  referralCode: string | null;
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

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Stripe checkout handler
  const handleUpgrade = async (plan: "PRO" | "UNLIMITED") => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
  };

  // Auto-trigger checkout from URL param
  useEffect(() => {
    const upgradePlan = searchParams.get("upgrade");
    if (upgradePlan === "pro") {
      handleUpgrade("PRO");
    } else if (upgradePlan === "unlimited") {
      handleUpgrade("UNLIMITED");
    }
  }, [searchParams]);

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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Score</p>
          <p className="text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
            {user?.overallScore || 0}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Title</p>
          <p className="text-xl font-bold text-foreground">
            {user?.title ? getTitleDisplay(user.title) : "Newbie"}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Videos</p>
          <p className="text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
            {user?.videosAnalyzed || 0}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">This Month</p>
          <p className="text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
            {user?.analysesThisMonth || 0}
          </p>
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
              onClick={() => handleUpgrade("PRO")}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                "Upgrade to Pro — $9/mo"
              )}
            </button>
            <button
              onClick={() => handleUpgrade("UNLIMITED")}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-all disabled:opacity-50"
            >
              Go Unlimited — $29/mo
            </button>
          </div>
        )}
        {user?.subscription === "PRO" && (
          <div className="px-5 pb-5">
            <button
              onClick={() => handleUpgrade("UNLIMITED")}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                "Upgrade to Unlimited — $29/mo"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Creator Profile */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Creator Profile</p>

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
    </div>
  );
}
