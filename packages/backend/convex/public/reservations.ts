import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { barberNamesLooselyEqual } from "../lib/barberNameMatch";
import { scheduleReservationAudioReminder } from "../system/reservations";

export const listByDayForOrganization = query({
  args: {
    dayStart: v.number(),
    dayEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_organization_id_and_start_time", (q) =>
        q
          .eq("organizationId", identity.orgId as string)
          .gte("startTime", args.dayStart)
          .lte("startTime", args.dayEnd),
      )
      .collect();

    return reservations;
  },
});

export const createManual = mutation({
  args: {
    barberName: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    const overlapping = await ctx.db
      .query("reservations")
      .withIndex("by_organization_id_and_start_time", (q) =>
        q
          .eq("organizationId", identity.orgId as string)
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
      organizationId: identity.orgId as string,
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

export const cancelById = mutation({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation || reservation.organizationId !== identity.orgId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Reserva no encontrada",
      });
    }

    if (reservation.reminderJobId) {
      try {
        await ctx.scheduler.cancel(reservation.reminderJobId);
      } catch {
        // Job ya ejecutado o id inválido
      }
    }

    await ctx.db.patch(args.reservationId, {
      status: "cancelled",
      reminderJobId: undefined,
    });
  },
});

