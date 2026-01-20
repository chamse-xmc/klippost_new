"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Easing functions
const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Animated score counter hook with smooth easing
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
    const startScore = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use exponential ease out for smooth deceleration
      const easedProgress = easeOutExpo(progress);

      const currentScore = Math.round(startScore + (targetScore - startScore) * easedProgress);
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

  // Random values for each piece - using useMemo pattern with index as seed
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

// Full screen confetti celebration
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

// Simple score display component
function ScoreDisplay({ score, onCelebrate }: { score: number; onCelebrate?: () => void }) {
  const { displayScore, isAnimating } = useAnimatedScore(score, 2000);
  const isExcellent = score >= 80;
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showBounce, setShowBounce] = useState(false);

  // Trigger celebration after animation completes for high scores
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
import { cn } from "@/lib/utils";
import type { Platform, AnalysisMode } from "@prisma/client";

// Analysis phases for the loading animation
const ANALYSIS_PHASES = [
  { text: "Uploading video..." },
  { text: "Extracting frames..." },
  { text: "Analyzing hook..." },
  { text: "Breaking down body..." },
  { text: "Evaluating ending..." },
  { text: "Calculating viral potential..." },
  { text: "Generating suggestions..." },
  { text: "Almost there..." },
];

const platforms: { value: Platform; label: string }[] = [
  { value: "TIKTOK", label: "TikTok" },
  { value: "INSTAGRAM_REELS", label: "Reels" },
  { value: "YOUTUBE_SHORTS", label: "Shorts" },
];

const modes: { value: AnalysisMode; label: string; description: string }[] = [
  { value: "VIRAL", label: "Viral", description: "Max reach" },
  { value: "UGC", label: "UGC", description: "Brand content" },
  { value: "TIKTOK_SHOP", label: "Shop", description: "Sell products" },
];

interface GoalAdvice {
  goal: string;
  advice: string;
  actionItems: string[];
}

interface VideoData {
  id: string;
  title: string | null;
  fileName: string;
  platform: string;
  thumbnailUrl: string | null;
  createdAt: string;
  analysis: {
    id: string;
    viralScore: number;
    hookScore: number;
    bodyScore: number;
    endingScore: number;
    expectedViewsMin?: number;
    expectedViewsMax?: number;
    viewsMin?: number;
    viewsMax?: number;
    summary?: string;
    hookFeedback?: string;
    bodyFeedback?: string;
    endingFeedback?: string;
    goalAdvice?: GoalAdvice[];
    suggestions?: { id: string; suggestion?: string; description?: string; priority: number | string }[];
  } | null;
}

interface AnalysisResult {
  analysis: VideoData["analysis"];
  video: VideoData;
}

// Mock videos for testing score colors
const MOCK_VIDEOS: VideoData[] = [
  {
    id: "mock-1",
    title: "Excellent Hook Example",
    fileName: "viral_dance_video.mp4",
    platform: "TIKTOK",
    thumbnailUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    analysis: {
      id: "analysis-1",
      viralScore: 92,
      hookScore: 95,
      bodyScore: 88,
      endingScore: 90,
      viewsMin: 500000,
      viewsMax: 1200000,
      summary: "Exceptional content with viral potential. Strong hook that immediately captures attention.",
      hookFeedback: "The first 2 seconds are incredibly engaging - the unexpected visual immediately grabs attention.",
      bodyFeedback: "Content maintains momentum well with good pacing and valuable information throughout.",
      endingFeedback: "Strong call-to-action that encourages engagement and follows.",
      suggestions: [],
    },
  },
  {
    id: "mock-2",
    title: "Good Performance Video",
    fileName: "cooking_tutorial.mp4",
    platform: "INSTAGRAM_REELS",
    thumbnailUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    analysis: {
      id: "analysis-2",
      viralScore: 74,
      hookScore: 78,
      bodyScore: 72,
      endingScore: 68,
      viewsMin: 50000,
      viewsMax: 150000,
      summary: "Solid content with good engagement potential. Some room for improvement in the ending.",
      hookFeedback: "Good opening that establishes the topic quickly, but could be more visually striking.",
      bodyFeedback: "Clear explanations and good pacing. Consider adding more visual variety.",
      endingFeedback: "The ending feels slightly abrupt. Add a stronger CTA to boost engagement.",
      suggestions: [],
    },
  },
  {
    id: "mock-3",
    title: "Average Content Example",
    fileName: "product_review.mp4",
    platform: "YOUTUBE_SHORTS",
    thumbnailUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    analysis: {
      id: "analysis-3",
      viralScore: 52,
      hookScore: 45,
      bodyScore: 58,
      endingScore: 55,
      viewsMin: 5000,
      viewsMax: 20000,
      summary: "Content has potential but needs work on the hook to improve viewer retention.",
      hookFeedback: "The opening is too slow. Viewers may scroll away before the value is apparent.",
      bodyFeedback: "Good information but delivery could be more dynamic. Try varying your energy.",
      endingFeedback: "Decent wrap-up but missing a compelling reason for viewers to engage.",
      suggestions: [],
    },
  },
  {
    id: "mock-4",
    title: "Needs Improvement",
    fileName: "random_vlog.mp4",
    platform: "TIKTOK",
    thumbnailUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    analysis: {
      id: "analysis-4",
      viralScore: 28,
      hookScore: 22,
      bodyScore: 35,
      endingScore: 30,
      viewsMin: 500,
      viewsMax: 2000,
      summary: "Significant improvements needed. Focus on creating a stronger hook and clearer value proposition.",
      hookFeedback: "No clear hook - the video starts without grabbing attention. This is critical to fix.",
      bodyFeedback: "Content lacks focus and clear direction. Define your main message before filming.",
      endingFeedback: "No call-to-action or reason for viewers to engage further.",
      suggestions: [],
    },
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("TIKTOK");
  const [mode, setMode] = useState<AnalysisMode>("VIRAL");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedData, setUploadedData] = useState<{ url: string; fileName: string; fileSize: number; thumbnailUrl: string | null } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLockedResults, setShowLockedResults] = useState(false);

  const { data: videosData, isLoading: videosLoading } = useQuery<{ videos: VideoData[] }>({
    queryKey: ["videos"],
    queryFn: async () => {
      const res = await fetch("/api/videos?limit=20");
      if (!res.ok) throw new Error("Failed to fetch videos");
      return res.json();
    },
  });

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }
    if (file.size > 256 * 1024 * 1024) {
      alert("File too large. Max 256MB");
      return;
    }

    setSelectedFile(file);
    setAnalysisResult(null);
    setUploadedData(null);
    setIsUploading(true);
    setUploadProgress(0);

    const localPreviewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(localPreviewUrl);

    try {
      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 500);

      // Upload video
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url, fileName, fileSize } = await uploadRes.json();
      setUploadProgress(95);

      // Extract and upload thumbnail
      let thumbnailUrl: string | null = null;
      const thumbnailDataUrl = await extractThumbnailFromUrl(localPreviewUrl);
      if (thumbnailDataUrl) {
        const thumbRes = await uploadThumbnailImage(thumbnailDataUrl);
        if (thumbRes) thumbnailUrl = thumbRes;
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Small delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 300));

      setUploadedData({ url, fileName, fileSize, thumbnailUrl });
      setIsUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload video");
      clearSelection();
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const clearSelection = () => {
    setSelectedFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setAnalysisResult(null);
    setUploadedData(null);
    setIsUploading(false);
    setUploadProgress(0);
    setShowLockedResults(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Extract thumbnail from video
  const extractThumbnailFromUrl = useCallback(async (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = videoUrl;
      video.muted = true;
      video.currentTime = 0.5; // Get frame at 0.5 seconds

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            resolve(dataUrl);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      video.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 5000); // Timeout after 5 seconds
    });
  }, []);

  // Upload thumbnail to S3
  const uploadThumbnailImage = useCallback(async (dataUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "thumbnail");

      const uploadRes = await fetch("/api/upload/thumbnail", { method: "POST", body: formData });
      if (!uploadRes.ok) return null;

      const { url } = await uploadRes.json();
      return url;
    } catch {
      return null;
    }
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!uploadedData) throw new Error("No video uploaded");

      // Create video record
      const videoRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: uploadedData.url,
          fileName: uploadedData.fileName,
          fileSize: uploadedData.fileSize,
          platform,
          thumbnailUrl: uploadedData.thumbnailUrl,
        }),
      });
      if (!videoRes.ok) throw new Error((await videoRes.json()).error || "Failed to create video");

      const { video } = await videoRes.json();

      // Run analysis
      const analysisRes = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id, mode }),
      });
      if (!analysisRes.ok) throw new Error((await analysisRes.json()).error || "Analysis failed");

      return analysisRes.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      if (data.analysis?.viralScore >= 80) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    },
  });

  // Stripe checkout mutation
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const handleUpgrade = async (plan: "PRO" | "UNLIMITED") => {
    setIsCheckingOut(true);
    try {
      // Save pending analysis data to localStorage before redirecting
      if (uploadedData) {
        localStorage.setItem("pendingAnalysis", JSON.stringify({
          uploadedData,
          platform,
          mode,
          videoPreviewUrl,
          fileName: selectedFile?.name,
        }));
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, returnUrl: "/dashboard?upgraded=true" }),
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
      alert(error instanceof Error ? error.message : "Failed to start checkout");
      setIsCheckingOut(false);
    }
  };

  // Check for successful upgrade and retry analysis
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      // Clear the URL param
      window.history.replaceState({}, "", "/dashboard");

      // Check for pending analysis
      const pendingData = localStorage.getItem("pendingAnalysis");
      if (pendingData) {
        try {
          const { uploadedData: savedUpload, platform: savedPlatform, mode: savedMode, videoPreviewUrl: savedPreview, fileName } = JSON.parse(pendingData);
          localStorage.removeItem("pendingAnalysis");

          // Restore state and trigger analysis
          setUploadedData(savedUpload);
          setPlatform(savedPlatform);
          setMode(savedMode);
          setVideoPreviewUrl(savedPreview);
          setSelectedFile({ name: fileName } as File);

          // Auto-trigger analysis after a short delay
          setTimeout(() => {
            setIsAnalyzing(true);
            setAnalysisPhase(0);

            let currentPhase = 0;
            const phaseInterval = setInterval(() => {
              currentPhase++;
              if (currentPhase < ANALYSIS_PHASES.length) setAnalysisPhase(currentPhase);
            }, 2000);

            analyzeMutation.mutateAsync().then(() => {
              clearInterval(phaseInterval);
              setIsAnalyzing(false);
            }).catch((error) => {
              clearInterval(phaseInterval);
              setIsAnalyzing(false);
              alert(error instanceof Error ? error.message : "Analysis failed");
            });
          }, 500);
        } catch (e) {
          console.error("Failed to restore pending analysis:", e);
        }
      }
    }
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisPhase(0);

    let currentPhase = 0;
    const phaseInterval = setInterval(() => {
      currentPhase++;
      if (currentPhase < ANALYSIS_PHASES.length) setAnalysisPhase(currentPhase);
    }, 2000);

    try {
      await analyzeMutation.mutateAsync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Analysis failed";
      // Check if it's a limit error - show locked results instead of alert
      if (errorMessage.toLowerCase().includes("limit")) {
        setShowLockedResults(true);
      } else {
        alert(errorMessage);
      }
    } finally {
      clearInterval(phaseInterval);
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-amber-500";
    return "text-yellow-500";
  };

  const triggerCelebration = useCallback(() => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3500);
  }, []);

  // Calculate user's overall score from real video history only (not mock data)
  const realVideos = videosData?.videos || [];
  const videosWithScores = realVideos.filter(v => v.analysis?.viralScore);
  const overallScore = videosWithScores.length > 0
    ? Math.round(videosWithScores.reduce((sum, v) => sum + (v.analysis?.viralScore || 0), 0) / videosWithScores.length)
    : 0;

  const getCreatorTitle = (score: number) => {
    if (score >= 90) return { title: "Viral Legend", emoji: "👑" };
    if (score >= 80) return { title: "Trendsetter", emoji: "🔥" };
    if (score >= 70) return { title: "Rising Star", emoji: "⭐" };
    if (score >= 60) return { title: "Content Creator", emoji: "🎬" };
    if (score >= 50) return { title: "Apprentice", emoji: "📈" };
    if (score >= 40) return { title: "Beginner", emoji: "🌱" };
    return { title: "Newbie", emoji: "👋" };
  };

  const creatorInfo = getCreatorTitle(overallScore);

  return (
    <div className="space-y-6">
      {/* Full screen confetti celebration */}
      <ConfettiCelebration show={showCelebration} />

      {/* Creator Rank Badge */}
      {!selectedFile && (
        <div className="flex justify-center py-4">
          <div className="relative group">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"
              style={{
                background: overallScore >= 80
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : overallScore >= 60
                  ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                  : overallScore >= 40
                  ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                  : 'linear-gradient(135deg, #6b7280, #9ca3af)',
              }}
            />

            {/* Main badge container */}
            <div className="relative flex items-center gap-4 px-6 py-4 rounded-2xl bg-card border border-border backdrop-blur-sm">
              {/* Score circle */}
              <div className="relative">
                {/* Progress ring SVG */}
                <svg className="w-20 h-20 rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted/30"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${overallScore * 2.64} 264`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      {overallScore >= 80 ? (
                        <>
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </>
                      ) : overallScore >= 60 ? (
                        <>
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </>
                      ) : overallScore >= 40 ? (
                        <>
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="#6b7280" />
                          <stop offset="100%" stopColor="#9ca3af" />
                        </>
                      )}
                    </linearGradient>
                  </defs>
                </svg>

                {/* Score number in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-3xl font-black text-foreground"
                    style={{ fontFamily: "var(--font-nunito)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {overallScore}
                  </span>
                </div>
              </div>

              {/* Title and label */}
              <div className="flex flex-col">
                <span
                  className="text-lg font-bold text-foreground tracking-tight"
                  style={{ fontFamily: "var(--font-nunito)" }}
                >
                  {creatorInfo.title}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  avg viral score
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!selectedFile ? (
        <div
          className={cn(
            "relative group rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden",
            dragActive
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 bg-card"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <div className="relative flex flex-col items-center justify-center py-12 px-4">
            <div className={cn(
              "mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
              dragActive
                ? "bg-primary scale-110"
                : "bg-muted group-hover:bg-primary group-hover:scale-105"
            )}>
              <svg className={cn(
                "w-8 h-8 transition-colors duration-300",
                dragActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground group-hover:text-primary-foreground"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Drop your video</h3>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <p className="text-xs text-muted-foreground/60 mt-3">MP4, MOV, WebM • Max 256MB</p>
          </div>
        </div>
      ) : isUploading ? (
        // Uploading state
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-10 text-center">
            {/* Animated upload icon */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1">Uploading...</h3>
            <p className="text-sm text-muted-foreground mb-8 truncate max-w-[250px] mx-auto">{selectedFile?.name}</p>

            {/* Progress bar */}
            <div className="max-w-sm mx-auto">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Progress</span>
                <span className="font-mono">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            {/* Cancel button */}
            <button
              onClick={clearSelection}
              className="mt-8 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : isAnalyzing ? (
        // Analyzing state with scanning effect
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-6">
            {/* Video with scanning effect */}
            {videoPreviewUrl && (
              <div className="relative mx-auto max-w-xs rounded-xl overflow-hidden bg-black mb-6">
                <video src={videoPreviewUrl} className="w-full aspect-[9/16] object-cover" muted />
                {/* Scanning line */}
                <div
                  className="absolute left-0 right-0 h-1 bg-primary animate-scan"
                  style={{ boxShadow: "0 0 20px 8px var(--primary), 0 0 40px 16px var(--primary)" }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10" />
                {/* Corner brackets */}
                <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-primary" />
                <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-primary" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-primary" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-primary" />
              </div>
            )}

            {/* Status text */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-2">Analyzing your video</h3>
              <p className="text-muted-foreground text-sm mb-4">{ANALYSIS_PHASES[analysisPhase]?.text}</p>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5">
                {ANALYSIS_PHASES.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i <= analysisPhase ? "bg-primary" : "bg-border"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : analysisResult?.analysis ? (
        // Results
        <div className="space-y-4 animate-slide-up">
          {/* Score Card - Gradient based on score */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: analysisResult.analysis.viralScore >= 80
                ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                : analysisResult.analysis.viralScore >= 60
                ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
                : analysisResult.analysis.viralScore >= 40
                ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            }}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />

            <div className="relative p-8">
              <ScoreDisplay score={analysisResult.analysis.viralScore} onCelebrate={triggerCelebration} />
              <div className="mt-6 text-center">
                <span className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white font-medium">
                  {(analysisResult.analysis.expectedViewsMin ?? analysisResult.analysis.viewsMin ?? 0).toLocaleString()} - {(analysisResult.analysis.expectedViewsMax ?? analysisResult.analysis.viewsMax ?? 0).toLocaleString()} expected views
                </span>
              </div>
            </div>
          </div>

          {/* Overall Summary */}
          {analysisResult.analysis.summary && (
            <div className="rounded-2xl bg-card border border-border p-6">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Summary</h4>
              <p className="text-foreground leading-relaxed">{analysisResult.analysis.summary}</p>
            </div>
          )}

          {/* Section Breakdown */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</h4>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: "Hook", desc: "First 3 seconds", score: analysisResult.analysis.hookScore, feedback: analysisResult.analysis.hookFeedback },
                { label: "Body", desc: "Main content", score: analysisResult.analysis.bodyScore, feedback: analysisResult.analysis.bodyFeedback },
                { label: "Ending", desc: "Call to action", score: analysisResult.analysis.endingScore, feedback: analysisResult.analysis.endingFeedback },
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
          {analysisResult.analysis.goalAdvice && analysisResult.analysis.goalAdvice.length > 0 && (
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Based on Your Goals</h4>
              </div>
              <div className="p-4 space-y-3">
                {analysisResult.analysis.goalAdvice.map((ga, i) => (
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

          {/* Suggestions */}
          {analysisResult.analysis.suggestions && analysisResult.analysis.suggestions.length > 0 && (
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Wins</h4>
              </div>
              <div className="p-4 space-y-2">
                {analysisResult.analysis.suggestions.map((s, i) => (
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

          {/* Actions */}
          <button
            onClick={clearSelection}
            className="w-full py-4 px-6 rounded-xl font-semibold text-primary-foreground bg-primary hover:opacity-90 transition-all"
          >
            Analyze Another Video
          </button>
        </div>
      ) : showLockedResults ? (
        // Locked results - blurred with upgrade prompt
        <div className="space-y-4 animate-slide-up">
          {/* Blurred Score Card */}
          <div className="relative">
            {/* The blurred results */}
            <div className="blur-md pointer-events-none select-none">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}
              >
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
                <div className="relative p-8">
                  <div className="text-center">
                    <div className="text-8xl font-extrabold text-white mb-2" style={{ fontFamily: "var(--font-nunito)" }}>
                      72
                    </div>
                    <div className="text-white text-lg font-semibold">Good</div>
                    <div className="text-white/70 text-sm mt-1">Solid content with room to grow</div>
                    <div className="mt-4 flex justify-center">
                      <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full w-[72%]" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <span className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white font-medium">
                      45,000 - 120,000 expected views
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Blurred Breakdown */}
          <div className="relative">
            <div className="blur-md pointer-events-none select-none">
              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</h4>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { label: "Hook", score: 78 },
                    { label: "Body", score: 68 },
                    { label: "Ending", score: 71 },
                  ].map(({ label, score }) => (
                    <div key={label} className="flex items-center p-4">
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">{label}</span>
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-2xl font-black text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
                          {score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Card */}
          <div className="rounded-2xl bg-card border-2 border-primary p-6 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Analysis Complete</h3>
              <p className="text-muted-foreground text-sm">
                You've hit your free limit. Upgrade to see your results.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleUpgrade("PRO")}
                disabled={isCheckingOut}
                className="w-full py-4 px-6 rounded-xl font-bold text-primary-foreground bg-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                className="w-full py-3 px-6 rounded-xl font-semibold text-foreground bg-muted hover:bg-muted/80 transition-all disabled:opacity-50"
              >
                Go Unlimited — $29/mo
              </button>
              <button
                onClick={() => {
                  setShowLockedResults(false);
                  clearSelection();
                }}
                disabled={isCheckingOut}
                className="w-full py-3 px-6 rounded-xl font-medium text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Video preview & configure
        <div className="space-y-4">
          {/* Video Preview Card */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="relative">
              <div className="bg-black">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl || undefined}
                  className="w-full aspect-[9/16] max-h-[400px] object-contain mx-auto"
                  controls
                  playsInline
                />
              </div>
              <button
                onClick={clearSelection}
                className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="rounded-2xl bg-card border border-border p-5 space-y-5">
            {/* Platform */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Platform</label>
              <div className="flex gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={cn(
                      "flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-all duration-200",
                      platform === p.value
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Analysis Mode</label>
              <div className="flex gap-2">
                {modes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl transition-all duration-200 text-center",
                      mode === m.value
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="font-medium">{m.label}</div>
                    <div className={cn("text-xs mt-0.5", mode === m.value ? "text-background/60" : "text-muted-foreground/70")}>
                      {m.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !uploadedData}
              className={cn(
                "w-full py-4 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2",
                uploadedData
                  ? "text-primary-foreground bg-primary hover:opacity-90 shadow-lg shadow-primary/20"
                  : "text-muted-foreground bg-muted cursor-not-allowed"
              )}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              Analyze with AI
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {!selectedFile && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Analyses</h2>
          <div className="space-y-3">
            {/* Show mock videos for testing, then real videos */}
            {[...MOCK_VIDEOS, ...(videosData?.videos || [])].map((video, i) => (
              <button
                key={video.id}
                onClick={() => {
                  if (video.analysis) {
                    router.push(`/analysis/${video.analysis.id}`);
                  }
                }}
                className="w-full bg-card border-b border-border hover:bg-muted/50 transition-all text-left group animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-stretch">
                  {/* Thumbnail - edge to edge on left */}
                  <div className="w-20 shrink-0 bg-muted overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg className="w-6 h-6 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-center gap-4 px-4">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-foreground">{video.title || video.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {video.platform.replace("_", " ")} • {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Score */}
                    {video.analysis && (
                      <div
                        className="text-2xl font-bold text-foreground"
                        style={{ fontFamily: "var(--font-nunito)" }}
                      >
                        {video.analysis.viralScore}
                      </div>
                    )}
                    <svg className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
