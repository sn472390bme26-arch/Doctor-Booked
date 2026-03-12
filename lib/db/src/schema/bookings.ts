import { pgTable, serial, integer, numeric, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { sessionsTable } from "./sessions";

export const bookingStatusEnum = pgEnum("booking_status", ["pending_payment", "confirmed", "completed", "cancelled", "refunded", "unvisited"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded"]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => usersTable.id).notNull(),
  sessionId: integer("session_id").references(() => sessionsTable.id).notNull(),
  tokenNumber: integer("token_number").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending_payment"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }),
  chiefComplaint: text("chief_complaint"),
  transactionId: integer("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
