-- Create a secure view for shipments that masks phone numbers based on status and role
-- Drivers can only see pickup_contact_phone when status is PICKUP_READY or later
-- Drivers can only see receiver_phone when status is IN_TRANSIT or later
-- Senders and managers can always see all phone numbers

CREATE OR REPLACE VIEW public.shipments_secure AS
SELECT
  id,
  tracking_id,
  sender_id,
  driver_id,
  status,
  package_type,
  pickup_address,
  pickup_city,
  pickup_pincode,
  pickup_contact_name,
  -- Mask pickup phone for drivers unless status is PICKUP_READY or later
  CASE 
    WHEN auth.uid() = sender_id THEN pickup_contact_phone
    WHEN public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin') THEN pickup_contact_phone
    WHEN auth.uid() = driver_id AND status IN ('PICKUP_READY', 'IN_TRANSIT', 'DELIVERED') THEN pickup_contact_phone
    ELSE '****-****'
  END AS pickup_contact_phone,
  pickup_date,
  pickup_time_slot,
  pickup_lat,
  pickup_lng,
  pickup_otp,
  picked_up_at,
  delivery_address,
  delivery_city,
  delivery_pincode,
  receiver_name,
  -- Mask receiver phone for drivers unless status is IN_TRANSIT or DELIVERED
  CASE 
    WHEN auth.uid() = sender_id THEN receiver_phone
    WHEN public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin') THEN receiver_phone
    WHEN auth.uid() = driver_id AND status IN ('IN_TRANSIT', 'DELIVERED') THEN receiver_phone
    ELSE '****-****'
  END AS receiver_phone,
  delivery_lat,
  delivery_lng,
  delivery_otp,
  delivered_at,
  proof_of_delivery_url,
  weight,
  dimensions,
  description,
  is_fragile,
  driver_lat,
  driver_lng,
  carbon_score,
  distance_km,
  estimated_cost,
  final_cost,
  created_at,
  updated_at
FROM public.shipments;

-- Grant access to the view
GRANT SELECT ON public.shipments_secure TO authenticated;

-- Add comment explaining the view
COMMENT ON VIEW public.shipments_secure IS 'Secure view that masks phone numbers based on user role and shipment status. Drivers can only see pickup phone during PICKUP_READY+ and receiver phone during IN_TRANSIT+.';