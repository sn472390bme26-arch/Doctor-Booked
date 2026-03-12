import { pgTable, serial, integer, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sessionsTable } from "./sessions";

export const tokenStatusEnum = pgEnum("token_status", ["available", "booked", "ongoing", "completed", "skipped", "unvisited"]);

export const tokensTable = pgTable("tokens", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessionsTable.id).notNull(),
  tokenNumber: integer("token_number").notNull(),
  status: tokenStatusEnum("status").notNull().default("available"),
  isBuffer: boolean("is_buffer").notNull().default(false),
  patientName: text("patient_name"),
  patientPhone: text("patient_phone"),
  bookingId: integer("booking_id"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTokenSchema = createInsertSchema(tokensTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokensTable.$inferSelect;
