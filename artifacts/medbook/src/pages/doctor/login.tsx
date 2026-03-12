import { useState } from "react";
import { useLocation } from "wouter";
import { useDoctorLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Stethoscope, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DoctorLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useDoctorLogin();
  
  const [loginCode, setLoginCode] = useState("DOC-DEMO-123");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      data: { loginCode }
    }, {
      onSuccess: (data) => {
        login(data.token, 'doctor');
        toast({ title: "Doctor Access Granted", description: "Welcome back." });
        setLocation("/doctor/dashboard");
      },
      onError: () => {
        toast({ title: "Invalid Code", description: "Please check your unique doctor code.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-3xl shadow-xl border border-border/50">
        <div className="text-center mb-8">
          <div className="mx-auto bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <Stethoscope className="w-10 h-10 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">Doctor Login</h1>
          <p className="text-muted-foreground mt-2">Enter your unique hospital code to access the queue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground ml-1">Unique Login Code</label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <input
                type="text"
                value={loginCode}
                onChange={e => setLoginCode(e.target.value)}
                placeholder="e.g. DOC-12345"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border-2 border-border focus:bg-background focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all outline-none font-mono text-lg uppercase tracking-wider"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-4 bg-secondary text-secondary-foreground font-bold rounded-2xl shadow-lg shadow-secondary/25 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {loginMutation.isPending ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
