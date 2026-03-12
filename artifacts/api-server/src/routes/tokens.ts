import { Router } from "express";
import { db } from "@workspace/db";
import { tokensTable, sessionsTable, bookingsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { authenticate } from "../middlewares/auth";

const router = Router();

const updateStatusSchema = z.object({
  status: z.enum(["ongoing", "completed", "skipped"]),
});

router.put("/:id/status", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "forbidden", message: "Doctors only" });
    }

    const tokenId = parseInt(req.params.id);
    const { status } = updateStatusSchema.parse(req.body);

    const [token] = await db.select().from(tokensTable).where(eq(tokensTable.id, tokenId)).limit(1);
    if (!token) return res.status(404).json({ error: "not_found", message: "Token not found" });

    let nextTokenNotified: number | undefined;

    if (status === "completed") {
      await db.update(tokensTable).set({ status: "completed" }).where(eq(tokensTable.id, tokenId));

      if (token.bookingId) {
        await db.update(bookingsTable)
          .set({ status: "completed" })
          .where(eq(bookingsTable.id, token.bookingId));
      }

      const sessionTokens = await db.select().from(tokensTable)
        .where(eq(tokensTable.sessionId, token.sessionId));

      const nextBooked = sessionTokens
        .filter(t => t.status === "booked" && !t.notificationSent && !t.isBuffer)
        .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

      if (nextBooked) {
        await db.update(tokensTable)
          .set({ notificationSent: true })
          .where(eq(tokensTable.id, nextBooked.id));
        nextTokenNotified = nextBooked.tokenNumber;
      }

    } else if (status === "ongoing") {
      await db.update(tokensTable).set({ status: "ongoing" }).where(eq(tokensTable.id, tokenId));

      if (token.bookingId) {
        await db.update(bookingsTable)
          .set({ status: "confirmed" })
          .where(eq(bookingsTable.id, token.bookingId));
      }

      const sessionTokens = await db.select().from(tokensTable)
        .where(eq(tokensTable.sessionId, token.sessionId));

      const nextBooked = sessionTokens
        .filter(t => t.status === "booked" && t.id !== tokenId && !t.isBuffer)
        .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

      if (nextBooked && !nextBooked.notificationSent) {
        await db.update(tokensTable)
          .set({ notificationSent: true })
          .where(eq(tokensTable.id, nextBooked.id));
        nextTokenNotified = nextBooked.tokenNumber;
      }
    } else if (status === "skipped") {
      await db.update(tokensTable).set({ status: "skipped" }).where(eq(tokensTable.id, tokenId));
    }

    const [updatedToken] = await db.select().from(tokensTable).where(eq(tokensTable.id, tokenId)).limit(1);

    res.json({
      token: updatedToken,
      nextTokenNotified,
      message: `Token ${token.tokenNumber} marked as ${status}${nextTokenNotified ? `. Next notification sent to token #${nextTokenNotified}` : ""}`,
    });
  } catch (err: any) {
    res.status(400).json({ error: "bad_request", message: err.message });
  }
});

export default router;
