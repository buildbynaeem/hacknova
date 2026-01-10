-- Create vehicle type enum
CREATE TYPE public.vehicle_type AS ENUM ('BIKE', 'THREE_WHEELER', 'MINI_TRUCK', 'TRUCK', 'LARGE_TRUCK');

-- Create pricing configuration table
CREATE TABLE public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type vehicle_type NOT NULL,
  cost_per_km DOUBLE PRECISION NOT NULL,
  base_fare DOUBLE PRECISION NOT NULL DEFAULT 50,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Create unique index for active pricing per vehicle type
CREATE UNIQUE INDEX unique_active_pricing ON public.pricing_config (vehicle_type) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Everyone can view pricing (needed for cost estimation)
CREATE POLICY "Anyone can view active pricing"
ON public.pricing_config
FOR SELECT
USING (is_active = true);

-- Only admins/managers can manage pricing
CREATE POLICY "Admins can manage pricing"
ON public.pricing_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add vehicle_type to shipments table
ALTER TABLE public.shipments 
ADD COLUMN vehicle_type vehicle_type DEFAULT 'MINI_TRUCK';

-- Create trigger for updated_at
CREATE TRIGGER update_pricing_config_updated_at
BEFORE UPDATE ON public.pricing_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pricing
INSERT INTO public.pricing_config (vehicle_type, cost_per_km, base_fare) VALUES
('BIKE', 3, 30),
('THREE_WHEELER', 5, 50),
('MINI_TRUCK', 8, 100),
('TRUCK', 12, 150),
('LARGE_TRUCK', 18, 200);