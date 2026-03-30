import z from "zod";
import { createTool } from "@convex-dev/agent";
import { internal } from "../../../_generated/api";
import { supportAgent } from "../agents/supportAgent";
import {
  bogotaDayBoundsFromYmd,
  bogotaLocalDateTimeToUtcMs,
  formatBogota,
  formatBogotaTimeOnly,
} from "../../../lib/bogotaTime";

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
  description:
    "Marca la conversación como resuelta. SOLO úsala cuando el cliente diga 'gracias', 'eso es todo' o deje de escribir DESPUÉS de que ya se haya creado la reserva con createReservationTool. NUNCA la llames si el cliente está pidiendo una reserva o esperando que se cree una.",
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
          "He marcado esta conversación como resuelta. Si en algún momento necesitas cambiar tu reserva o hacer una nueva, solo escríbenos de nuevo y con gusto te ayudamos.",
      },
    });

    return "Conversación resuelta";
  },
});

export const createReservationFromChat = createTool({
  description:
    "Crea la reserva. NO envíes timestamps Unix: el servidor calcula la hora (localDate YYYY-MM-DD + localHour24 en Bogotá). Si el horario ya está ocupado, el sistema avisa al cliente y le envía otros huecos libres ese día automáticamente.",
  args: z.object({
    barberName: z.string().describe("Nombre del barbero"),
    customerName: z.string().describe("Nombre del cliente"),
    customerPhone: z.string().describe("Teléfono o WhatsApp del cliente"),
    localDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe(
        "Día de la cita en Colombia (calendario Bogotá), formato estricto YYYY-MM-DD. Ej.: cliente dice mañana → fecha de mañana según la referencia Bogotá en tus instrucciones de sistema.",
      ),
    localHour24: z
      .number()
      .int()
      .min(0)
      .max(23)
      .describe(
        "Hora que pidió el cliente en Bogotá, 24h: 8 = 8:00 a.m., 14 = 2:00 p.m.",
      ),
    localMinute: z
      .number()
      .int()
      .min(0)
      .max(59)
      .optional()
      .default(0)
      .describe("Minutos, por defecto 0"),
    durationMinutes: z
      .number()
      .int()
      .min(60)
      .max(240)
      .optional()
      .default(60)
      .describe("Duración del turno en minutos; por defecto 60 (1 hora)"),
    notes: z
      .string()
      .optional()
      .describe("Notas opcionales (tipo de corte, barba, etc.)"),
  }),
  handler: async (ctx, args) => {
    if (!ctx.threadId) {
      return "Missing thread ID";
    }

    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      {
        threadId: ctx.threadId,
      },
    );

    if (!conversation) {
      return "Conversation not found";
    }

    let startTime: number;
    let endTime: number;
    try {
      startTime = bogotaLocalDateTimeToUtcMs(
        args.localDate,
        args.localHour24,
        args.localMinute ?? 0,
      );
      endTime = startTime + (args.durationMinutes ?? 60) * 60 * 1000;
    } catch {
      return "No pude interpretar la fecha u hora. Usa localDate YYYY-MM-DD y localHour24 0-23 (8 para las 8 a.m.).";
    }

    const result = await ctx.runMutation(
      internal.system.reservations.createFromAgent,
      {
        organizationId: conversation.organizationId,
        barberName: args.barberName,
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        startTime,
        endTime,
        notes: args.notes,
      },
    );

    if (!result.ok) {
      const requestedStartLabel = formatBogotaTimeOnly(startTime);
      const requestedEndLabel = formatBogotaTimeOnly(endTime);

      let conflictMessage: string;
      try {
        const bounds = bogotaDayBoundsFromYmd(args.localDate);
        const slots = await ctx.runQuery(
          internal.system.reservations.listAvailabilityForBarber,
          {
            organizationId: conversation.organizationId,
            barberName: args.barberName,
            dayStart: bounds.dayStart,
            dayEnd: bounds.dayEnd,
            slotDurationMinutes: args.durationMinutes ?? 60,
          },
        );

        if (slots.length === 0) {
          conflictMessage = `Ese horario con ${args.barberName} ya está ocupado (${requestedStartLabel} a ${requestedEndLabel} no está disponible).

Ese día no veo más huecos libres con ese barbero. ¿Puedes decirme otro día u otro barbero y lo agendamos?`;
        } else {
          const resumen = slots
            .slice(0, 12)
            .map((slot: { startTime: number; endTime: number }) => {
              const inicio = formatBogotaTimeOnly(slot.startTime);
              const fin = formatBogotaTimeOnly(slot.endTime);
              return `- ${inicio} a ${fin}`;
            })
            .join("\n");

          conflictMessage = `Ese horario con ${args.barberName} ya está reservado (${requestedStartLabel} a ${requestedEndLabel} no está libre).

Estos son otros horarios disponibles ese mismo día:
${resumen}

Responde con el que prefieras y te lo confirmo.`;
        }
      } catch {
        conflictMessage = `Ese horario con ${args.barberName} ya está ocupado (${requestedStartLabel} a ${requestedEndLabel}).

Dime otra hora o día y lo intentamos de nuevo.`;
      }

      await supportAgent.saveMessage(ctx, {
        threadId: ctx.threadId,
        message: {
          role: "assistant",
          content: conflictMessage,
        },
      });

      return "Horario ocupado: ya se envió al cliente el aviso y opciones de otros horarios (o que elija otro día/barbero).";
    }

    // Sincronizar con Google Calendar en segundo plano (no bloquea la respuesta)
    ctx.runAction(internal.system.googleCalendar.syncReservationToCalendar, {
      organizationId: conversation.organizationId,
      reservationId: result.id,
      barberName: args.barberName,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      startTime,
      endTime,
      notes: args.notes,
    }).catch((err: unknown) => {
      console.error("Google Calendar sync error (no crítico):", err);
    });

    const inicioBogota = formatBogota(startTime);
    const finBogota = formatBogotaTimeOnly(endTime);

    const confirmationText = `Listo, tu reserva quedó creada con éxito.

Barbero: ${args.barberName}
Día y hora (Colombia): ${inicioBogota}
Hasta aprox.: ${finBogota}
Cliente: ${args.customerName}

Si necesitas cambiar el horario, escríbenos.`;

    await supportAgent.saveMessage(ctx, {
      threadId: ctx.threadId,
      message: {
        role: "assistant",
        content: confirmationText,
      },
    });

    return `Reserva creada. Ya se envió confirmación al cliente con hora Colombia: ${inicioBogota}.`;
  },
});

export const listAvailabilityFromChat = createTool({
  description:
    "Lista huecos libres de un barbero en un día. Pasa localDate YYYY-MM-DD en Colombia (no milisegundos).",
  args: z.object({
    barberName: z.string().describe("Nombre del barbero"),
    localDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe(
        "Día a consultar en Bogotá, YYYY-MM-DD. Calcula según la referencia Bogotá en tus instrucciones de sistema si el cliente dice hoy/mañana.",
      ),
    slotDurationMinutes: z
      .number()
      .optional()
      .default(60)
      .describe(
        "Duración en minutos de cada hueco (igual que la cita; por defecto 60).",
      ),
  }),
  handler: async (ctx, args): Promise<unknown> => {
    if (!ctx.threadId) {
      return "Missing thread ID";
    }

    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      {
        threadId: ctx.threadId,
      },
    );

    if (!conversation) {
      return "Conversation not found";
    }

    let dayStart: number;
    let dayEnd: number;
    try {
      const bounds = bogotaDayBoundsFromYmd(args.localDate);
      dayStart = bounds.dayStart;
      dayEnd = bounds.dayEnd;
    } catch {
      return "Fecha inválida. Usa localDate como YYYY-MM-DD (día en Colombia).";
    }

    const slots = await ctx.runQuery(
      internal.system.reservations.listAvailabilityForBarber,
      {
        organizationId: conversation.organizationId,
        barberName: args.barberName,
        dayStart,
        dayEnd,
        slotDurationMinutes: args.slotDurationMinutes,
      },
    );

    if (slots.length === 0) {
      return "No hay horarios disponibles para ese barbero en el día seleccionado.";
    }

    const resumen = slots
      .slice(0, 10)
      .map((slot: { startTime: number; endTime: number }) => {
        const inicio = formatBogotaTimeOnly(slot.startTime);
        const fin = formatBogotaTimeOnly(slot.endTime);
        return `- ${inicio} a ${fin}`;
      })
      .join("\n");

    return `Horarios disponibles para ${args.barberName}:\n${resumen}`;
  },
});

