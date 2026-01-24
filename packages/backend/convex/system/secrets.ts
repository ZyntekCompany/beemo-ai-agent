import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { upsertSecret } from "../lib/secrets";

export const upsert = internalAction({
  args: {
    organizationId: v.string(),
    service: v.union(v.literal("vapi"), v.literal("ycloud")),
    value: v.any()
  },
  handler: async (ctx, args) => {
    try {
      const secretName = `tenant/${args.organizationId}/${args.service}`;
      await upsertSecret(secretName, args.value);

      // Store only the secretName and service, all credentials go to AWS Secrets Manager
      await ctx.runMutation(internal.system.plugins.upsert, {
        service: args.service,
        secretName,
        organizationId: args.organizationId,
      });
    } catch (error) {
      console.error("Error upserting secret:", error);
      throw error;
    }

    return { status: "success" };
  }
})