import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

// One row per account. `id` is the Netlify Identity user id; the username is what people sign in with.
export const profiles = pgTable("profiles", {
  id: text().primaryKey(),
  username: text().notNull().unique(),
  email: text().notNull().unique(),
  orgName: text("org_name").notNull().default(""), // shown in the header as "DJ Events - <org>"
  role: text().notNull().default("user"), // 'user' | 'admin'
  status: text().notNull().default("pending"), // 'pending' | 'active' | 'disabled'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

// Each user's whole workspace (inquiries, follow-ups, bookings, resources, settings) as one document,
// matching the shape the app has always kept in memory. `version` guards against overwrites between devices.
export const workspaces = pgTable("workspaces", {
  userId: text("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  data: jsonb().notNull(),
  version: integer().notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// "Ask the admin" messages from the sign-in screen (password resets, account questions).
export const helpRequests = pgTable("help_requests", {
  id: serial().primaryKey(),
  topic: text().notNull().default("password"),
  username: text().notNull().default(""),
  email: text().notNull().default(""),
  message: text().notNull().default(""),
  status: text().notNull().default("open"), // 'open' | 'resolved'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
