import { useState, useEffect, useRef } from "react";
import { useGetDoctorProfile, useUpdateDoctorProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Banknote, ListOrdered, Camera, Upload, X } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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
    bio: ""
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

      // Step 1: Request presigned URL
      const urlRes = await fetch(`${API_BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      // Step 2: Upload directly to GCS
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload file");

      // Step 3: Save objectPath as photoUrl in doctor profile
      const photoUrl = `/api/storage${objectPath}`;
      updateProfileMutation.mutate({ data: { photoUrl } }, {
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
    if (!profile?.photoUrl) return null;
    if (profile.photoUrl.startsWith("http")) return profile.photoUrl;
    return `${API_BASE}${profile.photoUrl}`;
  };

  if (isLoading) return <div className="p-20 text-center">Loading profile...</div>;

  const photoSrc = getPhotoSrc();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">Doctor Profile</h1>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-border bg-muted/30 flex items-center gap-6">
          {/* Photo upload area */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center text-primary overflow-hidden shadow-md">
              {photoSrc ? (
                <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingPhoto ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile?.name}</h2>
            <p className="text-primary font-medium">{profile?.specialty}</p>
            <p className="text-sm text-muted-foreground mt-1 font-mono bg-background px-2 py-1 rounded inline-block border border-border">Login Code: {profile?.loginCode}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="mt-2 flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploadingPhoto ? "Uploading..." : "Change Photo"}
            </button>
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
