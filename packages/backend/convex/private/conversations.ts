import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { supportAgent } from "../system/ai/agents/supportAgent";
import { MessageDoc } from "@convex-dev/agent";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { Doc } from "../_generated/dataModel";

export const updateStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(
      v.literal("unresolved"),
      v.literal("escalated"),
      v.literal("resolved"),
    ),
  },
  handler: async (ctx, args) => {
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

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    if (conversation.organizationId !== orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to access this conversation",
      });
    }

    await ctx.db.patch(args.conversationId, {
      status: args.status,
    });
  },
});

export const getOne = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
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

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    if (conversation.organizationId !== orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to access this conversation",
      });
    }

    const contactSession = await ctx.db.get(conversation.contactSessionId);

    if (!contactSession) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Contact Session not found",
      });
    }

    return {
      ...conversation,
      contactSession,
    };
  },
});

export const getMany = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("unresolved"),
        v.literal("escalated"),
        v.literal("resolved"),
      ),
    ),
    type: v.optional(
      v.union(
        v.literal("whatsapp"),
        v.literal("widget"),
      ),
    ),
  },
  handler: async (ctx, args) => {
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

    let conversations: PaginationResult<Doc<"conversations">>;

    // Usar el nuevo índice para ordenar por lastMessageAt
    if (args.status && args.type) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_organization_id_and_last_message", (q) =>
          q.eq("organizationId", orgId)
        )
        .filter((q) => 
          q.and(
            q.eq(q.field("status"), args.status),
            q.eq(q.field("type"), args.type)
          )
        )
        .order("desc")
        .paginate(args.paginationOpts);
    } else if (args.status) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_organization_id_and_last_message", (q) =>
          q.eq("organizationId", orgId)
        )
        .filter((q) => q.eq(q.field("status"), args.status))
        .order("desc")
        .paginate(args.paginationOpts);
    } else if (args.type) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_organization_id_and_last_message", (q) =>
          q.eq("organizationId", orgId)
        )
        .filter((q) => q.eq(q.field("type"), args.type))
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_organization_id_and_last_message", (q) =>
          q.eq("organizationId", orgId)
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    const conversationsWithAdditionalData = await Promise.all(
      conversations.page.map(async (conversation) => {
        let lastMessage: MessageDoc | null = null;

        const contactSession = await ctx.db.get(conversation.contactSessionId);

        if (!contactSession) return null;

        const messages = await supportAgent.listMessages(ctx, {
          threadId: conversation.threadId,
          paginationOpts: { numItems: 1, cursor: null },
        });

        if (messages.page.length > 0) {
          lastMessage = messages.page[0] ?? null;
        }

        return {
          ...conversation,
          contactSession,
          lastMessage,
        };
      }),
    );

    const validConversations = conversationsWithAdditionalData.filter(
      (conv): conv is NonNullable<typeof conv> => conv !== null,
    );

    return {
      ...conversations,
      page: validConversations,
    };
  },
});
