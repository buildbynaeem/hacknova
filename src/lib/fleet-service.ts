import { supabase } from "@/integrations/supabase/client";
import { VehicleType, VEHICLE_LABELS } from "./pricing-service";

export interface FleetVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  make: string | null;
  model: string | null;
  year: number | null;
  fuel_type: string;
  is_active: boolean;
  current_driver_id: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  total_km_driven: number;
  created_at: string;
  updated_at: string;
}

export type FleetVehicleInsert = Omit<FleetVehicle, 'id' | 'created_at' | 'updated_at'>;

export const FUEL_TYPES = ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID'] as const;

export async function getFleetVehicles(): Promise<FleetVehicle[]> {
  const { data, error } = await supabase
    .from('fleet_vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as FleetVehicle[];
}

export async function getActiveFleetVehicles(): Promise<FleetVehicle[]> {
  const { data, error } = await supabase
    .from('fleet_vehicles')
    .select('*')
    .eq('is_active', true)
    .order('vehicle_number', { ascending: true });

  if (error) throw error;
  return (data || []) as FleetVehicle[];
}

export async function addFleetVehicle(vehicle: {
  vehicle_number: string;
  vehicle_type: VehicleType;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  fuel_type?: string;
  is_active?: boolean;
}): Promise<FleetVehicle> {
  const { data, error } = await supabase
    .from('fleet_vehicles')
    .insert([vehicle])
    .select()
    .single();

  if (error) throw error;
  return data as FleetVehicle;
}

export async function updateFleetVehicle(id: string, updates: Partial<FleetVehicle>): Promise<void> {
  const { error } = await supabase
    .from('fleet_vehicles')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteFleetVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('fleet_vehicles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getFleetStats(): Promise<{
  total: number;
  active: number;
  byType: Record<VehicleType, number>;
}> {
  const vehicles = await getFleetVehicles();
  
  const byType = vehicles.reduce((acc, v) => {
    acc[v.vehicle_type] = (acc[v.vehicle_type] || 0) + 1;
    return acc;
  }, {} as Record<VehicleType, number>);

  return {
    total: vehicles.length,
    active: vehicles.filter(v => v.is_active).length,
    byType,
  };
}
