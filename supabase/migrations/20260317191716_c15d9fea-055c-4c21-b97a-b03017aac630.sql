ALTER TABLE public.escalas
ADD CONSTRAINT escalas_responsavel_id_fkey
FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id) ON DELETE CASCADE;