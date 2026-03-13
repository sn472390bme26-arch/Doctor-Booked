import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, Menu, X, Hospital, BookOpen, LayoutDashboard, UserCircle } from "lucide-react";
import logoImg from "@assets/Final_logo_page-0001_1773317875013.jpg";

export function Layout({ children }: { children: ReactNode }) {
  const { user, role, token, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn = !!token && !!role;
  const displayName = user?.name ?? (role === 'doctor' ? 'Doctor' : 'Patient');

  const patientLinks = [
    { href: "/patient/hospitals", label: "Hospitals", icon: <Hospital className="w-4 h-4" /> },
    { href: "/patient/bookings", label: "My Bookings", icon: <BookOpen className="w-4 h-4" /> },
  ];

  const doctorLinks = [
    { href: "/doctor/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/doctor/profile", label: "Profile", icon: <UserCircle className="w-4 h-4" /> },
  ];

  const navLinks = role === 'patient' ? patientLinks : role === 'doctor' ? doctorLinks : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href={role === 'doctor' ? "/doctor/dashboard" : "/patient/hospitals"}
              className="flex items-center gap-2.5 transition-transform hover:scale-105"
            >
              <img src={logoImg} alt="Doctor Booked Logo" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                Doctor <span className="text-primary">Booked</span>
              </span>
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                {/* Desktop nav links */}
                <nav className="hidden md:flex items-center gap-1 mr-2">
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.startsWith(link.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {/* User info + logout — desktop */}
                <div className="hidden md:flex items-center gap-3 pl-3 border-l border-border/50">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold leading-none">{displayName}</span>
                    <span className="text-xs text-muted-foreground capitalize">{role}</span>
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

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(o => !o)}
                  className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Open menu"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
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

        {/* Mobile dropdown menu */}
        {isLoggedIn && mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/98 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.startsWith(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{displayName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{role}</div>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 font-medium px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-auto">
        <p>© {new Date().getFullYear()} Doctor Booked. Premium Healthcare Access.</p>
      </footer>
    </div>
  );
}
