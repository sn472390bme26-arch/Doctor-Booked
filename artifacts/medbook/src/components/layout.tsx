import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, Activity, CalendarDays, LayoutDashboard } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, role, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={role === 'doctor' ? "/doctor/dashboard" : "/patient/hospitals"} className="flex items-center gap-2 transition-transform hover:scale-105">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl text-white shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                Med<span className="text-primary">Book</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground mr-4">
                    {role === 'patient' && (
                      <>
                        <Link href="/patient/hospitals" className="hover:text-primary transition-colors">Hospitals</Link>
                        <Link href="/patient/bookings" className="hover:text-primary transition-colors">My Bookings</Link>
                      </>
                    )}
                    {role === 'doctor' && (
                      <>
                        <Link href="/doctor/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                        <Link href="/doctor/profile" className="hover:text-primary transition-colors">Profile</Link>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 pl-4 border-l border-border/50">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-sm font-semibold leading-none">{user.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <button 
                      onClick={() => logout()}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href="/patient/login" className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2">
                    Patient Login
                  </Link>
                  <Link href="/doctor/login" className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full shadow-sm transition-all hover:shadow hover:-translate-y-0.5">
                    Doctor Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-auto">
        <p>© {new Date().getFullYear()} MedBook App. Premium Healthcare Access.</p>
      </footer>
    </div>
  );
}
