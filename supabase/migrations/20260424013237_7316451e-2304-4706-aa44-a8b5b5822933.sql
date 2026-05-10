-- 1. Create subjects table
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Subject',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Users can view own subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add subject_id to folders (nullable; ON DELETE SET NULL keeps folders alive)
ALTER TABLE public.folders
  ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;

CREATE INDEX idx_folders_subject_id ON public.folders(subject_id);
CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);

-- 5. Backfill: create a default "General" subject per user that has folders, then assign existing folders to it
INSERT INTO public.subjects (user_id, name)
SELECT DISTINCT user_id, 'General'
FROM public.folders
WHERE user_id IS NOT NULL;

UPDATE public.folders f
SET subject_id = s.id
FROM public.subjects s
WHERE s.user_id = f.user_id
  AND s.name = 'General'
  AND f.subject_id IS NULL;