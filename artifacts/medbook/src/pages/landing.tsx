import { Link } from "wouter";
import { motion } from "framer-motion";
import { HeartPulse, Stethoscope, Clock, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden rounded-3xl bg-black mt-4">
        <div className="absolute inset-0 opacity-60">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-medical.png`} 
            alt="Medical background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
        </div>
        
        <div className="relative z-10 py-24 px-8 md:py-32 md:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
              Skip the waiting room. <br/>
              <span className="text-primary">Track your token live.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl">
              Doctor Booked connects you with top specialists and provides real-time token tracking so you arrive exactly when the doctor is ready to see you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/patient/login" 
                className="px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg text-center shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                Book an Appointment
              </Link>
              <Link 
                href="/doctor/login" 
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-semibold text-lg text-center hover:bg-white/20 transition-all duration-300"
              >
                Doctor Portal
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Clock className="w-8 h-8 text-primary" />}
          title="Live Queue Tracking"
          desc="Watch your token progress in real-time. We'll notify you when it's almost your turn."
          delay={0.1}
        />
        <FeatureCard 
          icon={<Stethoscope className="w-8 h-8 text-secondary" />}
          title="Top Specialists"
          desc="Find the right doctor across premium hospitals verified by our team."
          delay={0.2}
        />
        <FeatureCard 
          icon={<ShieldCheck className="w-8 h-8 text-emerald-500" />}
          title="Secure Payments"
          desc="Pay consultation fees upfront safely to secure your confirmed token slot."
          delay={0.3}
        />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="bg-muted w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </motion.div>
  );
}
