-- Add route_type column to pricing_config for eco-friendly, standard, and express pricing
ALTER TABLE public.pricing_config 
ADD COLUMN route_type text NOT NULL DEFAULT 'standard';

-- Add check constraint for valid route types
ALTER TABLE public.pricing_config 
ADD CONSTRAINT valid_route_type CHECK (route_type IN ('eco', 'standard', 'express'));

-- Drop old unique index and create new one including route_type
DROP INDEX IF EXISTS unique_active_pricing;
CREATE UNIQUE INDEX unique_active_pricing ON public.pricing_config (vehicle_type, route_type) WHERE (is_active = true);

-- Update the atomic pricing function to include route_type
CREATE OR REPLACE FUNCTION public.update_vehicle_pricing(
  p_vehicle_type public.vehicle_type,
  p_route_type text,
  p_cost_per_km double precision,
  p_base_fare double precision,
  p_min_weight double precision,
  p_max_weight double precision
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id uuid;
BEGIN
  -- Authorization: only admin/manager
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Validate route_type
  IF p_route_type NOT IN ('eco', 'standard', 'express') THEN
    RAISE EXCEPTION 'invalid route type';
  END IF;

  -- Serialize updates per vehicle type + route type to prevent concurrent inserts
  PERFORM pg_advisory_xact_lock(hashtext('pricing_config'), hashtext(p_vehicle_type::text || p_route_type));

  -- Deactivate current active pricing for this vehicle + route combo
  UPDATE public.pricing_config
  SET is_active = false,
      effective_to = current_date
  WHERE vehicle_type = p_vehicle_type
    AND route_type = p_route_type
    AND is_active = true;

  -- Insert new active pricing
  INSERT INTO public.pricing_config (
    vehicle_type,
    route_type,
    cost_per_km,
    base_fare,
    min_weight,
    max_weight,
    is_active,
    created_by,
    effective_from
  ) VALUES (
    p_vehicle_type,
    p_route_type,
    p_cost_per_km,
    p_base_fare,
    p_min_weight,
    p_max_weight,
    true,
    auth.uid(),
    current_date
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Drop old function signature
DROP FUNCTION IF EXISTS public.update_vehicle_pricing(public.vehicle_type, double precision, double precision, double precision, double precision);