import { useState, useEffect } from "react";
import { useGetDoctorProfile, useUpdateDoctorProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Banknote, ListOrdered } from "lucide-react";

export default function DoctorProfile() {
  const { data: profile, isLoading } = useGetDoctorProfile();
  const updateProfileMutation = useUpdateDoctorProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    consultationFee: 0,
    tokensPerSession: 0,
    bio: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        specialty: profile.specialty || "",
        consultationFee: profile.consultationFee || 0,
        tokensPerSession: profile.tokensPerSession || 0,
        bio: profile.bio || ""
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      data: formData
    }, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
      }
    });
  };

  if (isLoading) return <div className="p-20 text-center">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">Doctor Profile</h1>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-border bg-muted/30 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center text-primary overflow-hidden">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.name}</h2>
            <p className="text-primary font-medium">{profile?.specialty}</p>
            <p className="text-sm text-muted-foreground mt-1 font-mono bg-background px-2 py-1 rounded inline-block border border-border">Login Code: {profile?.loginCode}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 rounded-xl border border-border bg-background" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Specialty</label>
              <input 
                type="text" 
                value={formData.specialty}
                onChange={e => setFormData({...formData, specialty: e.target.value})}
                className="w-full p-3 rounded-xl border border-border bg-background" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" /> Consultation Fee (₹)
              </label>
              <input 
                type="number" 
                value={formData.consultationFee}
                onChange={e => setFormData({...formData, consultationFee: parseInt(e.target.value) || 0})}
                className="w-full p-3 rounded-xl border border-border bg-background" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-primary" /> Tokens Per Session
              </label>
              <input 
                type="number" 
                value={formData.tokensPerSession}
                onChange={e => setFormData({...formData, tokensPerSession: parseInt(e.target.value) || 0})}
                className="w-full p-3 rounded-xl border border-border bg-background" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Bio / Qualifications</label>
            <textarea 
              rows={4}
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              className="w-full p-3 rounded-xl border border-border bg-background resize-none" 
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
            >
              <Save className="w-5 h-5" />
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
