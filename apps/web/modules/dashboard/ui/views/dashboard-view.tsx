"use client";

import { api } from "@workspace/backend/_generated/api";
import { useQuery } from "convex/react";
import { KPICard } from "../components/kpi-card";
import { ConversationsChart } from "../components/conversations-chart";
import { StatusDistributionChart } from "../components/status-distribution-chart";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  UserCheck,
} from "lucide-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Card, CardContent } from "@workspace/ui/components/card";
import { useUser } from "@clerk/nextjs";

export function DashboardView() {
  const stats = useQuery(api.private.analytics.getStats);
  const user = useUser();

  if (stats === undefined) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-none">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <Skeleton className="h-[300px]" />
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-6">
              <Skeleton className="h-[300px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground">Unable to load statistics</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-screen-lg space-y-6 overflow-x-hidden">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl">Welcome, {user?.user?.firstName}</h1>
          <p className="text-muted-foreground">Here you can see your statistics and insights.</p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Main KPIs - Grid 2x2 on mobile, 4 columns on desktop */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Conversations"
              value={stats.kpis.totalConversations}
              description="All registered conversations"
              icon={MessageSquare}
              iconTheme="blue"
            />
            <KPICard
              title="Resolution Rate"
              value={`${stats.kpis.resolutionRate}%`}
              description={`${stats.kpis.resolved} of ${stats.kpis.totalConversations} resolved`}
              icon={CheckCircle2}
              iconTheme="green"
            />
            <KPICard
              title="Pending"
              value={stats.kpis.unresolved}
              description="Unresolved conversations"
              icon={Clock}
              iconTheme="orange"
            />
            <KPICard
              title="Escalated"
              value={stats.kpis.escalated}
              description="Escalated conversations"
              icon={TrendingUp}
              iconTheme="red"
            />
          </div>

          {/* Contact Stats */}
          <div className="grid grid-cols-2 gap-4">
            <KPICard
              title="Total Contacts"
              value={stats.kpis.totalContacts}
              description="Registered contacts"
              icon={Users}
              iconTheme="blue"
            />
            <KPICard
              title="Active Contacts"
              value={stats.kpis.activeContacts}
              description="Active sessions"
              icon={UserCheck}
              iconTheme="green"
            />
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4 w-full min-w-0 grid grid-cols-1">
          <ConversationsChart data={stats.timeSeriesData} />
          <StatusDistributionChart data={stats.statusDistribution} />
        </div>
      </div>
    </div>
  );
}
