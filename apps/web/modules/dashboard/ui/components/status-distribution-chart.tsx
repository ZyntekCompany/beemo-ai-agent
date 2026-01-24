"use client";

import {
  Card,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { PieChart, Pie, Cell } from "recharts";

type StatusDistribution = {
  name: string;
  value: number;
  color: string;
};

type ProcessedStatusDistribution = StatusDistribution & {
  displayValue: number;
};

type StatusDistributionChartProps = {
  data: StatusDistribution[];
};

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Ensure all categories are visible even with 0 values by using a minimum value
  // Recharts doesn't render pie slices with value 0, so we use a small value for visual representation
  const processedData: ProcessedStatusDistribution[] = data.map((item) => ({
    ...item,
    displayValue: item.value === 0 ? 0.01 : item.value, // Use small value for 0 to show in chart
  }));

  const chartConfig = processedData.reduce(
    (acc, item) => {
      acc[item.name.toLowerCase().replace(/\s+/g, "")] = {
        label: item.name,
        color: item.color,
      };
      return acc;
    },
    {} as ChartConfig
  );

  if (data.length === 0) {
    return (
      <Card className="shadow-none overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 p-4 sm:p-6">
          <div className="flex-1 space-y-1 lg:max-w-sm lg:pl-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Status Distribution</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Proportion of conversations by status
            </CardDescription>
          </div>
          <div className="flex-1 lg:flex-shrink-0 lg:w-80 flex items-center justify-center h-[260px] min-w-0">
            <p className="text-muted-foreground text-sm">No conversations yet</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-none overflow-hidden py-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 p-4 sm:p-6">
        {/* Title and Description - Left side on large screens */}
        <div className="flex-1 space-y-1 lg:max-w-sm lg:pl-6 min-w-0">
          <CardTitle className="text-lg sm:text-xl font-semibold">Status Distribution</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Proportion of conversations by status
          </CardDescription>
        </div>

        {/* Chart - Right side on large screens */}
        <div className="flex-1 lg:flex-shrink-0 lg:w-80 min-w-0 w-full bg-muted py-4 rounded-xl">
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const dataPoint = payload[0]?.payload as ProcessedStatusDistribution;
                  const percentage = total > 0 ? ((dataPoint.value / total) * 100).toFixed(1) : "0.0";
                  
                  return (
                    <div className="border-border/50 bg-background grid min-w-[10rem] max-w-[90vw] items-start gap-2 rounded-lg border px-3 py-2.5 text-xs shadow-xl">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{
                            backgroundColor: dataPoint.color,
                          }}
                        />
                        <div className="font-semibold text-sm truncate">{dataPoint.name}</div>
                      </div>
                      <div className="grid gap-1 pl-5">
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-muted-foreground">Conversations</span>
                          <span className="text-foreground font-mono font-semibold tabular-nums">
                            {dataPoint.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-muted-foreground">Percentage</span>
                          <span className="text-foreground font-mono font-semibold tabular-nums">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, payload }) => {
                  // Use actual value from original data, not displayValue
                  const dataPoint = payload as ProcessedStatusDistribution;
                  const actualValue = dataPoint.value;
                  return actualValue > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : "";
                }}
                outerRadius="80%"
                innerRadius="45%"
                fill="#8884d8"
                dataKey="displayValue"
                paddingAngle={2}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent />}
                className="mt-2"
              />
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </Card>
  );
}
