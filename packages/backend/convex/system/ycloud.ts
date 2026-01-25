import { v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { supportAgent } from "./ai/agents/supportAgent";
import { saveMessage, MessageDoc } from "@convex-dev/agent";
import { components } from "../_generated/api";
import {
  escalateConversation,
  resolveConversation,
} from "./ai/tools/resolveConversation";
import { search } from "./ai/tools/search";
import { getSecretValue, parseSecretValue } from "../lib/secrets";
import { Id } from "../_generated/dataModel";
import type { PaginationResult } from "convex/server";

type YCloudApiResponse = {
  id?: string;
  status?: string;
  [key: string]: unknown;
};

const WHATSAPP_SESSION_DURATION_MS = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years

/**
 * Deduplicación: evita procesar el mismo webhook YCloud dos veces (reintentos).
 * Solo guarda eventId. Las conversaciones están en conversations + contactSessions.
 */
export const recordProcessedEvent = internalMutation({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ycloudProcessedEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .unique();
    if (existing) {
      return { duplicate: true };
    }
    await ctx.db.insert("ycloudProcessedEvents", { eventId: args.eventId });
    return { duplicate: false };
  },
});

/**
 * Obtiene o crea una contactSession para un contacto de WhatsApp.
 * Identificador: email = "whatsapp:+573181833248", name desde customerProfile.
 */
export const getOrCreateWhatsAppContact = internalMutation({
  args: {
    organizationId: v.string(),
    phone: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = `whatsapp:${args.phone}`;
    const existing = await ctx.db
      .query("contactSessions")
      .withIndex("by_organization_id_and_email", (q) =>
        q.eq("organizationId", args.organizationId).eq("email", email),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const expiresAt = now + WHATSAPP_SESSION_DURATION_MS;
    return await ctx.db.insert("contactSessions", {
      name: args.name || args.phone,
      email,
      organizationId: args.organizationId,
      expiresAt,
    });
  },
});

/**
 * Obtiene la conversación unresolved más reciente del contacto o crea una nueva
 * (thread + mensaje de bienvenida + conversación), igual que el widget.
 */
export const getOrCreateConversation = internalMutation({
  args: {
    organizationId: v.string(),
    contactSessionId: v.id("contactSessions"),
  },
  handler: async (ctx, args) => {
    // Buscar todas las conversaciones del contacto, ordenadas por más reciente
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_contact_session_id", (q) =>
        q.eq("contactSessionId", args.contactSessionId),
      )
      .order("desc")
      .collect();

    // Primero buscar una conversación unresolved (activa)
    const unresolvedConversation = allConversations.find(
      (c) => c.status === "unresolved",
    );
    if (unresolvedConversation) {
      return {
        conversationId: unresolvedConversation._id,
        threadId: unresolvedConversation.threadId,
      };
    }

    // Si hay una conversación "escalated" (solo humano), reutilizarla PERO mantener el status
    // No cambiar a "unresolved" porque el usuario quiere que sea solo humano
    const escalatedConversation = allConversations.find(
      (c) => c.status === "escalated",
    );
    if (escalatedConversation) {
      // Mantener el status como "escalated" - NO cambiar a "unresolved"
      return {
        conversationId: escalatedConversation._id,
        threadId: escalatedConversation.threadId,
      };
    }

    // Si solo hay conversaciones "resolved", reutilizar la más reciente y reactivarla
    // Esto permite que el usuario pueda volver a conversar después de resolver
    if (allConversations.length > 0) {
      const latestConversation = allConversations[0];
      if (!latestConversation) {
        // Esto no debería pasar, pero TypeScript lo requiere
        throw new Error("No conversations found");
      }
      // Solo cambiar a unresolved si estaba "resolved"
      if (latestConversation.status === "resolved") {
        await ctx.db.patch(latestConversation._id, {
          status: "unresolved",
        });
      }
      return {
        conversationId: latestConversation._id,
        threadId: latestConversation.threadId,
      };
    }

    const widgetSettings = await ctx.db
      .query("widgetSettings")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    const { threadId } = await supportAgent.createThread(ctx, {
      userId: args.organizationId,
    });

    const greetMessage =
      widgetSettings?.greetMessage ??
      "¡Hola! Soy Beemo, su asistente virtual. ¿En qué puedo ayudarle el día de hoy? ✨";

    await saveMessage(ctx, components.agent, {
      threadId,
      message: {
        role: "assistant",
        content: greetMessage,
      },
    });

    const conversationId = await ctx.db.insert("conversations", {
      contactSessionId: args.contactSessionId,
      status: "unresolved",
      type: "whatsapp",
      organizationId: args.organizationId,
      threadId,
    });

    return { conversationId, threadId };
  },
});

/**
 * Procesa un mensaje entrante de WhatsApp: guarda el mensaje del usuario y
 * ejecuta el agente (igual que el widget). Se ejecuta como action por el AI.
 * Después de que el agente responda, envía automáticamente la respuesta a WhatsApp.
 */
export const processInboundMessage = internalAction({
  args: {
    organizationId: v.string(),
    eventId: v.string(),
    phone: v.string(),
    name: v.string(),
    text: v.string(),
    wamid: v.optional(v.string()), // ID del mensaje para poder hacer reply
  },
  handler: async (ctx, args): Promise<void> => {
    try {
      const contactSessionId: Id<"contactSessions"> = await ctx.runMutation(
        internal.system.ycloud.getOrCreateWhatsAppContact,
        {
          organizationId: args.organizationId,
          phone: args.phone,
          name: args.name,
        },
      );

      const {
        conversationId,
        threadId,
      }: { conversationId: Id<"conversations">; threadId: string } =
        await ctx.runMutation(internal.system.ycloud.getOrCreateConversation, {
          organizationId: args.organizationId,
          contactSessionId,
        });

      const conversation: { status: string } | null = await ctx.runQuery(
        internal.system.conversations.getByThreadId,
        { threadId },
      );
      if (!conversation) {
        console.error("YCloud: conversation not found after getOrCreate", {
          threadId,
          conversationId,
        });
        return;
      }

      // Obtener el contactSession para verificar si es WhatsApp y obtener el teléfono
      const contactSession: { email: string } | null = await ctx.runQuery(
        internal.system.contactSession.getOne,
        { contactSessionId },
      );

      const isWhatsApp: boolean =
        contactSession?.email?.startsWith("whatsapp:") ?? false;

      const shouldTriggerAgent: boolean = conversation.status === "unresolved";

      if (shouldTriggerAgent) {
        // Ejecutar el agente
        await supportAgent.generateText(
          ctx,
          { threadId },
          {
            prompt: args.text,
            tools: {
              escalateConversationTool: escalateConversation,
              resolveConversationTool: resolveConversation,
              searchTool: search,
            },
          },
        );

        // Si es WhatsApp, obtener el último mensaje del agente y enviarlo
        if (isWhatsApp) {
          try {
            // Esperar un poco para asegurar que el mensaje se guardó
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Obtener los mensajes después de que el agente responda
            const messagesAfter: PaginationResult<MessageDoc> =
              await supportAgent.listMessages(ctx, {
                threadId,
                paginationOpts: { numItems: 10, cursor: null },
              });

            // Encontrar el último mensaje del agente (role: "assistant")
            // Los mensajes vienen ordenados del más reciente al más antiguo
            const lastAssistantMessage: MessageDoc | undefined =
              messagesAfter.page.find(
                (msg) => msg.message?.role === "assistant",
              );

            if (lastAssistantMessage?.message) {
              const messageContent = lastAssistantMessage.message.content;
              const messageText: string =
                typeof messageContent === "string"
                  ? messageContent
                  : Array.isArray(messageContent)
                    ? messageContent
                        .map((part: { type: string; text?: string }) =>
                          part.type === "text" ? (part.text ?? "") : "",
                        )
                        .join("")
                    : String(messageContent);

              if (messageText.trim() && contactSession?.email) {
                // Extraer el número de teléfono del email (formato: "whatsapp:+573181833248")
                const phoneNumber: string = contactSession.email.replace(
                  /^whatsapp:/,
                  "",
                );

                // Enviar el mensaje a WhatsApp usando la API de YCloud
                // Las credenciales se obtienen automáticamente desde AWS Secrets
                // NO usar wamid para enviar mensajes normales (no replies)
                await ctx.runAction(
                  internal.system.ycloud.sendWhatsAppMessage,
                  {
                    organizationId: args.organizationId,
                    to: phoneNumber,
                    text: messageText,
                    // wamid: undefined - No hacer reply, enviar mensaje normal
                    sendDirectly: false, // Usar cola asíncrona (POST /v2/whatsapp/messages)
                  },
                );

                console.log("YCloud: mensaje del agente enviado a WhatsApp", {
                  phone: phoneNumber,
                  threadId,
                  messageLength: messageText.length,
                });
              }
            }
          } catch (sendError) {
            console.error("YCloud: error al enviar mensaje a WhatsApp", {
              error:
                sendError instanceof Error
                  ? sendError.message
                  : String(sendError),
              phone: args.phone,
              threadId,
            });
            // No lanzar el error para no interrumpir el flujo principal
          }
        }
      } else {
        await saveMessage(ctx, components.agent, {
          threadId,
          prompt: args.text,
        });
      }
    } catch (err) {
      console.error("YCloud processInboundMessage ERROR", {
        eventId: args.eventId,
        organizationId: args.organizationId,
        phone: args.phone,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw err;
    }
  },
});

/**
 * Wrapper para enviar mensajes desde mutations usando scheduler.
 * Esta función maneja los errores y los registra correctamente.
 */
export const sendWhatsAppMessageFromMutation = internalAction({
  args: {
    organizationId: v.string(),
    to: v.string(),
    text: v.string(),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args): Promise<void> => {
    console.log("YCloud Wrapper: iniciando envío a WhatsApp", {
      conversationId: args.conversationId,
      phone: args.to,
      organizationId: args.organizationId,
      textLength: args.text.length,
    });

    try {
      const result = await ctx.runAction(internal.system.ycloud.sendWhatsAppMessage, {
        organizationId: args.organizationId,
        to: args.to,
        text: args.text,
        sendDirectly: false,
      });
      
      console.log("YCloud Wrapper: mensaje enviado exitosamente", {
        conversationId: args.conversationId,
        phone: args.to,
        messageId: result?.id,
        status: result?.status,
      });
    } catch (error) {
      console.error("YCloud Wrapper: ERROR al enviar mensaje", {
        conversationId: args.conversationId,
        phone: args.to,
        organizationId: args.organizationId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
});

/**
 * Envía un mensaje a WhatsApp usando la API de YCloud.
 * @param organizationId - ID de la organización
 * @param to - Número de destino en formato E164 (ej: +573181833248)
 * @param text - Texto del mensaje
 * @param wamid - (Opcional) ID del mensaje al que se responde (para hacer reply)
 * @param sendDirectly - Si es true, usa sendDirectly endpoint (síncrono, para OTP). Si es false, usa cola (asíncrono)
 */
export const sendWhatsAppMessage = internalAction({
  args: {
    organizationId: v.string(),
    to: v.string(),
    text: v.string(),
    wamid: v.optional(v.string()),
    sendDirectly: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<YCloudApiResponse> => {
    // Obtener credenciales desde AWS Secrets Manager
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: args.organizationId,
        service: "ycloud",
      },
    );

    if (!plugin) {
      throw new Error("YCloud plugin not found for this organization");
    }

    const secretName = plugin.secretName;
    if (!secretName) {
      throw new Error(
        "YCloud credentials not configured. Please configure them via the YCloud plugin.",
      );
    }

    const secretValue = await getSecretValue(secretName);
    const credentials = parseSecretValue<{
      apiKey: string;
      wabaNumber?: string;
    }>(secretValue);

    if (!credentials) {
      throw new Error("YCloud credentials not found in AWS Secrets Manager");
    }

    if (!credentials.apiKey) {
      throw new Error(
        "YCloud API key not configured. Please configure it via the YCloud plugin.",
      );
    }

    if (!credentials.wabaNumber) {
      throw new Error(
        "WhatsApp Business Account number (wabaNumber) not configured for this organization. Please configure it via the YCloud plugin.",
      );
    }

    const endpoint: string = args.sendDirectly
      ? "https://api.ycloud.com/v2/whatsapp/messages/sendDirectly"
      : "https://api.ycloud.com/v2/whatsapp/messages";

    const body: {
      from: string;
      to: string;
      type: string;
      text: { body: string };
      context?: { message_id: string };
    } = {
      from: credentials.wabaNumber,
      to: args.to,
      type: "text",
      text: {
        body: args.text,
      },
    };

    // Si se proporciona wamid, agregar contexto para hacer reply
    if (args.wamid) {
      body.context = {
        message_id: args.wamid,
      };
    }

    const response: Response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": credentials.apiKey,
      },
      body: JSON.stringify(body),
    });

    const responseText: string = await response.text();

    if (!response.ok) {
      // Intentar parsear el error para dar un mensaje más claro
      let errorMessage = `YCloud API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.error?.message) {
          errorMessage = `YCloud API error: ${errorJson.error.message}`;
          if (errorJson.error.code === "WHATSAPP_PHONE_NUMBER_UNAVAILABLE") {
            errorMessage = `El número de WhatsApp Business Account (${body.from}) no está registrado en YCloud. Por favor, regístralo en tu dashboard de YCloud o verifica que estés usando el número correcto.`;
          }
        }
      } catch {
        // Si no se puede parsear, usar el texto completo
        errorMessage = `YCloud API error: ${response.status} ${response.statusText} - ${responseText}`;
      }
      
      throw new Error(errorMessage);
    }

    let result: YCloudApiResponse;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("YCloud sendWhatsAppMessage: error parsing response", {
        responseText,
        error:
          parseError instanceof Error ? parseError.message : String(parseError),
      });
      throw new Error(`YCloud API returned invalid JSON: ${responseText}`);
    }

    console.log("YCloud sendWhatsAppMessage: éxito", {
      messageId: result.id,
      status: result.status,
    });

    return result;
  },
});

/**
 * Marca un mensaje entrante como leído.
 * @param organizationId - ID de la organización
 * @param inboundMessageId - ID del mensaje entrante (del webhook)
 */
export const markInboundMessageAsRead = internalAction({
  args: {
    organizationId: v.string(),
    inboundMessageId: v.string(),
  },
  handler: async (ctx, args): Promise<YCloudApiResponse> => {
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: args.organizationId,
        service: "ycloud",
      },
    );

    if (!plugin) {
      throw new Error("YCloud plugin not found for this organization");
    }

    const secretName = plugin.secretName;
    if (!secretName) {
      throw new Error(
        "YCloud credentials not configured. Please configure them via the YCloud plugin.",
      );
    }

    const secretValue = await getSecretValue(secretName);
    const credentials = parseSecretValue<{
      apiKey: string;
      wabaNumber?: string;
    }>(secretValue);

    if (!credentials) {
      throw new Error("YCloud credentials not found in AWS Secrets Manager");
    }

    if (!credentials.apiKey) {
      throw new Error("YCloud API key not configured");
    }

    const endpoint = `https://api.ycloud.com/v2/whatsapp/inboundMessages/${args.inboundMessageId}/markAsRead`;

    const response: Response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": credentials.apiKey,
      },
    });

    if (!response.ok) {
      const errorText: string = await response.text();
      throw new Error(
        `YCloud API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result: YCloudApiResponse = await response.json();
    return result;
  },
});
