
-- Create pastoral record types
CREATE TYPE public.pastoral_record_type AS ENUM ('visita', 'aconselhamento', 'anotacao');

-- Create pastoral_records table
CREATE TABLE public.pastoral_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pastor_id UUID NOT NULL,
  member_id UUID NOT NULL,
  record_type pastoral_record_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pastoral_records ENABLE ROW LEVEL SECURITY;

-- Only pastor and admin can manage pastoral records
CREATE POLICY "Pastor can manage pastoral records"
ON public.pastoral_records
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'pastor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add updated_at trigger
CREATE TRIGGER update_pastoral_records_updated_at
  BEFORE UPDATE ON public.pastoral_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
