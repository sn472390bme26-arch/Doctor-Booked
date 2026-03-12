import { useGetMyBookings } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Calendar, Clock, MapPin, Ticket, Activity, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, Hospital
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_payment: { label: "Pending Payment", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  confirmed:       { label: "Confirmed", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  visited:         { label: "Visited", color: "text-green-600 bg-green-50 border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled:       { label: "Cancelled", color: "text-red-600 bg-red-50 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
  unvisited:       { label: "Unvisited / Refunded", color: "text-gray-600 bg-gray-50 border-gray-200", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function MyBookings() {
  const { data: bookings, isLoading } = useGetMyBookings({ query: { refetchInterval: 10000 } as any });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-8">My Appointments</h1>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-36 bg-muted animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">My Appointments</h1>
        {bookings && bookings.length > 0 && (
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-medium">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
          <Ticket className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
          <p className="text-muted-foreground mb-6">You haven't booked any appointments.</p>
          <Link href="/patient/hospitals" className="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20">
            Find a Doctor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, i) => {
            const cfg = statusConfig[booking.status || "confirmed"] || statusConfig.confirmed;
            const isActive = booking.status === "confirmed" || booking.status === "pending_payment";
            const isToday = booking.date === format(new Date(), "yyyy-MM-dd");

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Top stripe for today's active bookings */}
                {isActive && isToday && (
                  <div className="bg-primary px-6 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-primary-foreground tracking-wide uppercase">Today's Session — Live</span>
                  </div>
                )}

                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                  {/* Left: date + details */}
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary shrink-0 border border-primary/20">
                      <span className="text-[10px] font-bold uppercase leading-none">{booking.date ? format(new Date(booking.date), "MMM") : "—"}</span>
                      <span className="text-2xl font-black leading-tight">{booking.date ? format(new Date(booking.date), "dd") : "—"}</span>
                      <span className="text-[10px] opacity-60">{booking.date ? format(new Date(booking.date), "EEE") : ""}</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold leading-tight">{booking.doctorName || "Doctor"}</h3>
                      <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                        <Hospital className="w-3.5 h-3.5" /> {booking.hospitalName}
                      </p>
                      <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="capitalize">{booking.sessionType}</span> session
                      </p>
                      <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Right: token + actions */}
                  <div className="flex items-center gap-4 sm:border-l sm:border-border sm:pl-6 shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Token</p>
                      <p className="text-4xl font-display font-black text-foreground leading-tight">#{booking.tokenNumber}</p>
                    </div>

                    {isActive ? (
                      <Link
                        href={`/patient/tracker/${booking.sessionId}`}
                        className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all text-sm whitespace-nowrap"
                      >
                        <Activity className="w-4 h-4 animate-pulse" />
                        Track Live
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        href={`/patient/tracker/${booking.sessionId}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground font-semibold rounded-2xl hover:bg-muted/80 transition-all text-sm"
                      >
                        View Queue
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
