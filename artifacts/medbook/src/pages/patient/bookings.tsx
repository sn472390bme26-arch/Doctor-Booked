import { useGetMyBookings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Calendar, Clock, MapPin, Ticket, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function MyBookings() {
  const { data: bookings, isLoading } = useGetMyBookings();

  if (isLoading) return <div className="p-20 text-center">Loading bookings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold mb-8">My Appointments</h1>
      
      {bookings?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border">
          <Ticket className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
          <p className="text-muted-foreground mb-6">You haven't booked any appointments.</p>
          <Link href="/patient/hospitals" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold">
            Find a Doctor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map(booking => (
            <div key={booking.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0 border border-primary/20">
                  <span className="text-xs font-bold uppercase">{booking.date ? format(new Date(booking.date), 'MMM') : ''}</span>
                  <span className="text-2xl font-black leading-none">{booking.date ? format(new Date(booking.date), 'dd') : ''}</span>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-1">{booking.doctorName}</h3>
                  <p className="text-muted-foreground text-sm flex items-center mb-1">
                    <MapPin className="w-3.5 h-3.5 mr-1" /> {booking.hospitalName}
                  </p>
                  <p className="text-muted-foreground text-sm flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" /> Session: <span className="capitalize ml-1">{booking.sessionType}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 md:border-l md:border-border md:pl-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Token</p>
                  <p className="text-3xl font-display font-black text-foreground">#{booking.tokenNumber}</p>
                </div>
                
                <Link 
                  href={`/patient/tracker/${booking.sessionId}`}
                  className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center hover:bg-secondary hover:text-white transition-colors"
                >
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
