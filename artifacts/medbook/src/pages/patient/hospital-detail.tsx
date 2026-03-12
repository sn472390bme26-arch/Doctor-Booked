import { useRoute, Link } from "wouter";
import { useGetHospital, useGetHospitalDoctors, useGetDoctorSessions } from "@workspace/api-client-react";
import { MapPin, Phone, ArrowLeft, GraduationCap, Banknote, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

function DoctorCard({ doc, index }: { doc: any; index: number }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Fetch live sessions for this doctor - polls every 10s to catch newly created sessions
  const { data: sessions = [] } = useGetDoctorSessions(doc.id, undefined, {
    query: { enabled: !!doc.id, refetchInterval: 10000 } as any,
  });

  const todaySessions = sessions.filter(s => s.date === todayStr && !s.isCancelled && s.status !== "cancelled" && s.status !== "closed");
  const hasAvailableSlots = todaySessions.some(s => s.bookedTokens < s.totalTokens);
  const totalSlotsLeft = todaySessions.reduce((sum, s) => sum + Math.max(0, s.totalTokens - s.bookedTokens), 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      <div className="p-6 flex items-start gap-5 flex-1">
        <div className="w-20 h-20 rounded-full bg-primary/5 border-4 border-background shadow-sm overflow-hidden shrink-0">
          <img
            src={doc.photoUrl || `${import.meta.env.BASE_URL}images/doctor-placeholder.png`}
            alt={doc.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground leading-tight truncate">{doc.name}</h3>
          <div className="flex items-center text-primary font-medium text-sm mt-1.5 mb-2">
            <GraduationCap className="w-4 h-4 mr-1.5 shrink-0" />
            {doc.specialty}
          </div>
          <div className="flex items-center text-muted-foreground text-sm">
            <Banknote className="w-4 h-4 mr-1.5 shrink-0" />
            <span>₹{doc.consultationFee} consultation</span>
          </div>

          {/* Live session availability */}
          <div className="mt-3">
            {todaySessions.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                No sessions today
              </span>
            ) : hasAvailableSlots ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {totalSlotsLeft} slots open today
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Fully booked today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Session chips */}
      {todaySessions.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {todaySessions.map(s => {
            const left = s.totalTokens - s.bookedTokens;
            const full = left <= 0;
            return (
              <span key={s.id} className={`text-xs font-semibold px-2.5 py-1 rounded-xl border capitalize ${full ? "bg-muted text-muted-foreground border-border line-through" : "bg-primary/5 text-primary border-primary/20"}`}>
                {s.sessionType} · {s.startTime}–{s.endTime}
                {!full && <span className="ml-1 opacity-70">({left} left)</span>}
              </span>
            );
          })}
        </div>
      )}

      <div className="border-t border-border px-6 py-4">
        <Link
          href={`/patient/book/${doc.id}`}
          className={`flex items-center justify-between w-full font-semibold rounded-xl px-4 py-2.5 transition-all text-sm ${
            hasAvailableSlots
              ? "bg-primary/10 text-primary hover:bg-primary hover:text-white"
              : "bg-muted text-muted-foreground hover:bg-primary/5 hover:text-primary"
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {hasAvailableSlots ? "Book Appointment" : "Check Schedule"}
          </span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function HospitalDetail() {
  const [, params] = useRoute("/patient/hospitals/:id");
  const id = parseInt(params?.id || "0");

  const { data: hospital, isLoading: loadingHosp } = useGetHospital(id, { query: { enabled: !!id } as any });
  const { data: doctors, isLoading: loadingDocs } = useGetHospitalDoctors(id, { query: { enabled: !!id } as any });

  if (loadingHosp) return <div className="p-12 text-center text-muted-foreground">Loading hospital details...</div>;
  if (!hospital) return <div className="p-12 text-center text-destructive">Hospital not found</div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in">
      <Link href="/patient/hospitals" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Hospitals
      </Link>

      <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-sm">
        <div className="h-64 sm:h-80 relative">
          <img
            src={hospital.imageUrl || `${import.meta.env.BASE_URL}images/hospital-placeholder.png`}
            alt={hospital.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 text-white">
            <h1 className="text-3xl sm:text-5xl font-display font-bold mb-4">{hospital.name}</h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 opacity-90 text-sm sm:text-base">
              <div className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary" /> {hospital.address}</div>
              <div className="flex items-center"><Phone className="w-5 h-5 mr-2 text-primary" /> {hospital.phone || "+91 80000 00000"}</div>
            </div>
          </div>
        </div>
      </div>

      {((hospital as any).photos?.length > 0) && (
        <div>
          <h2 className="text-xl font-bold font-display mb-4">Gallery</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {((hospital as any).photos as string[]).map((url, i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-video bg-muted">
                <img
                  src={url.startsWith("/api/") ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}${url}` : url}
                  alt={`${hospital.name} photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-display flex items-center gap-3">
            Doctors
            <span className="bg-primary/10 text-primary text-sm py-1 px-3 rounded-full">{doctors?.length || 0}</span>
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Session availability updates live
          </span>
        </div>

        {loadingDocs ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-56 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {doctors?.map((doc, i) => (
              <DoctorCard key={doc.id} doc={doc} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
