
-- Create enum for request types
CREATE TYPE public.request_type AS ENUM ('salao_social', 'emprestimo_utensilios', 'visita', 'outra');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pendente', 'aprovada', 'rejeitada');

-- Create member_requests table
CREATE TABLE public.member_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type request_type NOT NULL,
  description TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pendente',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_requests ENABLE ROW LEVEL SECURITY;

-- Members can view their own requests
CREATE POLICY "Members can view own requests"
  ON public.member_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Active members can insert own requests
CREATE POLICY "Members can create own requests"
  ON public.member_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_active_member(auth.uid()) AND has_role(auth.uid(), 'member'::app_role));

-- Admin full access
CREATE POLICY "Admin manages requests"
  ON public.member_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_member_requests_updated_at
  BEFORE UPDATE ON public.member_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
