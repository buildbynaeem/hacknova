-- Create fleet vehicles table
CREATE TABLE public.fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL UNIQUE,
  vehicle_type vehicle_type NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  fuel_type TEXT DEFAULT 'PETROL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_driver_id UUID,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  total_km_driven DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- Anyone can view active vehicles
CREATE POLICY "Anyone can view fleet vehicles"
ON public.fleet_vehicles
FOR SELECT
USING (true);

-- Only admins/managers can manage vehicles
CREATE POLICY "Admins can insert fleet vehicles"
ON public.fleet_vehicles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can update fleet vehicles"
ON public.fleet_vehicles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete fleet vehicles"
ON public.fleet_vehicles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_fleet_vehicles_updated_at
BEFORE UPDATE ON public.fleet_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();