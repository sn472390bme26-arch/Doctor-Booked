import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Stethoscope, KeyRound, Phone, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function DoctorLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [loginCode, setLoginCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCode.trim()) {
      toast({ title: "Missing Code", description: "Please enter your doctor login code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/doctor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginCode: loginCode.trim().toUpperCase(), phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Login Failed", description: data.message || "Invalid credentials.", variant: "destructive" });
        return;
      }
      login(data.token, "doctor");
      toast({ title: "Welcome Back!", description: `Access granted for ${data.user?.name || "Doctor"}.` });
      setLocation("/doctor/dashboard");
    } catch {
      toast({ title: "Network Error", description: "Could not connect to server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-3xl shadow-xl border border-border/50">
        <div className="text-center mb-8">
          <div className="mx-auto bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <Stethoscope className="w-10 h-10 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">Doctor Login</h1>
          <p className="text-muted-foreground mt-2 text-sm">Enter your credentials provided by the hospital admin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-secondary" /> Doctor Login Code
            </label>
            <input
              type="text"
              value={loginCode}
              onChange={e => setLoginCode(e.target.value.toUpperCase())}
              placeholder="e.g. DOC-00001"
              className="w-full px-4 py-3.5 rounded-2xl bg-muted/50 border-2 border-border focus:bg-background focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all outline-none font-mono text-lg uppercase tracking-widest"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground ml-1">Your unique code assigned by the admin</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-secondary" /> Phone Number <span className="text-muted-foreground font-normal">(Password)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3.5 rounded-2xl bg-muted/50 border-2 border-border focus:bg-background focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all outline-none text-base"
            />
            <p className="text-xs text-muted-foreground ml-1">Your registered phone number — required for new accounts</p>
          </div>

          <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Login codes are issued by your hospital admin. Contact your hospital's administration desk if you need your credentials.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-secondary text-secondary-foreground font-bold rounded-2xl shadow-lg shadow-secondary/25 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
