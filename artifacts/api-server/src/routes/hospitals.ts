import { Router } from "express";
import { db } from "@workspace/db";
import { hospitalsTable, doctorsTable, usersTable } from "@workspace/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const search = req.query.search as string;
    const location = req.query.location as string;

    let hospitals = await db.select().from(hospitalsTable);

    if (search) {
      hospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.location.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (location) {
      hospitals = hospitals.filter(h =>
        h.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    const result = await Promise.all(hospitals.map(async (h) => {
      const docs = await db.select().from(doctorsTable).where(eq(doctorsTable.hospitalId, h.id));
      return {
        ...h,
        doctorCount: docs.length,
        specialties: h.specialties || [],
      };
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, id)).limit(1);
    if (!hospital) return res.status(404).json({ error: "not_found", message: "Hospital not found" });

    const docs = await db.select().from(doctorsTable).where(eq(doctorsTable.hospitalId, id));
    res.json({ ...hospital, doctorCount: docs.length });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.get("/:id/doctors", async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id);
    const doctors = await db.select().from(doctorsTable)
      .where(eq(doctorsTable.hospitalId, hospitalId));

    res.json(doctors.map(d => ({
      ...d,
      consultationFee: parseFloat(d.consultationFee as string),
      sessionTypes: d.sessionTypes || [],
    })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

const createHospitalSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional(),
  imageUrl: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

router.post("/", async (req, res) => {
  try {
    const data = createHospitalSchema.parse(req.body);
    const [hospital] = await db.insert(hospitalsTable).values({
      name: data.name,
      location: data.location,
      address: data.address,
      phone: data.phone,
      imageUrl: data.imageUrl,
      specialties: data.specialties || [],
    }).returning();
    res.status(201).json({ ...hospital, doctorCount: 0 });
  } catch (err: any) {
    res.status(400).json({ error: "bad_request", message: err.message });
  }
});

export default router;
