import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, doctorsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "medbook-secret-2024";

const patientLoginSchema = z.object({
  method: z.enum(["email", "phone", "google"]),
  identifier: z.string().min(1),
  password: z.string().optional(),
  name: z.string().optional(),
});

const doctorLoginSchema = z.object({
  loginCode: z.string().min(1),
});

router.post("/patient/login", async (req, res) => {
  try {
    const data = patientLoginSchema.parse(req.body);
    let user;

    if (data.method === "email") {
      const existing = await db.select().from(usersTable)
        .where(eq(usersTable.email, data.identifier))
        .limit(1);

      if (existing.length > 0) {
        user = existing[0];
      } else {
        const [newUser] = await db.insert(usersTable).values({
          name: data.name || data.identifier.split("@")[0],
          email: data.identifier,
          role: "patient",
        }).returning();
        user = newUser;
      }
    } else if (data.method === "phone") {
      const existing = await db.select().from(usersTable)
        .where(eq(usersTable.phone, data.identifier))
        .limit(1);

      if (existing.length > 0) {
        user = existing[0];
      } else {
        const [newUser] = await db.insert(usersTable).values({
          name: data.name || `Patient ${data.identifier.slice(-4)}`,
          phone: data.identifier,
          role: "patient",
        }).returning();
        user = newUser;
      }
    } else {
      const email = data.identifier;
      const existing = await db.select().from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existing.length > 0) {
        user = existing[0];
      } else {
        const [newUser] = await db.insert(usersTable).values({
          name: data.name || "Google User",
          email,
          role: "patient",
        }).returning();
        user = newUser;
      }
    }

    const token = jwt.sign({ userId: user.id, role: "patient" }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "patient",
        patientId: user.id,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: "bad_request", message: err.message });
  }
});

router.post("/doctor/login", async (req, res) => {
  try {
    const { loginCode } = doctorLoginSchema.parse(req.body);

    const doctors = await db.select({
      doctor: doctorsTable,
      user: usersTable,
    })
      .from(doctorsTable)
      .innerJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
      .where(eq(doctorsTable.loginCode, loginCode))
      .limit(1);

    if (doctors.length === 0) {
      return res.status(401).json({ error: "unauthorized", message: "Invalid login code" });
    }

    const { doctor, user } = doctors[0];
    const token = jwt.sign({ userId: user.id, role: "doctor", doctorId: doctor.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user.id,
        name: doctor.name,
        email: user.email,
        role: "doctor",
        doctorId: doctor.id,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: "bad_request", message: err.message });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized", message: "No token" });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    const users = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (users.length === 0) {
      return res.status(401).json({ error: "unauthorized", message: "User not found" });
    }

    const user = users[0];
    let doctorId: number | undefined;
    let name = user.name;

    if (payload.role === "doctor") {
      const doctors = await db.select().from(doctorsTable)
        .where(eq(doctorsTable.userId, user.id))
        .limit(1);
      if (doctors.length > 0) {
        doctorId = doctors[0].id;
        name = doctors[0].name;
      }
    }

    res.json({
      id: user.id,
      name,
      email: user.email,
      role: payload.role,
      doctorId,
      patientId: payload.role === "patient" ? user.id : undefined,
    });
  } catch {
    res.status(401).json({ error: "unauthorized", message: "Invalid token" });
  }
});

export default router;
