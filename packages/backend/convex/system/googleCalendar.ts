import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const getConnectionForOrg = internalQuery({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();
  },
});

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("Google OAuth token refresh failed:", await response.text());
    return null;
  }

  const data = await response.json() as { access_token?: string };
  return data.access_token ?? null;
}

export const syncReservationToCalendar = internalAction({
  args: {
    organizationId: v.string(),
    reservationId: v.id("reservations"),
    barberName: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const connection = await ctx.runQuery(
      internal.system.googleCalendar.getConnectionForOrg,
      { organizationId: args.organizationId },
    );

    if (!connection) {
      console.log("Google Calendar: no hay cuenta conectada para esta organización, omitiendo sync");
      return;
    }

    const accessToken = await getAccessToken(connection.refreshToken);
    if (!accessToken) {
      console.error("Google Calendar: no se pudo obtener access token");
      return;
    }

    const calendarId = connection.calendarId ?? "primary";

    const descriptionParts = [
      `Cliente: ${args.customerName}`,
      `Teléfono: ${args.customerPhone}`,
    ];
    if (args.notes) descriptionParts.push(`Notas: ${args.notes}`);

    const event = {
      summary: `Reserva: ${args.customerName} con ${args.barberName}`,
      description: descriptionParts.join("\n"),
      start: { dateTime: new Date(args.startTime).toISOString() },
      end: { dateTime: new Date(args.endTime).toISOString() },
      attendees: [],
    };

    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );

    if (!eventResponse.ok) {
      const err = await eventResponse.text();
      console.error("Google Calendar: error al crear evento", err);
      return;
    }

    const createdEvent = await eventResponse.json() as { id?: string };
    const googleEventId = createdEvent.id;

    if (googleEventId) {
      await ctx.runMutation(
        internal.system.reservations.updateGoogleEventId,
        {
          reservationId: args.reservationId as Id<"reservations">,
          googleEventId,
        },
      );
      console.log("Google Calendar: evento creado correctamente", { googleEventId });
    }
  },
});
