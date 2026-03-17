
-- Enum for ministry/function types
CREATE TYPE public.escala_funcao AS ENUM ('recepcao', 'midias', 'diaconia', 'liturgia', 'ebd', 'pregacao');

-- Schedules table
CREATE TABLE public.escalas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcao escala_funcao NOT NULL,
  data DATE NOT NULL,
  horario TEXT NOT NULL DEFAULT '09:00',
  responsavel_id UUID NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent same person at same date/time in different roles
CREATE UNIQUE INDEX idx_escalas_responsavel_data_horario ON public.escalas (responsavel_id, data, horario);

-- Index for querying by date
CREATE INDEX idx_escalas_data ON public.escalas (data);

ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;

-- All active members can view
CREATE POLICY "Active members can view escalas"
ON public.escalas FOR SELECT
TO authenticated
USING (is_active_member(auth.uid()));

-- Admin manages
CREATE POLICY "Admin manages escalas"
ON public.escalas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_escalas_updated_at
BEFORE UPDATE ON public.escalas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
