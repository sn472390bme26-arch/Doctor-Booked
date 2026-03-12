import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import {
  Activity, Clock, User, MapPin, CheckCircle2, Users, Hourglass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useLiveData<T>(path: string, interval: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api${path}`);
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        if (active) { setData(json); setLoading(false); }
      } catch {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, interval);
    return () => { active = false; clearInterval(timer); };
  }, [path, interval]);

  return { data, loading };
}

export default function LiveQueue() {
  const [, params] = useRoute("/live/:sessionId");
  const sessionId = parseInt(params?.sessionId || "0");

  const { data: sessionData, loading: sessionLoading } = useLiveData<any>(`/sessions/${sessionId}`, 8000);
  const { data: tokens = [], loading: tokensLoading } = useLiveData<any[]>(`/sessions/${sessionId}/tokens`, 5000);

  const session = sessionData?.session;
  const isLoading = sessionLoading || tokensLoading;

  const regularTokens = (tokens || []).filter((t: any) => !t.isBuffer).sort((a: any, b: any) => a.tokenNumber - b.tokenNumber);
  const ongoingToken = regularTokens.find((t: any) => t.status === "ongoing");
  const completedCount = regularTokens.filter((t: any) => t.status === "completed").length;
  const waitingCount = regularTokens.filter((t: any) => t.status === "booked").length;
  const totalBooked = regularTokens.filter((t: any) => t.status !== "available").length;

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-lg">Invalid session link.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE
                </span>
                <span className="text-xs text-muted-foreground">Auto-refreshes every 5 seconds</span>
              </div>
              <h1 className="text-2xl font-bold font-display">Live Queue Board</h1>
              {session && (
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {session.doctorName}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {session.hospitalName}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {session.startTime} – {session.endTime}</span>
                </div>
              )}
            </div>

            {ongoingToken && (
              <div className="text-center bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl px-8 py-4 min-w-[160px]">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Now Serving</p>
                <div className="text-6xl font-display font-black text-foreground leading-none">#{ongoingToken.tokenNumber}</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Booked" value={totalBooked} color="blue" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={completedCount} color="green" />
          <StatCard icon={<Activity className="w-5 h-5" />} label="Now Seeing" value={ongoingToken ? `#${ongoingToken.tokenNumber}` : "—"} color="orange" />
          <StatCard icon={<Hourglass className="w-5 h-5" />} label="Waiting" value={waitingCount} color="default" />
        </div>

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
            {isLoading && regularTokens.length === 0 ? (
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
                  {regularTokens.map((token: any) => {
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
                        title={`Token #${token.tokenNumber} — ${isNext ? "NEXT UP" : token.status}`}
                      >
                        {token.tokenNumber}
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
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground py-4">
          Powered by <strong>Doctor Booked</strong> — Real-time queue tracking
        </div>
      </div>
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
