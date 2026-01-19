import z from "zod";
import { createTool } from "@convex-dev/agent";
import { internal } from "../../../_generated/api";
import { supportAgent } from "../agents/supportAgent";

export const escalateConversation = createTool({
  description: "Escalate a conversation to a human agent",
  args: z.object({}),
  handler: async (ctx) => {
    if (!ctx.threadId) {
      return "Missing thread ID";
    }

    await ctx.runMutation(internal.system.conversations.escalate, {
      threadId: ctx.threadId,
    });

    await supportAgent.saveMessage(ctx, {
      threadId: ctx.threadId,
      message: {
        role: "assistant",
        content:
          "He escalado su consulta a un especialista para brindarle una mejor atención. Se pondrán en contacto con usted a la brevedad. ¡Gracias por su paciencia! 🚀",
      },
    });

    return "Conversación escalada";
  },
});

export const resolveConversation = createTool({
  description: "Resolve a conversation",
  args: z.object({}),
  handler: async (ctx) => {
    if (!ctx.threadId) {
      return "Missing thread ID";
    }

    await ctx.runMutation(internal.system.conversations.resolve, {
      threadId: ctx.threadId,
    });

    await supportAgent.saveMessage(ctx, {
      threadId: ctx.threadId,
      message: {
        role: "assistant",
        content:
          "He marcado esta conversación como resuelta. Si necesita asistencia adicional en el futuro, no dude en contactarnos nuevamente. ¡Que tenga un excelente día! ✨",
      },
    });

    return "Conversación resuelta";
  },
});
