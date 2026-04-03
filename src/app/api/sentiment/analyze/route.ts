import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SentimentLabel = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";

interface SentimentResult {
  label: SentimentLabel;
  score: number;
  topics: string[];
  summary: string;
  suggestedResponse: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
}

function buildAnalysisPrompt(reviewText: string, businessName: string, rating: number): string {
  return `You are an expert review analyst and customer success specialist for "${businessName}".

Analyze the following customer review (rated ${rating}/5 stars) and provide a structured JSON response.

Review:
"""${reviewText}"""

Respond with ONLY valid JSON matching this exact structure:
{
  "label": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
  "score": <float between 0.0 and 1.0 representing sentiment intensity>,
  "topics": [<array of key topics mentioned, max 5>],
  "summary": "<one sentence summary of the review sentiment>",
  "suggestedResponse": "<professional, empathetic response to post publicly, 2-4 sentences>",
  "urgency": "LOW" | "MEDIUM" | "HIGH"
}

Guidelines:
- score: 1.0 = extremely positive, 0.5 = neutral, 0.0 = extremely negative
- urgency HIGH = negative review with complaints needing immediate attention
- urgency MEDIUM = mixed or neutral reviews needing follow-up
- urgency LOW = positive reviews
- suggestedResponse should be personalized, professional, and address specific points
- topics should be specific (e.g. "wait time", "staff friendliness", "product quality")`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reviewId, reviewText, rating, businessName } = body;

    if (!reviewText || typeof reviewText !== "string" || reviewText.trim().length === 0) {
      return NextResponse.json({ error: "reviewText is required" }, { status: 400 });
    }

    if (reviewText.length > 5000) {
      return NextResponse.json({ error: "reviewText exceeds 5000 characters" }, { status: 400 });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be a number between 1 and 5" }, { status: 400 });
    }

    const resolvedBusinessName = businessName || "our business";

    // Check if review belongs to the user if reviewId provided
    if (reviewId) {
      const review = await prisma.review.findFirst({
        where: {
          id: reviewId,
          business: {
            userId: session.user.id,
          },
        },
        select: { id: true, sentimentLabel: true, sentimentScore: true },
      });

      if (!review) {
        return NextResponse.json({ error: "Review not found or access denied" }, { status: 404 });
      }

      // Return cached result if already analyzed
      if (review.sentimentLabel && review.sentimentScore !== null) {
        const cached = await prisma.review.findUnique({
          where: { id: reviewId },
          select: {
            sentimentLabel: true,
            sentimentScore: true,
            sentimentTopics: true,
            sentimentSummary: true,
            suggestedResponse: true,
            urgency: true,
          },
        });
        return NextResponse.json({ result: cached, cached: true });
      }
    }

    // Check user subscription/usage limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        analysisCount: true,
        analysisResetAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const resetAt = user.analysisResetAt ? new Date(user.analysisResetAt) : null;
    const shouldReset = !resetAt || resetAt < now;

    const limits: Record<string, number> = {
      FREE: 10,
      STARTER: 100,
      PROFESSIONAL: 500,
      ENTERPRISE: 99999,
    };

    const plan = user.plan || "FREE";
    const limit = limits[plan] ?? 10;
    const currentCount = shouldReset ? 0 : (user.analysisCount ?? 0);

    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: "Monthly analysis limit reached",
          limit,
          used: currentCount,
          plan,
        },
        { status: 429 }
      );
    }

    // Call OpenAI GPT-4
    const prompt = buildAnalysisPrompt(reviewText.trim(), resolvedBusinessName, rating);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a precise sentiment analysis engine. Always respond with valid JSON only. No markdown, no explanations, just the JSON object.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("Empty response from OpenAI");
    }

    let result: SentimentResult;
    try {
      result = JSON.parse(rawContent) as SentimentResult;
    } catch {
      throw new Error("Failed to parse OpenAI JSON response");
    }

    // Validate result structure
    const validLabels: SentimentLabel[] = ["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"];
    const validUrgency = ["LOW", "MEDIUM", "HIGH"];

    if (!validLabels.includes(result.label)) {
      result.label = rating >= 4 ? "POSITIVE" : rating <= 2 ? "NEGATIVE" : "NEUTRAL";
    }
    if (typeof result.score !== "number" || result.score < 0 || result.score > 1) {
      result.score = rating / 5;
    }
    if (!Array.isArray(result.topics)) result.topics = [];
    if (!result.summary) result.summary = "";
    if (!result.suggestedResponse) result.suggestedResponse = "";
    if (!validUrgency.includes(result.urgency)) {
      result.urgency = result.label === "NEGATIVE" ? "HIGH" : "LOW";
    }

    // Persist results and update usage count
    await prisma.$transaction(async (tx) => {
      // Update usage counter
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          analysisCount: shouldReset ? 1 : { increment: 1 },
          analysisResetAt: shouldReset
            ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
            : undefined,
        },
      });

      // Update review if reviewId provided
      if (reviewId) {
        await tx.review.update({
          where: { id: reviewId },
          data: {
            sentimentLabel: result.label,
            sentimentScore: result.score,
            sentimentTopics: result.topics,
            sentimentSummary: result.summary,
            suggestedResponse: result.suggestedResponse,
            urgency: result.urgency,
            analyzedAt: now,
          },
        });
      }

      // Log analysis event
      await tx.analysisLog.create({
        data: {
          userId: session.user.id,
          reviewId: reviewId || null,
          model: "gpt-4-turbo-preview",
          tokensUsed: completion.usage?.total_tokens ?? 0,
          createdAt: now,
        },
      });
    });

    return NextResponse.json({
      result,
      cached: false,
      usage: {
        used: currentCount + 1,
        limit,
        plan,
      },
    });
  } catch (error) {
    console.error("[sentiment/analyze] Error:", error);

    if (error instanceof OpenAI.APIError) {
      const status = error.status === 429 ? 503 : 502;
      return NextResponse.json(
        { error: "AI service error", details: error.message },
        { status }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        business: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        sentimentLabel: true,
        sentimentScore: true,
        sentimentTopics: true,
        sentimentSummary: true,
        suggestedResponse: true,
        urgency: true,
        analyzedAt: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (!review.sentimentLabel) {
      return NextResponse.json({ analyzed: false });
    }

    return NextResponse.json({ analyzed: true, result: review });
  } catch (error) {
    console.error("[sentiment/analyze GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
