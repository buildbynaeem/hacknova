-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage pricing" ON public.pricing_config;

-- Create separate policies for each operation
CREATE POLICY "Admins can insert pricing"
ON public.pricing_config
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can update pricing"
ON public.pricing_config
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete pricing"
ON public.pricing_config
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));