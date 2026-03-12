import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import PatientLogin from "@/pages/patient/login";
import DoctorLogin from "@/pages/doctor/login";
import HospitalsList from "@/pages/patient/hospitals";
import HospitalDetail from "@/pages/patient/hospital-detail";
import BookDoctor from "@/pages/patient/book";
import Payment from "@/pages/patient/pay";
import TokenConfirmation from "@/pages/patient/token";
import TokenTracker from "@/pages/patient/tracker";
import MyBookings from "@/pages/patient/bookings";
import DoctorDashboard from "@/pages/doctor/dashboard";
import DoctorProfile from "@/pages/doctor/profile";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component, allowedRole }: { component: any, allowedRole?: string }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    setLocation(allowedRole === 'doctor' ? "/doctor/login" : "/patient/login");
    return null;
  }

  if (allowedRole && role !== allowedRole) {
    setLocation("/");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Landing} />
        <Route path="/patient/login" component={PatientLogin} />
        <Route path="/doctor/login" component={DoctorLogin} />

        {/* Patient Routes */}
        <Route path="/patient/hospitals">
          {() => <ProtectedRoute component={HospitalsList} allowedRole="patient" />}
        </Route>
        <Route path="/patient/hospitals/:id">
          {() => <ProtectedRoute component={HospitalDetail} allowedRole="patient" />}
        </Route>
        <Route path="/patient/book/:id">
          {() => <ProtectedRoute component={BookDoctor} allowedRole="patient" />}
        </Route>
        <Route path="/patient/pay/:id">
          {() => <ProtectedRoute component={Payment} allowedRole="patient" />}
        </Route>
        <Route path="/patient/token/:id">
          {() => <ProtectedRoute component={TokenConfirmation} allowedRole="patient" />}
        </Route>
        <Route path="/patient/tracker/:id">
          {() => <ProtectedRoute component={TokenTracker} allowedRole="patient" />}
        </Route>
        <Route path="/patient/bookings">
          {() => <ProtectedRoute component={MyBookings} allowedRole="patient" />}
        </Route>

        {/* Doctor Routes */}
        <Route path="/doctor/dashboard">
          {() => <ProtectedRoute component={DoctorDashboard} allowedRole="doctor" />}
        </Route>
        <Route path="/doctor/profile">
          {() => <ProtectedRoute component={DoctorProfile} allowedRole="doctor" />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
