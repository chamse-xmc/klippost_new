"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
      alert(error instanceof Error ? error.message : "Analysis failed");
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

  // Calculate user's overall score from video history
  const allVideos = [...MOCK_VIDEOS, ...(videosData?.videos || [])];
  const videosWithScores = allVideos.filter(v => v.analysis?.viralScore);
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

      {/* User Score Card */}
      {!selectedFile && (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground mb-2">{creatorInfo.emoji} {creatorInfo.title}</p>
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-5xl font-extrabold text-foreground"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              {overallScore}
            </span>
            <span className="text-muted-foreground text-sm">avg score</span>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!selectedFile ? (
        <div
          className={cn(
            "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer bg-card",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="mb-4 w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
              <svg className="w-7 h-7 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Drop your video here</h3>
            <p className="text-sm text-muted-foreground">or click to browse • Max 256MB</p>
          </div>
        </div>
      ) : isUploading ? (
        // Uploading state
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6">
              <svg className="w-8 h-8 text-primary-foreground animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Uploading video</h3>
            <p className="text-muted-foreground mb-6">{selectedFile?.name}</p>

            {/* Progress bar */}
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{Math.round(uploadProgress)}%</p>
            </div>

            {/* Cancel button */}
            <button
              onClick={clearSelection}
              className="mt-6 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
        <div className="rounded-2xl bg-card border border-border overflow-hidden animate-slide-up">
          {/* Score header */}
          <div className="p-8 bg-primary">
            <ScoreDisplay score={analysisResult.analysis.viralScore} onCelebrate={triggerCelebration} />
            <div className="mt-6 text-center">
              <span className="inline-flex items-center bg-white/20 rounded-full px-4 py-2 text-sm text-white">
                {(analysisResult.analysis.expectedViewsMin ?? analysisResult.analysis.viewsMin ?? 0).toLocaleString()} - {(analysisResult.analysis.expectedViewsMax ?? analysisResult.analysis.viewsMax ?? 0).toLocaleString()} views expected
              </span>
            </div>
          </div>

          {/* Overall Summary */}
          {analysisResult.analysis.summary && (
            <div className="p-6 border-b border-border">
              <h4 className="font-bold text-foreground mb-3">Overall Analysis</h4>
              <p className="text-muted-foreground leading-relaxed">{analysisResult.analysis.summary}</p>
            </div>
          )}

          {/* Section Breakdown with Scores */}
          <div className="p-6 border-b border-border">
            <h4 className="font-bold text-foreground mb-4">Section Breakdown</h4>
            <div className="space-y-3">
              {[
                { label: "Hook", score: analysisResult.analysis.hookScore, feedback: analysisResult.analysis.hookFeedback },
                { label: "Body", score: analysisResult.analysis.bodyScore, feedback: analysisResult.analysis.bodyFeedback },
                { label: "Ending", score: analysisResult.analysis.endingScore, feedback: analysisResult.analysis.endingFeedback },
              ].map(({ label, score, feedback }) => (
                <div key={label} className="flex rounded-xl bg-muted overflow-hidden">
                  <div className="flex-[0.8] p-4">
                    <span className="font-semibold text-foreground">{label}</span>
                    {feedback && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{feedback}</p>
                    )}
                  </div>
                  <div className="flex-[0.2] flex items-center justify-center bg-muted-foreground/5">
                    <div
                      className={cn("text-4xl font-extrabold", getScoreColor(score))}
                      style={{ fontFamily: "var(--font-nunito)" }}
                    >
                      {score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal advice */}
          {analysisResult.analysis.goalAdvice && analysisResult.analysis.goalAdvice.length > 0 && (
            <div className="p-6 border-t border-border">
              <h4 className="font-bold text-foreground mb-4">Based on Your Goals</h4>
              <div className="space-y-4">
                {analysisResult.analysis.goalAdvice.map((ga, i) => (
                  <div key={i} className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground">{ga.goal}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{ga.advice}</p>
                    {ga.actionItems?.length > 0 && (
                      <ul className="space-y-1">
                        {ga.actionItems.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-0.5">-</span>
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
            <div className="p-6 bg-muted border-t border-border">
              <h4 className="font-bold text-foreground mb-4">Quick Improvements</h4>
              <div className="space-y-2">
                {analysisResult.analysis.suggestions.map((s, i) => (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-card">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">{s.suggestion || s.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 border-t border-border">
            <button
              onClick={clearSelection}
              className="w-full py-4 px-6 rounded-xl font-semibold text-foreground border border-border hover:bg-muted transition-all"
            >
              Analyze Another Video
            </button>
          </div>
        </div>
      ) : (
        // Video preview
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-6 bg-muted">
            <div className="relative mx-auto max-w-xs rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                src={videoPreviewUrl || undefined}
                className="w-full aspect-[9/16] object-contain"
                controls
                playsInline
              />
              <button
                onClick={clearSelection}
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Platform */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">Platform</label>
              <div className="flex gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={cn(
                      "flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all",
                      platform === p.value
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">Analysis Mode</label>
              <div className="flex gap-2">
                {modes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg transition-all",
                      mode === m.value
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <div className="font-medium">{m.label}</div>
                    <div className={cn("text-xs mt-0.5", mode === m.value ? "text-background/60" : "text-muted-foreground")}>
                      {m.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !uploadedData}
              className={cn(
                "w-full py-4 px-6 rounded-xl font-bold transition-all",
                uploadedData
                  ? "text-primary-foreground bg-primary hover:opacity-90"
                  : "text-muted-foreground bg-muted"
              )}
            >
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
                    setAnalysisResult({ analysis: video.analysis, video });
                    // Set minimal state to show results without triggering upload
                    setSelectedFile({ name: video.fileName } as File);
                    setUploadedData({ url: "", fileName: video.fileName, fileSize: 0, thumbnailUrl: video.thumbnailUrl || null });
                  }
                }}
                className="w-full bg-card border-b border-border hover:bg-muted/50 transition-all text-left group"
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards", opacity: 0 }}
              >
                <div className="flex items-center p-4 gap-4">
                  {/* Thumbnail */}
                  <div className="w-12 h-16 shrink-0 bg-muted rounded overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg className="w-5 h-5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Content */}
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
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note about mock data */}
      {!selectedFile && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          The first 4 items are mock examples showing score color coding (green: 80+, pink: 60-79, amber: 40-59, red: below 40)
        </p>
      )}
    </div>
  );
}
