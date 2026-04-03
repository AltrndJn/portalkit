// @ts-nocheck
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Sentiment = "positive" | "negative" | "neutral";
export type Platform = "google" | "yelp" | "tripadvisor" | "trustpilot" | "facebook" | "custom";

export interface Review {
  id: string;
  platform: Platform;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  content: string;
  sentiment: Sentiment;
  publishedAt: Date;
  url?: string;
  responded: boolean;
  aiDraftResponse?: string;
  businessResponse?: string;
}

interface ReviewCardProps {
  review: Review;
  onReply?: (reviewId: string, response: string) => Promise<void>;
  onGenerateDraft?: (reviewId: string) => Promise<string>;
  className?: string;
}

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; icon: string }> = {
  google: { label: "Google", color: "#4285F4", icon: "/icons/google.svg" },
  yelp: { label: "Yelp", color: "#FF1A1A", icon: "/icons/yelp.svg" },
  tripadvisor: { label: "TripAdvisor", color: "#00AA6C", icon: "/icons/tripadvisor.svg" },
  trustpilot: { label: "Trustpilot", color: "#00B67A", icon: "/icons/trustpilot.svg" },
  facebook: { label: "Facebook", color: "#1877F2", icon: "/icons/facebook.svg" },
  custom: { label: "Custom", color: "#6B7280", icon: "/icons/custom.svg" },
};

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; icon: React.FC<{ className?: string }>; classes: string }> = {
  positive: {
    label: "Positive",
    icon: ({ className }) => <ThumbsUp className={className} />,
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  negative: {
    label: "Negative",
    icon: ({ className }) => <ThumbsDown className={className} />,
    classes: "bg-red-50 text-red-700 ring-red-600/20",
  },
  neutral: {
    label: "Neutral",
    icon: ({ className }) => <Minus className={className} />,
    classes: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  },
};

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
              ? "fill-amber-200 text-amber-400"
              : "fill-gray-100 text-gray-300"
          )}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
        ringColor: `${config.color}30`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const config = SENTIMENT_CONFIG[sentiment];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        config.classes
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export default function ReviewCard({
  review,
  onReply,
  onGenerateDraft,
  className,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState(review.aiDraftResponse ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(review.responded);
  const [error, setError] = useState<string | null>(null);

  const isLongContent = review.content.length > 200;
  const displayContent =
    isLongContent && !expanded ? review.content.slice(0, 200) + "…" : review.content;

  async function handleGenerateDraft() {
    if (!onGenerateDraft) return;
    setIsGenerating(true);
    setError(null);
    try {
      const draft = await onGenerateDraft(review.id);
      setReplyText(draft);
      setShowReplyBox(true);
    } catch {
      setError("Failed to generate AI response. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmitReply() {
    if (!onReply || !replyText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onReply(review.id, replyText.trim());
      setSubmitted(true);
      setShowReplyBox(false);
    } catch {
      setError("Failed to submit reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(replyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-center gap-3 min-w-0">
          {review.authorAvatar ? (
            <img
              src={review.authorAvatar}
              alt={review.authorName}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {review.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{review.authorName}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(review.publishedAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <PlatformBadge platform={review.platform} />
          <SentimentBadge sentiment={review.sentimentScore} />
          {submitted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              <Check className="h-3 w-3" />
              Replied
            </span>
          )}
          {review.url && (
            <a
              href={review.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="View original review"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="px-5 pb-3">
        <StarRating rating={review.rating} />
      </div>

      {/* Review Content */}
      <div className="px-5 pb-4">
        <p className="text-sm leading-relaxed text-gray-700">{displayContent}</p>
        {isLongContent && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="h-3 w-3" /> Show less</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Read more</>
            )}
          </button>
        )}
      </div>

      {/* Existing Business Response */}
      {review.businessResponse && !showReplyBox && (
        <div className="mx-5 mb-4 rounded-lg bg-indigo-50 border border-indigo-100 p-3">
          <p className="mb-1 text-xs font-semibold text-indigo-700">Your Response</p>
          <p className="text-sm text-indigo-900 leading-relaxed">{review.businessResponse}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Reply Box */}
      {showReplyBox && (
        <div className="mx-5 mb-4 space-y-2">
          <div className="relative">
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              AI-Drafted Response
              <span className="ml-1.5 inline-flex items-center rounded-full bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                GPT-4
              </span>
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={5}
              placeholder="Write your response…"
              className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400">{replyText.length} characters</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!replyText}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setShowReplyBox(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {isSubmitting ? "Sending…" : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {!submitted && (
        <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
          {!showReplyBox && (
            <>
              {onGenerateDraft && (
                <button
                  onClick={handleGenerateDraft}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60 transition"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5" />
                  )}
                  {isGenerating ? "Generating…" : "AI Draft"}
                </button>
              )}
              <button
                onClick={() => setShowReplyBox(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
