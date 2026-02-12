
-- Create visitors table
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Only admins can manage visitors
CREATE POLICY "Admin manages visitors"
ON public.visitors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Active members can view visitors
CREATE POLICY "Active members can view visitors"
ON public.visitors
FOR SELECT
USING (is_active_member(auth.uid()) AND has_role(auth.uid(), 'member'::app_role));
