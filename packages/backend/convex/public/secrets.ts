import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { getSecretValue, parseSecretValue } from "../lib/secrets";

export const getVapiSecrets = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const plugin = await ctx.runQuery(internal.system.plugins.getByOrganizationIdAndService, {
      organizationId: args.organizationId,
      service: "vapi",
    });

    if (!plugin) return null;

    const secretName = plugin.secretName;
    const secret = await getSecretValue(secretName);

    const secretData = parseSecretValue<{
      secretApiKey: string;
      publicApiKey: string;
    }>(secret);

    if (!secretData) return null;

    if (!secretData.publicApiKey) return null;
    if (!secretData.secretApiKey) return null;

    return {
      publicApiKey: secretData.publicApiKey,
    };
  }
})