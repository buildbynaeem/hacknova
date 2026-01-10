import { supabase } from '@/integrations/supabase/client';

// =============================================
// EMISSION FACTORS (kg CO2 per liter)
// =============================================
export const EMISSION_FACTORS: Record<string, number> = {
  DIESEL: 2.68,
  PETROL: 2.31,
  CNG: 1.93,
  LPG: 1.51,
  ELECTRIC: 0,
  HYBRID: 1.85,
};

// =============================================
// TYPES & INTERFACES
// =============================================
export interface FuelEntry {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  shipment_id?: string;
  fuel_type: string;
  fuel_liters: number;
  fuel_cost?: number;
  odometer_reading?: number;
  trip_distance_km?: number;
  co2_emitted_kg?: number;
  entry_date: string;
  notes?: string;
  created_at: string;
}

export interface DriverEcoScore {
  id: string;
  driver_id: string;
  fuel_efficiency_score: number;
  idling_score: number;
  acceleration_score: number;
  braking_score: number;
  overall_eco_score: number;
  total_deliveries: number;
  total_distance_km: number;
  total_fuel_liters: number;
  total_co2_emitted_kg: number;
  avg_fuel_efficiency: number;
  monthly_deliveries: number;
  monthly_distance_km: number;
  monthly_fuel_liters: number;
  monthly_co2_emitted_kg: number;
  eco_rank: string;
  badges: string[];
}

export interface VehicleEmission {
  id: string;
  vehicle_id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  total_trips: number;
  total_distance_km: number;
  total_fuel_liters: number;
  total_co2_kg: number;
  avg_co2_per_km: number;
  avg_fuel_efficiency?: number;
  idle_time_hours: number;
}

export interface EmissionsSummary {
  totalCO2Emitted: number;
  totalCO2Saved: number;
  co2PerKm: number;
  totalDistanceKm: number;
  totalFuelLiters: number;
  totalTrips: number;
  monthlyTrend: number; // percentage change
  evSavings: number;
}

export interface FleetEmissionStats {
  byVehicle: Array<{
    vehicleId: string;
    vehicleNumber: string;
    vehicleType: string;
    fuelType: string;
    totalCO2: number;
    avgCO2PerKm: number;
    isEV: boolean;
  }>;
  byFuelType: Array<{
    fuelType: string;
    totalCO2: number;
    percentage: number;
  }>;
  byPeriod: Array<{
    period: string;
    totalCO2: number;
    totalDistance: number;
    avgEfficiency: number;
  }>;
}

export interface EmissionInsight {
  id: string;
  type: 'warning' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  potentialSavings?: number;
  icon: string;
}

// =============================================
// CORE CALCULATION FUNCTIONS
// =============================================

/**
 * Calculate CO2 emissions from fuel consumption
 */
export function calculateCO2FromFuel(fuelLiters: number, fuelType: string): number {
  const factor = EMISSION_FACTORS[fuelType.toUpperCase()] ?? EMISSION_FACTORS.DIESEL;
  return Math.round(fuelLiters * factor * 100) / 100;
}

/**
 * Estimate fuel consumption from distance (when actual fuel data unavailable)
 * Uses average fuel efficiency for vehicle type
 */
export function estimateFuelFromDistance(
  distanceKm: number, 
  vehicleType: string,
  fuelEfficiencyLPK: number = 12 // L/100km default
): number {
  // Default efficiencies by vehicle type (L/100km)
  const efficiencies: Record<string, number> = {
    BIKE: 3,
    THREE_WHEELER: 6,
    MINI_TRUCK: 10,
    TRUCK: 15,
    LARGE_TRUCK: 25,
  };
  
  const efficiency = efficiencies[vehicleType.toUpperCase()] ?? fuelEfficiencyLPK;
  return Math.round((distanceKm * efficiency / 100) * 100) / 100;
}

/**
 * Calculate CO2 saved by using optimized routes vs standard routes
 */
export function calculateCO2Savings(
  distanceKm: number,
  fuelType: string,
  optimizationFactor: number = 0.3 // 30% savings from route optimization
): number {
  const standardCO2 = calculateCO2FromFuel(
    estimateFuelFromDistance(distanceKm, 'TRUCK'),
    fuelType
  );
  return Math.round(standardCO2 * optimizationFactor * 100) / 100;
}

/**
 * Calculate EV equivalent savings (what would have been emitted with diesel)
 */
export function calculateEVSavings(distanceKm: number): number {
  const dieselFuel = estimateFuelFromDistance(distanceKm, 'TRUCK');
  return calculateCO2FromFuel(dieselFuel, 'DIESEL');
}

// =============================================
// DATABASE OPERATIONS
// =============================================

/**
 * Add a fuel entry
 */
export async function addFuelEntry(entry: Omit<FuelEntry, 'id' | 'created_at' | 'co2_emitted_kg'>): Promise<{ data: FuelEntry | null; error: string | null }> {
  const { data, error } = await supabase
    .from('fuel_entries')
    .insert({
      vehicle_id: entry.vehicle_id,
      driver_id: entry.driver_id,
      shipment_id: entry.shipment_id,
      fuel_type: entry.fuel_type,
      fuel_liters: entry.fuel_liters,
      fuel_cost: entry.fuel_cost,
      odometer_reading: entry.odometer_reading,
      trip_distance_km: entry.trip_distance_km,
      entry_date: entry.entry_date,
      notes: entry.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding fuel entry:', error);
    return { data: null, error: error.message };
  }

  return { data: data as unknown as FuelEntry, error: null };
}

/**
 * Get fuel entries with filters
 */
export async function getFuelEntries(filters?: {
  vehicleId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: FuelEntry[]; error: string | null }> {
  let query = supabase
    .from('fuel_entries')
    .select('*')
    .order('entry_date', { ascending: false });

  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId);
  }
  if (filters?.driverId) {
    query = query.eq('driver_id', filters.driverId);
  }
  if (filters?.startDate) {
    query = query.gte('entry_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('entry_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching fuel entries:', error);
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as unknown as FuelEntry[], error: null };
}

/**
 * Get emission factors from database
 */
export async function getEmissionFactors(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('emission_factors')
    .select('fuel_type, co2_kg_per_liter');

  if (error || !data) {
    return EMISSION_FACTORS;
  }

  const factors: Record<string, number> = {};
  data.forEach((row: { fuel_type: string; co2_kg_per_liter: number }) => {
    factors[row.fuel_type] = row.co2_kg_per_liter;
  });
  
  return factors;
}

// =============================================
// ANALYTICS & AGGREGATIONS
// =============================================

/**
 * Get fleet-wide emissions summary
 */
export async function getFleetEmissionsSummary(
  startDate?: string,
  endDate?: string
): Promise<EmissionsSummary> {
  // Get fuel entries
  const { data: fuelEntries } = await getFuelEntries({ startDate, endDate });
  
  // Get delivered shipments for CO2 saved calculation
  const { data: shipments } = await supabase
    .from('shipments')
    .select('carbon_score, distance_km, vehicle_type')
    .eq('status', 'DELIVERED');

  const totalCO2Emitted = fuelEntries.reduce((sum, e) => sum + (e.co2_emitted_kg ?? 0), 0);
  const totalCO2Saved = (shipments ?? []).reduce((sum, s) => sum + (s.carbon_score ?? 0), 0);
  const totalFuelLiters = fuelEntries.reduce((sum, e) => sum + e.fuel_liters, 0);
  const totalDistanceKm = fuelEntries.reduce((sum, e) => sum + (e.trip_distance_km ?? 0), 0);
  
  // Calculate EV savings potential
  const evSavings = totalDistanceKm > 0 ? calculateEVSavings(totalDistanceKm) : 0;
  
  // Calculate month-over-month trend
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { data: lastMonthEntries } = await getFuelEntries({
    startDate: lastMonth.toISOString().split('T')[0],
    endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
  });
  
  const lastMonthCO2 = lastMonthEntries.reduce((sum, e) => sum + (e.co2_emitted_kg ?? 0), 0);
  const monthlyTrend = lastMonthCO2 > 0 
    ? Math.round(((totalCO2Emitted - lastMonthCO2) / lastMonthCO2) * 100) 
    : 0;

  return {
    totalCO2Emitted: Math.round(totalCO2Emitted * 100) / 100,
    totalCO2Saved: Math.round(totalCO2Saved * 100) / 100,
    co2PerKm: totalDistanceKm > 0 ? Math.round((totalCO2Emitted / totalDistanceKm) * 1000) / 1000 : 0,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    totalFuelLiters: Math.round(totalFuelLiters * 100) / 100,
    totalTrips: fuelEntries.length,
    monthlyTrend,
    evSavings: Math.round(evSavings * 100) / 100,
  };
}

/**
 * Get emissions by vehicle
 */
export async function getEmissionsByVehicle(): Promise<FleetEmissionStats['byVehicle']> {
  const { data: vehicles } = await supabase
    .from('fleet_vehicles')
    .select('id, vehicle_number, vehicle_type, fuel_type, total_km_driven, lifetime_co2_kg, avg_co2_per_km');

  const { data: fuelEntries } = await supabase
    .from('fuel_entries')
    .select('vehicle_id, co2_emitted_kg, trip_distance_km');

  const vehicleEmissions = new Map<string, { co2: number; distance: number }>();
  
  (fuelEntries ?? []).forEach((entry: { vehicle_id: string; co2_emitted_kg: number | null; trip_distance_km: number | null }) => {
    const current = vehicleEmissions.get(entry.vehicle_id) ?? { co2: 0, distance: 0 };
    vehicleEmissions.set(entry.vehicle_id, {
      co2: current.co2 + (entry.co2_emitted_kg ?? 0),
      distance: current.distance + (entry.trip_distance_km ?? 0),
    });
  });

  return (vehicles ?? []).map((v: { 
    id: string; 
    vehicle_number: string; 
    vehicle_type: string; 
    fuel_type: string | null;
    lifetime_co2_kg: number | null;
    avg_co2_per_km: number | null;
  }) => {
    const emissions = vehicleEmissions.get(v.id) ?? { co2: 0, distance: 0 };
    const isEV = v.fuel_type?.toUpperCase() === 'ELECTRIC';
    
    return {
      vehicleId: v.id,
      vehicleNumber: v.vehicle_number,
      vehicleType: v.vehicle_type,
      fuelType: v.fuel_type ?? 'DIESEL',
      totalCO2: emissions.co2 + (v.lifetime_co2_kg ?? 0),
      avgCO2PerKm: emissions.distance > 0 
        ? emissions.co2 / emissions.distance 
        : (v.avg_co2_per_km ?? 0.25),
      isEV,
    };
  });
}

/**
 * Get emissions by fuel type
 */
export async function getEmissionsByFuelType(): Promise<FleetEmissionStats['byFuelType']> {
  const { data: fuelEntries } = await supabase
    .from('fuel_entries')
    .select('fuel_type, co2_emitted_kg');

  const byType = new Map<string, number>();
  let total = 0;

  (fuelEntries ?? []).forEach((entry: { fuel_type: string; co2_emitted_kg: number | null }) => {
    const co2 = entry.co2_emitted_kg ?? 0;
    byType.set(entry.fuel_type, (byType.get(entry.fuel_type) ?? 0) + co2);
    total += co2;
  });

  return Array.from(byType.entries()).map(([fuelType, totalCO2]) => ({
    fuelType,
    totalCO2: Math.round(totalCO2 * 100) / 100,
    percentage: total > 0 ? Math.round((totalCO2 / total) * 100) : 0,
  }));
}

/**
 * Get monthly emissions trend
 */
export async function getEmissionsTrend(months: number = 6): Promise<FleetEmissionStats['byPeriod']> {
  const result: FleetEmissionStats['byPeriod'] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const { data: entries } = await getFuelEntries({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });

    const totalCO2 = entries.reduce((sum, e) => sum + (e.co2_emitted_kg ?? 0), 0);
    const totalDistance = entries.reduce((sum, e) => sum + (e.trip_distance_km ?? 0), 0);
    const totalFuel = entries.reduce((sum, e) => sum + e.fuel_liters, 0);

    result.push({
      period: startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      totalCO2: Math.round(totalCO2 * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      avgEfficiency: totalDistance > 0 ? Math.round((totalFuel / totalDistance * 100) * 100) / 100 : 0,
    });
  }

  return result;
}

// =============================================
// DRIVER ECO SCORES
// =============================================

/**
 * Get driver eco score
 */
export async function getDriverEcoScore(driverId: string): Promise<DriverEcoScore | null> {
  const { data, error } = await supabase
    .from('driver_eco_scores')
    .select('*')
    .eq('driver_id', driverId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as DriverEcoScore;
}

/**
 * Get driver leaderboard
 */
export async function getDriverLeaderboard(limit: number = 10): Promise<Array<DriverEcoScore & { rank: number; driverName?: string }>> {
  const { data: scores } = await supabase
    .from('driver_eco_scores')
    .select('*')
    .order('overall_eco_score', { ascending: false })
    .limit(limit);

  // Get driver names from profiles
  const driverIds = (scores ?? []).map((s: { driver_id: string }) => s.driver_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', driverIds);

  const nameMap = new Map<string, string>();
  (profiles ?? []).forEach((p: { user_id: string; full_name: string | null }) => {
    if (p.full_name) nameMap.set(p.user_id, p.full_name);
  });

  return (scores ?? []).map((score: DriverEcoScore, index: number) => ({
    ...score,
    rank: index + 1,
    driverName: nameMap.get(score.driver_id) ?? 'Unknown Driver',
  }));
}

/**
 * Update driver eco score after delivery
 */
export async function updateDriverEcoScore(
  driverId: string,
  deliveryData: {
    distanceKm: number;
    fuelUsed?: number;
    fuelType?: string;
    idleTimeMinutes?: number;
  }
): Promise<void> {
  // Get current score or create new
  let currentScore = await getDriverEcoScore(driverId);
  
  const co2Emitted = deliveryData.fuelUsed 
    ? calculateCO2FromFuel(deliveryData.fuelUsed, deliveryData.fuelType ?? 'DIESEL')
    : calculateCO2FromFuel(
        estimateFuelFromDistance(deliveryData.distanceKm, 'TRUCK'),
        deliveryData.fuelType ?? 'DIESEL'
      );

  const fuelUsed = deliveryData.fuelUsed ?? estimateFuelFromDistance(deliveryData.distanceKm, 'TRUCK');

  if (!currentScore) {
    // Create new score
    await supabase.from('driver_eco_scores').insert({
      driver_id: driverId,
      total_deliveries: 1,
      total_distance_km: deliveryData.distanceKm,
      total_fuel_liters: fuelUsed,
      total_co2_emitted_kg: co2Emitted,
      monthly_deliveries: 1,
      monthly_distance_km: deliveryData.distanceKm,
      monthly_fuel_liters: fuelUsed,
      monthly_co2_emitted_kg: co2Emitted,
    });
    return;
  }

  // Update existing score
  const newTotalDeliveries = currentScore.total_deliveries + 1;
  const newTotalDistance = currentScore.total_distance_km + deliveryData.distanceKm;
  const newTotalFuel = currentScore.total_fuel_liters + fuelUsed;
  const newTotalCO2 = currentScore.total_co2_emitted_kg + co2Emitted;
  const avgEfficiency = newTotalDistance > 0 ? (newTotalFuel / newTotalDistance) * 100 : 0;

  // Calculate fuel efficiency score (lower consumption = higher score)
  const avgCO2PerKm = newTotalDistance > 0 ? newTotalCO2 / newTotalDistance : 0.25;
  const fuelEfficiencyScore = Math.min(100, Math.max(0, 100 - (avgCO2PerKm * 200)));

  // Calculate idling score (less idle time = higher score)
  const idlingScore = deliveryData.idleTimeMinutes 
    ? Math.min(100, Math.max(0, 100 - (deliveryData.idleTimeMinutes / 2)))
    : currentScore.idling_score;

  // Calculate overall score
  const overallScore = Math.round(
    (fuelEfficiencyScore * 0.4 + 
     idlingScore * 0.3 + 
     currentScore.acceleration_score * 0.15 + 
     currentScore.braking_score * 0.15)
  );

  // Determine eco rank
  let ecoRank = 'Beginner';
  if (overallScore >= 90) ecoRank = 'Eco Champion';
  else if (overallScore >= 75) ecoRank = 'Green Driver';
  else if (overallScore >= 60) ecoRank = 'Eco Learner';
  else if (overallScore >= 40) ecoRank = 'Developing';

  // Check for new badges
  const badges = [...currentScore.badges];
  if (newTotalDeliveries >= 100 && !badges.includes('Century Driver')) {
    badges.push('Century Driver');
  }
  if (overallScore >= 90 && !badges.includes('Eco Star')) {
    badges.push('Eco Star');
  }
  if (newTotalCO2 / newTotalDistance < 0.2 && !badges.includes('Low Emission Hero')) {
    badges.push('Low Emission Hero');
  }

  await supabase
    .from('driver_eco_scores')
    .update({
      total_deliveries: newTotalDeliveries,
      total_distance_km: newTotalDistance,
      total_fuel_liters: newTotalFuel,
      total_co2_emitted_kg: newTotalCO2,
      avg_fuel_efficiency: avgEfficiency,
      fuel_efficiency_score: fuelEfficiencyScore,
      idling_score: idlingScore,
      overall_eco_score: overallScore,
      eco_rank: ecoRank,
      badges,
      monthly_deliveries: currentScore.monthly_deliveries + 1,
      monthly_distance_km: currentScore.monthly_distance_km + deliveryData.distanceKm,
      monthly_fuel_liters: currentScore.monthly_fuel_liters + fuelUsed,
      monthly_co2_emitted_kg: currentScore.monthly_co2_emitted_kg + co2Emitted,
    })
    .eq('driver_id', driverId);
}

// =============================================
// EMISSION INTELLIGENCE & INSIGHTS
// =============================================

/**
 * Generate smart emission insights
 */
export async function getEmissionInsights(): Promise<EmissionInsight[]> {
  const insights: EmissionInsight[] = [];
  
  const summary = await getFleetEmissionsSummary();
  const byVehicle = await getEmissionsByVehicle();
  const leaderboard = await getDriverLeaderboard(5);

  // High emission vehicles
  const highEmissionVehicles = byVehicle.filter(v => v.avgCO2PerKm > 0.35 && !v.isEV);
  if (highEmissionVehicles.length > 0) {
    insights.push({
      id: 'high-emission-vehicles',
      type: 'warning',
      title: `${highEmissionVehicles.length} vehicles have high emissions`,
      description: `Vehicles ${highEmissionVehicles.map(v => v.vehicleNumber).slice(0, 3).join(', ')} are emitting above average CO₂. Consider maintenance or route optimization.`,
      potentialSavings: highEmissionVehicles.reduce((sum, v) => sum + (v.avgCO2PerKm - 0.25) * 1000, 0),
      icon: 'AlertTriangle',
    });
  }

  // EV replacement opportunity
  const dieselVehicles = byVehicle.filter(v => v.fuelType === 'DIESEL');
  if (dieselVehicles.length > 0 && summary.evSavings > 0) {
    insights.push({
      id: 'ev-opportunity',
      type: 'suggestion',
      title: 'EV fleet transition opportunity',
      description: `Switching ${dieselVehicles.length} diesel vehicles to electric could save ${summary.evSavings.toFixed(0)} kg CO₂. Consider EV alternatives for short-distance routes.`,
      potentialSavings: summary.evSavings,
      icon: 'Zap',
    });
  }

  // Route optimization savings
  if (summary.totalDistanceKm > 0) {
    const potentialSavings = summary.totalCO2Emitted * 0.15; // 15% potential savings
    insights.push({
      id: 'route-optimization',
      type: 'suggestion',
      title: 'Route optimization can reduce emissions',
      description: `Optimizing delivery routes could reduce emissions by up to ${potentialSavings.toFixed(0)} kg CO₂ (15% reduction).`,
      potentialSavings,
      icon: 'Route',
    });
  }

  // Top performer recognition
  if (leaderboard.length > 0) {
    const topDriver = leaderboard[0];
    insights.push({
      id: 'top-driver',
      type: 'achievement',
      title: `${topDriver.driverName} is your eco champion!`,
      description: `With an eco-score of ${topDriver.overall_eco_score}/100, they're setting the standard for sustainable driving.`,
      icon: 'Trophy',
    });
  }

  // Monthly improvement
  if (summary.monthlyTrend < -5) {
    insights.push({
      id: 'monthly-improvement',
      type: 'achievement',
      title: `Emissions down ${Math.abs(summary.monthlyTrend)}% this month!`,
      description: 'Great progress on reducing your fleet\'s carbon footprint. Keep up the sustainable practices!',
      icon: 'TrendingDown',
    });
  } else if (summary.monthlyTrend > 10) {
    insights.push({
      id: 'monthly-increase',
      type: 'warning',
      title: `Emissions increased ${summary.monthlyTrend}% this month`,
      description: 'Consider reviewing driver behavior, route efficiency, and vehicle maintenance to reduce emissions.',
      icon: 'TrendingUp',
    });
  }

  return insights;
}

// =============================================
// COMPLIANCE & REPORTING
// =============================================

export interface EmissionReport {
  reportDate: string;
  reportPeriod: { start: string; end: string };
  summary: EmissionsSummary;
  byVehicle: FleetEmissionStats['byVehicle'];
  byFuelType: FleetEmissionStats['byFuelType'];
  monthlyTrend: FleetEmissionStats['byPeriod'];
  insights: EmissionInsight[];
  complianceStatus: 'compliant' | 'at-risk' | 'non-compliant';
  recommendations: string[];
}

/**
 * Generate comprehensive emission report
 */
export async function generateEmissionReport(
  startDate: string,
  endDate: string
): Promise<EmissionReport> {
  const [summary, byVehicle, byFuelType, monthlyTrend, insights] = await Promise.all([
    getFleetEmissionsSummary(startDate, endDate),
    getEmissionsByVehicle(),
    getEmissionsByFuelType(),
    getEmissionsTrend(6),
    getEmissionInsights(),
  ]);

  // Determine compliance status (simplified - could be based on regulations)
  let complianceStatus: 'compliant' | 'at-risk' | 'non-compliant' = 'compliant';
  if (summary.co2PerKm > 0.4) complianceStatus = 'non-compliant';
  else if (summary.co2PerKm > 0.3) complianceStatus = 'at-risk';

  // Generate recommendations
  const recommendations: string[] = [];
  if (summary.co2PerKm > 0.3) {
    recommendations.push('Review and optimize delivery routes to reduce fuel consumption');
  }
  if (byVehicle.some(v => v.avgCO2PerKm > 0.4)) {
    recommendations.push('Schedule maintenance for high-emission vehicles');
  }
  if (!byVehicle.some(v => v.isEV)) {
    recommendations.push('Consider adding electric vehicles to your fleet for short-distance routes');
  }
  recommendations.push('Implement driver training programs focused on eco-driving techniques');
  recommendations.push('Set monthly emission reduction targets and track progress');

  return {
    reportDate: new Date().toISOString(),
    reportPeriod: { start: startDate, end: endDate },
    summary,
    byVehicle,
    byFuelType,
    monthlyTrend,
    insights,
    complianceStatus,
    recommendations,
  };
}
