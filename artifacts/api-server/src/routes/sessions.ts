import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, doctorsTable, hospitalsTable, bookingsTable, tokensTable, usersTable } from "@workspace/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import { authenticate, optionalAuth } from "../middlewares/auth";

const router = Router();

const createSessionSchema = z.object({
  date: z.string(),
  sessionType: z.enum(["morning", "afternoon", "evening"]),
  startTime: z.string(),
  endTime: z.string(),
  totalTokens: z.number().int().min(1).max(50),
});

router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId);
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    let query = db.select().from(sessionsTable).where(eq(sessionsTable.doctorId, doctorId));
    const sessions = await query;

    const filtered = sessions.filter(s => {
      if (s.isCancelled) return false;
      if (fromDate && s.date < fromDate) return false;
      if (toDate && s.date > toDate) return false;
      return true;
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

router.post("/", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "forbidden", message: "Doctors only" });
    }

    const data = createSessionSchema.parse(req.body);

    const [session] = await db.insert(sessionsTable).values({
      doctorId: req.user.doctorId,
      date: data.date,
      sessionType: data.sessionType,
      startTime: data.startTime,
      endTime: data.endTime,
      totalTokens: data.totalTokens,
      bookedTokens: 0,
      status: "upcoming",
    }).returning();

    // Auto-create all token slots for this session
    const tokenRows = Array.from({ length: data.totalTokens }, (_, i) => ({
      sessionId: session.id,
      tokenNumber: i + 1,
      status: "available" as const,
      isBuffer: false,
      notificationSent: false,
    }));
    await db.insert(tokensTable).values(tokenRows);

    const doctor = await db.select().from(doctorsTable)
      .where(eq(doctorsTable.id, req.user.doctorId)).limit(1);

    res.status(201).json({
      ...session,
      doctorName: doctor[0]?.name || "",
      hospitalId: doctor[0]?.hospitalId || 0,
      hospitalName: "",
      consultationFee: doctor[0] ? parseFloat(doctor[0].consultationFee as string) : 0,
    });
  } catch (err: any) {
    res.status(400).json({ error: "bad_request", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    if (!session) return res.status(404).json({ error: "not_found", message: "Session not found" });

    const doctor = await db.select().from(doctorsTable).where(eq(doctorsTable.id, session.doctorId)).limit(1);
    const hospital = doctor.length > 0
      ? await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, doctor[0].hospitalId)).limit(1)
      : [];

    const tokens = await db.select().from(tokensTable).where(eq(tokensTable.sessionId, id));

    res.json({
      session: {
        ...session,
        doctorName: doctor[0]?.name || "",
        hospitalId: doctor[0]?.hospitalId || 0,
        hospitalName: hospital[0]?.name || "",
        consultationFee: doctor[0] ? parseFloat(doctor[0].consultationFee as string) : 0,
      },
      tokens: tokens.map(t => ({
        ...t,
        notificationSent: t.notificationSent || false,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.delete("/:id", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "forbidden", message: "Doctors only" });
    }

    const id = parseInt(req.params.id);
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    if (!session) return res.status(404).json({ error: "not_found", message: "Session not found" });
    if (session.doctorId !== req.user.doctorId) {
      return res.status(403).json({ error: "forbidden", message: "Not your session" });
    }

    await db.update(sessionsTable).set({ isCancelled: true, status: "cancelled" }).where(eq(sessionsTable.id, id));

    const bookedBookings = await db.select().from(bookingsTable)
      .where(and(eq(bookingsTable.sessionId, id), eq(bookingsTable.paymentStatus, "paid")));

    for (const booking of bookedBookings) {
      await db.update(bookingsTable)
        .set({ status: "cancelled", paymentStatus: "refunded" })
        .where(eq(bookingsTable.id, booking.id));
    }

    res.json({ success: true, message: "Session cancelled and refunds initiated" });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.post("/:id/close", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "forbidden", message: "Doctors only" });
    }

    const id = parseInt(req.params.id);
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    if (!session) return res.status(404).json({ error: "not_found", message: "Session not found" });

    const tokens = await db.select().from(tokensTable)
      .where(and(eq(tokensTable.sessionId, id), eq(tokensTable.status, "booked")));

    let unvisitedCount = tokens.length;
    let refundedCount = 0;

    for (const token of tokens) {
      await db.update(tokensTable).set({ status: "unvisited" }).where(eq(tokensTable.id, token.id));
      if (token.bookingId) {
        await db.update(bookingsTable)
          .set({ status: "unvisited", paymentStatus: "refunded" })
          .where(eq(bookingsTable.id, token.bookingId));
        refundedCount++;
      }
    }

    await db.update(sessionsTable).set({ status: "closed" }).where(eq(sessionsTable.id, id));

    res.json({
      success: true,
      unvisitedCount,
      refundedCount,
      message: `Session closed. ${unvisitedCount} patients marked unvisited. ${refundedCount} refunds initiated.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.get("/:id/tokens", optionalAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const tokens = await db.select().from(tokensTable).where(eq(tokensTable.sessionId, id));
    const isDoctor = req.user?.role === "doctor";

    if (!isDoctor) {
      return res.json(tokens.map(t => ({
        ...t,
        chiefComplaint: null,
        bookingPatientName: null,
      })));
    }

    const bookingIds = tokens.map(t => t.bookingId).filter((id): id is number => id !== null && id !== undefined);
    let bookingMap: Record<number, { chiefComplaint: string | null; patientName: string }> = {};
    if (bookingIds.length > 0) {
      const bookings = await db.select({
        id: bookingsTable.id,
        chiefComplaint: bookingsTable.chiefComplaint,
        patientId: bookingsTable.patientId,
      }).from(bookingsTable).where(inArray(bookingsTable.id, bookingIds));

      const patientIds = [...new Set(bookings.map(b => b.patientId))];
      const patients = patientIds.length > 0
        ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, patientIds))
        : [];
      const patientMap = Object.fromEntries(patients.map(p => [p.id, p.name]));

      bookingMap = Object.fromEntries(bookings.map(b => [b.id, {
        chiefComplaint: b.chiefComplaint,
        patientName: patientMap[b.patientId] || "Unknown",
      }]));
    }

    res.json(tokens.map(t => ({
      ...t,
      chiefComplaint: t.bookingId ? (bookingMap[t.bookingId]?.chiefComplaint ?? null) : null,
      bookingPatientName: t.bookingId ? (bookingMap[t.bookingId]?.patientName ?? null) : t.patientName || null,
    })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.post("/:id/buffer-slots", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "forbidden", message: "Doctors only" });
    }

    const sessionId = parseInt(req.params.id);
    const { slotGroupIndex, patientName, patientPhone } = req.body;

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
    if (!session) return res.status(404).json({ error: "not_found", message: "Session not found" });

    const existingTokens = await db.select().from(tokensTable).where(eq(tokensTable.sessionId, sessionId));
    const maxTokenNum = existingTokens.length > 0
      ? Math.max(...existingTokens.map(t => t.tokenNumber))
      : 0;

    const bufferTokenNumber = 1000 + (slotGroupIndex * 10) + (Date.now() % 10);

    const [token] = await db.insert(tokensTable).values({
      sessionId,
      tokenNumber: bufferTokenNumber,
      status: "booked",
      isBuffer: true,
      patientName,
      patientPhone,
      notificationSent: false,
    }).returning();

    res.json(token);
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
