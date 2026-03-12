import { useRoute, Link } from "wouter";
import { useGetMyBookings } from "@workspace/api-client-react";
import { CheckCircle2, Ticket, Calendar, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function TokenConfirmation() {
  const [, params] = useRoute("/patient/token/:id");
  const bookingId = parseInt(params?.id || "0");
  
  const { data: bookings, isLoading } = useGetMyBookings();
  const booking = bookings?.find(b => b.id === bookingId);

  if (isLoading) return <div className="p-20 text-center">Generating token...</div>;
  if (!booking) return <div className="p-20 text-center">Booking not found.</div>;

  return (
    <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-400 to-emerald-600" />
        
        <div className="relative pt-12 px-8 pb-8 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-6"
          >
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
          </motion.div>
          
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">Your appointment is scheduled.</p>
          
          <div className="my-8 py-8 border-y border-border border-dashed relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full border-r border-border" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full border-l border-border" />
            
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Your Token Number</p>
            <div className="text-7xl font-display font-black text-foreground tabular-nums flex items-center justify-center gap-4">
              <Ticket className="w-12 h-12 text-primary opacity-50" />
              {booking.tokenNumber}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-y-6 text-left mb-8">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center"><User className="w-3.5 h-3.5 mr-1"/> Doctor</p>
              <p className="font-semibold">{booking.doctorName}</p>
              <p className="text-xs text-muted-foreground">{booking.specialty}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1"/> Hospital</p>
              <p className="font-semibold">{booking.hospitalName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1"/> Date</p>
              <p className="font-semibold">{booking.date ? format(new Date(booking.date), 'MMM dd, yyyy') : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center"><Clock className="w-3.5 h-3.5 mr-1"/> Session</p>
              <p className="font-semibold capitalize">{booking.sessionType}</p>
            </div>
          </div>
          
          <Link 
            href={`/patient/tracker/${booking.sessionId}`}
            className="block w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Track Queue Live
          </Link>
          <Link 
            href="/patient/hospitals"
            className="block w-full py-4 mt-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
