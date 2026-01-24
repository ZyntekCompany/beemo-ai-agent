// import { Vapi, VapiClient } from '@vapi-ai/server-sdk';
// import { internal } from '../_generated/api';
// import { action } from '../_generated/server';
// import { getSecretValue, parseSecretValue } from '../lib/secrets';
// import { ConvexError } from 'convex/values';

// export const getAssitants = action({
//   args: {},
//   handler: async (ctx): Promise<Vapi.Assistant[]> => {
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

//     const plugin = await ctx.runQuery(
//       internal.system.plugins.getByOrganizationIdAndService,
//       {
//         organizationId: orgId,
//         service: "vapi"
//       }
//     );

//     if (!plugin) {
//       throw new ConvexError({
//         code: "NOT_FOUND",
//         message: "Plugin not found",
//       })
//     }

//     const secretName = plugin.secretName;
//     const secretValue = await getSecretValue(secretName);
//     const secretData = parseSecretValue<{
//       secretApiKey: string;
//       publicApiKey: string;
//     }>(secretValue);

//     if (!secretData) {
//       throw new ConvexError({
//         code: "NOT_FOUND",
//         message: "Credentials not found",
//       })
//     }

//     if (!secretData.secretApiKey || !secretData.publicApiKey) {
//       throw new ConvexError({
//         code: "NOT_FOUND",
//         message: `Credentials incomplete. Please reconnect your Vapi account. ${secretData.secretApiKey} ${secretData.publicApiKey}`,
//       })
//     }

//     const vapiClient = new VapiClient({
//       token: secretData.secretApiKey
//     })

//     const assistants = await vapiClient.assistants.list();

//     return assistants;
//   }
// })

// export const getPhoneNumbers = action({
//   args: {},
//   handler: async (ctx): Promise<Vapi.ListPhoneNumbersResponseItem[]> => {
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

//     const plugin = await ctx.runQuery(
//       internal.system.plugins.getByOrganizationIdAndService,
//       {
//         organizationId: orgId,
//         service: "vapi"
//       }
//     );

//     if (!plugin) {
//       throw new ConvexError({
//         code: "NOT_FOUND",
//         message: "Plugin not found",
//       })
//     }

//     const secretName = plugin.secretName;
//     const secretValue = await getSecretValue(secretName);
//     const secretData = parseSecretValue<{
//       secretApiKey: string;
//       publicApiKey: string;
//     }>(secretValue);

//     if (!secretData) {
//       throw new ConvexError({
//         code: "NOT_FOUND",
//         message: "Credentials not found",
//       })
//     }

//     if (!secretData.secretApiKey || !secretData.publicApiKey) {
//       throw new ConvexError({
//         code: "NOT_FOUND",
//         message: "Credentials incomplete. Please reconnect your Vapi account.",
//       })
//     }

//     const vapiData = new VapiClient({
//       token: secretData.secretApiKey
//     })

//     const phoneNumbers = await vapiData.phoneNumbers.list();

//     return phoneNumbers;
//   }
// })

import { Vapi, VapiClient } from '@vapi-ai/server-sdk';
import { internal } from '../_generated/api';
import { action } from '../_generated/server';
import { getSecretValue, parseSecretValue } from '../lib/secrets';
import { ConvexError } from 'convex/values';

export const getAssitants = action({
  args: {},
  handler: async (ctx): Promise<Vapi.Assistant[]> => {
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

    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: orgId,
        service: "vapi"
      }
    );

    if (!plugin) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Plugin not found",
      })
    }

    const secretName = plugin.secretName;
    if (!secretName) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Vapi credentials not configured. Please configure them via the Vapi plugin.",
      })
    }

    const secretValue = await getSecretValue(secretName);
    const secretData = parseSecretValue<{
      secretApiKey: string;
      publicApiKey: string;
    }>(secretValue);

    if (!secretData) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credentials not found",
      })
    }

    if (!secretData.secretApiKey || !secretData.publicApiKey) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: `Credentials incomplete. Please reconnect your Vapi account. ${secretData.secretApiKey} ${secretData.publicApiKey}`,
      })
    }

    const vapiClient = new VapiClient({
      token: secretData.secretApiKey
    })

    const assistants = await vapiClient.assistants.list();

    return assistants;
  }
})

export const getPhoneNumbers = action({
  args: {},
  handler: async (ctx): Promise<Vapi.ListPhoneNumbersResponseItem[]> => {
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

    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: orgId,
        service: "vapi"
      }
    );

    if (!plugin) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Plugin not found",
      })
    }

    const secretName = plugin.secretName;
    if (!secretName) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Vapi credentials not configured. Please configure them via the Vapi plugin.",
      })
    }

    const secretValue = await getSecretValue(secretName);
    const secretData = parseSecretValue<{
      secretApiKey: string;
      publicApiKey: string;
    }>(secretValue);

    if (!secretData) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credentials not found",
      })
    }

    if (!secretData.secretApiKey || !secretData.publicApiKey) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credentials incomplete. Please reconnect your Vapi account.",
      })
    }

    const vapiData = new VapiClient({
      token: secretData.secretApiKey
    })

    const phoneNumbers = await vapiData.phoneNumbers.list();

    return phoneNumbers;
  }
})