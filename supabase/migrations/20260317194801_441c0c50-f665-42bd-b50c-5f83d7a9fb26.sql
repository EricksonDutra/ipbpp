
-- Drop existing admin-only management policy
DROP POLICY IF EXISTS "Admin manages escalas" ON public.escalas;

-- Create a function to check if a user can manage a specific escala funcao
CREATE OR REPLACE FUNCTION public.can_manage_escala(_user_id uuid, _funcao escala_funcao)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Admin can manage all
    has_role(_user_id, 'admin')
    -- Gestor de mídias can manage midias
    OR (_funcao = 'midias' AND has_role(_user_id, 'gestor_midias'))
    -- Pastor can manage ebd, liturgia, pregacao
    OR (_funcao IN ('ebd', 'liturgia', 'pregacao') AND has_role(_user_id, 'pastor'))
    -- Diacono can manage diaconia
    OR (_funcao = 'diaconia' AND has_role(_user_id, 'diacono'))
    -- Presidente de sociedade can manage recepcao
    OR (_funcao = 'recepcao' AND has_role(_user_id, 'presidente_sociedade'))
$$;

-- Admin full access
CREATE POLICY "Admin manages all escalas"
ON public.escalas
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Role-based INSERT
CREATE POLICY "Role-based insert escalas"
ON public.escalas
FOR INSERT
TO authenticated
WITH CHECK (can_manage_escala(auth.uid(), funcao));

-- Role-based UPDATE
CREATE POLICY "Role-based update escalas"
ON public.escalas
FOR UPDATE
TO authenticated
USING (can_manage_escala(auth.uid(), funcao));

-- Role-based DELETE
CREATE POLICY "Role-based delete escalas"
ON public.escalas
FOR DELETE
TO authenticated
USING (can_manage_escala(auth.uid(), funcao));
