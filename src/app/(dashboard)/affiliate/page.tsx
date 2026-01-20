"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Copy, Check, Users, DollarSign, TrendingUp, Clock } from "lucide-react";
import type { PayoutStatus } from "@prisma/client";

interface AffiliateStats {
  referralCode: string | null;
  totalReferrals: number;
  activeSubscribers: number;
  totalEarnings: number;
  pendingEarnings: number;
  recentPayments: {
    id: string;
    originalAmount: number;
    commission: number;
    status: PayoutStatus;
    createdAt: string;
    paidAt: string | null;
  }[];
}

const statusColors: Record<PayoutStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500",
  PAID: "bg-green-500/10 text-green-500",
  FAILED: "bg-red-500/10 text-red-500",
};

export default function AffiliatePage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading } = useQuery<AffiliateStats>({
    queryKey: ["affiliate"],
    queryFn: async () => {
      const res = await fetch("/api/affiliate");
      if (!res.ok) throw new Error("Failed to fetch affiliate stats");
      return res.json();
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/affiliate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create referral code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });
      toast.success("Referral code created!");
    },
    onError: () => {
      toast.error("Failed to create referral code");
    },
  });

  const referralLink = stats?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}?ref=${stats.referralCode}`
    : null;

  const copyToClipboard = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Affiliate Program</h1>
        <p className="text-muted-foreground">
          Earn 50% lifetime commission on every referral
        </p>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link to earn 50% of all payments from users you refer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.referralCode ? (
            <div className="flex gap-2">
              <Input value={referralLink || ""} readOnly className="font-mono" />
              <Button onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="mb-4 text-muted-foreground">
                Create your referral code to start earning
              </p>
              <Button
                onClick={() => createCodeMutation.mutate()}
                disabled={createCodeMutation.isPending}
              >
                {createCodeMutation.isPending
                  ? "Creating..."
                  : "Create Referral Code"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Referrals
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscribers
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.activeSubscribers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(stats?.totalEarnings || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payout
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(stats?.pendingEarnings || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                1
              </div>
              <h3 className="mb-1 font-semibold">Share Your Link</h3>
              <p className="text-sm text-muted-foreground">
                Share your unique referral link with your audience
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                2
              </div>
              <h3 className="mb-1 font-semibold">They Subscribe</h3>
              <p className="text-sm text-muted-foreground">
                When someone signs up and subscribes to Pro or Unlimited
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                3
              </div>
              <h3 className="mb-1 font-semibold">You Earn 50%</h3>
              <p className="text-sm text-muted-foreground">
                Earn 50% of their payment every month — forever
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.recentPayments?.length ? (
            <div className="py-8 text-center text-muted-foreground">
              No commissions yet. Share your link to start earning!
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                >
                  <div>
                    <p className="font-medium">
                      ${payment.commission.toFixed(2)} commission
                    </p>
                    <p className="text-sm text-muted-foreground">
                      From ${payment.originalAmount.toFixed(2)} payment •{" "}
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={statusColors[payment.status]}>
                    {payment.status.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Commissions are paid out monthly once you reach a minimum balance of
            $50. Payouts are processed via PayPal or bank transfer. Contact
            support to set up your payout method.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
