"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  GROW: "Grow my audience",
  MONETIZE: "Make money from content",
  BRAND_DEALS: "Land brand deals",
  GO_VIRAL: "Go viral",
};

const challengeLabels: Record<Challenge, string> = {
  NO_VIEWS: "Videos don't get views",
  DONT_KNOW: "I don't know what's wrong",
  HOOKS_NOT_WORKING: "Hooks aren't working",
  INCONSISTENT: "Inconsistent results",
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
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setName(data.name || "");
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
      toast.success("Profile updated successfully");
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="text-lg">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
              />
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setName(user?.name || "");
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Stats</CardTitle>
          <CardDescription>Your performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <p className="text-2xl font-bold">{user?.overallScore || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Creator Title</p>
              <p className="text-2xl font-bold">
                {user?.title ? getTitleDisplay(user.title) : "Newbie"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Videos Analyzed</p>
              <p className="text-2xl font-bold">{user?.videosAnalyzed || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Analyses This Month</p>
              <p className="text-2xl font-bold">{user?.analysesThisMonth || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {user?.subscription === "FREE"
                  ? "Free Plan"
                  : user?.subscription === "PRO"
                  ? "Pro Plan"
                  : "Unlimited Plan"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.subscription === "FREE"
                  ? "3 analyses per month"
                  : user?.subscription === "PRO"
                  ? "30 analyses per month"
                  : "Unlimited analyses"}
              </p>
            </div>
            <Badge variant={user?.subscription === "FREE" ? "secondary" : "default"}>
              {user?.subscription}
            </Badge>
          </div>
          {user?.subscription === "FREE" && (
            <Button className="w-full" asChild>
              <a href="/pricing">Upgrade to Pro</a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Info */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Profile</CardTitle>
          <CardDescription>Information from your onboarding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Followers</p>
            <p className="font-medium">
              {user?.followerRange
                ? followerRangeLabels[user.followerRange]
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Goals</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {user?.goals?.length ? (
                user.goals.map((goal) => (
                  <Badge key={goal} variant="secondary">
                    {goalLabels[goal]}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Challenges</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {user?.challenges?.length ? (
                user.challenges.map((challenge) => (
                  <Badge key={challenge} variant="secondary">
                    {challengeLabels[challenge]}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut({ callbackUrl: "/" });
              }}
            >
              Sign Out
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteDialog(false)}
          />
          <div className="relative bg-card rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Delete Account</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We're sorry to see you go. Please tell us why you're leaving so we can improve.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Why are you deleting your account?</label>
              <div className="space-y-2">
                {DELETE_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
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
                    <span className="text-sm">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <span className="font-mono text-destructive">DELETE</span> to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteReason("");
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
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
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
