import { pgTable, serial, integer, text, date, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { doctorsTable } from "./doctors";

export const sessionTypeEnum = pgEnum("session_type", ["morning", "afternoon", "evening"]);
export const sessionStatusEnum = pgEnum("session_status", ["upcoming", "active", "closed", "cancelled"]);

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").references(() => doctorsTable.id).notNull(),
  date: date("date").notNull(),
  sessionType: sessionTypeEnum("session_type").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  bookedTokens: integer("booked_tokens").notNull().default(0),
  status: sessionStatusEnum("status").notNull().default("upcoming"),
  isCancelled: boolean("is_cancelled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, bookedTokens: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
