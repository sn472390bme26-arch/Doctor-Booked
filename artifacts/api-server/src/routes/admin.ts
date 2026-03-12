import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, doctorsTable, hospitalsTable,
  sessionsTable, bookingsTable, tokensTable
} from "@workspace/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { authenticate } from "../middlewares/auth";

const router = Router();
const JWT_SECRET = process.env["JWT_SECRET"] || "medbook-secret-2024";

// Admin credentials (in production these would be in env vars)
const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] || "admin";
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] || "DoctorBooked@2024";

// ─── Admin auth middleware ─────────────────────────────────────────────────────
function adminAuth(req: any, res: any, next: any) {
  const header = req.headers["authorization"] as string | undefined;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized", message: "No token provided" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as any;
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "forbidden", message: "Admin access only" });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
  }
}

// ─── POST /admin/login ─────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "bad_request", message: "Username and password required" });
    }
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
    }
    const token = jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, username, role: "admin" });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── GET /admin/stats ──────────────────────────────────────────────────────────
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [totalHospitals] = await db.select({ count: count() }).from(hospitalsTable);
    const [totalDoctors] = await db.select({ count: count() }).from(doctorsTable);
    const [totalPatients] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "patient"));
    const [totalBookings] = await db.select({ count: count() }).from(bookingsTable);
    const [activeSessionsResult] = await db.select({ count: count() }).from(sessionsTable)
      .where(and(eq(sessionsTable.status, "upcoming"), eq(sessionsTable.isCancelled, false)));

    res.json({
      hospitals: totalHospitals.count,
      doctors: totalDoctors.count,
      patients: totalPatients.count,
      bookings: totalBookings.count,
      activeSessions: activeSessionsResult.count,
    });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── GET /admin/hospitals ──────────────────────────────────────────────────────
router.get("/hospitals", adminAuth, async (req, res) => {
  try {
    const hospitals = await db.select().from(hospitalsTable);
    const result = await Promise.all(hospitals.map(async h => {
      const [{ count: docCount }] = await db.select({ count: count() }).from(doctorsTable).where(eq(doctorsTable.hospitalId, h.id));
      return { ...h, doctorCount: Number(docCount) };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── GET /admin/doctors ────────────────────────────────────────────────────────
router.get("/doctors", adminAuth, async (req, res) => {
  try {
    const doctors = await db.select({
      id: doctorsTable.id,
      name: doctorsTable.name,
      specialty: doctorsTable.specialty,
      consultationFee: doctorsTable.consultationFee,
      loginCode: doctorsTable.loginCode,
      isAvailable: doctorsTable.isAvailable,
      hospitalId: doctorsTable.hospitalId,
      createdAt: doctorsTable.createdAt,
    }).from(doctorsTable);

    const hospitals = await db.select({ id: hospitalsTable.id, name: hospitalsTable.name }).from(hospitalsTable);
    const hospitalMap = Object.fromEntries(hospitals.map(h => [h.id, h.name]));

    res.json(doctors.map(d => ({ ...d, hospitalName: hospitalMap[d.hospitalId] || "Unknown" })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── PUT /admin/doctors/:id ────────────────────────────────────────────────────
router.put("/doctors/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isAvailable, consultationFee, name, specialty } = req.body;
    const updates: any = {};
    if (isAvailable !== undefined) updates.isAvailable = isAvailable;
    if (consultationFee !== undefined) updates.consultationFee = String(consultationFee);
    if (name) updates.name = name;
    if (specialty) updates.specialty = specialty;

    await db.update(doctorsTable).set(updates).where(eq(doctorsTable.id, id));
    const [updated] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── GET /admin/patients ───────────────────────────────────────────────────────
router.get("/patients", adminAuth, async (req, res) => {
  try {
    const patients = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.role, "patient"));

    const result = await Promise.all(patients.map(async p => {
      const [{ count: bookingCount }] = await db.select({ count: count() }).from(bookingsTable).where(eq(bookingsTable.patientId, p.id));
      return { ...p, bookingCount: Number(bookingCount) };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── GET /admin/sessions ───────────────────────────────────────────────────────
router.get("/sessions", adminAuth, async (req, res) => {
  try {
    const sessions = await db.select().from(sessionsTable).orderBy(desc(sessionsTable.createdAt));
    const doctors = await db.select({ id: doctorsTable.id, name: doctorsTable.name }).from(doctorsTable);
    const docMap = Object.fromEntries(doctors.map(d => [d.id, d.name]));
    res.json(sessions.map(s => ({ ...s, doctorName: docMap[s.doctorId] || "Unknown" })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── GET /admin/bookings ───────────────────────────────────────────────────────
router.get("/bookings", adminAuth, async (req, res) => {
  try {
    const bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt)).limit(100);
    const patients = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    const patMap = Object.fromEntries(patients.map(p => [p.id, p.name]));
    const doctors = await db.select({ id: doctorsTable.id, name: doctorsTable.name }).from(doctorsTable);
    const docMap = Object.fromEntries(doctors.map(d => [d.id, d.name]));

    res.json(bookings.map(b => ({
      ...b,
      patientName: patMap[b.patientId] || "Unknown",
    })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── DELETE /admin/sessions/:id ────────────────────────────────────────────────
router.delete("/sessions/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(sessionsTable)
      .set({ isCancelled: true, status: "cancelled" })
      .where(eq(sessionsTable.id, id));
    res.json({ success: true, message: "Session cancelled by admin" });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
