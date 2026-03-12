import { useState } from "react";
import { Link } from "wouter";
import { useGetHospitals } from "@workspace/api-client-react";
import { Search, MapPin, Star, Building2, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function HospitalsList() {
  const [search, setSearch] = useState("");
  const { data: hospitals, isLoading } = useGetHospitals({ search });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-r from-primary/10 to-transparent p-8 rounded-3xl border border-primary/10">
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Find a Hospital</h1>
          <p className="text-muted-foreground text-lg">Select a hospital to view available doctors and book your token instantly.</p>
        </div>
        
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search hospitals or areas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card h-80 rounded-3xl border border-border animate-pulse" />
          ))}
        </div>
      ) : hospitals?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground">No hospitals found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hospitals?.map((hospital, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={hospital.id}
            >
              <Link 
                href={`/patient/hospitals/${hospital.id}`}
                className="block group h-full bg-card rounded-3xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="relative h-48 bg-muted overflow-hidden">
                  <img 
                    src={hospital.imageUrl || `${import.meta.env.BASE_URL}images/hospital-placeholder.png`} 
                    alt={hospital.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold font-display leading-tight">{hospital.name}</h3>
                    <div className="flex items-center text-sm mt-1 opacity-90">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {hospital.location}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 mr-1.5" />
                      {hospital.doctorCount || 12} Doctors
                    </div>
                    <div className="flex items-center text-amber-500 font-medium">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      4.8
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {hospital.specialties?.slice(0,3).map(s => (
                        <span key={s} className="text-xs bg-secondary/10 text-secondary-foreground px-2.5 py-1 rounded-md">
                          {s}
                        </span>
                      ))}
                      {hospital.specialties && hospital.specialties.length > 3 && (
                        <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-md">
                          +{hospital.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
