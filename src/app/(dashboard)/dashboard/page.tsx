import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReputationScore } from "@/components/dashboard/ReputationScore";
import { ReviewVolumeChart } from "@/components/dashboard/ReviewVolumeChart";
import { SentimentBreakdown } from "@/components/dashboard/SentimentBreakdown";
import { RecentReviews } from "@/components/dashboard/RecentReviews";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Star, TrendingUp, MessageSquare, AlertCircle } from "lucide-react";
import { subDays, startOfDay, format } from "date-fns";

async function getDashboardData(userId: string) {
  const business = await prisma.business.findFirst({
    where: { userId },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (!business) return null;

  const reviews = business.reviews;
  const totalReviews = reviews.length;

  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const sentimentCounts = reviews.reduce(
    (acc, r) => {
      const sentiment = r.sentiment as string | null;
      if (sentiment === "POSITIVE") acc.positive++;
      else if (sentiment === "NEGATIVE") acc.negative++;
      else acc.neutral++;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const last30Days = subDays(new Date(), 30);
  const recentReviews = reviews.filter((r) => r.createdAt >= last30Days);
  const previousPeriodReviews = reviews.filter(
    (r) => r.createdAt >= subDays(new Date(), 60) && r.createdAt < last30Days
  );

  const volumeChange =
    previousPeriodReviews.length > 0
      ? ((recentReviews.length - previousPeriodReviews.length) /
          previousPeriodReviews.length) *
        100
      : 0;

  // Build daily volume for last 30 days
  const volumeData: { date: string; count: number; avgRating: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const nextDay = startOfDay(subDays(new Date(), i - 1));
    const dayReviews = reviews.filter(
      (r) => r.createdAt >= day && r.createdAt < nextDay
    );
    volumeData.push({
      date: format(day, "MMM dd"),
      count: dayReviews.length,
      avgRating:
        dayReviews.length > 0
          ? dayReviews.reduce((s, r) => s + r.rating, 0) / dayReviews.length
          : 0,
    });
  }

  const reputationScore = Math.round(
    (avgRating / 5) * 60 +
      (sentimentCounts.positive / Math.max(totalReviews, 1)) * 30 +
      Math.min(totalReviews / 100, 1) * 10
  );

  const needsAttention = reviews.filter(
    (r) => r.rating <= 2 && !r.responseText
  ).length;

  return {
    business,
    reviews: reviews.slice(0, 10),
    totalReviews,
    avgRating,
    sentimentCounts,
    volumeData,
    reputationScore,
    recentCount: recentReviews.length,
    volumeChange,
    needsAttention,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const data = await getDashboardData(session.user.id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-semibold text-gray-700">No business found</h2>
        <p className="text-gray-500">Please set up your business profile to get started.</p>
        <a
          href="/onboarding"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Set Up Business
        </a>
      </div>
    );
  }

  const {
    business,
    reviews,
    totalReviews,
    avgRating,
    sentimentCounts,
    volumeData,
    reputationScore,
    recentCount,
    volumeChange,
    needsAttention,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Analytics overview · Last updated just now
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Live Monitoring
          </span>
        </div>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Reputation Score"
          value={`${reputationScore}/100`}
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          trend={{ value: 3, positive: true }}
          color="indigo"
        />
        <StatsCard
          title="Average Rating"
          value={avgRating.toFixed(1)}
          icon={<Star className="w-5 h-5 text-amber-500" />}
          subtitle={`${totalReviews} total reviews`}
          color="amber"
        />
        <StatsCard
          title="Reviews (30 days)"
          value={recentCount}
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          trend={{
            value: Math.abs(Math.round(volumeChange)),
            positive: volumeChange >= 0,
          }}
          color="blue"
        />
        <StatsCard
          title="Needs Response"
          value={needsAttention}
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          subtitle="Low-rated unanswered"
          color="red"
          urgent={needsAttention > 0}
        />
      </div>

      {/* Reputation score + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ReputationScore score={reputationScore} avgRating={avgRating} />
        </div>
        <div className="lg:col-span-2">
          <SentimentBreakdown
            positive={sentimentCounts.positive}
            negative={sentimentCounts.negative}
            neutral={sentimentCounts.neutral}
            total={totalReviews}
          />
        </div>
      </div>

      {/* Volume chart */}
      <ReviewVolumeChart data={volumeData} />

      {/* Recent reviews */}
      <RecentReviews reviews={reviews} />
    </div>
  );
}
