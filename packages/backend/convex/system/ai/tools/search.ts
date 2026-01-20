import { createTool } from "@convex-dev/agent";
import z from "zod";
import { internal } from "../../../_generated/api";
import rag from "../rag";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { supportAgent } from "../agents/supportAgent";
import { SEARCH_INTERPRETER_PROMPT } from "../constants";

export const search = createTool({
  description:
    "Search the knowledge base for relevant information to help answer user questions",
  args: z.object({
    query: z.string().describe("The search query to find relevant information"),
  }),
  handler: async (ctx, args) => {
    if (!ctx.threadId) {
      return "Missing thread ID";
    }

    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      { threadId: ctx.threadId },
    );

    if (!conversation) {
      return "Conversation not found";
    }

    const orgId = conversation?.organizationId;

    const searchResult = await rag.search(ctx, {
      namespace: orgId,
      query: args.query,
      limit: 5,
    });

    const contextText = `Encuetra resultados en ${searchResult.entries
      .map((e) => e.title || null)
      .filter((t) => t !== null)
      .join(", ")}. Aquí está el contexto:\n\n${searchResult.text}`;

    const response = await generateText({
      messages: [
        {
          role: "system",
          content: SEARCH_INTERPRETER_PROMPT,
        },
        {
          role: "user",
          content: `El usuario preguntó: ${args.query}\n\nBuscar resultados: ${contextText}`,
        },
      ],
      model: openai.chat("gpt-4o-mini"),
    });

    await supportAgent.saveMessage(ctx, {
      threadId: ctx.threadId,
      message: {
        role: "assistant",
        content: response.text,
      },
    });

    return response.text;
  },
});
