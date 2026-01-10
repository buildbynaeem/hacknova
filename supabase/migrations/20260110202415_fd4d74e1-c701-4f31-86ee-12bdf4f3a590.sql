-- Drop and recreate UPDATE policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Admins can update pricing" ON public.pricing_config;

CREATE POLICY "Admins can update pricing"
ON public.pricing_config
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));