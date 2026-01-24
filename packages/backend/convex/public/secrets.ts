import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getSecretValue, parseSecretValue } from "../lib/secrets";
import type { GetSecretValueCommandOutput } from "@aws-sdk/client-secrets-manager";

type YCloudCredentials = {
  apiKey: string;
  wabaNumber?: string;
} | null;

export const getVapiSecrets = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: args.organizationId,
        service: "vapi",
      },
    );

    if (!plugin) return null;

    const secretName = plugin.secretName;
    if (!secretName) return null;

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
  },
});

export const getYCloudCredentials = internalAction({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args): Promise<YCloudCredentials> => {
    const plugin: {
      secretName?: string;
    } | null = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: args.organizationId,
        service: "ycloud",
      },
    );

    if (!plugin) {
      return null;
    }

    // Obtener credenciales desde AWS Secrets Manager
    if (plugin.secretName) {
      const secret: GetSecretValueCommandOutput = await getSecretValue(
        plugin.secretName,
      );

      const secretData: {
        apiKey: string;
        wabaNumber?: string;
      } | null = parseSecretValue<{
        apiKey: string;
        wabaNumber?: string; // Número de WhatsApp Business Account en formato E164 (ej: +573181833248)
      }>(secret);

      if (secretData?.apiKey) {
        return {
          apiKey: secretData.apiKey,
          wabaNumber: secretData.wabaNumber,
        };
      }
    }

    return null;
  },
});
