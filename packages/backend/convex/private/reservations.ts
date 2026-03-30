import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { barberNamesLooselyEqual } from "../lib/barberNameMatch";
import { scheduleReservationAudioReminder } from "../system/reservations";

export const listByDay = query({
  args: {
    organizationId: v.string(),
    dayStart: v.number(),
    dayEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_organization_id_and_start_time", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .gte("startTime", args.dayStart)
          .lte("startTime", args.dayEnd),
      )
      .collect();

    return reservations;
  },
});

export const createFromChat = mutation({
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

    const overlappingForBarber = overlapping.filter(
      (r) =>
        r.status !== "cancelled" &&
        barberNamesLooselyEqual(r.barberName, args.barberName),
    );

    if (overlappingForBarber.length > 0) {
      throw new ConvexError({
        code: "CONFLICT",
        message:
          "Ya existe una reserva para ese barbero en el horario seleccionado.",
      });
    }

    const reservationId = await ctx.db.insert("reservations", {
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
      reservationId,
      args.startTime,
      args.customerPhone,
      "confirmed",
    );

    return reservationId;
  },
});

export const listAvailabilityForBarber = query({
  args: {
    organizationId: v.string(),
    barberName: v.string(),
    dayStart: v.number(),
    dayEnd: v.number(),
    slotDurationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const slotMinutes = args.slotDurationMinutes ?? 60;

    // Horario laboral fijo por ahora: 09:00 a 18:00 hora local del negocio.
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

