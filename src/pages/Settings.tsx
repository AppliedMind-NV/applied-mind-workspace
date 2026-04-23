import { User, Moon, Sun, Shield, LogOut, Sparkles, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AvatarUpload from "@/components/AvatarUpload";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const { signOut, role, setRole, replayOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleReplayOnboarding = async () => {
    await replayOnboarding();
    navigate("/");
  };

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
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
