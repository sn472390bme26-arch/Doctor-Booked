import { useRoute, Link } from "wouter";
import { useGetHospital, useGetHospitalDoctors } from "@workspace/api-client-react";
import { MapPin, Phone, ArrowLeft, GraduationCap, Banknote } from "lucide-react";
import { motion } from "framer-motion";

export default function HospitalDetail() {
  const [, params] = useRoute("/patient/hospitals/:id");
  const id = parseInt(params?.id || "0");

  const { data: hospital, isLoading: loadingHosp } = useGetHospital(id, { query: { enabled: !!id } });
  const { data: doctors, isLoading: loadingDocs } = useGetHospitalDoctors(id, { query: { enabled: !!id } });

  if (loadingHosp) return <div className="p-12 text-center">Loading hospital details...</div>;
  if (!hospital) return <div className="p-12 text-center text-destructive">Hospital not found</div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in">
      <Link href="/patient/hospitals" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hospitals
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

      <div>
        <h2 className="text-2xl font-bold font-display mb-6 flex items-center">
          Available Doctors
          <span className="ml-3 bg-primary/10 text-primary text-sm py-1 px-3 rounded-full">{doctors?.length || 0}</span>
        </h2>
        
        {loadingDocs ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {doctors?.map((doc, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={doc.id} 
                className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="w-24 h-24 rounded-full bg-primary/5 border-4 border-background shadow-sm overflow-hidden shrink-0">
                  <img src={doc.photoUrl || `${import.meta.env.BASE_URL}images/doctor-placeholder.png`} alt={doc.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">{doc.name}</h3>
                  <div className="flex items-center text-primary font-medium text-sm mb-3">
                    <GraduationCap className="w-4 h-4 mr-1.5" />
                    {doc.specialty}
                  </div>
                  
                  <div className="flex items-center text-muted-foreground text-sm mb-4">
                    <Banknote className="w-4 h-4 mr-1.5" />
                    Consultation Fee: <span className="font-bold text-foreground ml-1">₹{doc.consultationFee}</span>
                  </div>
                  
                  <Link 
                    href={`/patient/book/${doc.id}`}
                    className="inline-block w-full sm:w-auto text-center px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold rounded-xl transition-colors"
                  >
                    Check Availability & Book
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
