import { db } from "@workspace/db";
import { sessionsTable, tokensTable, bookingsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

async function populateTokens() {
  console.log("Populating token slots for existing sessions...");

  const sessions = await db.select().from(sessionsTable);

  for (const session of sessions) {
    const existingTokens = await db.select().from(tokensTable)
      .where(eq(tokensTable.sessionId, session.id));

    const regularTokens = existingTokens.filter(t => !t.isBuffer);

    if (regularTokens.length >= session.totalTokens) {
      console.log(`Session ${session.id} (${session.sessionType} ${session.date}) already has ${regularTokens.length} tokens. Skipping.`);
      continue;
    }

    // Find which token numbers already exist
    const existingNums = new Set(regularTokens.map(t => t.tokenNumber));

    // Create missing token slots
    const missing: { sessionId: number; tokenNumber: number; status: "available" | "booked"; isBuffer: boolean; notificationSent: boolean; }[] = [];
    for (let i = 1; i <= session.totalTokens; i++) {
      if (!existingNums.has(i)) {
        // For the first bookedTokens slots, mark them as booked (simulate existing bookings)
        const isBooked = i <= session.bookedTokens;
        missing.push({
          sessionId: session.id,
          tokenNumber: i,
          status: isBooked ? "booked" : "available",
          isBuffer: false,
          notificationSent: false,
        });
      }
    }

    if (missing.length > 0) {
      await db.insert(tokensTable).values(missing);
      console.log(`Session ${session.id} (${session.sessionType} ${session.date}): inserted ${missing.length} token slots (${session.bookedTokens} booked, ${session.totalTokens - session.bookedTokens} available)`);
    }
  }

  console.log("Done!");
  process.exit(0);
}

populateTokens().catch(e => {
  console.error("Failed:", e);
  process.exit(1);
});
