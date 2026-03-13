import { pgTable, serial, text, integer, numeric, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { hospitalsTable } from "./hospitals";

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  hospitalId: integer("hospital_id").references(() => hospitalsTable.id).notNull(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  education: text("education"),
  experience: integer("experience"),
  languages: text("languages").array().default([]),
  phone: text("phone"),
  consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 }).notNull().default("500"),
  tokensPerSession: integer("tokens_per_session").notNull().default(20),
  sessionTypes: jsonb("session_types").default([]),
  loginCode: text("login_code").notNull().unique(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true, createdAt: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;
