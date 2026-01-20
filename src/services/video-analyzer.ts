import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import type { AnalysisMode, Platform, Goal } from "@prisma/client";
import fs from "fs";
import path from "path";
import os from "os";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY || "");

export interface RetentionDropoff {
  timestamp: number;
  reason: string;
}

export interface AnalysisResult {
  viralScore: number;
  hookScore: number;
  bodyScore: number;
  endingScore: number;
  viewsMin: number;
  viewsMax: number;
  hookFeedback: string;
  bodyFeedback: string;
  endingFeedback: string;
  summary: string;
  goalAdvice: {
    goal: string;
    advice: string;
    actionItems: string[];
  }[];
  suggestions: {
    category: string;
    priority: string;
    title: string;
    description: string;
    timestamp?: number;
  }[];
  transcript?: string;

  // Hook analysis
  hookType?: string; // CURIOSITY_GAP, PATTERN_INTERRUPT, SHOCK_VALUE, EMOTIONAL, QUESTION

  // Retention
  retentionScore?: number;
  retentionDropoffs?: RetentionDropoff[];

  // CTA
  ctaType?: string; // FOLLOW, COMMENT, SHARE, LINK, NONE
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

const platformNames: Record<Platform, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "Instagram Reels",
  YOUTUBE_SHORTS: "YouTube Shorts",
  YOUTUBE: "YouTube",
  OTHER: "social media",
};

const modeDescriptions: Record<AnalysisMode, string> = {
  VIRAL: "general viral content that maximizes engagement and shareability",
  UGC: "user-generated content style that feels authentic and relatable",
  TIKTOK_SHOP: "TikTok Shop product promotion that drives conversions",
};

const goalDescriptions: Record<Goal, { name: string; focus: string }> = {
  GROW: {
    name: "Grow Audience",
    focus: "maximizing follower growth, improving discoverability, and creating shareable content that attracts new viewers",
  },
  MONETIZE: {
    name: "Monetize Content",
    focus: "creating content that drives revenue through ads, sponsorships, and direct monetization features",
  },
  BRAND_DEALS: {
    name: "Land Brand Deals",
    focus: "building a professional brand image, demonstrating engagement metrics, and creating sponsor-friendly content",
  },
  GO_VIRAL: {
    name: "Go Viral",
    focus: "maximizing shareability, creating emotional hooks, leveraging trends, and engineering content for explosive reach",
  },
};

function buildGoalPromptSection(goals: Goal[]): string {
  if (!goals || goals.length === 0) return "";

  const goalDetails = goals
    .map((g) => `- ${goalDescriptions[g].name}: ${goalDescriptions[g].focus}`)
    .join("\n");

  return `
The creator has the following goals:
${goalDetails}

For EACH of the creator's goals, provide specific, actionable advice on what they should change or improve in this video to achieve that goal. Be specific and reference actual moments or elements in the video.`;
}

function buildGoalJsonSection(goals: Goal[]): string {
  if (!goals || goals.length === 0) return "";

  const goalNames = goals.map((g) => goalDescriptions[g].name);

  return `"goalAdvice": [
    ${goalNames.map((name) => `{
      "goal": "${name}",
      "advice": "<2-3 sentences of specific advice for achieving this goal based on the video>",
      "actionItems": ["<specific action 1>", "<specific action 2>", "<specific action 3>"]
    }`).join(",\n    ")}
  ],`;
}

function buildPrompt(platform: Platform, mode: AnalysisMode, goals: Goal[]): string {
  const goalSection = buildGoalPromptSection(goals);
  const goalJsonSection = buildGoalJsonSection(goals);
  const hasBrandGoal = goals.includes("BRAND_DEALS" as Goal);

  return `You are an expert social media content analyst. Analyze this video for viral potential on ${platformNames[platform]}.

The video should be optimized for ${modeDescriptions[mode]}.
${goalSection}

## Analysis Areas

1. **HOOK (first 3 seconds)**: Does it grab attention immediately? What hook technique is used?
   - Hook Types: CURIOSITY_GAP (makes viewer need to know more), PATTERN_INTERRUPT (unexpected element), SHOCK_VALUE (surprising/controversial), EMOTIONAL (triggers strong feeling), QUESTION (poses compelling question)

2. **BODY (middle content)**: Is it engaging throughout? Good pacing? Where might viewers drop off?

3. **ENDING & CTA**: Strong call-to-action? What type of CTA?
   - CTA Types: FOLLOW, COMMENT, SHARE, LINK, NONE

4. **RETENTION**: Score how well the video holds attention. Identify specific timestamps where viewers might drop off.

5. **TREND ALIGNMENT**: How well does this content align with current ${platformNames[platform]} trends?

6. **ENGAGEMENT POTENTIAL**: Predict likes, comments, and shares based on content type and quality.

7. **TECHNICAL QUALITY**: Evaluate audio (clarity, music, sound effects) and visual (lighting, framing, effects) separately.
${hasBrandGoal ? "\n8. **BRAND VALUE**: Estimate potential brand deal value ($50-500 range) based on content quality, niche, and professionalism." : ""}

Provide your analysis in the following JSON format only, no other text:
{
  "viralScore": <0-100 overall score>,
  "hookScore": <0-100>,
  "bodyScore": <0-100>,
  "endingScore": <0-100>,
  "viewsMin": <minimum expected views>,
  "viewsMax": <maximum expected views>,
  "hookFeedback": "<detailed feedback on the hook - 2-3 sentences>",
  "bodyFeedback": "<detailed feedback on the body content - 2-3 sentences>",
  "endingFeedback": "<detailed feedback on the ending - 2-3 sentences>",
  "summary": "<overall summary and main takeaway - 2-3 sentences>",
  ${goalJsonSection}
  "suggestions": [
    {
      "category": "<HOOK|AUDIO|VISUAL|PACING|CONTENT|TEXT|CTA|TRENDING>",
      "priority": "<LOW|MEDIUM|HIGH|CRITICAL>",
      "title": "<short actionable title>",
      "description": "<specific, actionable improvement tip - 1-2 sentences>",
      "timestamp": <optional: seconds into video this applies to, null if not applicable>
    }
  ],
  "transcript": "<brief transcript or description of what's said/shown in the video>",

  "hookType": "<CURIOSITY_GAP|PATTERN_INTERRUPT|SHOCK_VALUE|EMOTIONAL|QUESTION>",

  "retentionScore": <0-100, how well the video holds attention>,
  "retentionDropoffs": [
    { "timestamp": <seconds>, "reason": "<why viewers might leave here>" }
  ],

  "ctaType": "<FOLLOW|COMMENT|SHARE|LINK|NONE>",
  "ctaStrength": <0-100>,
  "ctaFeedback": "<specific feedback on the CTA effectiveness>",

  "trendScore": <0-100, alignment with current trends>,
  "trendMatches": ["<trend1>", "<trend2>"],
  "trendSuggestions": ["<trending format/sound/style to try>"],

  "estimatedLikesMin": <minimum expected likes>,
  "estimatedLikesMax": <maximum expected likes>,
  "estimatedCommentsMin": <minimum expected comments>,
  "estimatedCommentsMax": <maximum expected comments>,
  "estimatedSharesMin": <minimum expected shares>,
  "estimatedSharesMax": <maximum expected shares>,

  "audioScore": <0-100>,
  "visualScore": <0-100>,
  "audioFeedback": "<specific feedback on audio quality, music choice, voice clarity>",
  "visualFeedback": "<specific feedback on lighting, framing, visual effects>"${hasBrandGoal ? `,

  "brandValue": <50-500, estimated brand deal value in dollars>` : ""}
}

Provide 4-6 actionable suggestions prioritized by impact. Be specific with timestamps where applicable.`;
}

function parseResult(text: string): AnalysisResult {
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  const result = JSON.parse(jsonMatch[0]) as AnalysisResult;

  // Helper to clamp scores
  const clampScore = (score: number | undefined): number | undefined => {
    if (score === undefined || score === null) return undefined;
    return Math.max(0, Math.min(100, score));
  };

  // Validate and clamp main scores
  result.viralScore = Math.max(0, Math.min(100, result.viralScore));
  result.hookScore = Math.max(0, Math.min(100, result.hookScore));
  result.bodyScore = Math.max(0, Math.min(100, result.bodyScore));
  result.endingScore = Math.max(0, Math.min(100, result.endingScore));

  // Clamp new scores
  result.retentionScore = clampScore(result.retentionScore);
  result.ctaStrength = clampScore(result.ctaStrength);
  result.trendScore = clampScore(result.trendScore);
  result.audioScore = clampScore(result.audioScore);
  result.visualScore = clampScore(result.visualScore);

  // Clamp brand value to $50-500 range
  if (result.brandValue !== undefined && result.brandValue !== null) {
    result.brandValue = Math.max(50, Math.min(500, result.brandValue));
  }

  // Ensure arrays exist
  if (!result.goalAdvice) {
    result.goalAdvice = [];
  }
  if (!result.retentionDropoffs) {
    result.retentionDropoffs = [];
  }
  if (!result.trendMatches) {
    result.trendMatches = [];
  }
  if (!result.trendSuggestions) {
    result.trendSuggestions = [];
  }

  return result;
}

async function downloadVideo(url: string): Promise<{ filePath: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "video/mp4";
  const buffer = Buffer.from(await response.arrayBuffer());

  // Determine file extension from content type
  let ext = ".mp4";
  if (contentType.includes("quicktime") || contentType.includes("mov")) {
    ext = ".mov";
  } else if (contentType.includes("webm")) {
    ext = ".webm";
  }

  const tempFilePath = path.join(os.tmpdir(), `video-${Date.now()}${ext}`);
  fs.writeFileSync(tempFilePath, buffer);

  return { filePath: tempFilePath, mimeType: contentType };
}

export async function analyzeVideo(
  videoUrl: string,
  platform: Platform,
  mode: AnalysisMode,
  goals: Goal[] = []
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = buildPrompt(platform, mode, goals);

  let tempFilePath: string | null = null;

  try {
    // Download the video from S3
    console.log("Downloading video from:", videoUrl);
    const { filePath, mimeType } = await downloadVideo(videoUrl);
    tempFilePath = filePath;
    console.log("Video downloaded to:", tempFilePath);

    // Upload to Google's File API
    console.log("Uploading to Google File API...");
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType,
      displayName: `video-${Date.now()}`,
    });
    console.log("Upload complete:", uploadResult.file.uri);

    // Wait for file to be processed
    let file = uploadResult.file;
    while (file.state === "PROCESSING") {
      console.log("Waiting for file processing...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(file.name);
    }

    if (file.state === "FAILED") {
      throw new Error("File processing failed");
    }

    console.log("File ready, analyzing...");

    // Generate content with the uploaded file
    const response = await model.generateContent([
      { text: prompt },
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        },
      },
    ]);

    const text = response.response.text();
    return parseResult(text);
  } catch (error) {
    console.error("Video analysis error:", error);
    throw new Error("Failed to analyze video");
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

export async function analyzeVideoFromBase64(
  base64Data: string,
  mimeType: string,
  platform: Platform,
  mode: AnalysisMode,
  goals: Goal[] = []
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = buildPrompt(platform, mode, goals);

  try {
    const response = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const text = response.response.text();
    return parseResult(text);
  } catch (error) {
    console.error("Video analysis error:", error);
    throw new Error("Failed to analyze video");
  }
}
