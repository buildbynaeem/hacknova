-- =============================================
-- CARBON EMISSIONS TRACKING SYSTEM
-- =============================================

-- 1. Create fuel_entries table for tracking fuel consumption
CREATE TABLE public.fuel_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  driver_id UUID,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  
  -- Fuel data
  fuel_type TEXT NOT NULL DEFAULT 'DIESEL',
  fuel_liters DOUBLE PRECISION NOT NULL,
  fuel_cost DOUBLE PRECISION,
  odometer_reading DOUBLE PRECISION,
  
  -- Trip data
  trip_distance_km DOUBLE PRECISION,
  
  -- Calculated emissions
  co2_emitted_kg DOUBLE PRECISION,
  
  -- Metadata
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create driver_eco_scores table for driver performance tracking
CREATE TABLE public.driver_eco_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  
  -- Score components (0-100 scale)
  fuel_efficiency_score DOUBLE PRECISION DEFAULT 50,
  idling_score DOUBLE PRECISION DEFAULT 50,
  acceleration_score DOUBLE PRECISION DEFAULT 50,
  braking_score DOUBLE PRECISION DEFAULT 50,
  overall_eco_score DOUBLE PRECISION DEFAULT 50,
  
  -- Lifetime stats
  total_deliveries INTEGER DEFAULT 0,
  total_distance_km DOUBLE PRECISION DEFAULT 0,
  total_fuel_liters DOUBLE PRECISION DEFAULT 0,
  total_co2_emitted_kg DOUBLE PRECISION DEFAULT 0,
  avg_fuel_efficiency DOUBLE PRECISION DEFAULT 0,
  
  -- Period stats (current month)
  monthly_deliveries INTEGER DEFAULT 0,
  monthly_distance_km DOUBLE PRECISION DEFAULT 0,
  monthly_fuel_liters DOUBLE PRECISION DEFAULT 0,
  monthly_co2_emitted_kg DOUBLE PRECISION DEFAULT 0,
  
  -- Gamification
  eco_rank TEXT DEFAULT 'Beginner',
  badges TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(driver_id)
);

-- 3. Create vehicle_emissions table for vehicle-level tracking
CREATE TABLE public.vehicle_emissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  
  -- Period tracking
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly, yearly
  
  -- Emission data
  total_trips INTEGER DEFAULT 0,
  total_distance_km DOUBLE PRECISION DEFAULT 0,
  total_fuel_liters DOUBLE PRECISION DEFAULT 0,
  total_co2_kg DOUBLE PRECISION DEFAULT 0,
  avg_co2_per_km DOUBLE PRECISION DEFAULT 0,
  
  -- Efficiency metrics
  avg_fuel_efficiency DOUBLE PRECISION, -- L/100km
  idle_time_hours DOUBLE PRECISION DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(vehicle_id, period_start, period_type)
);

-- 4. Create emission_factors table for accurate calculations
CREATE TABLE public.emission_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fuel_type TEXT NOT NULL UNIQUE,
  co2_kg_per_liter DOUBLE PRECISION NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'IPCC Guidelines',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert standard emission factors
INSERT INTO public.emission_factors (fuel_type, co2_kg_per_liter, description) VALUES
('DIESEL', 2.68, 'Standard diesel fuel'),
('PETROL', 2.31, 'Standard petrol/gasoline'),
('CNG', 1.93, 'Compressed Natural Gas (per kg)'),
('LPG', 1.51, 'Liquefied Petroleum Gas'),
('ELECTRIC', 0, 'Zero tailpipe emissions'),
('HYBRID', 1.85, 'Hybrid vehicle average');

-- 5. Add mileage tracking columns to fleet_vehicles
ALTER TABLE public.fleet_vehicles 
ADD COLUMN IF NOT EXISTS fuel_efficiency_lpk DOUBLE PRECISION DEFAULT 12,
ADD COLUMN IF NOT EXISTS avg_co2_per_km DOUBLE PRECISION DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS lifetime_co2_kg DOUBLE PRECISION DEFAULT 0;

-- 6. Enable RLS on all new tables
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_eco_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for fuel_entries
CREATE POLICY "Managers can manage fuel entries"
ON public.fuel_entries FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Drivers can view their fuel entries"
ON public.fuel_entries FOR SELECT
TO authenticated
USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert their fuel entries"
ON public.fuel_entries FOR INSERT
TO authenticated
WITH CHECK (driver_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role));

-- 8. RLS Policies for driver_eco_scores
CREATE POLICY "Anyone can view eco scores"
ON public.driver_eco_scores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Managers can manage eco scores"
ON public.driver_eco_scores FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 9. RLS Policies for vehicle_emissions
CREATE POLICY "Authenticated users can view vehicle emissions"
ON public.vehicle_emissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Managers can manage vehicle emissions"
ON public.vehicle_emissions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 10. RLS Policies for emission_factors
CREATE POLICY "Anyone can view emission factors"
ON public.emission_factors FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify emission factors"
ON public.emission_factors FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 11. Create updated_at triggers
CREATE TRIGGER update_fuel_entries_updated_at
BEFORE UPDATE ON public.fuel_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_eco_scores_updated_at
BEFORE UPDATE ON public.driver_eco_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Create function to calculate CO2 emissions
CREATE OR REPLACE FUNCTION public.calculate_co2_emissions(
  p_fuel_type TEXT,
  p_fuel_liters DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  emission_factor DOUBLE PRECISION;
BEGIN
  SELECT co2_kg_per_liter INTO emission_factor
  FROM public.emission_factors
  WHERE fuel_type = UPPER(p_fuel_type);
  
  IF emission_factor IS NULL THEN
    emission_factor := 2.68; -- Default to diesel
  END IF;
  
  RETURN ROUND((p_fuel_liters * emission_factor)::NUMERIC, 2);
END;
$$;

-- 13. Create trigger to auto-calculate CO2 on fuel entry insert
CREATE OR REPLACE FUNCTION public.calculate_fuel_entry_emissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.co2_emitted_kg := calculate_co2_emissions(NEW.fuel_type, NEW.fuel_liters);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_calculate_fuel_emissions
BEFORE INSERT OR UPDATE ON public.fuel_entries
FOR EACH ROW EXECUTE FUNCTION public.calculate_fuel_entry_emissions();