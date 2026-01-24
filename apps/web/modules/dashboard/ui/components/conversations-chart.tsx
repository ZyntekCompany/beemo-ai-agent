"use client";

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

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  resolved: {
    label: "Resolved",
    color: "#10b981", // Green
  },
  unresolved: {
    label: "Pending",
    color: "#ef4444", // Red
  },
  escalated: {
    label: "Escalated",
    color: "#f59e0b", // Yellow/Orange
  },
} satisfies ChartConfig;

export function ConversationsChart({ data }: ConversationsChartProps) {
  return (
    <Card className="shadow-none overflow-hidden pb-0">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Conversations per Day</CardTitle>
        <CardDescription>
          Evolution of conversations over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 md:px-6 bg-muted py-4 pt-6 mx-4 mb-4 rounded-xl">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#a3a3a3" opacity={0.3} strokeWidth={1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const dataPoint = payload[0]?.payload as TimeSeriesData;
                return (
                  <div className="border-border/50 bg-background grid min-w-[8rem] max-w-[90vw] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                    <div className="font-medium truncate">{dataPoint?.dateFull || label}</div>
                    <div className="grid gap-1.5">
                      {payload.map((item) => {
                        const key = item.dataKey as string;
                        const itemConfig = chartConfig[key as keyof typeof chartConfig];
                        return (
                          <div
                            key={item.dataKey}
                            className="flex w-full flex-wrap items-stretch gap-2 min-w-0"
                          >
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                              style={{
                                backgroundColor: item.color,
                              }}
                            />
                            <div className="flex flex-1 justify-between leading-none min-w-0">
                              <span className="text-muted-foreground truncate">
                                {itemConfig?.label || item.name}
                              </span>
                              {item.value !== undefined && (
                                <span className="text-foreground font-mono font-medium tabular-nums shrink-0 ml-2">
                                  {item.value.toLocaleString()}
                                </span>
                              )}
                            </div>
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
