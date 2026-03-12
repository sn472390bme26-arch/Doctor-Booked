import { useState } from "react";
import { useGetMe, useGetDoctorSessions, useGetSessionTokens, useUpdateTokenStatus, useActivateBufferSlot, useCloseSession } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Users, AlertCircle, Check, Play, PauseCircle, PowerOff, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorDashboard() {
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const doctorId = user?.doctorId || 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: sessions, refetch: refetchSessions } = useGetDoctorSessions(doctorId, {
    query: { enabled: !!doctorId }
  });

  const activeSessions = sessions?.filter(s => s.date === todayStr && s.status !== 'cancelled') || [];
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  
  // Auto-select first active session
  if (!selectedSessionId && activeSessions.length > 0) {
    setSelectedSessionId(activeSessions[0].id);
  }

  const { data: tokens = [], refetch: refetchTokens } = useGetSessionTokens(selectedSessionId || 0, {
    query: { enabled: !!selectedSessionId, refetchInterval: 5000 }
  });

  const updateStatusMutation = useUpdateTokenStatus();
  const closeSessionMutation = useCloseSession();

  const handleTokenClick = (tokenId: number, currentStatus: string) => {
    let newStatus: 'ongoing' | 'completed' | 'skipped' | null = null;
    
    if (currentStatus === 'booked') newStatus = 'ongoing';
    else if (currentStatus === 'ongoing' || currentStatus === 'skipped') {
      // In a real app, this would open a dialog to choose completed vs skipped.
      // For fast UX, let's toggle: click once = complete. Shift+click = skip.
      // We'll use a prompt for simplicity in this demo.
      const action = window.confirm("Mark as Completed? (Cancel to mark Skipped)");
      newStatus = action ? 'completed' : 'skipped';
    }

    if (newStatus) {
      updateStatusMutation.mutate({
        tokenId,
        data: { status: newStatus }
      }, {
        onSuccess: () => refetchTokens()
      });
    }
  };

  const handleEndSession = () => {
    if (!selectedSessionId) return;
    if (window.confirm("Are you sure you want to end this session? Unvisited tokens will be refunded.")) {
      closeSessionMutation.mutate({ sessionId: selectedSessionId }, {
        onSuccess: (res) => {
          toast({ title: "Session Closed", description: res.message });
          refetchSessions();
        }
      });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-display">Token Control Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage live queue for today's sessions</p>
        </div>

        <div className="flex gap-2">
          {activeSessions.map(session => (
            <button
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedSessionId === session.id 
                  ? 'bg-secondary text-white shadow-md' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span className="capitalize">{session.sessionType}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedSessionId ? (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-muted p-4 border-b border-border flex justify-between items-center">
            <div className="flex gap-6 text-sm font-medium">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-border rounded-full" /> Open</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[hsl(var(--status-booked))] rounded-full" /> Waiting</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[hsl(var(--status-ongoing))] rounded-full" /> Ongoing/Skipped</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[hsl(var(--status-completed))] rounded-full" /> Done</span>
            </div>
            <button 
              onClick={handleEndSession}
              className="text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <PowerOff className="w-4 h-4" /> End Session
            </button>
          </div>

          <div className="p-8">
            <TokenGrid 
              tokens={tokens} 
              onTokenClick={handleTokenClick} 
              sessionId={selectedSessionId} 
              onRefresh={refetchTokens}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
          <p className="text-muted-foreground">No active sessions for today.</p>
        </div>
      )}
    </div>
  );
}

// Separate component for the grid to handle the priority slots logic
function TokenGrid({ tokens, onTokenClick, sessionId, onRefresh }: any) {
  const addBufferMutation = useActivateBufferSlot();
  const { toast } = useToast();

  const regularTokens = tokens.filter((t: any) => !t.isBuffer).sort((a: any, b: any) => a.tokenNumber - b.tokenNumber);
  const bufferTokens = tokens.filter((t: any) => t.isBuffer).sort((a: any, b: any) => a.tokenNumber - b.tokenNumber);

  const handleAddBuffer = (slotGroupIndex: number) => {
    const name = window.prompt("Priority Patient Name:");
    if (!name) return;
    const phone = window.prompt("Priority Patient Phone:");
    
    addBufferMutation.mutate({
      sessionId,
      data: { slotGroupIndex, patientName: name, patientPhone: phone || "" }
    }, {
      onSuccess: () => {
        toast({ title: "Priority Slot Added" });
        onRefresh();
      }
    });
  };

  const renderToken = (token: any) => {
    let bgClass = "bg-white border-2 border-border hover:border-primary/50 text-foreground cursor-pointer";
    let icon = null;
    
    if (token.status === 'booked') {
      bgClass = "bg-[hsl(var(--status-booked))] border-[hsl(var(--status-booked))] hover:brightness-110 text-white cursor-pointer shadow-md";
    }
    if (token.status === 'ongoing') {
      bgClass = "bg-[hsl(var(--status-ongoing))] border-[hsl(var(--status-ongoing))] text-white cursor-pointer shadow-[0_0_15px_hsl(var(--status-ongoing))] scale-105 z-10";
      icon = <Play className="w-6 h-6 absolute opacity-20" />;
    }
    if (token.status === 'skipped') {
      bgClass = "bg-[hsl(var(--status-ongoing))] border-[hsl(var(--status-ongoing))] text-white opacity-70 cursor-pointer border-dashed";
      icon = <PauseCircle className="w-6 h-6 absolute opacity-50" />;
    }
    if (token.status === 'completed') {
      bgClass = "bg-[hsl(var(--status-completed))] border-[hsl(var(--status-completed))] text-white opacity-40 cursor-not-allowed";
      icon = <Check className="w-6 h-6 absolute opacity-50" />;
    }
    if (token.status === 'booked' && token.notificationSent) {
      bgClass = "bg-[hsl(var(--status-next))] border-[hsl(var(--status-next))] text-black cursor-pointer shadow-md";
    }

    return (
      <motion.button
        layout
        key={token.id}
        onClick={() => token.status !== 'completed' && token.status !== 'available' && onTokenClick(token.id, token.status)}
        className={`relative aspect-square rounded-2xl flex items-center justify-center text-2xl font-bold font-display transition-all duration-300 ${bgClass}`}
        title={token.patientName ? `${token.patientName} - ${token.status}` : token.status}
      >
        {icon}
        <span className="relative z-10">{token.tokenNumber}</span>
      </motion.button>
    );
  };

  const chunks = [];
  for(let i=0; i < regularTokens.length; i+=10) {
    chunks.push(regularTokens.slice(i, i+10));
  }

  return (
    <div className="space-y-6">
      {chunks.map((chunk, index) => {
        const rowBuffers = bufferTokens.filter((t: any) => Math.floor((t.tokenNumber - 1000) / 10) === index);
        
        return (
          <div key={index} className="space-y-4">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {chunk.map(renderToken)}
            </div>
            
            {/* Priority Row UI - Only visible if there are buffers or hovered */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleAddBuffer(index)}
                className="h-10 px-4 rounded-xl border border-dashed border-primary text-primary text-sm font-bold flex items-center gap-2 hover:bg-primary hover:text-white transition-colors shrink-0"
              >
                <UserPlus className="w-4 h-4" /> Add Priority Slot
              </button>
              
              {rowBuffers.length > 0 && (
                <div className="flex-1 bg-muted rounded-xl p-2 flex gap-3 overflow-x-auto border border-border">
                  {rowBuffers.map((token: any) => (
                    <div key={token.id} className="w-12 shrink-0">
                      {renderToken(token)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}
