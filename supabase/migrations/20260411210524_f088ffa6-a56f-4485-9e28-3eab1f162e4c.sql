-- Add service_role DELETE policy for suppressed_emails table
CREATE POLICY "Service role can delete suppressed emails"
ON public.suppressed_emails
FOR DELETE
USING (auth.role() = 'service_role'::text);