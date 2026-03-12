import { useState } from "react";
import {
  useGetMe,
  useGetDoctorSessions,
  useGetSessionTokens,
  useUpdateTokenStatus,
  useActivateBufferSlot,
  useCloseSession,
  useCancelSession,
  useCreateSession,
} from "@workspace/api-client-react";
import { format, addDays } from "date-fns";
import {
  Users, PowerOff, UserPlus, CheckCircle2, PlayCircle, SkipForward,
  CalendarPlus, X, AlertTriangle, Clock, ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── Dialog component ──────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-6 z-10"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold font-display">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const doctorId = user?.doctorId || 0;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: allSessions = [], refetch: refetchSessions } = useGetDoctorSessions(doctorId, {
    query: { enabled: !!doctorId },
  });

  const todaySessions = allSessions.filter(s => s.date === todayStr && !s.isCancelled);
  const upcomingSessions = allSessions.filter(s => s.date > todayStr && !s.isCancelled).slice(0, 5);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [tokenModal, setTokenModal] = useState<{ id: number; number: number; status: string } | null>(null);
  const [bufferModal, setBufferModal] = useState<{ groupIndex: number } | null>(null);
  const [closeModal, setCloseModal] = useState(false);
  const [newSessionModal, setNewSessionModal] = useState(false);
  const [bufferPatientName, setBufferPatientName] = useState("");
  const [bufferPatientPhone, setBufferPatientPhone] = useState("");

  // Auto-select first today session
  const effectiveSessionId = selectedSessionId ?? (todaySessions[0]?.id || null);

  const { data: tokens = [], refetch: refetchTokens } = useGetSessionTokens(effectiveSessionId || 0, {
    query: { enabled: !!effectiveSessionId, refetchInterval: 8000 },
  });

  const updateStatusMutation = useUpdateTokenStatus();
  const closeSessionMutation = useCloseSession();
  const addBufferMutation = useActivateBufferSlot();
  const cancelSessionMutation = useCancelSession();
  const createSessionMutation = useCreateSession();

  const handleTokenClick = (tokenId: number, tokenNumber: number, status: string) => {
    if (status === "available" || status === "completed") return;
    setTokenModal({ id: tokenId, number: tokenNumber, status });
  };

  const handleStatusUpdate = (status: "ongoing" | "completed" | "skipped") => {
    if (!tokenModal) return;
    updateStatusMutation.mutate(
      { tokenId: tokenModal.id, data: { status } },
      {
        onSuccess: (res) => {
          toast({ title: `Token #${tokenModal.number} — ${status}`, description: res.message || "" });
          refetchTokens();
          setTokenModal(null);
        },
        onError: () => toast({ title: "Error", variant: "destructive", description: "Could not update token." }),
      }
    );
  };

  const handleAddBuffer = () => {
    if (!bufferModal || !bufferPatientName.trim() || !effectiveSessionId) return;
    addBufferMutation.mutate(
      {
        sessionId: effectiveSessionId,
        data: { slotGroupIndex: bufferModal.groupIndex, patientName: bufferPatientName, patientPhone: bufferPatientPhone },
      },
      {
        onSuccess: () => {
          toast({ title: "Priority Slot Added", description: `${bufferPatientName} added to the queue.` });
          refetchTokens();
          setBufferModal(null);
          setBufferPatientName("");
          setBufferPatientPhone("");
        },
      }
    );
  };

  const handleCloseSession = () => {
    if (!effectiveSessionId) return;
    closeSessionMutation.mutate(
      { sessionId: effectiveSessionId },
      {
        onSuccess: (res) => {
          toast({ title: "Session Closed", description: res.message });
          refetchSessions();
          setCloseModal(false);
          setSelectedSessionId(null);
        },
      }
    );
  };

  const handleCancelUpcoming = (sessionId: number) => {
    cancelSessionMutation.mutate({ sessionId }, {
      onSuccess: () => {
        toast({ title: "Session Cancelled", description: "Patients will be notified and refunded." });
        refetchSessions();
      },
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold font-display">Token Control Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage live patient queue for your sessions</p>
      </div>

      {/* Session Tabs */}
      {todaySessions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {todaySessions.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold capitalize transition-all border-2 ${
                effectiveSessionId === s.id
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "border-border bg-card hover:border-primary/40 text-foreground"
              }`}
            >
              {s.sessionType} · {s.startTime}–{s.endTime}
            </button>
          ))}
          <button
            onClick={() => setNewSessionModal(true)}
            className="px-5 py-2.5 rounded-2xl text-sm font-bold border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all flex items-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" /> Add Session
          </button>
        </div>
      )}

      {/* Token Grid Panel */}
      {effectiveSessionId ? (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          {/* Legend + Close */}
          <div className="bg-muted/60 px-6 py-4 border-b border-border flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-background border border-border inline-block" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Booked</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Ongoing / Skipped</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Next Up</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Completed</span>
            </div>
            <button
              onClick={() => setCloseModal(true)}
              className="text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            >
              <PowerOff className="w-3.5 h-3.5" /> End Session
            </button>
          </div>

          <div className="p-6 md:p-8">
            <TokenGrid
              tokens={tokens}
              onTokenClick={handleTokenClick}
              onAddBuffer={(groupIndex) => setBufferModal({ groupIndex })}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No active sessions for today.</p>
          <button
            onClick={() => setNewSessionModal(true)}
            className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20"
          >
            Create Today's Session
          </button>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-muted-foreground" /> Upcoming Sessions</h2>
          <div className="space-y-3">
            {upcomingSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-muted/40 rounded-2xl px-4 py-3 border border-border">
                <div>
                  <span className="font-semibold capitalize">{s.sessionType}</span>
                  <span className="text-muted-foreground text-sm ml-2">{s.date} · {s.startTime}–{s.endTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{s.bookedTokens}/{s.totalTokens} booked</span>
                  <button
                    onClick={() => handleCancelUpcoming(s.id)}
                    className="text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Token Status Dialog ─── */}
      <AnimatePresence>
        {tokenModal && (
          <Modal open={!!tokenModal} onClose={() => setTokenModal(null)} title={`Token #${tokenModal.number}`}>
            <p className="text-muted-foreground text-sm mb-6">
              Current status: <strong className="text-foreground capitalize">{tokenModal.status}</strong>. Choose an action:
            </p>
            <div className="space-y-3">
              {(tokenModal.status === "booked") && (
                <button
                  onClick={() => handleStatusUpdate("ongoing")}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors"
                >
                  <PlayCircle className="w-5 h-5" /> Mark as Ongoing (Patient is In)
                </button>
              )}
              {(tokenModal.status === "ongoing" || tokenModal.status === "skipped") && (
                <>
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={updateStatusMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Mark as Completed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("skipped")}
                    disabled={updateStatusMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-orange-400 hover:bg-orange-500 text-white font-semibold rounded-2xl transition-colors"
                  >
                    <SkipForward className="w-5 h-5" /> Patient Not Available (Skip)
                  </button>
                </>
              )}
              {tokenModal.status === "completed" && (
                <button
                  onClick={() => handleStatusUpdate("ongoing")}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors"
                >
                  <PlayCircle className="w-5 h-5" /> Re-open as Ongoing
                </button>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ─── Priority Slot Dialog ─── */}
      <AnimatePresence>
        {bufferModal && (
          <Modal open={!!bufferModal} onClose={() => { setBufferModal(null); setBufferPatientName(""); setBufferPatientPhone(""); }} title="Add Priority Slot">
            <p className="text-muted-foreground text-sm mb-5">Register a walk-in patient for a priority slot.</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Patient Name *</label>
                <input
                  type="text"
                  value={bufferPatientName}
                  onChange={e => setBufferPatientName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={bufferPatientPhone}
                  onChange={e => setBufferPatientPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                onClick={handleAddBuffer}
                disabled={!bufferPatientName.trim() || addBufferMutation.isPending}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                {addBufferMutation.isPending ? "Adding..." : "Add to Queue"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ─── End Session Confirm Dialog ─── */}
      <AnimatePresence>
        {closeModal && (
          <Modal open={closeModal} onClose={() => setCloseModal(false)} title="End Session?">
            <div className="flex items-start gap-3 p-4 bg-destructive/5 rounded-2xl border border-destructive/20 mb-5">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">All unvisited booked patients will be marked for refund. This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCloseModal(false)}
                className="flex-1 py-3 rounded-2xl border border-border font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseSession}
                disabled={closeSessionMutation.isPending}
                className="flex-1 py-3 rounded-2xl bg-destructive text-white font-bold hover:bg-destructive/90 transition-colors disabled:opacity-70"
              >
                {closeSessionMutation.isPending ? "Closing..." : "End Session"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ─── Create New Session Dialog ─── */}
      <AnimatePresence>
        {newSessionModal && (
          <CreateSessionModal
            doctorId={doctorId}
            onClose={() => setNewSessionModal(false)}
            onCreated={() => { refetchSessions(); setNewSessionModal(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Token Grid ────────────────────────────────────────────────────────────────
function TokenGrid({ tokens, onTokenClick, onAddBuffer }: {
  tokens: any[];
  onTokenClick: (id: number, number: number, status: string) => void;
  onAddBuffer: (groupIndex: number) => void;
}) {
  const regularTokens = tokens.filter(t => !t.isBuffer).sort((a, b) => a.tokenNumber - b.tokenNumber);
  const bufferTokens = tokens.filter(t => t.isBuffer);

  const chunks: any[][] = [];
  for (let i = 0; i < regularTokens.length; i += 10) {
    chunks.push(regularTokens.slice(i, i + 10));
  }

  return (
    <div className="space-y-6">
      {chunks.map((chunk, index) => {
        const rowBuffers = bufferTokens.filter(t => Math.floor((t.tokenNumber - 1000) / 10) === index);

        return (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
              {chunk.map((token) => <TokenBox key={token.id} token={token} onClick={onTokenClick} />)}
            </div>

            {/* Priority Slot Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onAddBuffer(index)}
                className="h-9 px-4 rounded-xl border-2 border-dashed border-primary/50 text-primary text-xs font-bold flex items-center gap-1.5 hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" /> Priority Slot
              </button>
              {rowBuffers.map(token => (
                <div key={token.id} className="w-10 h-10">
                  <TokenBox token={token} onClick={onTokenClick} small />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {regularTokens.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tokens found for this session.</p>
          <p className="text-xs mt-1">The session may not have been set up correctly.</p>
        </div>
      )}
    </div>
  );
}

// ─── Single Token Box ──────────────────────────────────────────────────────────
function TokenBox({ token, onClick, small = false }: { token: any; onClick: (id: number, num: number, status: string) => void; small?: boolean }) {
  const { status } = token;

  const colorMap: Record<string, string> = {
    available: "bg-white dark:bg-zinc-800 border-2 border-border text-muted-foreground hover:border-primary/40 cursor-default",
    booked:    "bg-red-500 border-2 border-red-600 text-white hover:brightness-110 cursor-pointer shadow-md",
    ongoing:   "bg-orange-500 border-2 border-orange-500 text-white cursor-pointer shadow-[0_0_18px_rgba(249,115,22,0.5)] scale-105 z-10",
    skipped:   "bg-orange-400 border-2 border-orange-400 border-dashed text-white opacity-80 cursor-pointer",
    completed: "bg-green-500 border-2 border-green-600 text-white opacity-60 cursor-pointer",
    unvisited: "bg-gray-400 border-2 border-gray-500 text-white opacity-60 cursor-default",
  };

  // Yellow for "next up" — booked + notificationSent
  const isNext = status === "booked" && token.notificationSent;
  const colorClass = isNext
    ? "bg-yellow-400 border-2 border-yellow-500 text-black cursor-pointer shadow-md"
    : (colorMap[status] || colorMap.available);

  const sizeClass = small ? "text-[10px] rounded-lg" : "text-xl rounded-2xl";

  return (
    <motion.button
      layout
      whileHover={status !== "available" && status !== "completed" ? { scale: 1.06 } : {}}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(token.id, token.tokenNumber, status)}
      className={`relative aspect-square flex items-center justify-center font-bold font-display transition-all duration-300 w-full ${colorClass} ${sizeClass}`}
      title={`Token #${token.tokenNumber} — ${isNext ? "NEXT UP" : status}${token.patientName ? " · " + token.patientName : ""}`}
    >
      {token.tokenNumber}
      {isNext && !small && (
        <span className="absolute -top-1 -right-1 text-[8px] bg-yellow-500 text-black font-black px-1 rounded leading-tight">NEXT</span>
      )}
    </motion.button>
  );
}

// ─── Create Session Modal ──────────────────────────────────────────────────────
function CreateSessionModal({ doctorId, onClose, onCreated }: { doctorId: number; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const createMutation = useCreateSession();

  const today = new Date();
  const dates = Array.from({ length: 5 }, (_, i) => addDays(today, i));

  const [date, setDate] = useState(format(today, "yyyy-MM-dd"));
  const [sessionType, setSessionType] = useState<"morning" | "afternoon" | "evening">("morning");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [totalTokens, setTotalTokens] = useState(20);

  const sessionDefaults = {
    morning:   { start: "09:00", end: "12:00" },
    afternoon: { start: "14:00", end: "17:00" },
    evening:   { start: "18:00", end: "20:00" },
  };

  const handleTypeChange = (type: "morning" | "afternoon" | "evening") => {
    setSessionType(type);
    setStartTime(sessionDefaults[type].start);
    setEndTime(sessionDefaults[type].end);
  };

  const handleCreate = () => {
    createMutation.mutate(
      { data: { date, sessionType, startTime, endTime, totalTokens } },
      {
        onSuccess: () => {
          toast({ title: "Session Created!", description: `${totalTokens} token slots ready.` });
          onCreated();
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Modal open={true} onClose={onClose} title="Create New Session">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-semibold block mb-2">Date</label>
          <div className="flex flex-wrap gap-2">
            {dates.map(d => {
              const ds = format(d, "yyyy-MM-dd");
              return (
                <button
                  key={ds}
                  onClick={() => setDate(ds)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${date === ds ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                >
                  <div className="text-xs opacity-70">{format(d, "EEE")}</div>
                  <div className="font-bold">{format(d, "dd MMM")}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-2">Session Type</label>
          <div className="flex gap-2">
            {(["morning", "afternoon", "evening"] as const).map(t => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${sessionType === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-1.5">Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">End Time</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">Number of Tokens: <strong className="text-primary">{totalTokens}</strong></label>
          <input
            type="range" min={5} max={50} value={totalTokens} onChange={e => setTotalTokens(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5</span><span>50</span></div>
        </div>

        <button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:transform-none"
        >
          {createMutation.isPending ? "Creating..." : `Create Session · ${totalTokens} Tokens`}
        </button>
      </div>
    </Modal>
  );
}
