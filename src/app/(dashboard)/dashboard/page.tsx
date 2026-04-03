import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import ReputationScore from "@/components/dashboard/ReputationScore";
import ReviewVolumeChart from "@/components/dashboard/ReviewVolumeChart";
import SentimentBreakdown from "@/components/dashboard/SentimentBreakdown";
import RecentReviews from "@/components/dashboard/RecentReviews";
import StatsCard from "@/components/dashboard/StatsCard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard />
        <ReputationScore />
        <SentimentBreakdown />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReviewVolumeChart />
        <RecentReviews />
      </div>
    </div>
  );
}
