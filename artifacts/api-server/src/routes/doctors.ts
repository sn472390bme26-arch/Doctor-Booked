import { Router } from "express";
import { db } from "@workspace/db";
import { doctorsTable, sessionsTable, hospitalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { authenticate } from "../middlewares/auth";

const router = Router();

const sessionTypeSchema = z.object({
  type: z.enum(["morning", "afternoon", "evening"]),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean(),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  specialty: z.string().optional(),
  photoUrl: z.string().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  experience: z.number().int().optional(),
  languages: z.array(z.string()).optional(),
  phone: z.string().optional(),
  consultationFee: z.number().optional(),
  tokensPerSession: z.number().int().optional(),
  sessionTypes: z.array(sessionTypeSchema).optional(),
});

router.get("/me", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "forbidden", message: "Doctors only" });
    }

    const doctors = await db.select().from(doctorsTable)
      .where(eq(doctorsTable.id, req.user.doctorId))
      .limit(1);

    if (doctors.length === 0) {
      return res.status(404).json({ error: "not_found", message: "Doctor not found" });
    }

    const d = doctors[0];
    res.json({
      ...d,
      consultationFee: parseFloat(d.consultationFee as string),
      sessionTypes: d.sessionTypes || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.put("/me", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "forbidden", message: "Doctors only" });
    }

    const data = updateProfileSchema.parse(req.body);
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.specialty !== undefined) updateData.specialty = data.specialty;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.languages !== undefined) updateData.languages = data.languages;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.consultationFee !== undefined) updateData.consultationFee = data.consultationFee.toString();
    if (data.tokensPerSession !== undefined) updateData.tokensPerSession = data.tokensPerSession;
    if (data.sessionTypes !== undefined) updateData.sessionTypes = data.sessionTypes;

    const [updated] = await db.update(doctorsTable)
      .set(updateData)
      .where(eq(doctorsTable.id, req.user.doctorId))
      .returning();

    res.json({
      ...updated,
      consultationFee: parseFloat(updated.consultationFee as string),
      sessionTypes: updated.sessionTypes || [],
    });
  } catch (err: any) {
    res.status(400).json({ error: "bad_request", message: err.message });
  }
});

router.get("/:id/sessions", async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const sessions = await db.select().from(sessionsTable)
      .where(eq(sessionsTable.doctorId, doctorId))
      .orderBy(sessionsTable.date, sessionsTable.id);
    const filtered = sessions.filter(s => {
      if (s.isCancelled) return false;
      if (fromDate && s.date < fromDate) return false;
      if (toDate && s.date > toDate) return false;
      return true;
    });

    // Sort: active first, then upcoming, then closed; within same status by id DESC (newest first)
    const statusPriority: Record<string, number> = { active: 0, upcoming: 1, closed: 2, cancelled: 3 };
    filtered.sort((a, b) => {
      const pA = statusPriority[a.status] ?? 99;
      const pB = statusPriority[b.status] ?? 99;
      if (pA !== pB) return pA - pB;
      return b.id - a.id;
    });

    const doctor = await db.select().from(doctorsTable).where(eq(doctorsTable.id, doctorId)).limit(1);
    const hospital = doctor.length > 0
      ? await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, doctor[0].hospitalId)).limit(1)
      : [];

    res.json(filtered.map(s => ({
      ...s,
      doctorName: doctor[0]?.name || "",
      hospitalId: doctor[0]?.hospitalId || 0,
      hospitalName: hospital[0]?.name || "",
      consultationFee: doctor[0] ? parseFloat(doctor[0].consultationFee as string) : 0,
    })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
