import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { usePatientLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Activity, Mail, Phone, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PatientLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = usePatientLogin();
  
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState("demo@patient.com");
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("John Doe");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      data: { method, identifier, password, name }
    }, {
      onSuccess: (data) => {
        login(data.token, 'patient');
        toast({ title: "Welcome to MedBook", description: "Successfully logged in." });
        setLocation("/patient/hospitals");
      },
      onError: () => {
        toast({ title: "Login Failed", description: "Please check your credentials.", variant: "destructive" });
      }
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
          <div className="mb-8 text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">Patient Portal</h1>
            <p className="text-muted-foreground mt-2">Sign in to book and manage appointments</p>
          </div>

          <div className="flex bg-muted p-1 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setMethod('email')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'email' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => setMethod('phone')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'phone' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Phone Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Name (for demo)</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">{method === 'email' ? 'Email Address' : 'Phone Number'}</label>
              <div className="relative">
                {method === 'email' ? <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" /> : <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />}
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
