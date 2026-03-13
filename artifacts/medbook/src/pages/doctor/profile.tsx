import { useState, useEffect, useRef } from "react";
import { useGetDoctorProfile, useUpdateDoctorProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Save, User, Banknote, ListOrdered, Camera, Upload,
  GraduationCap, Clock, Languages, Phone, FileText, Plus, X
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all";

export default function DoctorProfile() {
  const { data: profile, isLoading, refetch } = useGetDoctorProfile();
  const updateProfileMutation = useUpdateDoctorProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    consultationFee: 0,
    tokensPerSession: 0,
    bio: "",
    education: "",
    experience: "",
    phone: "",
    languages: [] as string[],
  });
  const [langInput, setLangInput] = useState("");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        specialty: profile.specialty || "",
        consultationFee: profile.consultationFee || 0,
        tokensPerSession: profile.tokensPerSession || 0,
        bio: (profile as any).bio || "",
        education: (profile as any).education || "",
        experience: (profile as any).experience?.toString() || "",
        phone: (profile as any).phone || "",
        languages: (profile as any).languages || [],
      });
    }
  }, [profile]);

  const set = (key: string, value: any) => setFormData(f => ({ ...f, [key]: value }));

  const addLanguage = () => {
    const l = langInput.trim();
    if (l && !formData.languages.includes(l)) {
      set("languages", [...formData.languages, l]);
    }
    setLangInput("");
  };

  const removeLanguage = (lang: string) => {
    set("languages", formData.languages.filter(l => l !== lang));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      data: {
        name: formData.name,
        specialty: formData.specialty,
        consultationFee: formData.consultationFee,
        tokensPerSession: formData.tokensPerSession,
        bio: formData.bio,
        education: formData.education,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        phone: formData.phone,
        languages: formData.languages,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
        refetch();
      },
      onError: () => {
        toast({ title: "Save Failed", description: "Could not save changes.", variant: "destructive" });
      }
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Image must be under 5MB.", variant: "destructive" });
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);

    try {
      const token = localStorage.getItem("medbook_token");

      const urlRes = await fetch(`${API_BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload file");

      const photoUrl = `/api/storage${objectPath}`;
      updateProfileMutation.mutate({ data: { photoUrl } as any }, {
        onSuccess: () => {
          toast({ title: "Photo Updated", description: "Your profile photo has been saved." });
          refetch();
        },
        onError: () => {
          toast({ title: "Save Failed", description: "Photo uploaded but could not save to profile.", variant: "destructive" });
        }
      });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "Could not upload photo.", variant: "destructive" });
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getPhotoSrc = () => {
    if (photoPreview) return photoPreview;
    if (!(profile as any)?.photoUrl) return null;
    if ((profile as any).photoUrl.startsWith("http")) return (profile as any).photoUrl;
    return `${API_BASE}${(profile as any).photoUrl}`;
  };

  if (isLoading) return <div className="p-20 text-center text-muted-foreground">Loading profile...</div>;

  const photoSrc = getPhotoSrc();

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <h1 className="text-3xl font-display font-bold mb-2">My Profile</h1>
      <p className="text-muted-foreground text-sm mb-8">This information is shown to patients when they browse and select a doctor.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Photo + Identity card ── */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Photo & Identity</h2>
          </div>
          <div className="p-6 flex items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-primary/10 border-4 border-background flex items-center justify-center text-primary overflow-hidden shadow-lg">
                {photoSrc ? (
                  <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 opacity-40" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingPhoto ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white" />
                    <span className="text-white text-xs font-medium">Change</span>
                  </>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold truncate">{profile?.name || "—"}</div>
              <div className="text-primary font-medium text-sm mt-0.5">{(profile as any)?.specialty || "—"}</div>
              <div className="text-xs text-muted-foreground mt-2 font-mono bg-muted px-2.5 py-1 rounded-lg inline-block border border-border">
                Code: {(profile as any)?.loginCode}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="mt-3 flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadingPhoto ? "Uploading..." : "Upload new photo"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Personal Details ── */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Personal Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name" icon={<User className="w-4 h-4 text-primary" />}>
              <input type="text" value={formData.name} onChange={e => set("name", e.target.value)} className={INPUT_CLS} placeholder="Dr. First Last" />
            </Field>

            <Field label="Specialty" icon={<GraduationCap className="w-4 h-4 text-primary" />}>
              <input type="text" value={formData.specialty} onChange={e => set("specialty", e.target.value)} className={INPUT_CLS} placeholder="e.g. Cardiologist" />
            </Field>

            <Field label="Contact Phone" icon={<Phone className="w-4 h-4 text-primary" />}>
              <input type="tel" value={formData.phone} onChange={e => set("phone", e.target.value)} className={INPUT_CLS} placeholder="+91 98765 43210" />
            </Field>

            <Field label="Years of Experience" icon={<Clock className="w-4 h-4 text-primary" />}>
              <input type="number" min="0" max="60" value={formData.experience} onChange={e => set("experience", e.target.value)} className={INPUT_CLS} placeholder="e.g. 12" />
            </Field>

            <div className="md:col-span-2">
              <Field label="Education & Qualifications" icon={<GraduationCap className="w-4 h-4 text-primary" />}>
                <input type="text" value={formData.education} onChange={e => set("education", e.target.value)} className={INPUT_CLS} placeholder="e.g. MBBS, MD (Cardiology) — AIIMS Delhi" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── About / Bio ── */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">About</h2>
          </div>
          <div className="p-6">
            <Field label="Bio / About the Doctor" icon={<FileText className="w-4 h-4 text-primary" />}>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={e => set("bio", e.target.value)}
                className={`${INPUT_CLS} resize-none`}
                placeholder="Brief description visible to patients — areas of expertise, approach to care, etc."
              />
            </Field>
          </div>
        </div>

        {/* ── Languages ── */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Languages Spoken</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={langInput}
                onChange={e => setLangInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLanguage(); } }}
                className={`${INPUT_CLS} flex-1`}
                placeholder="e.g. English, Hindi, Tamil…"
              />
              <button
                type="button"
                onClick={addLanguage}
                className="px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {formData.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.languages.map(lang => (
                  <span key={lang} className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full border border-primary/20">
                    <Languages className="w-3.5 h-3.5" />
                    {lang}
                    <button type="button" onClick={() => removeLanguage(lang)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Session Settings ── */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Session Settings</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Consultation Fee (₹)" icon={<Banknote className="w-4 h-4 text-primary" />}>
              <input type="number" min="0" value={formData.consultationFee} onChange={e => set("consultationFee", parseInt(e.target.value) || 0)} className={INPUT_CLS} />
            </Field>
            <Field label="Tokens Per Session" icon={<ListOrdered className="w-4 h-4 text-primary" />}>
              <input type="number" min="1" max="100" value={formData.tokensPerSession} onChange={e => set("tokensPerSession", parseInt(e.target.value) || 0)} className={INPUT_CLS} />
            </Field>
          </div>
        </div>

        {/* ── Save Button ── */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="px-10 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2.5 disabled:opacity-70 disabled:transform-none"
          >
            <Save className="w-5 h-5" />
            {updateProfileMutation.isPending ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
