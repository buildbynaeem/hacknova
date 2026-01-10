import { supabase } from "@/integrations/supabase/client";

export type VehicleType = 'BIKE' | 'THREE_WHEELER' | 'MINI_TRUCK' | 'TRUCK' | 'LARGE_TRUCK';

export interface PricingConfig {
  id: string;
  vehicle_type: VehicleType;
  cost_per_km: number;
  base_fare: number;
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

export async function getActivePricing(): Promise<PricingConfig[]> {
  const { data, error } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('is_active', true)
    .order('cost_per_km', { ascending: true });

  if (error) throw error;
  return (data || []) as PricingConfig[];
}

export async function getPricingForVehicle(vehicleType: VehicleType): Promise<PricingConfig | null> {
  const { data, error } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('vehicle_type', vehicleType)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as PricingConfig | null;
}

export async function estimateCost(
  distanceKm: number,
  vehicleType: VehicleType
): Promise<{ baseFare: number; distanceCost: number; totalCost: number; costPerKm: number }> {
  const pricing = await getPricingForVehicle(vehicleType);
  
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
  costPerKm: number,
  baseFare: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Deactivate existing pricing for this vehicle type
  await supabase
    .from('pricing_config')
    .update({ is_active: false, effective_to: new Date().toISOString().split('T')[0] })
    .eq('vehicle_type', vehicleType)
    .eq('is_active', true);

  // Insert new pricing
  const { error } = await supabase
    .from('pricing_config')
    .insert({
      vehicle_type: vehicleType,
      cost_per_km: costPerKm,
      base_fare: baseFare,
      created_by: user?.id,
    });

  if (error) throw error;
}

export async function getPricingHistory(vehicleType: VehicleType): Promise<PricingConfig[]> {
  const { data, error } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('vehicle_type', vehicleType)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as PricingConfig[];
}
