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
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import WeeklyHeatmap from "@/components/WeeklyHeatmap";

const quickActions = [
  { label: "New Note", icon: FileText, path: "/notes" },
  { label: "Start Study", icon: Clock, path: "/study" },
  { label: "Practice", icon: HelpCircle, path: "/practice" },
  { label: "Review Cards", icon: Layers, path: "/flashcards" },
];

interface RecentNote {
  id: string;
  title: string;
  updated_at: string;
  folder_id: string | null;
}

interface DueFlashcard {
  id: string;
  front: string;
  note_id: string | null;
}

interface ReviewTopic {
  noteId: string;
  noteTitle: string;
  folderName: string | null;
  daysSinceUpdate: number;
  flashcardCount: number;
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
  const [studyDates, setStudyDates] = useState<Set<string>>(new Set());
  const [minutesPerDay, setMinutesPerDay] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const [dueCards, setDueCards] = useState<DueFlashcard[]>([]);
  const [reviewTopics, setReviewTopics] = useState<ReviewTopic[]>([]);
  const [staleNotes, setStaleNotes] = useState<RecentNote[]>([]);
  const [practiceCount, setPracticeCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
      const now = new Date().toISOString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const [
        notesRes,
        flashcardsDueRes,
        flashcardsTotalRes,
        sessionsRes,
        recentRes,
        streakRes,
        dueCardsRes,
        staleNotesRes,
        foldersRes,
        practiceRes,
      ] = await Promise.all([
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id).lte("next_review", now),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("study_sessions").select("duration_minutes").eq("user_id", user.id).gte("started_at", weekAgo),
        supabase.from("notes").select("id, title, updated_at, folder_id").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
        supabase.from("study_sessions").select("started_at, duration_minutes").eq("user_id", user.id).order("started_at", { ascending: false }).limit(365),
        supabase.from("flashcards").select("id, front, note_id").eq("user_id", user.id).lte("next_review", now).order("next_review", { ascending: true }).limit(5),
        supabase.from("notes").select("id, title, updated_at, folder_id").eq("user_id", user.id).lte("updated_at", threeDaysAgo).order("updated_at", { ascending: true }).limit(10),
        supabase.from("folders").select("id, name").eq("user_id", user.id),
        supabase.from("practice_questions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      setNotesCount(notesRes.count ?? 0);
      setPracticeCount(practiceRes.count ?? 0);
      setFlashcardsDue(flashcardsDueRes.count ?? 0);
      setFlashcardsTotal(flashcardsTotalRes.count ?? 0);

      const sessions = sessionsRes.data ?? [];
      setSessionsCount(sessions.length);
      setStudyMinutes(sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0));

      const streakDays = streakRes.data ?? [];
      const datesSet = new Set<string>();
      const minsMap = new Map<string, number>();
      for (const s of streakDays) {
        const dateKey = new Date(s.started_at).toISOString().split("T")[0];
        datesSet.add(dateKey);
        minsMap.set(dateKey, (minsMap.get(dateKey) ?? 0) + (s.duration_minutes ?? 0));
      }
      setStudyDates(datesSet);
      setMinutesPerDay(minsMap);

      const uniqueDays = new Set(streakDays.map((s) => new Date(s.started_at).toLocaleDateString()));
      const sortedDays = Array.from(uniqueDays)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

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
            if (diffDays === 1) currentStreak++;
            else break;
          }
        }
      }
      setStreak(currentStreak);
      setRecentNotes(recentRes.data ?? []);
      setDueCards(dueCardsRes.data ?? []);

      const folders = foldersRes.data ?? [];
      const folderMap = new Map(folders.map((f) => [f.id, f.name]));
      const staleData = staleNotesRes.data ?? [];
      setStaleNotes(staleData);

      const topicMap = new Map<string, ReviewTopic>();
      for (const note of staleData) {
        const key = note.folder_id || "__uncategorized";
        const daysSince = Math.floor((Date.now() - new Date(note.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (!topicMap.has(key)) {
          topicMap.set(key, {
            noteId: note.id,
            noteTitle: note.title,
            folderName: note.folder_id ? (folderMap.get(note.folder_id) ?? "Unknown") : null,
            daysSinceUpdate: daysSince,
            flashcardCount: 0,
          });
        }
      }
      setReviewTopics(Array.from(topicMap.values()).slice(0, 4));

      } catch (err: any) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
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

  const studyPlanItems = [
    ...(flashcardsDue > 0
      ? [{
          key: "flashcards",
          icon: Layers,
          label: `Review ${flashcardsDue} due flashcard${flashcardsDue !== 1 ? "s" : ""}`,
          sublabel: dueCards.length > 0 ? dueCards.slice(0, 2).map((c) => c.front).join(" • ") : undefined,
          action: () => navigate("/flashcards"),
          priority: "high" as const,
        }]
      : []),
    ...(practiceCount > 0 && staleNotes.length > 0
      ? [{
          key: "practice-recommend",
          icon: HelpCircle,
          label: `Practice questions on recent topics`,
          sublabel: `${practiceCount} question${practiceCount !== 1 ? "s" : ""} available`,
          action: () => navigate("/practice"),
          priority: "high" as const,
        }]
      : []),
    ...reviewTopics.map((topic) => ({
      key: `review-${topic.noteId}`,
      icon: RotateCcw,
      label: topic.folderName ? `Review ${topic.folderName}` : `Review "${topic.noteTitle}"`,
      sublabel: `Last updated ${topic.daysSinceUpdate}d ago`,
      action: () => navigate("/notes"),
      priority: "medium" as const,
    })),
    ...staleNotes.slice(0, 2).filter((n) => !reviewTopics.some((t) => t.noteId === n.id)).map((note) => ({
      key: `stale-${note.id}`,
      icon: FileText,
      label: `Revisit "${note.title}"`,
      sublabel: formatTime(note.updated_at),
      action: () => navigate("/notes"),
      priority: "low" as const,
    })),
  ].slice(0, 5);

  const totalReviewItems = flashcardsDue + staleNotes.length;
  const allCaughtUp = studyPlanItems.length === 0 && !loading;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">{greeting()}</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading your dashboard…" : flashcardsDue > 0
            ? `You have ${flashcardsDue} flashcard${flashcardsDue !== 1 ? "s" : ""} due for review.`
            : "You're all caught up. Keep studying!"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="glass-card flex items-center gap-2.5 px-4 py-3.5 hover:border-primary/30 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <action.icon size={15} className="text-primary" />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* AI Study Coach */}
      <div className="glass-card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Sparkles size={12} className="text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Study Coach</span>
          </div>
          <div className="flex items-center gap-2">
            {studyPlanItems.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {studyPlanItems.length} item{studyPlanItems.length !== 1 ? "s" : ""}
              </span>
            )}
            {totalReviewItems > 0 && (
              <button
                onClick={() => navigate("/quick-review")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-all btn-glow"
              >
                <Zap size={11} />
                Quick Review
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground px-3 py-2">Loading…</p>
        ) : allCaughtUp ? (
          <div className="flex items-center gap-3 px-3 py-5 text-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">All caught up!</p>
              <p className="text-xs text-muted-foreground">No pending reviews. Create notes or start a study session.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {studyPlanItems.map((item) => (
              <button
                key={item.key}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-all text-left group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.priority === "high"
                    ? "bg-primary/10"
                    : item.priority === "medium"
                    ? "bg-accent/50"
                    : "bg-muted/50"
                }`}>
                  <item.icon size={14} className={
                    item.priority === "high" ? "text-primary" : "text-muted-foreground"
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.sublabel && (
                    <p className="text-[10px] text-muted-foreground truncate">{item.sublabel}</p>
                  )}
                </div>
                <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <TrendingUp size={12} className="text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">This Week</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame size={18} className={streak > 0 ? "text-orange-500" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{loading ? "—" : streak}</p>
                <p className="text-xs text-muted-foreground">Day streak</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-lg font-bold tabular-nums">
                  {loading ? "—" : studyMinutes >= 60 ? `${(studyMinutes / 60).toFixed(1)}h` : `${studyMinutes}m`}
                </p>
                <p className="text-[10px] text-muted-foreground">Study time</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{loading ? "—" : sessionsCount}</p>
                <p className="text-[10px] text-muted-foreground">Sessions</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{loading ? "—" : flashcardsTotal}</p>
                <p className="text-[10px] text-muted-foreground">Cards</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Zap size={12} className="text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">At a Glance</span>
          </div>
          <div className="space-y-2">
            <div
              onClick={() => navigate("/flashcards")}
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${flashcardsDue > 0 ? "bg-primary animate-pulse-glow" : "bg-muted"}`} />
                <span className="text-sm">
                  {flashcardsDue > 0 ? `Review ${flashcardsDue} due flashcard${flashcardsDue !== 1 ? "s" : ""}` : "No flashcards due"}
                </span>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
            <div
              onClick={() => navigate("/notes")}
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-sm">{notesCount} note{notesCount !== 1 ? "s" : ""} saved</span>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
            <div
              onClick={() => navigate("/practice")}
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-muted" />
                <span className="text-sm">Practice questions</span>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="glass-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Flame size={12} className="text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground px-3 py-2">Loading…</p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <WeeklyHeatmap studyDates={studyDates} minutesPerDay={minutesPerDay} />
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-muted-foreground">Less</span>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-[10px] h-[10px] rounded-[2px] ${
                    ["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/90"][i]
                  }`}
                />
              ))}
              <span className="text-[10px] text-muted-foreground">More</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Notes */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <BookOpen size={12} className="text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Notes</span>
          </div>
          <button onClick={() => navigate("/notes")} className="text-xs text-primary font-medium hover:underline">View all</button>
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
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-all cursor-pointer"
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
