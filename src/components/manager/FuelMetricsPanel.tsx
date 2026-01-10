import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Fuel, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Truck,
  User,
  Clock,
  BarChart3,
  Droplets,
  Gauge
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

const FuelMetricsPanel: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return { start: startOfDay(now), end: now };
      case 'week':
        return { start: subDays(now, 7), end: now };
      case 'month':
        return { start: subMonths(now, 1), end: now };
    }
  };

  // Fetch fuel entries
  const { data: fuelEntries, isLoading: loadingFuel } = useQuery({
    queryKey: ['fuel-entries', timeRange],
    queryFn: async () => {
      const { start } = getDateRange();
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*')
        .gte('entry_date', format(start, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch vehicles for mapping
  const { data: vehicles } = useQuery({
    queryKey: ['fleet-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch driver profiles
  const { data: profiles } = useQuery({
    queryKey: ['driver-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalFuelLiters = fuelEntries?.reduce((sum, e) => sum + (e.fuel_liters || 0), 0) || 0;
  const totalCO2Kg = fuelEntries?.reduce((sum, e) => sum + (e.co2_emitted_kg || 0), 0) || 0;
  const totalCost = fuelEntries?.reduce((sum, e) => sum + (e.fuel_cost || 0), 0) || 0;
  const totalDistance = fuelEntries?.reduce((sum, e) => sum + (e.trip_distance_km || 0), 0) || 0;
  const avgEfficiency = totalDistance > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : '0';

  // Group by vehicle
  const vehicleMetrics = React.useMemo(() => {
    if (!fuelEntries || !vehicles) return [];
    
    const vehicleMap = new Map<string, { liters: number; cost: number; distance: number; entries: number }>();
    
    fuelEntries.forEach(entry => {
      const existing = vehicleMap.get(entry.vehicle_id) || { liters: 0, cost: 0, distance: 0, entries: 0 };
      vehicleMap.set(entry.vehicle_id, {
        liters: existing.liters + (entry.fuel_liters || 0),
        cost: existing.cost + (entry.fuel_cost || 0),
        distance: existing.distance + (entry.trip_distance_km || 0),
        entries: existing.entries + 1,
      });
    });

    return vehicles
      .filter(v => vehicleMap.has(v.id))
      .map(v => {
        const stats = vehicleMap.get(v.id)!;
        return {
          id: v.id,
          vehicleNumber: v.vehicle_number,
          vehicleType: v.vehicle_type,
          make: v.make,
          model: v.model,
          ...stats,
          avgEfficiency: stats.distance > 0 ? (stats.distance / stats.liters).toFixed(2) : '0',
        };
      })
      .sort((a, b) => b.liters - a.liters);
  }, [fuelEntries, vehicles]);

  // Group by driver
  const driverMetrics = React.useMemo(() => {
    if (!fuelEntries || !profiles) return [];
    
    const driverMap = new Map<string, { liters: number; cost: number; distance: number; entries: number }>();
    
    fuelEntries.forEach(entry => {
      if (!entry.driver_id) return;
      const existing = driverMap.get(entry.driver_id) || { liters: 0, cost: 0, distance: 0, entries: 0 };
      driverMap.set(entry.driver_id, {
        liters: existing.liters + (entry.fuel_liters || 0),
        cost: existing.cost + (entry.fuel_cost || 0),
        distance: existing.distance + (entry.trip_distance_km || 0),
        entries: existing.entries + 1,
      });
    });

    return profiles
      .filter(p => driverMap.has(p.user_id))
      .map(p => {
        const stats = driverMap.get(p.user_id)!;
        return {
          id: p.user_id,
          name: p.full_name || 'Unknown Driver',
          ...stats,
          avgEfficiency: stats.distance > 0 ? (stats.distance / stats.liters).toFixed(2) : '0',
        };
      })
      .sort((a, b) => b.liters - a.liters);
  }, [fuelEntries, profiles]);

  // Daily chart data
  const chartData = React.useMemo(() => {
    if (!fuelEntries) return [];
    
    const dayMap = new Map<string, { liters: number; cost: number; co2: number }>();
    
    fuelEntries.forEach(entry => {
      const day = format(new Date(entry.entry_date), 'MMM dd');
      const existing = dayMap.get(day) || { liters: 0, cost: 0, co2: 0 };
      dayMap.set(day, {
        liters: existing.liters + (entry.fuel_liters || 0),
        cost: existing.cost + (entry.fuel_cost || 0),
        co2: existing.co2 + (entry.co2_emitted_kg || 0),
      });
    });

    return Array.from(dayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .reverse();
  }, [fuelEntries]);

  const getTimeLabel = () => {
    switch (timeRange) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Fuel className="w-6 h-6 text-accent" />
          Fuel Metrics
        </h2>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="day" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Day
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                {loadingFuel ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{totalFuelLiters.toFixed(1)}L</p>
                )}
                <p className="text-xs text-muted-foreground">Total Fuel {getTimeLabel()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Gauge className="w-6 h-6 text-green-600" />
              </div>
              <div>
                {loadingFuel ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{avgEfficiency} km/L</p>
                )}
                <p className="text-xs text-muted-foreground">Avg Efficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                {loadingFuel ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">₹{totalCost.toFixed(0)}</p>
                )}
                <p className="text-xs text-muted-foreground">Fuel Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                {loadingFuel ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{totalCO2Kg.toFixed(1)} kg</p>
                )}
                <p className="text-xs text-muted-foreground">CO₂ Emitted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-accent" />
            Fuel Consumption Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFuel ? (
            <Skeleton className="h-[250px] w-full" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="liters" name="Fuel (L)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No fuel data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle & Driver Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="w-5 h-5 text-accent" />
              Vehicle Fuel Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFuel ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))
            ) : vehicleMetrics.length > 0 ? (
              vehicleMetrics.slice(0, 6).map((vehicle, idx) => {
                const maxLiters = vehicleMetrics[0]?.liters || 1;
                const percentage = (vehicle.liters / maxLiters) * 100;
                
                return (
                  <div key={vehicle.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{vehicle.vehicleNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.make} {vehicle.model} • {vehicle.vehicleType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{vehicle.liters.toFixed(1)}L</p>
                        <p className="text-xs text-muted-foreground">{vehicle.avgEfficiency} km/L</p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No vehicle fuel data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-accent" />
              Driver Fuel Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFuel ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))
            ) : driverMetrics.length > 0 ? (
              driverMetrics.slice(0, 6).map((driver, idx) => {
                const maxLiters = driverMetrics[0]?.liters || 1;
                const percentage = (driver.liters / maxLiters) * 100;
                
                return (
                  <div key={driver.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/60 rounded-full flex items-center justify-center text-accent-foreground text-xs font-bold">
                          {driver.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {driver.entries} entries • {driver.distance.toFixed(0)} km
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{driver.liters.toFixed(1)}L</p>
                        <p className="text-xs text-muted-foreground">{driver.avgEfficiency} km/L</p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No driver fuel data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Fuel Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-5 h-5 text-accent" />
            Recent Fuel Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFuel ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : fuelEntries && fuelEntries.length > 0 ? (
            <div className="space-y-3">
              {fuelEntries.slice(0, 10).map((entry) => {
                const vehicle = vehicles?.find(v => v.id === entry.vehicle_id);
                const driver = profiles?.find(p => p.user_id === entry.driver_id);
                
                return (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Fuel className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {vehicle?.vehicle_number || 'Unknown Vehicle'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {driver?.full_name || 'Unknown Driver'} • {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-sm">{entry.fuel_liters.toFixed(1)}L</p>
                        {entry.fuel_cost && (
                          <p className="text-xs text-muted-foreground">₹{entry.fuel_cost.toFixed(0)}</p>
                        )}
                      </div>
                      {entry.trip_distance_km && (
                        <Badge variant="outline" className="text-xs">
                          {entry.trip_distance_km.toFixed(0)} km
                        </Badge>
                      )}
                      {entry.co2_emitted_kg && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.co2_emitted_kg.toFixed(1)} kg CO₂
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Fuel className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="font-semibold mb-1">No Fuel Entries</h3>
              <p className="text-sm">Fuel entries will appear here when drivers log them</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FuelMetricsPanel;
