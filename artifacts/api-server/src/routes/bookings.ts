import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, sessionsTable, doctorsTable, hospitalsTable, tokensTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ error: "forbidden", message: "Patients only" });
    }

    const bookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.patientId, req.user.userId));

    const result = await Promise.all(bookings.map(async (b) => {
      const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, b.sessionId)).limit(1);
      const [doctor] = session
        ? await db.select().from(doctorsTable).where(eq(doctorsTable.id, session.doctorId)).limit(1)
        : [undefined];
      const [hospital] = doctor
        ? await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, doctor.hospitalId)).limit(1)
        : [undefined];

      return {
        ...b,
        amountPaid: b.amountPaid ? parseFloat(b.amountPaid as string) : null,
        chiefComplaint: b.chiefComplaint || null,
        doctorName: doctor?.name || "Unknown",
        hospitalName: hospital?.name || "Unknown",
        specialty: doctor?.specialty || "",
        date: session?.date || "",
        sessionType: session?.sessionType || "morning",
      };
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.post("/", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ error: "forbidden", message: "Patients only" });
    }

    const { sessionId, chiefComplaint } = z.object({
      sessionId: z.number().int(),
      chiefComplaint: z.string().optional(),
    }).parse(req.body);

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
    if (!session) return res.status(404).json({ error: "not_found", message: "Session not found" });
    if (session.isCancelled) return res.status(400).json({ error: "bad_request", message: "Session is cancelled" });
    if (session.bookedTokens >= session.totalTokens) {
      return res.status(400).json({ error: "bad_request", message: "Session is full" });
    }

    // Find the next available token slot (first-come-first-serve)
    const availableTokens = await db.select().from(tokensTable)
      .where(and(eq(tokensTable.sessionId, sessionId), eq(tokensTable.status, "available")));

    availableTokens.sort((a, b) => a.tokenNumber - b.tokenNumber);
    const nextToken = availableTokens[0];

    if (!nextToken) {
      return res.status(400).json({ error: "bad_request", message: "Session is full. No available slots." });
    }

    const tokenNumber = nextToken.tokenNumber;

    const [booking] = await db.insert(bookingsTable).values({
      patientId: req.user.userId,
      sessionId,
      tokenNumber,
      chiefComplaint: chiefComplaint?.trim() || null,
      status: "pending_payment",
      paymentStatus: "pending",
    }).returning();

    // Update the existing available token to booked
    await db.update(tokensTable)
      .set({ status: "booked", bookingId: booking.id })
      .where(eq(tokensTable.id, nextToken.id));

    await db.update(sessionsTable)
      .set({ bookedTokens: session.bookedTokens + 1 })
      .where(eq(sessionsTable.id, sessionId));

    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, session.doctorId)).limit(1);
    const [hospital] = doctor
      ? await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, doctor.hospitalId)).limit(1)
      : [undefined];

    res.status(201).json({
      ...booking,
      amountPaid: null,
      doctorName: doctor?.name || "",
      hospitalName: hospital?.name || "",
      specialty: doctor?.specialty || "",
      date: session.date,
      sessionType: session.sessionType,
    });
  } catch (err: any) {
    res.status(400).json({ error: "bad_request", message: err.message });
  }
});

router.post("/:id/pay", authenticate, async (req: any, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { method, amount } = z.object({
      method: z.enum(["card", "upi", "netbanking", "wallet"]),
      amount: z.number(),
    }).parse(req.body);

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ error: "not_found", message: "Booking not found" });
    if (booking.patientId !== req.user.userId) {
      return res.status(403).json({ error: "forbidden", message: "Not your booking" });
    }

    const transactionId = `TXN${Date.now()}`;

    const [updated] = await db.update(bookingsTable)
      .set({ status: "confirmed", paymentStatus: "paid", amountPaid: amount.toString() })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, updated.sessionId)).limit(1);
    const [doctor] = session
      ? await db.select().from(doctorsTable).where(eq(doctorsTable.id, session.doctorId)).limit(1)
      : [undefined];
    const [hospital] = doctor
      ? await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, doctor.hospitalId)).limit(1)
      : [undefined];

    res.json({
      success: true,
      transactionId,
      booking: {
        ...updated,
        amountPaid: parseFloat(updated.amountPaid as string),
        doctorName: doctor?.name || "",
        hospitalName: hospital?.name || "",
        specialty: doctor?.specialty || "",
        date: session?.date || "",
        sessionType: session?.sessionType || "morning",
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: "bad_request", message: err.message });
  }
});

export default router;
