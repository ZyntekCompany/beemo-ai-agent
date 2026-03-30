import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { barberNamesLooselyEqual } from "../lib/barberNameMatch";
import { normalizeCustomerPhoneE164 } from "../lib/phoneE164";
import { DEFAULT_RESERVATION_REMINDER_AUDIO_URL } from "../lib/reservationReminder";

const TEN_MIN_MS = 10 * 60 * 1000;

export async function scheduleReservationAudioReminder(
  ctx: MutationCtx,
  reservationId: Id<"reservations">,
  startTime: number,
  customerPhone: string,
  status: "pending" | "confirmed" | "cancelled",
): Promise<void> {
  if (status !== "confirmed") return;
  if (!customerPhone.trim()) return;

  const runAt = startTime - TEN_MIN_MS;
  if (runAt <= Date.now()) return;

  const jobId = await ctx.scheduler.runAt(
    runAt,
    internal.system.reservations.deliverScheduledReservationAudioReminder,
    { reservationId },
  );

  await ctx.db.patch(reservationId, { reminderJobId: jobId });
}

export const createFromAgent = internalMutation({
  args: {
    organizationId: v.string(),
    barberName: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const overlapping = await ctx.db
      .query("reservations")
      .withIndex("by_organization_id_and_start_time", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .gte("startTime", args.startTime)
          .lt("startTime", args.endTime),
      )
      .collect();

    const conflict = overlapping.some(
      (r) =>
        r.status !== "cancelled" &&
        barberNamesLooselyEqual(r.barberName, args.barberName),
    );
    if (conflict) {
      return { ok: false as const, error: "CONFLICT" };
    }

    const id = await ctx.db.insert("reservations", {
      organizationId: args.organizationId,
      barberName: args.barberName,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      startTime: args.startTime,
      endTime: args.endTime,
      status: "confirmed",
      notes: args.notes,
      googleEventId: undefined,
    });

    await scheduleReservationAudioReminder(
      ctx,
      id,
      args.startTime,
      args.customerPhone,
      "confirmed",
    );

    return { ok: true as const, id };
  },
});

export const listAvailabilityForBarber = internalQuery({
  args: {
    organizationId: v.string(),
    barberName: v.string(),
    dayStart: v.number(),
    dayEnd: v.number(),
    slotDurationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const slotMinutes = args.slotDurationMinutes ?? 60;
    const businessStart = args.dayStart + 9 * 60 * 60 * 1000;
    const businessEnd = args.dayStart + 18 * 60 * 60 * 1000;

    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_organization_id_and_start_time", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .gte("startTime", args.dayStart)
          .lte("startTime", args.dayEnd),
      )
      .collect();

    const barberReservations = reservations.filter(
      (r) => barberNamesLooselyEqual(r.barberName, args.barberName),
    );

    const slots: { startTime: number; endTime: number }[] = [];
    for (
      let ts = businessStart;
      ts + slotMinutes * 60 * 1000 <= businessEnd;
      ts += slotMinutes * 60 * 1000
    ) {
      const slotStart = ts;
      const slotEnd = ts + slotMinutes * 60 * 1000;

      const overlaps = barberReservations.some(
        (r) =>
          !(r.endTime <= slotStart || r.startTime >= slotEnd) &&
          r.status !== "cancelled",
      );

      if (!overlaps) {
        slots.push({ startTime: slotStart, endTime: slotEnd });
      }
    }

    return slots;
  },
});

export const updateGoogleEventId = internalMutation({
  args: {
    reservationId: v.id("reservations"),
    googleEventId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reservationId as Id<"reservations">, {
      googleEventId: args.googleEventId,
    });
  },
});

export const getReservationInternal = internalQuery({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reservationId);
  },
});

export const markReservationReminderSent = internalMutation({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reservationId, {
      reminderSentAt: Date.now(),
      reminderJobId: undefined,
    });
  },
});

/**
 * Ejecutado por el scheduler ~10 min antes del inicio: envía el audio por YCloud.
 */
export const deliverScheduledReservationAudioReminder = internalAction({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, args): Promise<void> => {
    const reservation = await ctx.runQuery(
      internal.system.reservations.getReservationInternal,
      { reservationId: args.reservationId },
    );

    if (!reservation || reservation.status !== "confirmed") {
      return;
    }

    if (reservation.reminderSentAt != null) {
      return;
    }

    const to = normalizeCustomerPhoneE164(reservation.customerPhone);
    if (!to) {
      console.warn("Reservation reminder: teléfono inválido", {
        reservationId: args.reservationId,
      });
      return;
    }

    const audioUrl =
      process.env.RESERVATION_REMINDER_AUDIO_URL?.trim() ||
      DEFAULT_RESERVATION_REMINDER_AUDIO_URL;

    try {
      await ctx.runAction(internal.system.ycloud.sendWhatsAppAudio, {
        organizationId: reservation.organizationId,
        to,
        audioLink: audioUrl,
        sendDirectly: true,
      });
      await ctx.runMutation(
        internal.system.reservations.markReservationReminderSent,
        { reservationId: args.reservationId },
      );
    } catch (e) {
      console.error("Reservation reminder YCloud audio falló", {
        reservationId: args.reservationId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
});
