"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Easing function for score animation
const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

// Animated score counter hook
function useAnimatedScore(targetScore: number, duration: number = 2000) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (targetScore === 0) {
      setDisplayScore(0);
      return;
    }

    setIsAnimating(true);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentScore = Math.round(targetScore * easedProgress);
      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [targetScore, duration]);

  return { displayScore, isAnimating };
}

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

function ScoreDisplay({ score, onCelebrate }: { score: number; onCelebrate?: () => void }) {
  const { displayScore, isAnimating } = useAnimatedScore(score, 2000);
  const isExcellent = score >= 80;
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showBounce, setShowBounce] = useState(false);

  useEffect(() => {
    if (!isAnimating && isExcellent && !hasCelebrated) {
      setHasCelebrated(true);
      setShowBounce(true);
      onCelebrate?.();
    }
  }, [isAnimating, isExcellent, hasCelebrated, onCelebrate]);

  const getScoreInfo = (s: number) => {
    if (s >= 80) return { label: "Viral Potential", message: "This video could blow up!" };
    if (s >= 60) return { label: "Good", message: "Solid content with room to grow" };
    if (s >= 40) return { label: "Average", message: "Some tweaks could boost performance" };
    return { label: "Needs Work", message: "Check the suggestions below to improve" };
  };

  return (
    <div className="text-center relative">
      <div
        className={cn(
          "text-8xl font-extrabold text-white mb-2 relative",
          showBounce && "animate-celebrate-bounce"
        )}
        style={{ fontFamily: "var(--font-nunito)", fontVariantNumeric: "tabular-nums" }}
      >
        {displayScore}
      </div>
      <div className="text-white text-lg font-semibold">
        {getScoreInfo(displayScore).label}
        {isExcellent && " 🎉"}
      </div>
      <div className="text-white/70 text-sm mt-1">
        {getScoreInfo(displayScore).message}
      </div>
      <div className="mt-4 flex justify-center">
        <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{
              width: `${displayScore}%`,
              transition: "width 0.1s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface GoalAdvice {
  goal: string;
  advice: string;
  actionItems: string[];
}

interface RetentionDropoff {
  timestamp: number;
  reason: string;
}

interface Suggestion {
  id: string;
  title: string;
  suggestion?: string;
  description?: string;
  priority: string;
  category: string;
  timestamp?: number | null;
}

interface AnalysisData {
  id: string;
  viralScore: number;
  hookScore: number;
  bodyScore: number;
  endingScore: number;
  viewsMin?: number;
  viewsMax?: number;
  summary?: string;
  hookFeedback?: string;
  bodyFeedback?: string;
  endingFeedback?: string;
  transcript?: string;
  goalAdvice?: GoalAdvice[];
  createdAt: string;
  video: {
    id: string;
    title: string | null;
    fileName: string;
    platform: string;
    thumbnailUrl: string | null;
    createdAt: string;
  };
  suggestions: Suggestion[];

  // Hook analysis
  hookType?: string;

  // Retention
  retentionScore?: number;
  retentionDropoffs?: RetentionDropoff[];

  // CTA
  ctaType?: string;
  ctaStrength?: number;
  ctaFeedback?: string;

  // Trends
  trendScore?: number;
  trendMatches?: string[];
  trendSuggestions?: string[];

  // Engagement predictions
  estimatedLikesMin?: number;
  estimatedLikesMax?: number;
  estimatedCommentsMin?: number;
  estimatedCommentsMax?: number;
  estimatedSharesMin?: number;
  estimatedSharesMax?: number;

  // Technical quality
  audioScore?: number;
  visualScore?: number;
  audioFeedback?: string;
  visualFeedback?: string;

  // Brand value
  brandValue?: number;
}

// Priority badge colors
const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30" },
  HIGH: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
  MEDIUM: { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/30" },
  LOW: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/30" },
};

// Category icons and labels
const categoryConfig: Record<string, { icon: string; label: string; color: string }> = {
  HOOK: { icon: "🎣", label: "Hook", color: "text-purple-400" },
  AUDIO: { icon: "🎵", label: "Audio", color: "text-blue-400" },
  VISUAL: { icon: "🎨", label: "Visual", color: "text-pink-400" },
  PACING: { icon: "⚡", label: "Pacing", color: "text-yellow-400" },
  CONTENT: { icon: "📝", label: "Content", color: "text-green-400" },
  TEXT: { icon: "💬", label: "Text", color: "text-cyan-400" },
  CTA: { icon: "👆", label: "CTA", color: "text-orange-400" },
  TRENDING: { icon: "📈", label: "Trending", color: "text-red-400" },
};

// Hook type labels
const hookTypeLabels: Record<string, { label: string; description: string }> = {
  CURIOSITY_GAP: { label: "Curiosity Gap", description: "Makes viewers need to know more" },
  PATTERN_INTERRUPT: { label: "Pattern Interrupt", description: "Unexpected element grabs attention" },
  SHOCK_VALUE: { label: "Shock Value", description: "Surprising or controversial opening" },
  EMOTIONAL: { label: "Emotional", description: "Triggers strong feeling immediately" },
  QUESTION: { label: "Question", description: "Poses a compelling question" },
};

// CTA type labels
const ctaTypeLabels: Record<string, string> = {
  FOLLOW: "Follow CTA",
  COMMENT: "Comment CTA",
  SHARE: "Share CTA",
  LINK: "Link CTA",
  NONE: "No CTA",
};

// Format timestamp as "at X:XX"
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `at ${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);

  const { data: analysis, isLoading, error } = useQuery<AnalysisData>({
    queryKey: ["analysis", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Analysis not found");
        throw new Error("Failed to fetch analysis");
      }
      return res.json();
    },
  });

  const triggerCelebration = useCallback(() => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3500);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Analysis not found</p>
        <button
          onClick={() => router.push("/app")}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConfettiCelebration show={showCelebration} />

      {/* Back button */}
      <button
        onClick={() => router.push("/app")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Video info */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
        {analysis.video.thumbnailUrl ? (
          <img
            src={analysis.video.thumbnailUrl}
            alt=""
            className="w-16 h-24 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-24 rounded-lg bg-muted flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {analysis.video.title || analysis.video.fileName}
          </p>
          <p className="text-sm text-muted-foreground">
            {analysis.video.platform.replace("_", " ")} • {new Date(analysis.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Score Card */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: analysis.viralScore >= 80
            ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
            : analysis.viralScore >= 60
            ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
            : analysis.viralScore >= 40
            ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div className="relative p-8">
          <ScoreDisplay score={analysis.viralScore} onCelebrate={triggerCelebration} />
          <div className="mt-6 text-center">
            <span className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white font-medium">
              {(analysis.viewsMin ?? 0).toLocaleString()} - {(analysis.viewsMax ?? 0).toLocaleString()} expected views
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="rounded-2xl bg-card border border-border p-6">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Summary</h4>
          <p className="text-foreground leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Section Breakdown */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</h4>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Hook", desc: "First 3 seconds", score: analysis.hookScore, feedback: analysis.hookFeedback },
            { label: "Body", desc: "Main content", score: analysis.bodyScore, feedback: analysis.bodyFeedback },
            { label: "Ending", desc: "Call to action", score: analysis.endingScore, feedback: analysis.endingFeedback },
          ].map(({ label, desc, score, feedback }, idx) => (
            <div key={label} className="flex items-stretch animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex-1 p-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
                {feedback && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{feedback}</p>
                )}
              </div>
              <div className="w-20 flex items-center justify-center bg-muted/50">
                <span
                  className="text-3xl font-black text-foreground"
                  style={{ fontFamily: "var(--font-nunito)" }}
                >
                  {score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal advice */}
      {analysis.goalAdvice && analysis.goalAdvice.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Based on Your Goals</h4>
          </div>
          <div className="p-4 space-y-3">
            {analysis.goalAdvice.map((ga, i) => (
              <div key={i} className="p-4 rounded-xl bg-muted">
                <span className="font-semibold text-foreground">{ga.goal}</span>
                <p className="text-sm text-muted-foreground mt-1 mb-2">{ga.advice}</p>
                {ga.actionItems?.length > 0 && (
                  <ul className="space-y-1">
                    {ga.actionItems.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retention */}
      {analysis.retentionScore != null && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Retention</h4>
          </div>
          <div className="flex items-stretch">
            <div className="flex-1 p-3 sm:p-4">
              {analysis.retentionDropoffs && analysis.retentionDropoffs.length > 0 ? (
                <div className="space-y-1.5">
                  {analysis.retentionDropoffs.map((dropoff, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs shrink-0">
                        {formatTimestamp(dropoff.timestamp)}
                      </span>
                      <span className="text-muted-foreground">{dropoff.reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">No significant drop-off points detected</p>
              )}
            </div>
            <div className="w-16 sm:w-20 flex items-center justify-center bg-muted/50">
              <span className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
                {analysis.retentionScore}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CTA Analysis */}
      {analysis.ctaStrength != null && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Call to Action</h4>
          </div>
          <div className="flex items-stretch">
            <div className="flex-1 p-3 sm:p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {ctaTypeLabels[analysis.ctaType || "NONE"] || analysis.ctaType || "None"}
                </span>
              </div>
              {analysis.ctaFeedback && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">{analysis.ctaFeedback}</p>
              )}
            </div>
            <div className="w-16 sm:w-20 flex items-center justify-center bg-muted/50">
              <span className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
                {analysis.ctaStrength}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Quality */}
      {(analysis.audioScore != null || analysis.visualScore != null) && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Technical Quality</h4>
          </div>
          <div className="divide-y divide-border">
            {analysis.audioScore != null && (
              <div className="flex items-stretch">
                <div className="flex-1 p-3 sm:p-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm sm:text-base">Audio</span>
                  </div>
                  {analysis.audioFeedback && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">{analysis.audioFeedback}</p>
                  )}
                </div>
                <div className="w-16 sm:w-20 flex items-center justify-center bg-muted/50">
                  <span className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
                    {analysis.audioScore}
                  </span>
                </div>
              </div>
            )}
            {analysis.visualScore != null && (
              <div className="flex items-stretch">
                <div className="flex-1 p-3 sm:p-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm sm:text-base">Visual</span>
                  </div>
                  {analysis.visualFeedback && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">{analysis.visualFeedback}</p>
                  )}
                </div>
                <div className="w-16 sm:w-20 flex items-center justify-center bg-muted/50">
                  <span className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
                    {analysis.visualScore}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brand Value */}
      {analysis.brandValue != null && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4">
          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Estimated Brand Value</h4>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400" style={{ fontFamily: "var(--font-nunito)" }}>
              ${analysis.brandValue}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">per sponsored post</span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggestions</h4>
          </div>
          <div className="p-4 space-y-2">
            {analysis.suggestions.map((s, i) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted">
                <span className="w-6 h-6 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground">{s.suggestion || s.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back to dashboard */}
      <button
        onClick={() => router.push("/app")}
        className="w-full py-4 px-6 rounded-xl font-semibold text-primary-foreground bg-primary hover:opacity-90 transition-all"
      >
        Analyze Another Video
      </button>
    </div>
  );
}
