import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { usePatientLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Activity, Mail, Phone, Lock, User, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PatientLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = usePatientLogin();

  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("demo@patient.com");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("password");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      data: { method: "email", identifier: email, password, name }
    }, {
      onSuccess: (data) => {
        login(data.token, "patient");
        toast({ title: "Welcome to Doctor Booked", description: "Successfully signed in." });
        setLocation("/patient/hospitals");
      },
      onError: () => {
        toast({ title: "Sign In Failed", description: "Please check your credentials.", variant: "destructive" });
      }
    });
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google Sign-In",
      description: "Google authentication requires OAuth configuration. Contact admin to enable.",
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-card rounded-3xl shadow-xl overflow-hidden border border-border/50">

        {/* Image side */}
        <div className="hidden md:block relative bg-primary/5">
          <img
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
            alt="Clinic interior"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-10">
            <h2 className="text-3xl font-display font-bold text-white mb-2">Your Health, Prioritized.</h2>
            <p className="text-primary-foreground/80">Book appointments instantly and track your queue position live.</p>
          </div>
        </div>

        {/* Form side */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-7 text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">Patient Portal</h1>
            <p className="text-muted-foreground mt-2 text-sm">Sign in to book and manage appointments</p>
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all font-medium text-sm text-foreground mb-5 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center mb-5">
            <div className="flex-grow border-t border-border" />
            <span className="mx-4 text-xs text-muted-foreground">or sign in with email</span>
            <div className="flex-grow border-t border-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Phone Number <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loginMutation.isPending}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In & Continue"}
            </motion.button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
