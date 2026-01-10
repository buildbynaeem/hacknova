-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create a new policy that allows both admins and managers to insert driver roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'manager'::app_role) AND role = 'driver'::app_role)
);