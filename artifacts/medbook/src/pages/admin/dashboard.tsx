import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Hospital, Users, Stethoscope, CalendarDays, BookOpen,
  LogOut, ShieldCheck, RefreshCw, ToggleLeft, ToggleRight,
  XCircle, Search, ChevronDown, ChevronRight, Zap,
  Plus, X, Copy, CheckCircle2, Phone, KeyRound
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

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder, required, hint }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:bg-white/8 transition-all"
        required={required}
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { token, isAuthenticated, logout } = useAdminAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);

  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newDoctorResult, setNewDoctorResult] = useState<{ name: string; loginCode: string; phone: string } | null>(null);

  const [doctorForm, setDoctorForm] = useState({ name: "", phone: "", hospitalId: "", specialty: "", consultationFee: "500", tokensPerSession: "20" });
  const [hospitalForm, setHospitalForm] = useState({ name: "", location: "", address: "", phone: "" });
  const [saving, setSaving] = useState(false);

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

  const seedToday = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/seed-today`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to seed");
      const data = await res.json();
      toast({ title: "Sessions Seeded", description: data.message });
      stats.reload();
      sessions.reload();
    } catch {
      toast({ title: "Error", description: "Failed to seed today's sessions", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const createDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/doctors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: doctorForm.name,
          phone: doctorForm.phone,
          hospitalId: parseInt(doctorForm.hospitalId),
          specialty: doctorForm.specialty,
          consultationFee: parseFloat(doctorForm.consultationFee) || 500,
          tokensPerSession: parseInt(doctorForm.tokensPerSession) || 20,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create doctor");
      setNewDoctorResult({ name: data.name, loginCode: data.loginCode, phone: doctorForm.phone });
      setShowAddDoctor(false);
      setDoctorForm({ name: "", phone: "", hospitalId: "", specialty: "", consultationFee: "500", tokensPerSession: "20" });
      doctors.reload();
      stats.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const createHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/hospitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(hospitalForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create hospital");
      toast({ title: "Hospital Created", description: `${data.name} added successfully.` });
      setShowAddHospital(false);
      setHospitalForm({ name: "", location: "", address: "", phone: "" });
      hospitals.reload();
      stats.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `"${text}" copied to clipboard` });
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const doctorIdsWithTodaySession = new Set(
    (sessions.data || [])
      .filter(s => (s.date?.split("T")[0] || s.date) === todayStr && !s.isCancelled)
      .map(s => s.doctorId)
  );
  const availableDoctors = (doctors.data || []).filter(d => d.isAvailable);
  const allDoctorsSeeded =
    availableDoctors.length > 0 && availableDoctors.every(d => doctorIdsWithTodaySession.has(d.id));

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
          <div className="flex items-center gap-3">
            {tab === "doctors" && (
              <button
                onClick={() => setShowAddDoctor(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
              >
                <Plus className="w-4 h-4" /> Add Doctor
              </button>
            )}
            {tab === "hospitals" && (
              <button
                onClick={() => setShowAddHospital(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
              >
                <Plus className="w-4 h-4" /> Add Hospital
              </button>
            )}
            {tab !== "overview" && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary w-56"
                  placeholder={`Search ${tab}...`}
                />
              </div>
            )}
          </div>
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

                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-5 mt-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-primary" /> Seed Today's Sessions
                      </h3>
                      <p className="text-slate-400 text-sm">Create one session per doctor with simulated tokens for testing the live queue.</p>
                    </div>
                    <button
                      onClick={seedToday}
                      disabled={seeding || allDoctorsSeeded}
                      className={`shrink-0 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        allDoctorsSeeded
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-primary text-white hover:-translate-y-0.5 shadow-lg shadow-primary/30"
                      }`}
                    >
                      {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {seeding ? "Seeding..." : allDoctorsSeeded ? "All Seeded" : "Seed Now"}
                    </button>
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
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">City / Location</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Doctors</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(hospitals.data, ["name", "city", "location"]).map((h, i) => (
                    <tr key={h.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5`}>
                      <td className="py-3 px-5 text-white font-medium text-sm">{h.name}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{h.location || h.city || "—"}</td>
                      <td className="py-3 px-5">
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{h.doctorCount}</span>
                      </td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{h.phone || "—"}</td>
                    </tr>
                  ))}
                  {(hospitals.data?.length ?? 0) === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-slate-500">No hospitals found. Click "Add Hospital" to create one.</td></tr>
                  )}
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
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Login Code</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(doctors.data, ["name", "specialty", "hospitalName", "loginCode", "phone"]).map((d, i) => (
                    <tr key={d.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5`}>
                      <td className="py-3 px-5 text-white font-medium text-sm">{d.name}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{d.hospitalName}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{d.specialty}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm">{d.phone || <span className="text-slate-600 italic text-xs">Not set</span>}</td>
                      <td className="py-3 px-5">
                        <button
                          onClick={() => copyToClipboard(d.loginCode)}
                          className="flex items-center gap-1.5 text-xs bg-white/10 text-primary px-2.5 py-1 rounded-lg hover:bg-primary hover:text-white transition-all font-mono"
                          title="Click to copy"
                        >
                          {d.loginCode} <Copy className="w-3 h-3 opacity-60" />
                        </button>
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
                  {(doctors.data?.length ?? 0) === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-500">No doctors found. Click "Add Doctor" to create one.</td></tr>
                  )}
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
                      <td className="py-3 px-5 text-slate-300 text-sm">#{b.tokenNumber}</td>
                      <td className="py-3 px-5 text-slate-400 text-sm max-w-[200px] truncate" title={b.chiefComplaint || ""}>{b.chiefComplaint || <span className="text-slate-600 italic text-xs">None</span>}</td>
                      <td className="py-3 px-5 text-slate-300 text-sm">₹{b.amount ? Number(b.amount).toLocaleString("en-IN") : "—"}</td>
                      <td className="py-3 px-5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          b.paymentStatus === "paid" ? "bg-emerald-500/20 text-emerald-400" :
                          b.paymentStatus === "refunded" ? "bg-blue-500/20 text-blue-400" :
                          "bg-slate-500/20 text-slate-400"
                        }`}>{b.paymentStatus}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          b.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" :
                          b.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                          b.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                          "bg-slate-500/20 text-slate-400"
                        }`}>{b.status}</span>
                      </td>
                      <td className="py-3 px-5 text-slate-500 text-xs">{new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ─── Add Doctor Modal ─── */}
      <Modal open={showAddDoctor} onClose={() => setShowAddDoctor(false)} title="Add New Doctor">
        <form onSubmit={createDoctor} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Full Name" value={doctorForm.name} onChange={v => setDoctorForm(f => ({ ...f, name: v }))} placeholder="Dr. Priya Sharma" required />
            <InputField label="Phone Number" type="tel" value={doctorForm.phone} onChange={v => setDoctorForm(f => ({ ...f, phone: v }))} placeholder="+91 98765 43210" required hint="This will be the doctor's login password" />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Hospital <span className="text-red-400">*</span></label>
            <select
              value={doctorForm.hospitalId}
              onChange={e => setDoctorForm(f => ({ ...f, hospitalId: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-all"
              required
            >
              <option value="" className="bg-slate-800">Select hospital...</option>
              {hospitals.data?.map(h => (
                <option key={h.id} value={h.id} className="bg-slate-800">{h.name}</option>
              ))}
            </select>
          </div>
          <InputField label="Specialty" value={doctorForm.specialty} onChange={v => setDoctorForm(f => ({ ...f, specialty: v }))} placeholder="e.g. Cardiology, General Medicine" required />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Consultation Fee (₹)" type="number" value={doctorForm.consultationFee} onChange={v => setDoctorForm(f => ({ ...f, consultationFee: v }))} placeholder="500" />
            <InputField label="Tokens Per Session" type="number" value={doctorForm.tokensPerSession} onChange={v => setDoctorForm(f => ({ ...f, tokensPerSession: v }))} placeholder="20" />
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
            A unique sequential doctor code (e.g. DOC-00001) will be automatically generated for login.
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-60 disabled:transform-none flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "Creating..." : "Create Doctor"}
          </button>
        </form>
      </Modal>

      {/* ─── Doctor Created Success Modal ─── */}
      <Modal open={!!newDoctorResult} onClose={() => setNewDoctorResult(null)} title="Doctor Created Successfully">
        {newDoctorResult && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <p className="text-white font-bold">{newDoctorResult.name}</p>
                <p className="text-slate-400 text-sm">has been registered successfully</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">Share these credentials with the doctor securely:</p>
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Login Code</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-2xl font-bold text-primary font-mono tracking-widest">{newDoctorResult.loginCode}</code>
                  <button onClick={() => copyToClipboard(newDoctorResult.loginCode)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Password (Phone Number)</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-bold text-white font-mono">{newDoctorResult.phone}</code>
                  <button onClick={() => copyToClipboard(newDoctorResult.phone)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">The doctor should go to the Doctor Login page and enter these credentials.</p>
            <button onClick={() => setNewDoctorResult(null)} className="w-full py-3 bg-primary text-white font-bold rounded-xl">
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* ─── Add Hospital Modal ─── */}
      <Modal open={showAddHospital} onClose={() => setShowAddHospital(false)} title="Add New Hospital / Clinic">
        <form onSubmit={createHospital} className="space-y-4">
          <InputField label="Hospital / Clinic Name" value={hospitalForm.name} onChange={v => setHospitalForm(f => ({ ...f, name: v }))} placeholder="e.g. City General Hospital" required />
          <InputField label="City / Location" value={hospitalForm.location} onChange={v => setHospitalForm(f => ({ ...f, location: v }))} placeholder="e.g. Mumbai, Maharashtra" required />
          <InputField label="Full Address" value={hospitalForm.address} onChange={v => setHospitalForm(f => ({ ...f, address: v }))} placeholder="Street address, landmark..." required />
          <InputField label="Contact Phone" type="tel" value={hospitalForm.phone} onChange={v => setHospitalForm(f => ({ ...f, phone: v }))} placeholder="+91 22 1234 5678" />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-60 disabled:transform-none flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "Creating..." : "Create Hospital"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
