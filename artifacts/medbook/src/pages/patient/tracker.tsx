import { useRoute, Link } from "wouter";
import { useGetSession, useGetSessionTokens, useGetMyBookings } from "@workspace/api-client-react";
import {
  Activity, BellRing, Clock, User, MapPin, ChevronLeft,
  CheckCircle2, AlertCircle, Hourglass, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TokenTracker() {
  const [, params] = useRoute("/patient/tracker/:id");
  const sessionId = parseInt(params?.id || "0");

  // Session details - polls every 8s to catch status changes
  const { data: sessionData } = useGetSession(sessionId, {
    query: { queryKey: [], enabled: !!sessionId, refetchInterval: 8000 } as any,
  });
  const session = sessionData?.session;

  // Token grid - polls every 4s
  const { data: tokens = [], isLoading } = useGetSessionTokens(sessionId, {
    query: { queryKey: [], enabled: !!sessionId, refetchInterval: 4000 } as any,
  });

  // Find MY booking
  const { data: bookings } = useGetMyBookings({ query: { queryKey: [], refetchInterval: 8000 } as any });
  const myBooking = bookings?.find(b => b.sessionId === sessionId);
  const myTokenNumber = myBooking?.tokenNumber;

  // Compute queue state
  const regularTokens = tokens.filter(t => !t.isBuffer).sort((a, b) => a.tokenNumber - b.tokenNumber);
  const ongoingToken = regularTokens.find(t => t.status === "ongoing");
  const completedCount = regularTokens.filter(t => t.status === "completed").length;
  const bookedCount = regularTokens.filter(t => t.status === "booked" || t.status === "ongoing" || t.status === "completed").length;

  // My token's status
  const myToken = regularTokens.find(t => t.tokenNumber === myTokenNumber);
  const myStatus = myToken?.status;
  const isMyTurn = myStatus === "ongoing";
  const isNextUp = myStatus === "booked" && myToken?.notificationSent;

  // Tokens ahead of me = booked tokens with tokenNumber < mine AND not yet completed
  const tokensAhead = myTokenNumber
    ? regularTokens.filter(t => t.tokenNumber < myTokenNumber && (t.status === "booked" || t.status === "ongoing")).length
    : null;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">
      {/* Back */}
      <Link href="/patient/bookings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> My Bookings
      </Link>

      {/* Header */}
      <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE
              </span>
              <span className="text-xs text-muted-foreground">Updates every 4 seconds</span>
            </div>
            <h1 className="text-2xl font-bold font-display">Live Queue Tracker</h1>
            {session && (
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {session.doctorName}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {session.hospitalName}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {session.startTime} – {session.endTime}</span>
              </div>
            )}
          </div>

          {myTokenNumber && (
            <div className="text-center bg-primary/5 border-2 border-primary/20 rounded-2xl px-8 py-4 min-w-[160px]">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Your Token</p>
              <div className="text-6xl font-display font-black text-foreground leading-none">#{myTokenNumber}</div>
              {myStatus && (
                <span className={`mt-2 inline-block text-xs font-bold px-2 py-1 rounded-full capitalize ${statusBadgeClass(myStatus)}`}>
                  {myStatus === "booked" && myToken?.notificationSent ? "NEXT UP" : myStatus}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alert banners */}
      <AnimatePresence>
        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-orange-500 text-white p-6 rounded-3xl flex items-center gap-4 shadow-xl shadow-orange-500/30"
          >
            <BellRing className="w-10 h-10 shrink-0 animate-bounce" />
            <div>
              <h2 className="text-2xl font-bold">It's Your Turn!</h2>
              <p className="opacity-90 text-lg">Please go to the doctor's cabin now.</p>
            </div>
          </motion.div>
        )}
        {isNextUp && !isMyTurn && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-yellow-400 text-black p-5 rounded-3xl flex items-center gap-4 shadow-lg shadow-yellow-400/30"
          >
            <AlertCircle className="w-9 h-9 shrink-0" />
            <div>
              <h2 className="text-xl font-bold">You're Next!</h2>
              <p className="text-sm opacity-80">Please make your way to the waiting area near the cabin.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Booked"
          value={bookedCount}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value={completedCount}
          color="green"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Now Seeing"
          value={ongoingToken ? `#${ongoingToken.tokenNumber}` : "—"}
          color="orange"
        />
        <StatCard
          icon={<Hourglass className="w-5 h-5" />}
          label="Tokens Ahead"
          value={tokensAhead !== null ? tokensAhead : "—"}
          color={tokensAhead === 0 ? "green" : "default"}
        />
      </div>

      {/* Full Token Grid */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="bg-muted/60 border-b border-border px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Queue Board
          </h2>
          <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
            <LegendDot color="bg-white border border-border" label="Available" />
            <LegendDot color="bg-red-500" label="Booked" />
            <LegendDot color="bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" label="Ongoing" />
            <LegendDot color="bg-yellow-400" label="Next Up" />
            <LegendDot color="bg-green-500 opacity-70" label="Done" />
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : regularTokens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No tokens available yet for this session.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3">
              <AnimatePresence>
                {regularTokens.map(token => {
                  const isMine = token.tokenNumber === myTokenNumber;
                  const isNext = token.status === "booked" && token.notificationSent;

                  let cls = "bg-white dark:bg-zinc-800 border-2 border-border text-muted-foreground";
                  let glow = "";

                  if (token.status === "booked" && !isNext) cls = "bg-red-500 border-2 border-red-600 text-white";
                  if (isNext) cls = "bg-yellow-400 border-2 border-yellow-500 text-black";
                  if (token.status === "ongoing") {
                    cls = "bg-orange-500 border-2 border-orange-500 text-white scale-110 z-10";
                    glow = "shadow-[0_0_20px_rgba(249,115,22,0.55)]";
                  }
                  if (token.status === "completed") cls = "bg-green-500 border-2 border-green-600 text-white opacity-50";
                  if (token.status === "skipped") cls = "bg-orange-300 border-2 border-dashed border-orange-400 text-white opacity-70";

                  return (
                    <motion.div
                      layout
                      key={token.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: token.status === "ongoing" ? 1.1 : 1 }}
                      transition={{ duration: 0.3 }}
                      className={`relative aspect-square rounded-xl flex items-center justify-center text-base sm:text-lg font-bold font-display transition-all duration-500 ${cls} ${glow}`}
                      title={`Token #${token.tokenNumber}${isMine ? " (YOURS)" : ""} — ${isNext ? "NEXT UP" : token.status}`}
                    >
                      {token.tokenNumber}
                      {isMine && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background shadow" title="Your token" />
                      )}
                      {token.status === "ongoing" && (
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-orange-500 uppercase tracking-tight whitespace-nowrap">NOW</span>
                      )}
                      {isNext && (
                        <span className="absolute -top-1 -right-1 text-[8px] bg-yellow-500 text-black font-black px-1 rounded leading-tight">NEXT</span>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {myTokenNumber && !isLoading && (
            <div className="mt-6 pt-5 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-3.5 h-3.5 bg-primary rounded-full border-2 border-background shadow" />
              Tokens with the blue dot are yours
            </div>
          )}
        </div>
      </div>

      {/* Position summary */}
      {myTokenNumber && tokensAhead !== null && !isMyTurn && myStatus !== "completed" && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-bold mb-3 text-base">Your Queue Position</h3>
          {tokensAhead === 0 ? (
            <p className="text-green-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> You are next! Prepare to go in.
            </p>
          ) : (
            <p className="text-muted-foreground">
              There are <strong className="text-foreground text-lg">{tokensAhead}</strong> patient{tokensAhead !== 1 ? "s" : ""} ahead of you
              {ongoingToken ? ` (doctor is currently with Token #${ongoingToken.tokenNumber})` : ""}.
            </p>
          )}
        </div>
      )}

      {myStatus === "completed" && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-5 rounded-2xl text-green-700 dark:text-green-400 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-bold">Appointment Completed</p>
            <p className="text-sm opacity-80">Thank you for using Doctor Booked. We hope you feel better soon!</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-950",
    green: "text-green-600 bg-green-50 dark:bg-green-950",
    orange: "text-orange-600 bg-orange-50 dark:bg-orange-950",
    default: "text-muted-foreground bg-muted/40",
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2 ${colorMap[color] || colorMap.default}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold font-display">{value}</p>
      <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-full inline-block ${color}`} />
      {label}
    </span>
  );
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    available: "bg-gray-100 text-gray-600",
    booked: "bg-red-100 text-red-600",
    ongoing: "bg-orange-100 text-orange-600",
    completed: "bg-green-100 text-green-600",
    skipped: "bg-orange-100 text-orange-500",
  };
  return map[status] || "bg-muted text-muted-foreground";
}
