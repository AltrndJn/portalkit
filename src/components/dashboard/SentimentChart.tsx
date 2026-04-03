// @ts-nocheck
"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

export interface SentimentDataPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentChartProps {
  data: SentimentDataPoint[];
  isLoading?: boolean;
}

const COLORS = {
  positive: "#10B981",
  neutral: "#2563EB",
  negative: "#EF4444",
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-800">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const SkeletonChart = () => (
  <div className="w-full h-full flex flex-col gap-3 animate-pulse">
    <div className="flex gap-2 justify-end">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-5 w-16 bg-gray-200 rounded" />
      ))}
    </div>
    <div className="flex-1 bg-gray-100 rounded-lg" />
    <div className="flex gap-4 justify-around">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-4 w-10 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

export default function SentimentChart({
  data,
  isLoading = false,
}: SentimentChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Sentiment Trends
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Review sentiment over time
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartType("area")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              chartType === "area"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              chartType === "bar"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="h-64">
        {isLoading ? (
          <SkeletonChart />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg
              className="w-12 h-12 mb-2 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-sm">No sentiment data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart
                data={data}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="positiveGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.positive}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.positive}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="neutralGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.neutral}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.neutral}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="negativeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.negative}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.negative}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
                <Area
                  type="monotone"
                  dataKey="positive"
                  stroke={COLORS.positive}
                  strokeWidth={2}
                  fill="url(#positiveGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="neutral"
                  stroke={COLORS.neutral}
                  strokeWidth={2}
                  fill="url(#neutralGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="negative"
                  stroke={COLORS.negative}
                  strokeWidth={2}
                  fill="url(#negativeGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
                <Bar
                  dataKey="positive"
                  fill={COLORS.positive}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="neutral"
                  fill={COLORS.neutral}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="negative"
                  fill={COLORS.negative}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center gap-4 pt-1 border-t border-gray-50">
        {([
          { label: "Positive", key: "positive", color: COLORS.positive },
          { label: "Neutral", key: "neutral", color: COLORS.neutral },
          { label: "Negative", key: "negative", color: COLORS.negative },
        ] as const).map(({ label, key, color }) => {
          const total = data.reduce((sum, d) => sum + d[key], 0);
          const overall = data.reduce(
            (sum, d) => sum + d.positive + d.neutral + d.negative,
            0
          );
          const pct = overall > 0 ? Math.round((total / overall) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-semibold text-gray-700">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
