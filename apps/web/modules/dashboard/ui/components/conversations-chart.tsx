"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@workspace/ui/lib/utils";

type TimeSeriesData = {
  date: string;
  dateFull: string;
  total: number;
  resolved: number;
  unresolved: number;
  escalated: number;
};

type ConversationsChartProps = {
  data: TimeSeriesData[];
};

type TimeRange = "7d" | "15d" | "30d";

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  resolved: {
    label: "Resolved",
    color: "#10b981",
  },
  unresolved: {
    label: "Pending",
    color: "#ef4444",
  },
  escalated: {
    label: "Escalated",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

const timeRangeOptions: { value: TimeRange; label: string; days: number }[] = [
  { value: "7d", label: "7d", days: 7 },
  { value: "15d", label: "15d", days: 15 },
  { value: "30d", label: "30d", days: 30 },
];

export function ConversationsChart({ data }: ConversationsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  const filteredData = useMemo(() => {
    const days = timeRangeOptions.find((o) => o.value === timeRange)?.days ?? 30;
    return data.slice(-days);
  }, [data, timeRange]);

  return (
    <Card className="shadow-none overflow-hidden pb-0">
      <CardHeader className="px-4 sm:px-6 pb-4">
        {/* Header with title and time range selector */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Conversations per Day</CardTitle>
            <CardDescription>
              Evolution of conversations over the last 30 days
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors font-medium",
                  timeRange === option.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-4 md:px-6 bg-muted py-4 pt-6 mx-4 mb-4 rounded-xl border">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <defs>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientUnresolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientEscalated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#a3a3a3" opacity={0.4} strokeWidth={1} vertical={true} />
            <XAxis
              dataKey="dateFull"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              interval={timeRange === "7d" ? 0 : timeRange === "15d" ? 2 : 4}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              width={35}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const dataPoint = payload[0]?.payload as TimeSeriesData;
                return (
                  <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                    <div className="text-sm font-medium mb-2">{dataPoint?.dateFull || label}</div>
                    <div className="space-y-1.5">
                      {payload.map((item) => {
                        const key = item.dataKey as string;
                        const itemConfig = chartConfig[key as keyof typeof chartConfig];
                        return (
                          <div key={key} className="flex items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-muted-foreground">{itemConfig?.label}</span>
                            </div>
                            <span className="font-medium tabular-nums">
                              {(item.value as number)?.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              fill="url(#gradientTotal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke="var(--color-resolved)"
              fill="url(#gradientResolved)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="unresolved"
              stroke="var(--color-unresolved)"
              fill="url(#gradientUnresolved)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="escalated"
              stroke="var(--color-escalated)"
              fill="url(#gradientEscalated)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
