import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function AvatarUpload() {
  const { user, avatarUrl, refreshAvatar } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Avatar must be under 2 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Bust cache with timestamp
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      refreshAvatar(url);
      toast({ title: "Avatar updated", description: "Your profile picture has been saved." });
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group shrink-0"
        aria-label="Upload avatar"
      >
        <div className="w-16 h-16 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-muted-foreground uppercase">
              {user?.email?.[0] || "?"}
            </span>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Camera size={18} className="text-white" />
          )}
        </div>
      </button>
      <div>
        <p className="text-sm font-medium">{user?.email}</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-primary hover:underline mt-0.5 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Change photo"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
