import { User, Moon, Sun, Shield, LogOut, Volume2, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AvatarUpload from "@/components/AvatarUpload";

const SOUND_LABELS: Record<string, string> = {
  rain: "Rain",
  cafe: "Café",
  whitenoise: "White Noise",
  forest: "Forest",
};

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const { user, signOut, role, setRole } = useAuth();

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const regenerateSound = async (key: string) => {
    setRegenerating(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ambient-sounds`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ sound: key, force: true }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: "Sound regenerated", description: `${SOUND_LABELS[key]} has been refreshed with a new variation.` });
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (err) {
      console.error("Regeneration failed:", err);
      toast({ title: "Regeneration failed", description: "Could not regenerate sound. Please try again.", variant: "destructive" });
    } finally {
      setRegenerating(null);
    }
  };

  const regenerateAll = async () => {
    setRegenerating("all");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ambient-sounds`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ sound: "all", force: true }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: "All sounds regenerated", description: "Fresh variations are ready to play." });
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (err) {
      console.error("Regeneration failed:", err);
      toast({ title: "Regeneration failed", description: "Could not regenerate sounds. Please try again.", variant: "destructive" });
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <User size={14} className="text-primary" />
            <h2 className="text-sm font-medium">Profile</h2>
          </div>
          <div className="space-y-4">
            <AvatarUpload />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <div className="flex gap-2">
                {(["student", "professional"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                      role === r ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            {darkMode ? <Moon size={14} className="text-primary" /> : <Sun size={14} className="text-primary" />}
            <h2 className="text-sm font-medium">Appearance</h2>
          </div>
          <button
            onClick={toggleDark}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors"
          >
            <span className="text-sm">Dark mode</span>
            <div className={`w-8 h-4.5 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-muted"} relative`}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-primary-foreground transition-transform ${darkMode ? "left-4" : "left-0.5"}`} />
            </div>
          </button>
        </section>

        {/* Study Sounds */}
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 size={14} className="text-primary" />
            <h2 className="text-sm font-medium">Study Sounds</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Regenerate ambient sounds to get fresh AI-generated variations.
          </p>
          <div className="space-y-2">
            {Object.entries(SOUND_LABELS).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors"
              >
                <span className="text-sm">{label}</span>
                <button
                  onClick={() => regenerateSound(key)}
                  disabled={regenerating !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {regenerating === key ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  {regenerating === key ? "Generating…" : "Regenerate"}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={regenerateAll}
              disabled={regenerating !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-md border text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {regenerating === "all" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {regenerating === "all" ? "Regenerating all…" : "Regenerate all sounds"}
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-primary" />
            <h2 className="text-sm font-medium">Account</h2>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-md border text-sm hover:bg-accent transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
