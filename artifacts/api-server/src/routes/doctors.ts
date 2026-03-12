import { Router } from "express";
import { db } from "@workspace/db";
import { doctorsTable } from "@workspace/db/schema";
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

export default router;
