-- Atomic pricing update to avoid unique_active_pricing race conditions

CREATE OR REPLACE FUNCTION public.update_vehicle_pricing(
  p_vehicle_type public.vehicle_type,
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

  -- Serialize updates per vehicle type to prevent concurrent inserts
  PERFORM pg_advisory_xact_lock(hashtext('pricing_config'), hashtext(p_vehicle_type::text));

  -- Deactivate current active pricing
  UPDATE public.pricing_config
  SET is_active = false,
      effective_to = current_date
  WHERE vehicle_type = p_vehicle_type
    AND is_active = true;

  -- Insert new active pricing
  INSERT INTO public.pricing_config (
    vehicle_type,
    cost_per_km,
    base_fare,
    min_weight,
    max_weight,
    is_active,
    created_by,
    effective_from
  ) VALUES (
    p_vehicle_type,
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

REVOKE ALL ON FUNCTION public.update_vehicle_pricing(public.vehicle_type, double precision, double precision, double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_vehicle_pricing(public.vehicle_type, double precision, double precision, double precision, double precision) TO authenticated;