// import { ConvexError, v } from "convex/values";
// import { action, mutation, query } from "../_generated/server";
// import { components, internal } from "../_generated/api";
// import { supportAgent } from "../system/ai/agents/supportAgent";
// import { paginationOptsValidator } from "convex/server";
// import { saveMessage } from "@convex-dev/agent";
// import { generateText } from "ai";
// import { openai } from "@ai-sdk/openai";
// import { OPERATOR_MESSAGE_ENHANCEMENT_PROMPT } from "../system/ai/constants";

// export const enhanceResponse = action({
//   args: {
//     prompt: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const identity = await ctx.auth.getUserIdentity();

//     if (identity === null) {
//       throw new ConvexError({
//         code: "UNAUTHORIZED",
//         message: "Identity not found",
//       });
//     }

//     const orgId = identity.orgId as string;

//     if (!orgId) {
//       throw new ConvexError({
//         code: "UNAUTHORIZED",
//         message: "Organization not found",
//       });
//     }

//     const subscription = await ctx.runQuery(
//       internal.system.subscriptions.getByOrganizationId,
//       {
//         organizationId: orgId,
//       }
//     );

//     if (subscription?.status !== "active") {
//       throw new ConvexError({
//         code: "BAD_REQUEST",
//         message: "Subscription not active",
//       });
//     }

//     const response = await generateText({
//       model: openai("gpt-4o-mini"),
//       messages: [
//         {
//           role: "system",
//           content: OPERATOR_MESSAGE_ENHANCEMENT_PROMPT,
//         },
//         {
//           role: "user",
//           content: args.prompt,
//         },
//       ],
//     });

//     return response.text;
//   },
// });

// export const create = mutation({
//   args: {
//     prompt: v.string(),
//     conversationId: v.id("conversations"),
//   },
//   handler: async (ctx, args) => {
//     const identity = await ctx.auth.getUserIdentity();

//     if (identity === null) {
//       throw new ConvexError({
//         code: "UNAUTHORIZED",
//         message: "Identity not found",
//       });
//     }

//     const orgId = identity.orgId as string;

//     if (!orgId) {
//       throw new ConvexError({
//         code: "UNAUTHORIZED",
//         message: "Organization not found",
//       });
//     }

//     const conversation = await ctx.db.get(args.conversationId);

//     if (!conversation) {
//       throw new ConvexError({
//         code: "NOT_FOUND",
//         message: "Conversation not found",
//       });
//     }

//     if (conversation.organizationId !== orgId) {
//       throw new ConvexError({
//         code: "UNAUTHORIZED",
//         message: "You are not authorized to access this conversation",
//       });
//     }

//     if (conversation.status === "resolved") {
//       throw new ConvexError({
//         code: "BAD_REQUEST",
//         message: "Conversation already resolved",
//       });
//     }

//     if (conversation.status === "unresolved") {
//       await ctx.db.patch(args.conversationId, {
//         status: "escalated",
//       });
//     }

//     await saveMessage(ctx, components.agent, {
//       threadId: conversation.threadId,
//       agentName: identity.familyName,
//       message: {
//         role: "assistant",
//         content: args.prompt,
//       },
//     });
//   },
// });

// export const getMany = query({
//   args: {
//     threadId: v.string(),
//     paginationOpts: paginationOptsValidator,
//   },
//   handler: async (ctx, args) => {
//     const identity = await ctx.auth.getUserIdentity();

//     if (identity === null) {
//       throw new ConvexError({
//         code: "UNAUTHORIZED",
//         message: "Identity not found",
//       });
//     }

//     const orgId = identity.orgId as string;

//     if (!orgId) {
//       throw new ConvexError({
//         code: "UNAUTHORIZED",
//         message: "Organization not found",
//       });
//     }

//     const conversation = await ctx.db
//       .query("conversations")
//       .withIndex("by_thread_id", (q) => q.eq("threadId", args.threadId))
//       .unique();

//     if (!conversation) {
//       throw new ConvexError({
//         code: "NOT_FOUND",
//         message: "Conversation not found",
//       });
//     }

//     if (conversation.organizationId !== orgId) {
//       throw new ConvexError({
//         code: "UNAUTHORIZED",
//         message: "You are not authorized to access this conversation",
//       });
//     }

//     const paginated = await supportAgent.listMessages(ctx, {
//       threadId: args.threadId,
//       paginationOpts: args.paginationOpts,
//     });

//     return paginated;
//   },
// });

import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { supportAgent } from "../system/ai/agents/supportAgent";
import { paginationOptsValidator } from "convex/server";
import { saveMessage } from "@convex-dev/agent";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { OPERATOR_MESSAGE_ENHANCEMENT_PROMPT } from "../system/ai/constants";

export const enhanceResponse = action({
  args: {
    prompt: v.string(),
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

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: OPERATOR_MESSAGE_ENHANCEMENT_PROMPT,
        },
        {
          role: "user",
          content: args.prompt,
        },
      ],
    });

    return response.text;
  },
});

export const create = mutation({
  args: {
    prompt: v.string(),
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

    if (conversation.status === "resolved") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Conversation already resolved",
      });
    }

    if (conversation.status === "unresolved") {
      await ctx.db.patch(args.conversationId, {
        status: "escalated",
      });
    }

    await saveMessage(ctx, components.agent, {
      threadId: conversation.threadId,
      agentName: identity.familyName,
      message: {
        role: "assistant",
        content: args.prompt,
      },
    });

    // Actualizar lastMessageAt de la conversación
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    // Si es una conversación de WhatsApp, enviar el mensaje a WhatsApp
    console.log("YCloud Dashboard: verificando tipo de conversación", {
      conversationId: args.conversationId,
      conversationType: conversation.type,
      contactSessionId: conversation.contactSessionId,
    });

    if (conversation.type === "whatsapp") {
      const contactSession = await ctx.db.get(conversation.contactSessionId);
      
      console.log("YCloud Dashboard: contactSession obtenido", {
        conversationId: args.conversationId,
        hasContactSession: !!contactSession,
        email: contactSession?.email,
      });
      
      if (contactSession?.email?.startsWith("whatsapp:")) {
        const phoneNumber = contactSession.email.replace(/^whatsapp:/, "");
        
        console.log("YCloud Dashboard: programando envío a WhatsApp", {
          phone: phoneNumber,
          conversationId: args.conversationId,
          organizationId: conversation.organizationId,
          textLength: args.prompt.length,
        });
        
        // Programar envío en background
        await ctx.scheduler.runAfter(0, internal.system.ycloud.sendWhatsAppMessageFromMutation, {
          organizationId: conversation.organizationId,
          to: phoneNumber,
          text: args.prompt,
          conversationId: args.conversationId,
        });
        
        console.log("YCloud Dashboard: envío programado exitosamente");
      } else {
        console.error("YCloud Dashboard: email no tiene formato WhatsApp", {
          conversationId: args.conversationId,
          email: contactSession?.email,
        });
      }
    }
  },
});

export const getMany = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
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

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_thread_id", (q) => q.eq("threadId", args.threadId))
      .unique();

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

    const paginated = await supportAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });

    return paginated;
  },
});