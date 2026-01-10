-- Add weight limits to pricing_config
ALTER TABLE public.pricing_config 
ADD COLUMN min_weight DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN max_weight DOUBLE PRECISION NOT NULL DEFAULT 1000;

-- Update default weights for existing records
UPDATE public.pricing_config SET min_weight = 0, max_weight = 20 WHERE vehicle_type = 'BIKE';
UPDATE public.pricing_config SET min_weight = 0, max_weight = 100 WHERE vehicle_type = 'THREE_WHEELER';
UPDATE public.pricing_config SET min_weight = 0, max_weight = 500 WHERE vehicle_type = 'MINI_TRUCK';
UPDATE public.pricing_config SET min_weight = 0, max_weight = 2000 WHERE vehicle_type = 'TRUCK';
UPDATE public.pricing_config SET min_weight = 0, max_weight = 5000 WHERE vehicle_type = 'LARGE_TRUCK';