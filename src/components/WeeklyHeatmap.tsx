import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WeeklyHeatmapProps {
  /** Set of ISO date strings (YYYY-MM-DD) the user studied on */
  studyDates: Set<string>;
  /** Minutes per day map: YYYY-MM-DD → total minutes */
  minutesPerDay: Map<string, number>;
  weeks?: number;
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

export default function WeeklyHeatmap({ studyDates, minutesPerDay, weeks = 7 }: WeeklyHeatmapProps) {
  // Build grid: columns = weeks, rows = 7 days (Mon–Sun)
  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun
  // Adjust so Monday = 0
  const adjustedDay = todayDay === 0 ? 6 : todayDay - 1;

  const totalDays = weeks * 7;
  const days: Date[] = [];

  // Start from (weeks * 7 - 1 - remaining days in current week) days ago
  // We want the grid to end on today
  const startOffset = totalDays - 1 - adjustedDay + (7 - 7); // fill current partial week
  // Simpler: just go back totalDays - 1 days from today
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const getIntensity = (d: Date): number => {
    const key = formatDate(d);
    if (!studyDates.has(key)) return 0;
    const mins = minutesPerDay.get(key) ?? 0;
    if (mins <= 0) return 1;
    if (mins < 15) return 1;
    if (mins < 45) return 2;
    if (mins < 90) return 3;
    return 4;
  };

  const intensityClasses = [
    "bg-muted",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/60",
    "bg-primary/90",
  ];

  // Group into columns (weeks)
  const columns: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  const formatLabel = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="flex gap-3">
      {/* Day labels */}
      <div className="flex flex-col gap-[3px]">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="h-[14px] flex items-center">
            <span className="text-[10px] text-muted-foreground w-6">{label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <TooltipProvider delayDuration={150}>
        <div className="flex gap-[3px]">
          {columns.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => {
                const intensity = getIntensity(day);
                const isToday = formatDate(day) === formatDate(today);
                const mins = minutesPerDay.get(formatDate(day)) ?? 0;
                return (
                  <Tooltip key={di}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-[14px] h-[14px] rounded-[3px] transition-colors ${intensityClasses[intensity]} ${
                          isToday ? "ring-1 ring-primary/50" : ""
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{formatLabel(day)}</p>
                      <p className="text-muted-foreground">
                        {intensity === 0 ? "No activity" : `${mins}m studied`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
