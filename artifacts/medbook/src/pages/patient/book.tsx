import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetDoctorSessions, useCreateBooking } from "@workspace/api-client-react";
import { format, addDays } from "date-fns";
import { Calendar, Clock, ArrowRight, Activity, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BookDoctor() {
  const [, params] = useRoute("/patient/book/:id");
  const doctorId = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Generate next 5 days
  const today = new Date();
  const dates = Array.from({ length: 5 }).map((_, i) => addDays(today, i));
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);

  // Fetch sessions for this doctor
  const { data: sessions, isLoading } = useGetDoctorSessions(doctorId, undefined, {
    query: { queryKey: [] as any, enabled: !!doctorId, refetchInterval: 8000 }
  });

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const createBookingMutation = useCreateBooking();

  const handleBook = () => {
    if (!selectedSessionId) return;
    
    createBookingMutation.mutate({
      data: { sessionId: selectedSessionId }
    }, {
      onSuccess: (booking) => {
        setLocation(`/patient/pay/${booking.id}`);
      },
      onError: (err) => {
        toast({ title: "Booking Failed", description: err.message || "Session might be full.", variant: "destructive" });
      }
    });
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const availableSessions = sessions?.filter(s => s.date === selectedDateStr && s.status !== 'cancelled') || [];
  const selectedSession = availableSessions.find(s => s.id === selectedSessionId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold mb-2">Book Appointment</h1>
        <p className="text-muted-foreground">Select a date and session to generate your token.</p>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold flex items-center mb-6">
          <Calendar className="w-5 h-5 mr-2 text-primary" /> 1. Select Date
        </h2>
        <div className="flex flex-wrap gap-3">
          {dates.map((date) => {
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            return (
              <button
                key={date.toISOString()}
                onClick={() => { setSelectedDate(date); setSelectedSessionId(null); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all min-w-[100px]
                  ${isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:border-primary/40 text-foreground'}`}
              >
                <span className="text-sm font-medium uppercase tracking-wider opacity-80">{format(date, 'EEE')}</span>
                <span className="text-2xl font-bold mt-1">{format(date, 'dd')}</span>
                <span className="text-xs mt-1 opacity-70">{format(date, 'MMM')}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold flex items-center mb-6">
          <Clock className="w-5 h-5 mr-2 text-primary" /> 2. Select Session
        </h2>
        
        {isLoading ? (
          <div className="h-32 bg-muted animate-pulse rounded-2xl" />
        ) : availableSessions.length === 0 ? (
          <div className="p-8 text-center bg-muted/50 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">No available sessions for this date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableSessions.map(session => {
              const isSelected = selectedSessionId === session.id;
              const isFull = session.bookedTokens >= session.totalTokens;
              
              return (
                <button
                  key={session.id}
                  disabled={isFull}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                    isFull ? 'opacity-50 cursor-not-allowed border-border bg-muted' :
                    isSelected ? 'border-secondary bg-secondary/5 ring-4 ring-secondary/10' : 
                    'border-border hover:border-secondary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold capitalize text-lg">{session.sessionType}</span>
                    {isFull && <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md font-bold">FULL</span>}
                  </div>
                  <div className="text-muted-foreground font-mono text-sm mb-4">
                    {session.startTime} - {session.endTime}
                  </div>
                  
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden mt-auto">
                    <div 
                      className={`h-full ${isFull ? 'bg-destructive' : 'bg-secondary'}`}
                      style={{ width: `${(session.bookedTokens / session.totalTokens) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-right mt-1 text-muted-foreground font-medium">
                    {session.bookedTokens} / {session.totalTokens} Booked
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/20 p-6 sm:p-8 animate-in slide-in-from-bottom-4">
          <h2 className="text-xl font-bold flex items-center mb-4">
            <Activity className="w-5 h-5 mr-2 text-primary" /> Token Preview
          </h2>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-4 text-lg">
              <p className="flex items-start gap-3">
                <Info className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">{selectedSession.bookedTokens} tokens</strong> are already booked for this session.</span>
              </p>
              <p className="text-muted-foreground pl-9">
                If you book now, you will receive <strong className="text-primary font-bold text-xl">Token #{selectedSession.bookedTokens + 1}</strong>.
              </p>
              <p className="text-muted-foreground pl-9">
                Consultation Fee: <strong className="text-foreground text-xl">₹{selectedSession.consultationFee}</strong>
              </p>
            </div>
            
            <button
              onClick={handleBook}
              disabled={createBookingMutation.isPending}
              className="w-full md:w-auto whitespace-nowrap px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {createBookingMutation.isPending ? "Generating..." : "Generate Token"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
