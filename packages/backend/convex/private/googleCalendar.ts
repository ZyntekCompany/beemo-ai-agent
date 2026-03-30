import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";

export const getConnection: ReturnType<typeof query> = query({
  handler: async (ctx): Promise<{
    connectedAt: number;
    accountEmail?: string;
    calendarId?: string;
  } | null> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });
    }

    const connection = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", identity.orgId as string),
      )
      .unique();

    if (!connection) return null;

    return {
      connectedAt: connection.connectedAt,
      accountEmail: connection.accountEmail,
      calendarId: connection.calendarId,
    };
  },
});

export const saveConnection: ReturnType<typeof mutation> = mutation({
  args: {
    organizationId: v.string(),
    refreshToken: v.string(),
    accountEmail: v.optional(v.string()),
    calendarId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        refreshToken: args.refreshToken,
        connectedAt: Date.now(),
        accountEmail: args.accountEmail,
        calendarId: args.calendarId,
      });
    } else {
      await ctx.db.insert("googleCalendarConnections", {
        organizationId: args.organizationId,
        refreshToken: args.refreshToken,
        connectedAt: Date.now(),
        accountEmail: args.accountEmail,
        calendarId: args.calendarId,
      });
    }
  },
});

export const deleteConnection: ReturnType<typeof mutation> = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });
    }

    const existing = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", identity.orgId as string),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
