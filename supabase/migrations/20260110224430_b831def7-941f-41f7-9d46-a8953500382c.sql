-- Create damage_reports table for tracking vehicle damage
CREATE TABLE public.damage_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_number TEXT NOT NULL,
  damage_description TEXT NOT NULL,
  damage_severity TEXT NOT NULL DEFAULT 'minor',
  damage_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  repair_cost DOUBLE PRECISION,
  manager_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;

-- Drivers can insert their own damage reports
CREATE POLICY "Drivers can insert damage reports"
ON public.damage_reports
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Drivers can view their own damage reports
CREATE POLICY "Drivers can view their own damage reports"
ON public.damage_reports
FOR SELECT
USING (auth.uid() = driver_id);

-- Managers can view all damage reports
CREATE POLICY "Managers can view all damage reports"
ON public.damage_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Managers can update damage reports
CREATE POLICY "Managers can update damage reports"
ON public.damage_reports
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_damage_reports_updated_at
BEFORE UPDATE ON public.damage_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();