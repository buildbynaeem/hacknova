import { supabase } from '@/integrations/supabase/client';

export interface Driver {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  assigned_vehicle_id: string | null;
}

// Get all users with driver role along with their profile info
export async function getDrivers(): Promise<Driver[]> {
  // First get all users with driver role
  const { data: driverRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'driver');

  if (rolesError) throw rolesError;
  if (!driverRoles || driverRoles.length === 0) return [];

  const driverUserIds = driverRoles.map(r => r.user_id);

  // Get profiles for these drivers
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', driverUserIds);

  if (profilesError) throw profilesError;

  // Get vehicle assignments
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('fleet_vehicles')
    .select('id, current_driver_id')
    .in('current_driver_id', driverUserIds);

  if (vehiclesError) throw vehiclesError;

  // Map to Driver type
  return driverUserIds.map(userId => {
    const profile = profiles?.find(p => p.user_id === userId);
    const vehicle = vehicles?.find(v => v.current_driver_id === userId);
    
    return {
      user_id: userId,
      email: '', // Will be populated from auth if needed
      full_name: profile?.full_name || null,
      phone: profile?.phone || null,
      avatar_url: profile?.avatar_url || null,
      role: 'driver',
      assigned_vehicle_id: vehicle?.id || null,
    };
  });
}

// Add a driver role to a user by email
export async function addDriverByEmail(email: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  // We need to use an edge function to look up user by email since we can't query auth.users directly
  // For now, we'll create a profile and role entry - the user needs to exist first
  
  // Check if user already has driver role by looking up in profiles first
  // This is a limitation - we'd need an edge function to look up by email properly
  
  return { 
    success: false, 
    error: 'To add a driver, the user must first sign up. Then you can assign them the driver role.' 
  };
}

// Assign driver to vehicle
export async function assignDriverToVehicle(vehicleId: string, driverId: string | null): Promise<void> {
  // If assigning a new driver, first unassign them from any existing vehicle
  if (driverId) {
    await supabase
      .from('fleet_vehicles')
      .update({ current_driver_id: null })
      .eq('current_driver_id', driverId);
  }

  // Assign to the new vehicle
  const { error } = await supabase
    .from('fleet_vehicles')
    .update({ current_driver_id: driverId })
    .eq('id', vehicleId);

  if (error) throw error;
}

// Get driver by email using profiles (limited - only works if email matches user_id pattern)
export async function findDriverByUserId(userId: string): Promise<Driver | null> {
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('user_id', userId)
    .eq('role', 'driver')
    .maybeSingle();

  if (roleError || !roleData) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    user_id: userId,
    email: '',
    full_name: profile?.full_name || null,
    phone: profile?.phone || null,
    avatar_url: profile?.avatar_url || null,
    role: 'driver',
    assigned_vehicle_id: null,
  };
}
