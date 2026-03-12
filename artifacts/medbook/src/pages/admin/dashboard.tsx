import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Hospital, Users, Stethoscope, CalendarDays, BookOpen,
  LogOut, ShieldCheck, RefreshCw, ToggleLeft, ToggleRight,
  XCircle, Search, ChevronDown, ChevronRight
} from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/Final_logo_page-0001_1773317875013.jpg";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useFetch<T>(path: string, token: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token, path]);
  return { data, loading, error, reload: load };
}

type Tab = "overview" | "hospitals" | "doctors" | "patients" | "sessions" | "bookings";

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "hospitals", label: "Hospitals", icon: Hospital },
  { id: "doctors", label: "Doctors", icon: Stethoscope },
  { id: "patients", label: "Patients", icon: Users },
  { id: "sessions", label: "Sessions", icon: CalendarDays },
  { id: "bookings", label: "Bookings", icon: BookOpen },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { token, isAuthenticated, logout } = useAdminAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated]);

  const stats = useFetch<any>("/stats", token);
  const hospitals = useFetch<any[]>("/hospitals", token);
  const doctors = useFetch<any[]>("/doctors", token);
  const patients = useFetch<any[]>("/patients", token);
  const sessions = useFetch<any[]>("/sessions", token);
  const bookings = useFetch<any[]>("/bookings", token);

  const toggleDoctor = async (doctor: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/doctors/${doctor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isAvailable: !doctor.isAvailable }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: `Dr. ${doctor.name}`, description: `Marked as ${!doctor.isAvailable ? "available" : "unavailable"}` });
      doctors.reload();
    } catch {
      toast({ title: "Error", description: "Failed to update doctor status", variant: "destructive" });
    }
  };

  const cancelSession = async (session: any) => {
    if (!confirm(`Cancel session for ${session.doctorName} on ${new Date(session.date).toLocaleDateString()}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/sessions/${session.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to cancel");
      toast({ title: "Session Cancelled", description: "Session has been cancelled." });
      sessions.reload();
    } catch {
      toast({ title: "Error", description: "Failed to cancel session", variant: "destructive" });
    }
  };

  const filtered = <T extends any[]>(arr: T | null, keys: string[]): T =>
    (!arr ? [] : search.trim()
      ? arr.filter(item => keys.some(k => String(item[k] || "").toLowerCase().includes(search.toLowerCase())))
      : arr) as T;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <img src={logoImg} alt="Logo" className="w-9 h-9 rounded-xl" />
          <div>
            <p className="text-white font-bold text-sm leading-none">Doctor Booked</p>
            <p className="text-primary text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSearch(""); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.id
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl capitalize">{tab === "overview" ? "Dashboard Overview" : tab}</h1>
            <p className="text-slate-500 text-sm">Doctor Booked Admin Control Panel</p>
          </div>
          {tab !== "overview" && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary w-64"
                placeholder={`Search ${tab}...`}
              />
            </div>
          )}
        </div>

        <div className="p-8 space-y-6">
          {/* ─── OVERVIEW ─── */}
          {tab === "overview" && (
            <>
              {stats.loading ? (
                <div className="text-slate-400 text-center py-16">Loading stats...</div>
              ) : stats.data && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {[
                      { label: "Hospitals", value: stats.data.hospitals, icon: Hospital, color: "from-blue-600/20 to-blue-600/5", border: "border-blue-500/30", text: "text-blue-400" },
                      { label: "Doctors", value: stats.data.doctors, icon: Stethoscope, color: "from-emerald-600/20 to-emerald-600/5", border: "border-emerald-500/30", text: "text-emerald-400" },
                      { label: "Patients", value: stats.data.patients, icon: Users, color: "from-violet-600/20 to-violet-600/5", border: "border-violet-500/30", text: "text-violet-400" },
                      { label: "Bookings", value: stats.data.bookings, icon: BookOpen, color: "from-amber-600/20 to-amber-600/5", border: "border-amber-500/30", text: "text-amber-400" },
                      { label: "Active Sessions", value: stats.data.activeSessions, icon: CalendarDays, color: "from-rose-600/20 to-rose-600/5", border: "border-rose-500/30", text: "text-rose-400" },
                    ].map(s => (
                      <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5`}>
                        <s.icon className={`w-6 h-6 ${s.text} mb-3`} />
                        <div className="text-3xl font-bold text-white">{s.value}</div>
                        <div className="text-slate-400 text-sm mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Hospital className="w-4 h-4 text-primary" /> Hospitals
                      </h3>
                      {hospitals.data?.slice(0, 5).map(h => (
                        <div key={h.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-slate-300 text-sm">{h.name}</span>
                          <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{h.doctorCount} doctors</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-emerald-400" /> Recent Bookings
                      </h3>
                      {bookings.data?.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div>
                            <span className="text-slate-300 text-sm">{b.patientName}</span>
                            <span className="text-slate-500 text-xs ml-2">Token #{b.tokenNumber}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            b.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" :
                            b.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                            "bg-slate-500/20 text-slate-400"
                          }`}>{b.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ─── HOSPITALS ─── */}
          {tab === "hospitals" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">City</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Doctors</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(hospitals.data, ["name", "city"]).map((h, i) => (
                    <tr key={h.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5`}>
                      <td className="py-3 px-5 text-white font-medium text-sm">{h.name}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{h.city}</td>
                      <td className="py-3 px-5">
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{h.doctorCount}</span>
                      </td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{h.type || "General"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── DOCTORS ─── */}
          {tab === "doctors" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Doctor</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Hospital</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Specialty</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Fee</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Login Code</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(doctors.data, ["name", "specialty", "hospitalName", "loginCode"]).map((d, i) => (
                    <tr key={d.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5`}>
                      <td className="py-3 px-5 text-white font-medium text-sm">{d.name}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{d.hospitalName}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{d.specialty}</td>
                      <td className="py-3 px-5 text-slate-300 text-sm">₹{Number(d.consultationFee).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-5">
                        <code className="text-xs bg-white/10 text-primary px-2 py-0.5 rounded">{d.loginCode}</code>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${d.isAvailable ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                          {d.isAvailable ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <button
                          onClick={() => toggleDoctor(d)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            d.isAvailable
                              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {d.isAvailable ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                          {d.isAvailable ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── PATIENTS ─── */}
          {tab === "patients" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Bookings</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(patients.data, ["name", "email", "phone"]).map((p, i) => (
                    <tr key={p.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5`}>
                      <td className="py-3 px-5 text-white font-medium text-sm">{p.name}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{p.email}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{p.phone || "—"}</td>
                      <td className="py-3 px-5">
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.bookingCount}</span>
                      </td>
                      <td className="py-3 px-5 text-slate-500 text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── SESSIONS ─── */}
          {tab === "sessions" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Doctor</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tokens</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(sessions.data, ["doctorName", "sessionType"]).map((s, i) => (
                    <tr key={s.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5`}>
                      <td className="py-3 px-5 text-white font-medium text-sm">{s.doctorName}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{new Date(s.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 px-5 text-slate-300 text-sm capitalize">{s.sessionType}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{s.totalTokens}</td>
                      <td className="py-3 px-5">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          s.isCancelled ? "bg-red-500/20 text-red-400" :
                          s.status === "ongoing" ? "bg-amber-500/20 text-amber-400" :
                          s.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        }`}>{s.isCancelled ? "Cancelled" : s.status}</span>
                      </td>
                      <td className="py-3 px-5">
                        {!s.isCancelled && s.status !== "completed" && (
                          <button
                            onClick={() => cancelSession(s)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── BOOKINGS ─── */}
          {tab === "bookings" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Patient</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Token #</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Complaint</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(bookings.data, ["patientName", "status"]).map((b, i) => (
                    <tr key={b.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5`}>
                      <td className="py-3 px-5 text-white font-medium text-sm">{b.patientName}</td>
                      <td className="py-3 px-5 text-slate-300 text-sm font-mono">{b.tokenNumber}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm max-w-[200px] truncate" title={b.chiefComplaint || ""}>{b.chiefComplaint || <span className="text-slate-600 italic">—</span>}</td>
                      <td className="py-3 px-5 text-slate-300 text-sm">₹{Number(b.amount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-5">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${b.paymentStatus === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {b.paymentStatus || "pending"}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          b.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                          b.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-slate-500/20 text-slate-400"
                        }`}>{b.status}</span>
                      </td>
                      <td className="py-3 px-5 text-slate-500 text-xs">{new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
