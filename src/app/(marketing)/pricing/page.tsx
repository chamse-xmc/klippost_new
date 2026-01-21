"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    analyses: 3,
    tagline: "Test it out",
    plan: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    analyses: 30,
    tagline: "For consistent creators",
    popular: true,
    plan: "PRO" as const,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 29,
    analyses: -1,
    tagline: "Post every day",
    plan: "UNLIMITED" as const,
  },
];

const FEATURES = [
  "AI-powered video analysis",
  "Hook, body & ending scores",
  "View predictions",
  "Actionable suggestions",
  "All platforms supported",
];

const FAQ = [
  {
    question: "What counts as one analysis?",
    answer: "Each video you upload and analyze counts as one analysis. You can re-view past analyses without using additional credits.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time. You'll keep access until the end of your billing period.",
  },
  {
    question: "What video formats are supported?",
    answer: "We support MP4, MOV, AVI, and WebM formats up to 256MB. This covers most videos from TikTok, Instagram, and YouTube.",
  },
];

export default function PricingPage() {
  const { status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState(1); // Start with Pro selected
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const plan = PLANS[selectedPlan];

  const checkoutMutation = useMutation({
    mutationFn: async (planType: "PRO" | "UNLIMITED") => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planType }),
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

  const handleCheckout = () => {
    if (!plan.plan) {
      window.location.href = "/onboarding";
      return;
    }
    if (status !== "authenticated") {
      window.location.href = "/onboarding";
      return;
    }
    setLoadingPlan(plan.plan);
    checkoutMutation.mutate(plan.plan);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      {/* Grid pattern background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, .08) 1px, transparent 0), linear-gradient(180deg, rgba(0, 0, 0, .08) 1px, transparent 0)",
          backgroundSize: "80px 80px",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Pick your plan
            </h1>
            <p className="text-xl text-gray-600">
              Start free, no credit card needed.
            </p>
          </motion.div>

          {/* Plan selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-10"
          >
            <div className="relative bg-white rounded-full p-2 shadow-lg border border-gray-200">
              <div className="relative flex">
                {PLANS.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(i)}
                    className={`relative z-10 w-32 py-3 text-sm font-semibold text-center transition-colors duration-200 ${
                      selectedPlan === i ? "text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {selectedPlan === i && (
                      <motion.div
                        layoutId="pricing-pill-page"
                        className="absolute inset-0 bg-gray-900 rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{p.name}</span>
                    {p.popular && selectedPlan !== i && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main pricing card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Popular badge */}
              <AnimatePresence mode="wait">
                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-primary text-white text-center py-2 text-sm font-semibold"
                  >
                    Most Popular Choice
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-8 sm:p-10">
                {/* Price display - centered */}
                <div className="text-center mb-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-gray-500 text-sm font-medium mb-2">{plan.tagline}</p>
                      <div className="flex items-baseline justify-center gap-1 mb-3">
                        <span className="text-6xl sm:text-7xl font-black text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-xl text-gray-500">/mo</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-gray-700">
                          {plan.analyses === -1 ? "Unlimited" : plan.analyses} analyses/month
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Features - horizontal */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {FEATURES.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="rounded-full px-12 py-6 text-lg font-semibold"
                    onClick={handleCheckout}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {plan.price === 0 ? "Start Free" : "Get Started"}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Visual slider indicator */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-3">
                {PLANS.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(i)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      selectedPlan === i
                        ? "bg-primary scale-125"
                        : "bg-gray-300 group-hover:bg-gray-400"
                    }`} />
                    <span className={`text-xs font-medium transition-colors ${
                      selectedPlan === i ? "text-gray-900" : "text-gray-400"
                    }`}>
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20 max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {FAQ.map((item) => (
                <div key={item.question} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* CTA - Yellow Section */}
      <section
        className="py-20 px-4 sm:px-6 relative"
        style={{
          backgroundColor: 'rgb(255,241,0)',
          backgroundImage: 'linear-gradient(90deg, rgba(0, 0, 0, .12) 1px, transparent 0), linear-gradient(180deg, rgba(0, 0, 0, .12) 1px, transparent 0)',
          backgroundSize: '33.5vw 33.5vw',
          backgroundPosition: '50%',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Ready to create viral content?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Join thousands of creators using AI to level up their content.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg font-semibold bg-gray-900 hover:bg-gray-800">
              Start Free Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 sm:px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
              <span className="font-bold text-white">klippost</span>
            </div>
            <p>&copy; {new Date().getFullYear()} klippost. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
