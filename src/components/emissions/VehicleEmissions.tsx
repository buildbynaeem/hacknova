import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  Truck, 
  Zap, 
  Fuel, 
  Leaf,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { getEmissionsByVehicle, FleetEmissionStats } from '@/lib/emissions-service';
import { StatsGridSkeleton } from '@/components/dashboard/DashboardSkeletons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const getVehicleIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'BIKE':
      return Car;
    case 'THREE_WHEELER':
      return Car;
    case 'TRUCK':
    case 'LARGE_TRUCK':
    case 'MINI_TRUCK':
      return Truck;
    default:
      return Car;
  }
};

const getEmissionStatus = (avgCO2PerKm: number, isEV: boolean) => {
  if (isEV) return { status: 'zero', color: 'text-success', bg: 'bg-success/10', label: 'Zero Emission' };
  if (avgCO2PerKm <= 0.2) return { status: 'excellent', color: 'text-success', bg: 'bg-success/10', label: 'Excellent' };
  if (avgCO2PerKm <= 0.25) return { status: 'good', color: 'text-chart-1', bg: 'bg-chart-1/10', label: 'Good' };
  if (avgCO2PerKm <= 0.35) return { status: 'moderate', color: 'text-warning', bg: 'bg-warning/10', label: 'Moderate' };
  return { status: 'high', color: 'text-destructive', bg: 'bg-destructive/10', label: 'High' };
};

const VehicleEmissions: React.FC = () => {
  const [vehicles, setVehicles] = useState<FleetEmissionStats['byVehicle']>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getEmissionsByVehicle();
        
        // Use mock data if no real data
        if (data.length === 0) {
          setVehicles([
            { vehicleId: '1', vehicleNumber: 'MH-12-AB-1234', vehicleType: 'MINI_TRUCK', fuelType: 'DIESEL', totalCO2: 458.2, avgCO2PerKm: 0.22, isEV: false },
            { vehicleId: '2', vehicleNumber: 'MH-12-CD-5678', vehicleType: 'TRUCK', fuelType: 'DIESEL', totalCO2: 892.5, avgCO2PerKm: 0.32, isEV: false },
            { vehicleId: '3', vehicleNumber: 'MH-12-EF-9012', vehicleType: 'BIKE', fuelType: 'PETROL', totalCO2: 124.8, avgCO2PerKm: 0.15, isEV: false },
            { vehicleId: '4', vehicleNumber: 'MH-12-GH-3456', vehicleType: 'THREE_WHEELER', fuelType: 'CNG', totalCO2: 215.3, avgCO2PerKm: 0.18, isEV: false },
            { vehicleId: '5', vehicleNumber: 'MH-12-IJ-7890', vehicleType: 'LARGE_TRUCK', fuelType: 'DIESEL', totalCO2: 1245.6, avgCO2PerKm: 0.42, isEV: false },
            { vehicleId: '6', vehicleNumber: 'MH-12-KL-1122', vehicleType: 'MINI_TRUCK', fuelType: 'ELECTRIC', totalCO2: 0, avgCO2PerKm: 0, isEV: true },
          ]);
        } else {
          setVehicles(data);
        }
      } catch (error) {
        console.error('Error fetching vehicle emissions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <StatsGridSkeleton count={6} />;
  }

  // Sort by emissions for chart
  const chartData = [...vehicles]
    .sort((a, b) => b.totalCO2 - a.totalCO2)
    .slice(0, 10);

  // Calculate fleet stats
  const totalCO2 = vehicles.reduce((sum, v) => sum + v.totalCO2, 0);
  const evCount = vehicles.filter(v => v.isEV).length;
  const highEmissionCount = vehicles.filter(v => v.avgCO2PerKm > 0.35 && !v.isEV).length;

  return (
    <div className="space-y-6">
      {/* Fleet Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fleet Size</p>
                  <p className="text-2xl font-bold">{vehicles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Fuel className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total CO₂</p>
                  <p className="text-2xl font-bold">{totalCO2.toFixed(0)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Zap className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">EVs in Fleet</p>
                  <p className="text-2xl font-bold">{evCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">High Emitters</p>
                  <p className="text-2xl font-bold">{highEmissionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Emissions Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>CO₂ Emissions by Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${value} kg`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="vehicleNumber"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} kg CO₂`, 'Emissions']}
                  />
                  <Bar dataKey="totalCO2" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.isEV 
                            ? 'hsl(var(--success))' 
                            : entry.avgCO2PerKm > 0.35 
                              ? 'hsl(var(--destructive))'
                              : entry.avgCO2PerKm > 0.25
                                ? 'hsl(var(--warning))'
                                : 'hsl(var(--primary))'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vehicle List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vehicle Emission Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehicles.map((vehicle, index) => {
                const VehicleIcon = getVehicleIcon(vehicle.vehicleType);
                const status = getEmissionStatus(vehicle.avgCO2PerKm, vehicle.isEV);
                
                return (
                  <motion.div
                    key={vehicle.vehicleId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    {/* Vehicle Icon */}
                    <div className={`p-2 rounded-lg ${status.bg}`}>
                      {vehicle.isEV ? (
                        <Zap className={`w-5 h-5 ${status.color}`} />
                      ) : (
                        <VehicleIcon className={`w-5 h-5 ${status.color}`} />
                      )}
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{vehicle.vehicleNumber}</p>
                        <Badge variant="outline" className="text-xs">
                          {vehicle.vehicleType.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.fuelType} • {vehicle.totalCO2.toFixed(1)} kg total
                      </p>
                    </div>

                    {/* Emission Rate */}
                    <div className="hidden sm:block w-40">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">kg CO₂/km</span>
                        <span className={`font-medium ${status.color}`}>
                          {vehicle.avgCO2PerKm.toFixed(3)}
                        </span>
                      </div>
                      <Progress 
                        value={vehicle.isEV ? 100 : Math.min(100, (1 - vehicle.avgCO2PerKm / 0.5) * 100)} 
                        className="h-2"
                      />
                    </div>

                    {/* Status Badge */}
                    <Badge className={status.bg + ' ' + status.color + ' border-0'}>
                      {vehicle.isEV ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : status.status === 'high' ? (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      ) : (
                        <Leaf className="w-3 h-3 mr-1" />
                      )}
                      {status.label}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* EV Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-success/10 to-chart-1/10 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-success/20 rounded-xl">
                <Zap className="w-8 h-8 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">EV Fleet Transition</h3>
                <p className="text-muted-foreground mt-1">
                  Switching your {vehicles.filter(v => !v.isEV).length} diesel/petrol vehicles to electric 
                  could save <span className="font-bold text-success">{totalCO2.toFixed(0)} kg CO₂</span> in emissions.
                </p>
                <div className="flex gap-4 mt-4">
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-success">₹{Math.round(totalCO2 * 5)}</p>
                    <p className="text-xs text-muted-foreground">Est. Fuel Savings/Month</p>
                  </div>
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-chart-1">{Math.round(totalCO2 / 21)}</p>
                    <p className="text-xs text-muted-foreground">Trees Equivalent/Year</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VehicleEmissions;
