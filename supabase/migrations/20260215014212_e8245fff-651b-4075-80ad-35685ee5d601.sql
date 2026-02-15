
-- Add visibility column to prayer_requests
ALTER TABLE public.prayer_requests ADD COLUMN visibility text NOT NULL DEFAULT 'public';

-- Update RLS: members can only see public prayers (or their own), admin sees all
DROP POLICY IF EXISTS "Active members can view all prayers" ON public.prayer_requests;

CREATE POLICY "Active members can view prayers"
ON public.prayer_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_active_member(auth.uid())
    AND has_role(auth.uid(), 'member'::app_role)
    AND (visibility = 'public' OR user_id = auth.uid())
  )
);
