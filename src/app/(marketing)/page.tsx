"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, TrendingUp, Target, Zap, Check, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Animated counter component
function Counter({ from, to, duration = 2000 }: { from: number; to: number; duration?: number }) {
  const [count, setCount] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const steps = 60;
          const increment = (to - from) / steps;
          let current = from;
          const timer = setInterval(() => {
            current += increment;
            if (current >= to) {
              setCount(to);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [from, to, duration, hasAnimated]);

  return <span ref={ref}>{count}</span>;
}

// Phone mockup with video analysis animation
function PhoneMockup() {
  const [phase, setPhase] = useState<"video" | "scanning" | "results" | "expanded">("video");
  const [score, setScore] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    // Animation sequence (runs once)
    const sequence = async () => {
      setPhase("video");
      setScore(0);
      await new Promise(r => setTimeout(r, 1500));
      setPhase("scanning");
      await new Promise(r => setTimeout(r, 2500));
      setPhase("results");
      // Animate score
      let current = 0;
      const target = 87;
      const timer = setInterval(() => {
        current += 2;
        if (current >= target) {
          setScore(target);
          clearInterval(timer);
        } else {
          setScore(current);
        }
      }, 30);
      await new Promise(r => setTimeout(r, 2000));
      // Expand ending section to show improvement tips
      setPhase("expanded");
    };

    sequence();
  }, [animKey]);

  const resetAnimation = () => {
    setAnimKey(k => k + 1);
  };

  return (
    <div className="relative">
      {/* Glow effect behind phone */}
      <div className="absolute -inset-8 bg-gradient-to-br from-primary/30 via-pink-500/20 to-purple-500/20 rounded-full blur-3xl" />

      {/* Reset button */}
      <button
        onClick={resetAnimation}
        className="absolute -right-2 -top-2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Replay animation"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Phone frame */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
        className="relative bg-gray-900 rounded-[40px] p-2 shadow-2xl"
      >
        <div className="bg-black rounded-[32px] overflow-hidden w-[85vw] max-w-[380px] sm:w-[280px]">
          <div className="relative aspect-[9/16]">
            {/* Video thumbnail - creator recording content */}
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=700&fit=crop&crop=face"
                alt="Creator recording video"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Scanning overlay */}
            <AnimatePresence>
              {phase === "scanning" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40"
                >
                  {/* Scan line */}
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-white"
                    style={{ boxShadow: "0 0 20px 8px rgba(255,255,255,0.6), 0 0 40px 16px rgba(255,255,255,0.3)" }}
                    initial={{ top: "0%" }}
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Corner brackets */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/70" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/70" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/70" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/70" />
                  {/* Analyzing text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-white text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        Analyzing...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results overlay */}
            <AnimatePresence>
              {(phase === "results" || phase === "expanded") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex flex-col justify-end p-4"
                >
                  {/* Score display - smaller when expanded */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: phase === "expanded" ? 0.85 : 1,
                      opacity: 1,
                    }}
                    transition={{ delay: phase === "results" ? 0.2 : 0, type: "spring" }}
                    className="bg-primary rounded-2xl p-4 mb-3"
                  >
                    <div className="text-center">
                      <div
                        className="font-extrabold text-white transition-all"
                        style={{
                          fontFamily: "var(--font-nunito)",
                          fontSize: phase === "expanded" ? "2.5rem" : "3rem",
                        }}
                      >
                        {score}
                      </div>
                      <div className="text-white/80 text-sm font-medium">Viral Potential 🎉</div>
                    </div>
                  </motion.div>

                  {/* Section scores */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: phase === "results" ? 0.4 : 0 }}
                    className="space-y-2"
                  >
                    {[
                      { label: "Hook", score: 92 },
                      { label: "Body", score: 85 },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: phase === "results" ? 0.5 + i * 0.1 : 0 }}
                        className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2"
                      >
                        <span className="text-white text-sm">{item.label}</span>
                        <span className="text-green-400 font-bold">{item.score}</span>
                      </motion.div>
                    ))}

                    {/* Ending - expandable */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{
                        x: 0,
                        opacity: 1,
                        height: phase === "expanded" ? "auto" : "auto",
                      }}
                      transition={{ delay: phase === "results" ? 0.7 : 0 }}
                      className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-white text-sm flex items-center gap-1.5">
                          Ending
                          {phase === "expanded" && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded"
                            >
                              Needs work
                            </motion.span>
                          )}
                        </span>
                        <span className="text-amber-400 font-bold">78</span>
                      </div>

                      {/* Expanded feedback */}
                      <AnimatePresence>
                        {phase === "expanded" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-white/10"
                          >
                            <div className="p-3 space-y-2.5">
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-white/70 text-[11px] leading-relaxed"
                              >
                                Video ends abruptly without a clear call-to-action. Viewers have no reason to follow or engage.
                              </motion.p>
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-start gap-2 bg-white/5 rounded-lg p-2"
                              >
                                <span className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0">1</span>
                                <span className="text-white/90 text-[11px]">End with a question to spark comments, e.g. "Which one would you pick?"</span>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play button (video phase) */}
            {phase === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Play className="h-7 w-7 text-white fill-white ml-1" />
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating feedback bubbles */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, type: "spring" }}
        className="absolute -left-4 lg:-left-20 top-[5%] bg-white rounded-2xl shadow-lg border border-gray-200 px-3 py-2 max-w-[180px] z-10"
      >
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3 h-3 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Strong Hook!</p>
            <p className="text-[11px] text-gray-600">First 2 seconds grab attention</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, type: "spring" }}
        className="absolute -right-4 lg:-right-24 top-[20%] bg-white rounded-2xl shadow-lg border border-gray-200 px-3 py-2 max-w-[180px] z-10"
      >
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3 h-3 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">500K-1M views</p>
            <p className="text-[11px] text-gray-600">Expected reach potential</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, type: "spring" }}
        className="absolute -left-4 lg:-left-16 top-[28%] bg-white rounded-2xl shadow-lg border border-gray-200 px-3 py-2 max-w-[180px] z-10"
      >
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Target className="w-3 h-3 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Tip</p>
            <p className="text-[11px] text-gray-600">Add CTA in last 3 seconds</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Interactive Pricing Section
const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    analyses: 3,
    tagline: "Test it out",
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    analyses: 30,
    tagline: "For consistent creators",
    popular: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 29,
    analyses: -1,
    tagline: "Post every day",
  },
];

const FEATURES = [
  "AI-powered video analysis",
  "Hook, body & ending scores",
  "View predictions",
  "Actionable suggestions",
  "All platforms supported",
];

function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState(1); // Start with Pro selected
  const plan = PLANS[selectedPlan];

  return (
    <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Pick your plan
          </h2>
          <p className="text-xl text-gray-600">
            Start free, no credit card needed.
          </p>
        </motion.div>

        {/* Plan selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
                      layoutId="pricing-pill"
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
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
                      <span className="text-6xl sm:text-7xl font-black text-gray-900" style={{ fontFamily: "var(--font-nunito)" }}>
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
                <Link href="/onboarding">
                  <Button size="lg" className="rounded-full px-12 py-6 text-lg font-semibold">
                    {plan.price === 0 ? "Start Free" : "Get Started"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
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
      </div>
    </section>
  );
}

// Animated Score Demo
function ScoreDemo() {
  const [phase, setPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          // Staggered animation
          setTimeout(() => setPhase(1), 300);
          setTimeout(() => setPhase(2), 800);
          setTimeout(() => setPhase(3), 1300);
          setTimeout(() => setPhase(4), 1800);
        }
      },
      { threshold: 0.5 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={containerRef} className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Every second <br />scored
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              We break down your video into three critical parts and score each one. No more guessing why videos flop.
            </p>
            <div className="space-y-4">
              {[
                { label: "Hook", desc: "First 3 seconds — do they stop scrolling?" },
                { label: "Body", desc: "Middle content — do they keep watching?" },
                { label: "Ending", desc: "Last moments — do they take action?" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{item.label}</p>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Phone with scores */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Phone */}
              <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-black rounded-[2.5rem] overflow-hidden w-[280px]">
                  <div className="relative aspect-[9/16]">
                    <img
                      src="https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=700&fit=crop&crop=face"
                      alt="Creator"
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay with scores */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
                      {/* Viral Score */}
                      <AnimatePresence>
                        {phase >= 1 && (
                          <motion.div
                            key="viral"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-primary rounded-2xl p-4 mb-4 text-center"
                          >
                            <p className="text-white/80 text-xs font-medium">Viral Score</p>
                            <p className="text-5xl font-black text-white">87</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Score bars */}
                      <div className="space-y-3">
                        <AnimatePresence>
                          {phase >= 2 && (
                            <motion.div
                              key="hook-bar"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between bg-white/10 backdrop-blur rounded-xl px-4 py-3"
                            >
                              <span className="text-white text-sm font-medium">Hook</span>
                              <span className="text-green-400 font-black text-lg">92</span>
                            </motion.div>
                          )}
                          {phase >= 3 && (
                            <motion.div
                              key="body-bar"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between bg-white/10 backdrop-blur rounded-xl px-4 py-3"
                            >
                              <span className="text-white text-sm font-medium">Body</span>
                              <span className="text-green-400 font-black text-lg">85</span>
                            </motion.div>
                          )}
                          {phase >= 4 && (
                            <motion.div
                              key="ending-bar"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between bg-white/10 backdrop-blur rounded-xl px-4 py-3"
                            >
                              <span className="text-white text-sm font-medium">Ending</span>
                              <span className="text-amber-400 font-black text-lg">68</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <AnimatePresence>
                {phase >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -right-4 -bottom-4 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="font-bold text-gray-900">100K-500K views</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// AI Coach Demo
function CoachDemo() {
  const [phase, setPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          setTimeout(() => setPhase(1), 400);
          setTimeout(() => setPhase(2), 1200);
          setTimeout(() => setPhase(3), 2000);
        }
      },
      { threshold: 0.5 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const suggestions = [
    {
      type: "critical",
      title: "Weak ending",
      text: "Your video cuts off without a CTA. Add a question like \"Which one should I try next?\" to spark comments.",
    },
    {
      type: "tip",
      title: "Hook improvement",
      text: "Add text overlay in the first second. Videos with on-screen text get 40% more watch time.",
    },
    {
      type: "good",
      title: "Great pacing",
      text: "Your cuts every 2-3 seconds keep attention. Keep this rhythm in future videos.",
    },
  ];

  return (
    <section
      ref={containerRef}
      className="py-24 px-4 sm:px-6 relative"
      style={{
        backgroundColor: 'rgb(255,241,0)',
        backgroundImage: 'linear-gradient(90deg, rgba(0, 0, 0, .12) 1px, transparent 0), linear-gradient(180deg, rgba(0, 0, 0, .12) 1px, transparent 0)',
        backgroundSize: '33.5vw 33.5vw',
        backgroundPosition: '50%',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Chat interface */}
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">AI Coach</p>
                  <p className="text-xs text-gray-500">Analyzing your video...</p>
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {suggestions.map((suggestion, i) => (
                    phase >= i + 1 && (
                      <motion.div
                        key={suggestion.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl p-4 ${
                          suggestion.type === "critical"
                            ? "bg-red-50 border-2 border-red-200"
                            : suggestion.type === "tip"
                            ? "bg-amber-50 border-2 border-amber-200"
                            : "bg-green-50 border-2 border-green-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                              suggestion.type === "critical"
                                ? "bg-red-500 text-white"
                                : suggestion.type === "tip"
                                ? "bg-amber-500 text-white"
                                : "bg-green-500 text-white"
                            }`}
                          >
                            {suggestion.type === "critical" ? "!" : suggestion.type === "tip" ? "?" : "✓"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{suggestion.title}</p>
                            <p className="text-gray-600 text-sm mt-1">{suggestion.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right - Text */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Your personal <br />AI coach
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Not just scores — actual feedback. The AI tells you exactly what's wrong and how to fix it. Like having a viral content expert review every video.
            </p>
            <div className="space-y-4">
              {[
                "Identifies weak spots instantly",
                "Gives specific, actionable fixes",
                "Learns what works for your niche",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <Check className="w-5 h-5 text-gray-900" />
                  <span className="text-gray-900 font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Testimonials data
const TESTIMONIALS = [
  {
    name: "Sarah",
    role: "TikTok, 2.4K followers",
    quote: "I was mass posting and getting like 200-300 views each. klippost told me my hooks were boring. Changed how I open my videos and now I'm hitting 5-10K consistently.",
    initials: "S",
  },
  {
    name: "Marcus",
    role: "YouTube Shorts, 800 subs",
    quote: "Been posting for 6 months with zero traction. The AI roasted my endings honestly. Added a proper CTA and my last video got 12K views. First time breaking 1K.",
    initials: "M",
  },
  {
    name: "Emma",
    role: "Instagram Reels",
    quote: "I used to just post and hope. Now I actually understand why some videos flop. It's not magic but it helps you stop making the same mistakes.",
    initials: "E",
  },
  {
    name: "Jake",
    role: "Fitness content, 5K",
    quote: "Thought my content was fine but I was losing people in the middle every time. The body analysis showed me exactly where. Small tweaks, big difference.",
    initials: "J",
  },
  {
    name: "Priya",
    role: "Starting out on TikTok",
    quote: "Only have 400 followers but my last 3 videos got way more views than before. The suggestions are actually useful, not generic advice.",
    initials: "P",
  },
];

// Testimonials Section
function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 bg-white overflow-hidden relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <Heart className="w-8 h-8 sm:w-9 sm:h-9 text-red-500" fill="currentColor" />'d by creators
          </h2>
        </div>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex-shrink-0 w-[320px] bg-white border-2 border-gray-100 rounded-3xl p-8"
            >
              {/* Author - at top */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-black">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-black text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>

              {/* Quote */}
              <p
                className="text-gray-700 text-lg leading-relaxed"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                "{testimonial.quote}"
              </p>
            </div>
          ))}
        </div>

        {/* Navigation buttons - centered below */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => scroll("left")}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 ease-out hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 ease-out hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3EE]">
      {/* Grid pattern background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, .08) 1px, transparent 0), linear-gradient(180deg, rgba(0, 0, 0, .08) 1px, transparent 0)",
          backgroundSize: "80px 80px",
          backgroundPosition: "center",
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - Text */}
            <div className="text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6"
              >
                Know if your video will go viral{" "}
                <span className="text-primary">before</span> you post.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl text-gray-600 max-w-xl mb-8 mx-auto lg:mx-0"
              >
                AI-powered analysis that scores your hook, body, and ending — then tells you exactly how to improve.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link href="/onboarding">
                  <Button size="lg" className="w-full sm:w-auto rounded-full px-8 py-6 text-lg font-semibold">
                    Analyze Your First Video Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right side - Phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <Link href="/onboarding" className="cursor-pointer">
                <PhoneMockup />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Yellow Section */}
      <section
        className="py-24 md:py-32 px-4 sm:px-6 relative"
        style={{
          backgroundColor: 'rgb(255,241,0)',
          backgroundImage: 'linear-gradient(90deg, rgba(0, 0, 0, .12) 1px, transparent 0), linear-gradient(180deg, rgba(0, 0, 0, .12) 1px, transparent 0)',
          backgroundSize: '33.5vw 33.5vw',
          backgroundPosition: '50%',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-4">
              How it works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                step: "01",
                title: "Upload your video",
                description: "Drop your TikTok, Reel, or Short into the analyzer. We support all major formats.",
              },
              {
                step: "02",
                title: "AI analyzes everything",
                description: "Our AI watches your video and scores hook, body, and ending. Takes seconds.",
              },
              {
                step: "03",
                title: "Get actionable feedback",
                description: "See your viral score, expected views, and specific tips to improve.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-8xl sm:text-9xl font-black mb-4 text-gray-900">{item.step}</div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-700 text-lg">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Score Demo */}
      <ScoreDemo />

      {/* AI Coach Demo */}
      <CoachDemo />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing Preview - Interactive */}
      <PricingSection />

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
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
            ].map((item, i) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
      <footer className="py-8 px-4 sm:px-6 border-t border-gray-200 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">klippost</span>
            </div>
            <p>&copy; {new Date().getFullYear()} klippost. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/pricing" className="hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
