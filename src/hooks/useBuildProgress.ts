import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BuildProgressData {
  build_id: string;
  current_step: number;
  completed_steps: number[];
  completed: boolean;
  completed_at: string | null;
}

export function useBuildProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, BuildProgressData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("build_progress")
        .select("build_id, current_step, completed_steps, completed, completed_at");
      if (data) {
        const map: Record<string, BuildProgressData> = {};
        for (const row of data) {
          map[row.build_id] = row as BuildProgressData;
        }
        setProgress(map);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const updateProgress = useCallback(
    async (buildId: string, updates: Partial<BuildProgressData>) => {
      if (!user) return;
      const current = progress[buildId];
      const newData = { ...current, ...updates, build_id: buildId };
      setProgress((prev) => ({ ...prev, [buildId]: newData }));

      if (current) {
        await supabase
          .from("build_progress")
          .update({
            current_step: newData.current_step,
            completed_steps: newData.completed_steps,
            completed: newData.completed,
            completed_at: newData.completed_at,
          })
          .eq("user_id", user.id)
          .eq("build_id", buildId);
      } else {
        await supabase.from("build_progress").insert({
          user_id: user.id,
          build_id: buildId,
          current_step: newData.current_step ?? 0,
          completed_steps: newData.completed_steps ?? [],
          completed: newData.completed ?? false,
          completed_at: newData.completed_at ?? null,
        });
      }
    },
    [user, progress]
  );

  const markStepComplete = useCallback(
    async (buildId: string, stepIndex: number, totalSteps: number) => {
      const current = progress[buildId];
      const completedSteps = current?.completed_steps
        ? [...new Set([...current.completed_steps, stepIndex])]
        : [stepIndex];
      const allDone = completedSteps.length >= totalSteps;
      await updateProgress(buildId, {
        completed_steps: completedSteps,
        current_step: Math.min(stepIndex + 1, totalSteps - 1),
        completed: allDone,
        completed_at: allDone ? new Date().toISOString() : null,
      });
    },
    [progress, updateProgress]
  );

  const getProgress = useCallback(
    (buildId: string): BuildProgressData | undefined => progress[buildId],
    [progress]
  );

  return { progress, loading, updateProgress, markStepComplete, getProgress };
}
