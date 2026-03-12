import { useRoute } from "wouter";
import { useGetSession, useGetSessionTokens, useGetMyBookings } from "@workspace/api-client-react";
import { Activity, BellRing, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TokenTracker() {
  const [, params] = useRoute("/patient/tracker/:id");
  const sessionId = parseInt(params?.id || "0");

  // Fetch session details
  const { data: sessionData } = useGetSession(sessionId, { query: { enabled: !!sessionId } });
  
  // Poll tokens every 5 seconds for real-time feel
  const { data: tokens = [] } = useGetSessionTokens(sessionId, { 
    query: { 
      enabled: !!sessionId,
      refetchInterval: 5000 
    } 
  });

  // Get current user's booking to highlight their token
  const { data: bookings } = useGetMyBookings();
  const myBooking = bookings?.find(b => b.sessionId === sessionId);
  const myTokenNumber = myBooking?.tokenNumber;

  const ongoingToken = tokens.find(t => t.status === 'ongoing');
  const nextToken = tokens.find(t => t.status === 'next' || t.notificationSent); // Assuming frontend derives 'next' or backend marks it. Yellow state.

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-card rounded-3xl p-6 sm:p-10 border border-border shadow-sm flex flex-col md:flex-row items-center gap-8 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Live Token Tracker</h1>
          <p className="text-muted-foreground flex items-center">
            <Activity className="w-4 h-4 mr-2 text-primary animate-pulse" /> Auto-updating real-time queue
          </p>
        </div>
        
        {myTokenNumber && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl text-center min-w-[200px]">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-1">Your Token</p>
            <div className="text-5xl font-display font-black text-foreground">#{myTokenNumber}</div>
          </div>
        )}
      </div>

      {ongoingToken && myTokenNumber === ongoingToken.tokenNumber && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500 text-white p-6 rounded-3xl flex items-center gap-4 shadow-lg shadow-orange-500/20"
        >
          <BellRing className="w-10 h-10 animate-bounce" />
          <div>
            <h2 className="text-2xl font-bold">It's Your Turn!</h2>
            <p className="opacity-90 text-lg">Please enter the doctor's cabin now.</p>
          </div>
        </motion.div>
      )}

      <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <h2 className="text-xl font-bold flex items-center">
            <Clock className="w-5 h-5 mr-2 text-muted-foreground" /> Queue Status
          </h2>
          
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-white border border-border mr-2"/> Available</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[hsl(var(--status-booked))] mr-2"/> Booked</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[hsl(var(--status-ongoing))] shadow-[0_0_10px_hsl(var(--status-ongoing))] mr-2"/> Ongoing</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[hsl(var(--status-next))] mr-2"/> Next</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[hsl(var(--status-completed))] mr-2"/> Completed</div>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-3 sm:gap-4">
          <AnimatePresence>
            {tokens.map((token, i) => {
              const isMine = token.tokenNumber === myTokenNumber;
              let bgClass = "bg-white border-2 border-border text-foreground";
              let shadow = "";
              
              if (token.status === 'booked') bgClass = "bg-[hsl(var(--status-booked))] border-[hsl(var(--status-booked))] text-white";
              if (token.status === 'ongoing') {
                bgClass = "bg-[hsl(var(--status-ongoing))] border-[hsl(var(--status-ongoing))] text-white";
                shadow = "shadow-[0_0_15px_hsl(var(--status-ongoing))] z-10 scale-110";
              }
              if (token.status === 'completed') bgClass = "bg-[hsl(var(--status-completed))] border-[hsl(var(--status-completed))] text-white opacity-50";
              if (token.status === 'skipped') bgClass = "bg-[hsl(var(--status-ongoing))] border-[hsl(var(--status-ongoing))] text-white opacity-70";
              
              // Frontend calculation for next (assuming the one right after ongoing)
              if (token.status === 'booked' && token.notificationSent) {
                bgClass = "bg-[hsl(var(--status-next))] border-[hsl(var(--status-next))] text-black";
              }

              return (
                <motion.div
                  layout
                  key={token.id}
                  className={`
                    relative aspect-square rounded-xl flex items-center justify-center text-xl font-bold font-display transition-all duration-500
                    ${bgClass} ${shadow}
                  `}
                >
                  {token.tokenNumber}
                  {isMine && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                  )}
                  {token.isBuffer && (
                    <div className="absolute bottom-1 text-[8px] uppercase tracking-tighter opacity-70">PRI</div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
