import { supabase } from "@/integrations/supabase/client";

export type VehicleType = 'BIKE' | 'THREE_WHEELER' | 'MINI_TRUCK' | 'TRUCK' | 'LARGE_TRUCK';
export type RouteType = 'eco' | 'standard' | 'express';

export interface PricingConfig {
  id: string;
  vehicle_type: VehicleType;
  route_type: RouteType;
  cost_per_km: number;
  base_fare: number;
  min_weight: number;
  max_weight: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  BIKE: 'Bike',
  THREE_WHEELER: 'Three Wheeler',
  MINI_TRUCK: 'Mini Truck',
  TRUCK: 'Truck',
  LARGE_TRUCK: 'Large Truck',
};

export const VEHICLE_CAPACITIES: Record<VehicleType, string> = {
  BIKE: 'Up to 20kg',
  THREE_WHEELER: 'Up to 100kg',
  MINI_TRUCK: 'Up to 500kg',
  TRUCK: 'Up to 2000kg',
  LARGE_TRUCK: 'Up to 5000kg',
};

export const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  eco: 'Eco-Friendly',
  standard: 'Standard',
  express: 'Express',
};

export const ROUTE_TYPE_COLORS: Record<RouteType, { bg: string; text: string; border: string }> = {
  eco: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  standard: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  express: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
};

export async function getActivePricing(): Promise<PricingConfig[]> {
  const { data, error } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('is_active', true)
    .order('vehicle_type', { ascending: true })
    .order('route_type', { ascending: true });

  if (error) throw error;
  return (data || []) as PricingConfig[];
}

export async function getPricingForVehicle(vehicleType: VehicleType, routeType: RouteType = 'standard'): Promise<PricingConfig | null> {
  const { data, error } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('vehicle_type', vehicleType)
    .eq('route_type', routeType)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as PricingConfig | null;
}

export async function estimateCost(
  distanceKm: number,
  vehicleType: VehicleType,
  routeType: RouteType = 'standard'
): Promise<{ baseFare: number; distanceCost: number; totalCost: number; costPerKm: number }> {
  const pricing = await getPricingForVehicle(vehicleType, routeType);
  
  if (!pricing) {
    // Fallback pricing if none configured
    const fallback = { base_fare: 50, cost_per_km: 5 };
    return {
      baseFare: fallback.base_fare,
      distanceCost: distanceKm * fallback.cost_per_km,
      totalCost: fallback.base_fare + distanceKm * fallback.cost_per_km,
      costPerKm: fallback.cost_per_km,
    };
  }

  const distanceCost = distanceKm * pricing.cost_per_km;
  return {
    baseFare: pricing.base_fare,
    distanceCost,
    totalCost: pricing.base_fare + distanceCost,
    costPerKm: pricing.cost_per_km,
  };
}

export async function updatePricing(
  vehicleType: VehicleType,
  routeType: RouteType,
  costPerKm: number,
  baseFare: number,
  minWeight: number,
  maxWeight: number
): Promise<void> {
  // Use atomic database function to avoid race conditions with unique constraint
  const { error } = await supabase.rpc('update_vehicle_pricing', {
    p_vehicle_type: vehicleType,
    p_route_type: routeType,
    p_cost_per_km: costPerKm,
    p_base_fare: baseFare,
    p_min_weight: minWeight,
    p_max_weight: maxWeight,
  });

  if (error) throw error;
}

export async function getPricingHistory(vehicleType: VehicleType, routeType?: RouteType): Promise<PricingConfig[]> {
  let query = supabase
    .from('pricing_config')
    .select('*')
    .eq('vehicle_type', vehicleType)
    .order('created_at', { ascending: false });

  if (routeType) {
    query = query.eq('route_type', routeType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as PricingConfig[];
}
