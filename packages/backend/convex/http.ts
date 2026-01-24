import { Webhook } from "svix";
import { createClerkClient } from "@clerk/backend";
import type { WebhookEvent } from "@clerk/backend";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY ?? "",
})

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, args) => {
    const event = await validateRequest(args);

    if (!event) {
      return new Response("Error acurred", { status: 400 });
    }

    switch (event.type) {
      case "subscription.updated": {
        const subscriptions = event.data as {
          status: string;
          payer?: {
            organization_id: string
          }
        };

        const organizationId = subscriptions.payer?.organization_id;

        if (!organizationId) {
          return new Response("Missing organization ID", { status: 400 });
        }

        const newMaxAllowedMemberships = subscriptions.status === "active" ? 5 : 1;

        await clerkClient.organizations.updateOrganization(organizationId, { maxAllowedMemberships: newMaxAllowedMemberships });

        await ctx.runMutation(internal.system.subscriptions.upsert, {
          organizationId,
          status: subscriptions.status,
        });

        break;
      }
      default:
        console.log("Ignored Clerk webhook event:", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

// Webhook YCloud - con organizationId en la ruta
// URL formato: /webhooks/ycloud/{organizationId}
http.route({
  pathPrefix: "/webhooks/ycloud/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Extraer organizationId de la URL
    // URL será algo como: https://xxx.convex.site/webhooks/ycloud/org_123abc
    const url = new URL(request.url);
    const pathname = url.pathname; // ej: "/webhooks/ycloud/org_123abc"
    const pathParts = pathname.split("/").filter(Boolean); // ["webhooks", "ycloud", "org_123abc"]
    
    // El organizationId debería estar después de "ycloud"
    const ycloudIndex = pathParts.indexOf("ycloud");
    
    if (ycloudIndex === -1 || ycloudIndex === pathParts.length - 1) {
      return new Response("Organization ID is required in URL path. Expected format: /webhooks/ycloud/{organizationId}", { status: 400 });
    }
    
    const organizationId = pathParts[ycloudIndex + 1];
    
    if (!organizationId || organizationId.trim() === "") {
      return new Response("Organization ID is required in URL path. Expected format: /webhooks/ycloud/{organizationId}", { status: 400 });
    }

    // Validar que la organización existe en Clerk
    try {
      await clerkClient.organizations.getOrganization({ organizationId });
    } catch (error) {
      console.error("Organization not found:", organizationId, error);
      return new Response("Organization not found", { status: 404 });
    }

    // Capturar el rawBody antes de parsear
    const rawBody = await request.text();
    
    // Parsear el JSON
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("Error parsing YCloud webhook body:", error);
      return new Response("Invalid JSON", { status: 400 });
    }

    // Obtener headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Loggear toda la información recibida con el organizationId
    // IMPORTANTE: Los logs NO aparecen en tu terminal. Ver en:
    // https://dashboard.convex.dev → tu proyecto → Logs → buscar "YCLOUD_WEBHOOK" o filtrar HTTP
    const timestamp = new Date().toISOString();
    
    // Log detallado para fácil búsqueda
    console.log("🔵 YCLOUD_WEBHOOK RECIBIDO");
    console.log("Organization ID:", organizationId);
    console.log("Timestamp:", timestamp);
    console.log("URL:", request.url);
    console.log("Headers:", JSON.stringify(headers, null, 2));
    console.log("Raw Body:", rawBody);
    console.log("Parsed Body:", JSON.stringify(body, null, 2));
    
    // Log estructurado para búsqueda
    const logData = {
      type: "YCLOUD_WEBHOOK",
      organizationId,
      timestamp,
      url: request.url,
      headers,
      rawBody,
      parsedBody: body,
    };
    console.log("YCLOUD_WEBHOOK_DATA:", JSON.stringify(logData));

    // Guardar conversaciones (como widget) para mensajes entrantes de WhatsApp
    const parsed = body as {
      id?: string;
      type?: string;
      whatsappInboundMessage?: {
        id?: string; // ID del mensaje entrante (para markAsRead)
        wamid?: string; // ID del mensaje para reply (YCloud puede usar wamid o id)
        from?: string;
        customerProfile?: { name?: string };
        type?: string;
        text?: { body?: string };
      };
    };

    if (parsed.type === "whatsapp.inbound_message.received" && parsed.whatsappInboundMessage) {
      const evt = parsed.whatsappInboundMessage;
      const eventId = parsed.id ?? `evt_${Date.now()}`;
      const inboundMessageId = evt.id; // ID del mensaje entrante para markAsRead
      const wamid = evt.wamid ?? evt.id; // wamid para context.message_id al responder
      const phone = evt.from ?? "";
      const name = (evt.customerProfile?.name ?? "").trim() || phone;
      const text =
        evt.type === "text" && evt.text?.body
          ? String(evt.text.body).trim()
          : "";

      if (phone && text) {
        const dedupe = await ctx.runMutation(internal.system.ycloud.recordProcessedEvent, {
          eventId,
        });
        if (dedupe.duplicate) {
          console.log("YCloud: evento ya procesado (duplicado), skip", { eventId, phone });
        } else {
          console.log("YCloud: persistiendo conversación (sync)", { eventId, phone, text: text.slice(0, 50) });
          try {
            // Marcar el mensaje como leído (opcional, no bloquea el flujo si falla)
            if (inboundMessageId) {
              ctx.runAction(internal.system.ycloud.markInboundMessageAsRead, {
                organizationId,
                inboundMessageId,
              }).catch((err) => {
                console.error("YCloud: error al marcar como leído (no crítico)", {
                  inboundMessageId,
                  error: err instanceof Error ? err.message : String(err),
                });
              });
            }

            await ctx.runAction(internal.system.ycloud.processInboundMessage, {
              organizationId,
              eventId,
              phone,
              name,
              text,
              wamid, // Pasar el wamid para poder hacer reply
            });
            console.log("YCloud: conversación guardada OK", { eventId, phone });
          } catch (err) {
            console.error("YCloud: error al persistir", {
              eventId,
              phone,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      } else {
        console.log("YCloud: skip (no phone o no text)", { phone: !!phone, hasText: !!text, type: evt.type });
      }
    }

    // Responder OK para que YCloud sepa que recibimos el webhook
    return new Response(JSON.stringify({ 
      ok: true, 
      organizationId,
      receivedAt: new Date().toISOString(),
      message: "Webhook recibido correctamente"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
});

// Endpoint GET para verificar que el webhook está funcionando
// Útil para probar: GET /webhooks/ycloud/{organizationId}
http.route({
  pathPrefix: "/webhooks/ycloud/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const pathParts = pathname.split("/").filter(Boolean);
    const ycloudIndex = pathParts.indexOf("ycloud");
    
    if (ycloudIndex === -1 || ycloudIndex === pathParts.length - 1) {
      return new Response("Organization ID is required in URL path", { status: 400 });
    }
    
    const organizationId = pathParts[ycloudIndex + 1];
    
    if (!organizationId) {
      return new Response("Organization ID is required", { status: 400 });
    }

    // Validar que la organización existe
    try {
      const org = await clerkClient.organizations.getOrganization({ organizationId });
      return new Response(JSON.stringify({
        ok: true,
        message: "Webhook endpoint activo",
        organizationId,
        organizationName: org.name,
        webhookUrl: `${url.origin}/webhooks/ycloud/${organizationId}`,
        instructions: "Envía un POST a esta URL para recibir webhooks de YCloud"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Organization not found",
        organizationId
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET ?? "");

  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return null;
  }
}


export default http;