import { query } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Doc } from "../_generated/dataModel";

type ConversationStatus = Doc<"conversations">["status"];

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = identity.orgId as string;

    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    // Get all conversations for the organization
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();

    // Calculate KPIs
    const totalConversations = allConversations.length;
    const unresolved = allConversations.filter((c) => c.status === "unresolved").length;
    const resolved = allConversations.filter((c) => c.status === "resolved").length;
    const escalated = allConversations.filter((c) => c.status === "escalated").length;

    // Calculate resolution rate
    const resolutionRate =
      totalConversations > 0
        ? Math.round((resolved / totalConversations) * 100)
        : 0;

    // Get conversations from last 30 days for time series
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentConversations = allConversations.filter(
      (c) => c._creationTime >= thirtyDaysAgo
    );

    // Group by day for the last 30 days
    const dailyData: Record<string, { date: string; total: number; resolved: number; unresolved: number; escalated: number }> = {};

    // Initialize all days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      dailyData[dateKey] = {
        date: dateKey,
        total: 0,
        resolved: 0,
        unresolved: 0,
        escalated: 0,
      };
    }

    // Count conversations by day and status
    recentConversations.forEach((conversation) => {
      const date = new Date(conversation._creationTime);
      const dateKey = date.toISOString().split("T")[0];

      if (dailyData[dateKey]) {
        dailyData[dateKey].total++;
        if (conversation.status === "resolved") {
          dailyData[dateKey].resolved++;
        } else if (conversation.status === "unresolved") {
          dailyData[dateKey].unresolved++;
        } else if (conversation.status === "escalated") {
          dailyData[dateKey].escalated++;
        }
      }
    });

    // Convert to array and format dates
    const timeSeriesData = Object.values(dailyData).map((day) => {
      const dateObj = new Date(day.date);
      return {
        date: dateObj.getDate().toString(),
        dateFull: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        total: day.total,
        resolved: day.resolved,
        unresolved: day.unresolved,
        escalated: day.escalated,
      };
    });

    // Get status distribution for pie chart - always show all statuses
    const statusDistribution = [
      { name: "Resolved", value: resolved, color: "#10b981" }, // Green
      { name: "Pending", value: unresolved, color: "#ef4444" }, // Red
      { name: "Escalated", value: escalated, color: "#f59e0b" }, // Yellow/Orange
    ];

    // Get contact sessions count
    const contactSessions = await ctx.db
      .query("contactSessions")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();

    const totalContacts = contactSessions.length;
    const activeContacts = contactSessions.filter(
      (s) => s.expiresAt > Date.now()
    ).length;

    return {
      kpis: {
        totalConversations,
        unresolved,
        resolved,
        escalated,
        resolutionRate,
        totalContacts,
        activeContacts,
      },
      timeSeriesData,
      statusDistribution,
    };
  },
});
