import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, doctorsTable, hospitalsTable,
  sessionsTable, bookingsTable, tokensTable
} from "@workspace/db/schema";
import { eq, desc, count, and, inArray } from "drizzle-orm";
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
      userId: doctorsTable.userId,
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

    const users = await db.select({ id: usersTable.id, phone: usersTable.phone }).from(usersTable);
    const userPhoneMap = Object.fromEntries(users.map(u => [u.id, u.phone]));

    res.json(doctors.map(d => ({ ...d, hospitalName: hospitalMap[d.hospitalId] || "Unknown", phone: userPhoneMap[d.userId] || null })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── POST /admin/doctors ───────────────────────────────────────────────────────
router.post("/doctors", adminAuth, async (req, res) => {
  try {
    const { name, phone, hospitalId, specialty, consultationFee, tokensPerSession } = req.body;
    if (!name || !phone || !hospitalId || !specialty) {
      return res.status(400).json({ error: "bad_request", message: "name, phone, hospitalId and specialty are required" });
    }

    // Check phone not already used
    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "conflict", message: "A user with this phone number already exists" });
    }

    // Generate sequential login code: DOC-00001, DOC-00002, ...
    const allDoctors = await db.select({ id: doctorsTable.id }).from(doctorsTable).orderBy(desc(doctorsTable.id)).limit(1);
    const nextNum = allDoctors.length > 0 ? allDoctors[0].id + 1 : 1;
    const loginCode = `DOC-${String(nextNum).padStart(5, "0")}`;

    // Create user record
    const [user] = await db.insert(usersTable).values({
      name,
      phone,
      role: "doctor",
    }).returning();

    // Create doctor record
    const [doctor] = await db.insert(doctorsTable).values({
      userId: user.id,
      hospitalId: parseInt(hospitalId),
      name,
      specialty,
      loginCode,
      consultationFee: consultationFee ? String(consultationFee) : "500",
      tokensPerSession: tokensPerSession || 20,
      isAvailable: true,
      sessionTypes: [
        { type: "morning", startTime: "09:00", endTime: "12:00", isActive: true },
        { type: "afternoon", startTime: "14:00", endTime: "17:00", isActive: false },
      ],
    }).returning();

    const [hospital] = await db.select({ name: hospitalsTable.name }).from(hospitalsTable).where(eq(hospitalsTable.id, parseInt(hospitalId))).limit(1);

    res.status(201).json({
      ...doctor,
      hospitalName: hospital?.name || "Unknown",
      loginCode,
      message: `Doctor created successfully. Login Code: ${loginCode}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── POST /admin/hospitals ─────────────────────────────────────────────────────
router.post("/hospitals", adminAuth, async (req, res) => {
  try {
    const { name, location, address, phone } = req.body;
    if (!name || !location || !address) {
      return res.status(400).json({ error: "bad_request", message: "name, location and address are required" });
    }

    const [hospital] = await db.insert(hospitalsTable).values({
      name,
      location,
      address,
      phone: phone || null,
    }).returning();

    res.status(201).json({ ...hospital, doctorCount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── PUT /admin/doctors/:id ────────────────────────────────────────────────────
router.put("/doctors/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isAvailable, consultationFee, name, specialty, hospitalId } = req.body;
    const updates: any = {};
    if (isAvailable !== undefined) updates.isAvailable = isAvailable;
    if (consultationFee !== undefined) updates.consultationFee = String(consultationFee);
    if (name) updates.name = name;
    if (specialty) updates.specialty = specialty;
    if (hospitalId !== undefined) updates.hospitalId = parseInt(hospitalId);

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
      chiefComplaint: b.chiefComplaint || null,
      patientName: patMap[b.patientId] || "Unknown",
    })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── DELETE /admin/doctors/:id ─────────────────────────────────────────────────
router.delete("/doctors/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id)).limit(1);
    if (!doctor) {
      return res.status(404).json({ error: "not_found", message: "Doctor not found" });
    }
    // Gather all session IDs for this doctor
    const doctorSessions = await db.select({ id: sessionsTable.id }).from(sessionsTable).where(eq(sessionsTable.doctorId, id));
    const sessionIds = doctorSessions.map(s => s.id);
    if (sessionIds.length > 0) {
      // Delete tokens first (they reference sessions)
      await db.delete(tokensTable).where(inArray(tokensTable.sessionId, sessionIds));
      // Delete bookings next (they reference sessions via session_id)
      await db.delete(bookingsTable).where(inArray(bookingsTable.sessionId, sessionIds));
      // Now safe to delete sessions
      await db.delete(sessionsTable).where(eq(sessionsTable.doctorId, id));
    }
    // Delete doctor record
    await db.delete(doctorsTable).where(eq(doctorsTable.id, id));
    // Delete associated user record (if role is "doctor")
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId)).limit(1);
    if (user && user.role === "doctor") {
      await db.delete(usersTable).where(eq(usersTable.id, doctor.userId));
    }
    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── DELETE /admin/hospitals/:id ───────────────────────────────────────────────
router.delete("/hospitals/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, id)).limit(1);
    if (!hospital) {
      return res.status(404).json({ error: "not_found", message: "Hospital not found" });
    }
    // Check for associated doctors
    const associatedDoctors = await db.select({ id: doctorsTable.id }).from(doctorsTable).where(eq(doctorsTable.hospitalId, id));
    if (associatedDoctors.length > 0) {
      return res.status(409).json({
        error: "conflict",
        message: `Cannot delete hospital — it has ${associatedDoctors.length} doctor(s) assigned. Please remove or reassign all doctors first.`,
      });
    }
    await db.delete(hospitalsTable).where(eq(hospitalsTable.id, id));
    res.json({ success: true, message: "Hospital deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── POST /admin/hospitals/:id/photos ──────────────────────────────────────────
router.post("/hospitals/:id/photos", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "bad_request", message: "photoUrl is required" });
    }
    const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, id)).limit(1);
    if (!hospital) {
      return res.status(404).json({ error: "not_found", message: "Hospital not found" });
    }
    const current = (hospital.photos as string[]) || [];
    const updated = [...current, photoUrl];
    await db.update(hospitalsTable).set({ photos: updated }).where(eq(hospitalsTable.id, id));
    res.json({ success: true, photos: updated });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// ─── DELETE /admin/hospitals/:id/photos/:index ─────────────────────────────────
router.delete("/hospitals/:id/photos/:index", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = parseInt(req.params.index);
    const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, id)).limit(1);
    if (!hospital) {
      return res.status(404).json({ error: "not_found", message: "Hospital not found" });
    }
    const current = (hospital.photos as string[]) || [];
    const updated = current.filter((_, i) => i !== index);
    await db.update(hospitalsTable).set({ photos: updated }).where(eq(hospitalsTable.id, id));
    res.json({ success: true, photos: updated });
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

// ─── POST /admin/seed-today ────────────────────────────────────────────────────
router.post("/seed-today", adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.isAvailable, true));

    const existingSessions = await db.select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.date, today), eq(sessionsTable.isCancelled, false)));
    const doctorsWithSession = new Set(existingSessions.map(s => s.doctorId));

    const patients = await db.select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable).where(eq(usersTable.role, "patient"));

    let created = 0;
    for (const doctor of doctors) {
      if (doctorsWithSession.has(doctor.id)) continue;

      const sessionTypes = (doctor.sessionTypes as any[]) || [];
      const activeType = sessionTypes.find((st: any) => st.isActive) || { type: "morning", startTime: "09:00", endTime: "12:00" };

      const totalTokens = doctor.tokensPerSession || 15;

      const [session] = await db.insert(sessionsTable).values({
        doctorId: doctor.id,
        date: today,
        sessionType: activeType.type,
        startTime: activeType.startTime,
        endTime: activeType.endTime,
        totalTokens,
        bookedTokens: 0,
        status: "active",
        isCancelled: false,
      }).returning();

      const completedCount = Math.floor(totalTokens / 3);
      const ongoingCount = 1;
      // All remaining tokens after completed + ongoing are booked (simulates mid-session queue)
      const bookedCount = totalTokens - completedCount - ongoingCount;

      const tokenValues: any[] = [];
      let tokenNum = 1;

      for (let i = 0; i < completedCount; i++, tokenNum++) {
        tokenValues.push({
          sessionId: session.id,
          tokenNumber: tokenNum,
          status: "completed",
          isBuffer: false,
          patientName: patients.length > 0 ? patients[i % patients.length].name : `Patient ${tokenNum}`,
          notificationSent: true,
        });
      }

      tokenValues.push({
        sessionId: session.id,
        tokenNumber: tokenNum,
        status: "ongoing",
        isBuffer: false,
        patientName: patients.length > 0 ? patients[completedCount % patients.length].name : `Patient ${tokenNum}`,
        notificationSent: true,
      });
      tokenNum++;

      for (let i = 0; i < bookedCount; i++, tokenNum++) {
        const isNext = i === 0;
        tokenValues.push({
          sessionId: session.id,
          tokenNumber: tokenNum,
          status: "booked",
          isBuffer: false,
          patientName: patients.length > 0 ? patients[(completedCount + 1 + i) % patients.length].name : `Patient ${tokenNum}`,
          notificationSent: isNext,
        });
      }

      if (tokenValues.length > 0) {
        await db.insert(tokensTable).values(tokenValues);
      }

      await db.update(sessionsTable)
        .set({ bookedTokens: completedCount + ongoingCount + bookedCount })
        .where(eq(sessionsTable.id, session.id));

      created++;
    }

    res.json({ success: true, created, message: `Created ${created} session(s) with simulated tokens for today.` });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
