import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  subscriptions: defineTable({
    organizationId: v.string(),
    status: v.string(),
  }).index("by_organization_id", ["organizationId"]),
  widgetSettings: defineTable({
    organizationId: v.string(),
    greetMessage: v.string(),
    defaultSuggestions: v.object({
      suggestion1: v.optional(v.string()),
      suggestion2: v.optional(v.string()),
      suggestion3: v.optional(v.string()),
    }),
    vapiSettings: v.object({
      assistantId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    }),
  }).index("by_organization_id", ["organizationId"]),
  plugins: defineTable({
    organizationId: v.string(),
    service: v.union(v.literal("vapi"), v.literal("ycloud")),
    secretName: v.string(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_organization_id_and_service", ["organizationId", "service"]),
  conversations: defineTable({
    threadId: v.string(),
    type: v.union(v.literal("widget"), v.literal("whatsapp")),
    organizationId: v.string(),
    contactSessionId: v.id("contactSessions"),
    status: v.union(
      v.literal("unresolved"),
      v.literal("resolved"),
      v.literal("escalated",
      ),
    ),
    lastMessageAt: v.optional(v.number()),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_contact_session_id", ["contactSessionId"])
    .index("by_thread_id", ["threadId"])
    .index("by_status_and_organization_id", ["status", "organizationId"])
    .index("by_organization_id_and_last_message", [
      "organizationId",
      "lastMessageAt",
    ]),
  contactSessions: defineTable({
    name: v.string(),
    email: v.string(),
    organizationId: v.string(),
    expiresAt: v.number(),
    metadata: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        lenguage: v.optional(v.string()),
        lenguages: v.optional(v.string()),
        platform: v.optional(v.string()),
        vendor: v.optional(v.string()),
        screenResolution: v.optional(v.string()),
        viewportSize: v.optional(v.string()),
        timezone: v.optional(v.string()),
        timezoneOffset: v.optional(v.number()),
        cookieEnabled: v.optional(v.boolean()),
        referrer: v.optional(v.string()),
        currentUrl: v.optional(v.string()),
      }),
    ),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_organization_id_and_email", ["organizationId", "email"]),
  ycloudProcessedEvents: defineTable({
    eventId: v.string(),
  }).index("by_event_id", ["eventId"]),
  users: defineTable({
    name: v.string(),
  }),
  reservations: defineTable({
    organizationId: v.string(),
    barberName: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
    ),
    googleEventId: v.optional(v.string()),
    notes: v.optional(v.string()),
    reminderJobId: v.optional(v.id("_scheduled_functions")),
    reminderSentAt: v.optional(v.number()),
  }).index("by_organization_id_and_start_time", [
    "organizationId",
    "startTime",
  ]),
  googleCalendarConnections: defineTable({
    organizationId: v.string(),
    refreshToken: v.string(),
    connectedAt: v.number(),
    accountEmail: v.optional(v.string()),
    calendarId: v.optional(v.string()),
  }).index("by_organization_id", ["organizationId"]),
});
