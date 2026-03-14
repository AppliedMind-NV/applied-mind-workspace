import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Zap,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickActions = [
  { label: "New Note", icon: FileText, color: "text-primary", path: "/notes" },
  { label: "Start Study", icon: Clock, color: "text-primary", path: "/study" },
  { label: "Practice", icon: HelpCircle, color: "text-primary", path: "/practice" },
  { label: "Review Cards", icon: Layers, color: "text-primary", path: "/flashcards" },
];

interface RecentNote {
  id: string;
  title: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const [flashcardsDue, setFlashcardsDue] = useState(0);
  const [flashcardsTotal, setFlashcardsTotal] = useState(0);
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const now = new Date().toISOString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [notesRes, flashcardsDueRes, flashcardsTotalRes, sessionsRes, recentRes, streakRes] =
        await Promise.all([
          supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id).lte("next_review", now),
          supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("study_sessions").select("duration_minutes").eq("user_id", user.id).gte("started_at", weekAgo),
          supabase.from("notes").select("id, title, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
          supabase.from("study_sessions").select("started_at").eq("user_id", user.id).order("started_at", { ascending: false }).limit(365),
        ]);

      setNotesCount(notesRes.count ?? 0);
      setFlashcardsDue(flashcardsDueRes.count ?? 0);
      setFlashcardsTotal(flashcardsTotalRes.count ?? 0);

      const sessions = sessionsRes.data ?? [];
      setSessionsCount(sessions.length);
      setStudyMinutes(sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0));

      // Calculate streak from unique study days
      const streakDays = streakRes.data ?? [];
      const uniqueDays = new Set(streakDays.map((s) => new Date(s.started_at).toLocaleDateString()));
      const sortedDays = Array.from(uniqueDays)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Streak counts if user studied today or yesterday
      if (sortedDays.length > 0) {
        const mostRecent = new Date(sortedDays[0]);
        mostRecent.setHours(0, 0, 0, 0);
        if (mostRecent.getTime() === today.getTime() || mostRecent.getTime() === yesterday.getTime()) {
          currentStreak = 1;
          for (let i = 1; i < sortedDays.length; i++) {
            const curr = new Date(sortedDays[i]);
            curr.setHours(0, 0, 0, 0);
            const prev = new Date(sortedDays[i - 1]);
            prev.setHours(0, 0, 0, 0);
            const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }
      setStreak(currentStreak);

      setRecentNotes(recentRes.data ?? []);
      setLoading(false);
    };

    load();
  }, [user]);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">{greeting()}</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading your dashboard…" : flashcardsDue > 0
            ? `You have ${flashcardsDue} flashcard${flashcardsDue !== 1 ? "s" : ""} due for review.`
            : "You're all caught up. Keep studying!"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
          >
            <action.icon size={16} className={action.color} />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Week</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame size={18} className={streak > 0 ? "text-orange-500" : "text-muted-foreground"} />
              <div>
                <p className="text-2xl font-semibold tabular-nums">{loading ? "—" : streak}</p>
                <p className="text-xs text-muted-foreground">Day streak</p>
              </div>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? "—" : studyMinutes >= 60 ? `${(studyMinutes / 60).toFixed(1)}h` : `${studyMinutes}m`}
              </p>
              <p className="text-xs text-muted-foreground">Study time</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{loading ? "—" : sessionsCount}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{loading ? "—" : flashcardsTotal}</p>
              <p className="text-xs text-muted-foreground">Total flashcards</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">At a Glance</span>
          </div>
          <div className="space-y-2">
            <div
              onClick={() => navigate("/flashcards")}
              className="flex items-center justify-between px-3 py-2.5 rounded-md bg-background hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${flashcardsDue > 0 ? "bg-primary" : "bg-muted"}`} />
                <span className="text-sm">
                  {flashcardsDue > 0 ? `Review ${flashcardsDue} due flashcard${flashcardsDue !== 1 ? "s" : ""}` : "No flashcards due"}
                </span>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
            <div
              onClick={() => navigate("/notes")}
              className="flex items-center justify-between px-3 py-2.5 rounded-md bg-background hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <span className="text-sm">{notesCount} note{notesCount !== 1 ? "s" : ""} saved</span>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
            <div
              onClick={() => navigate("/practice")}
              className="flex items-center justify-between px-3 py-2.5 rounded-md bg-background hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                <span className="text-sm">Practice questions</span>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Notes</span>
          </div>
          <button onClick={() => navigate("/notes")} className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="space-y-1">
          {loading ? (
            <p className="text-sm text-muted-foreground px-3 py-2">Loading…</p>
          ) : recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">No notes yet. Create your first one!</p>
          ) : (
            recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => navigate("/notes")}
                className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <p className="text-sm font-medium">{note.title}</p>
                <span className="text-xs text-muted-foreground">{formatTime(note.updated_at)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
