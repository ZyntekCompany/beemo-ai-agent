"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

type IconTheme = "blue" | "green" | "orange" | "red";

type KPICardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconTheme?: IconTheme;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

const iconThemeClasses: Record<IconTheme, { bg: string; icon: string }> = {
  blue: {
    bg: "bg-blue-100/40",
    icon: "text-blue-600",
  },
  green: {
    bg: "bg-green-100/40",
    icon: "text-green-600",
  },
  orange: {
    bg: "bg-amber-100/40",
    icon: "text-amber-600",
  },
  red: {
    bg: "bg-red-100/40",
    icon: "text-red-600",
  },
};

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  iconTheme = "blue",
  trend,
  className,
}: KPICardProps) {
  const theme = iconThemeClasses[iconTheme];

  return (
    <Card className={cn("shadow-none py-0 rounded-2xl gap-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-1 min-w-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            {title}
          </CardTitle>
          {Icon && (
            <div className={cn("flex-shrink-0 size-6 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center", theme.bg)}>
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", theme.icon)} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
