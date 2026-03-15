
CREATE TABLE public.build_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  build_id text NOT NULL,
  current_step integer NOT NULL DEFAULT 0,
  completed_steps integer[] NOT NULL DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, build_id)
);

ALTER TABLE public.build_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.build_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.build_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.build_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.build_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_build_progress_updated_at BEFORE UPDATE ON public.build_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
