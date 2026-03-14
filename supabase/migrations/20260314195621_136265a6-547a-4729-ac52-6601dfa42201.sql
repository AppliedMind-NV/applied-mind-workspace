-- Create public storage bucket for ambient sounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('ambient-sounds', 'ambient-sounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read ambient sounds (they're shared assets, not user-specific)
CREATE POLICY "Anyone can read ambient sounds"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'ambient-sounds');

-- Only service role can upload (edge function uses service role)
CREATE POLICY "Service role can upload ambient sounds"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'ambient-sounds');