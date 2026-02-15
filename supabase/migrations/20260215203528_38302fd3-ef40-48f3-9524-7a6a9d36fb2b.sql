
-- Create enum for notice category
CREATE TYPE public.notice_category AS ENUM ('public', 'members');

-- Create notices table
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category notice_category NOT NULL DEFAULT 'public',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Anyone can view active public notices
CREATE POLICY "Anyone can view active public notices"
ON public.notices FOR SELECT
USING (active = true AND category = 'public');

-- Members can view active member notices
CREATE POLICY "Members can view member notices"
ON public.notices FOR SELECT
USING (
  active = true AND category = 'members'
  AND is_active_member(auth.uid())
  AND has_role(auth.uid(), 'member'::app_role)
);

-- Admin can view all notices (including inactive)
CREATE POLICY "Admin manages notices"
ON public.notices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
