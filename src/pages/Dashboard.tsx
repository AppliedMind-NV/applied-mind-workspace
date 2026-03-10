import {
  FileText,
  Layers,
  HelpCircle,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Zap,
} from "lucide-react";

const quickActions = [
  { label: "New Note", icon: FileText, color: "text-primary" },
  { label: "Start Study", icon: Clock, color: "text-primary" },
  { label: "Practice", icon: HelpCircle, color: "text-primary" },
  { label: "Review Cards", icon: Layers, color: "text-primary" },
];

const recentNotes = [
  { title: "Binary Search Trees", subject: "Data Structures", time: "2h ago" },
  { title: "React Server Components", subject: "Web Development", time: "Yesterday" },
  { title: "TCP/IP Protocol Stack", subject: "Networking", time: "2 days ago" },
];

const studyPlan = [
  { task: "Review 12 flashcards due today", type: "flashcards", priority: "high" },
  { task: "Practice: Binary Search implementation", type: "coding", priority: "medium" },
  { task: "Re-read: Operating Systems - Memory Management", type: "review", priority: "low" },
];

export default function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Good morning</h1>
        <p className="text-sm text-muted-foreground">
          Here's your study plan for today. Stay focused.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
          >
            <action.icon size={16} className={action.color} />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Study Stats */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Week</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-semibold tabular-nums">4.5h</p>
              <p className="text-xs text-muted-foreground">Study time</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">48</p>
              <p className="text-xs text-muted-foreground">Cards reviewed</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">86%</p>
              <p className="text-xs text-muted-foreground">Retention rate</p>
            </div>
          </div>
        </div>

        {/* Today's Study Plan */}
        <div className="md:col-span-2 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Plan</span>
          </div>
          <div className="space-y-2">
            {studyPlan.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2.5 rounded-md bg-background hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.priority === "high"
                        ? "bg-primary"
                        : item.priority === "medium"
                        ? "bg-muted-foreground"
                        : "bg-muted"
                    }`}
                  />
                  <span className="text-sm">{item.task}</span>
                </div>
                <ArrowRight size={14} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Notes */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Notes</span>
          </div>
          <button className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="space-y-1">
          {recentNotes.map((note, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium">{note.title}</p>
                <p className="text-xs text-muted-foreground">{note.subject}</p>
              </div>
              <span className="text-xs text-muted-foreground">{note.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
