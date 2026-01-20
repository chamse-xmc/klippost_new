"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "3 video analyses per month",
      "Basic viral score",
      "Hook, body & ending scores",
      "AI-generated suggestions",
    ],
    limitations: ["Limited to 3 analyses/month"],
    cta: "Get Started",
    popular: false,
    plan: null,
  },
  {
    name: "Pro",
    price: 9,
    description: "For serious content creators",
    features: [
      "30 video analyses per month",
      "All analysis modes (Viral, UGC, TikTok Shop)",
      "Priority processing",
      "Detailed feedback & suggestions",
      "Expected views predictions",
      "Progress tracking",
    ],
    limitations: [],
    cta: "Upgrade to Pro",
    popular: true,
    plan: "PRO" as const,
  },
  {
    name: "Unlimited",
    price: 29,
    description: "For agencies & power users",
    features: [
      "Unlimited video analyses",
      "All Pro features",
      "API access (coming soon)",
      "Priority support",
      "Early access to new features",
    ],
    limitations: [],
    cta: "Go Unlimited",
    popular: false,
    plan: "UNLIMITED" as const,
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: async (plan: "PRO" | "UNLIMITED") => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout session");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setLoadingPlan(null);
    },
  });

  const handleCheckout = (plan: "PRO" | "UNLIMITED") => {
    if (status !== "authenticated") {
      // Redirect to onboarding/sign up
      window.location.href = "/onboarding";
      return;
    }
    setLoadingPlan(plan);
    checkoutMutation.mutate(plan);
  };

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold">Simple, Transparent Pricing</h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Choose the plan that fits your content creation needs. All plans
            include AI-powered analysis.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative flex flex-col",
                plan.popular && "border-primary shadow-lg"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary px-3 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li
                      key={limitation}
                      className="flex items-start gap-2 text-muted-foreground"
                    >
                      <span className="mt-0.5 h-4 w-4 shrink-0 text-center">
                        •
                      </span>
                      <span className="text-sm">{limitation}</span>
                    </li>
                  ))}
                </ul>
                {plan.plan ? (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    disabled={loadingPlan === plan.plan}
                    onClick={() => handleCheckout(plan.plan!)}
                  >
                    {loadingPlan === plan.plan ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                ) : (
                  <Link href="/onboarding">
                    <Button className="w-full" variant="outline">
                      {plan.cta}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Affiliate Program CTA */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold">
            Earn 50% Lifetime Commission
          </h2>
          <p className="mb-6 text-muted-foreground">
            Share Unnamed with your audience and earn 50% of every payment from
            users you refer — for life.
          </p>
          <Link href={session ? "/affiliate" : "/onboarding"}>
            <Button variant="outline" size="lg">
              Join Affiliate Program
            </Button>
          </Link>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">
                What counts as one analysis?
              </h3>
              <p className="text-muted-foreground">
                Each video you upload and analyze counts as one analysis. You can
                re-view past analyses without using additional credits.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can cancel your subscription at any time. You'll keep
                access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">
                What video formats are supported?
              </h3>
              <p className="text-muted-foreground">
                We support MP4, MOV, AVI, and WebM formats up to 256MB. This
                covers most videos from TikTok, Instagram, and YouTube.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">
                How does the affiliate program work?
              </h3>
              <p className="text-muted-foreground">
                Share your unique referral link. When someone signs up and
                subscribes, you earn 50% of their payment every month they stay
                subscribed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
