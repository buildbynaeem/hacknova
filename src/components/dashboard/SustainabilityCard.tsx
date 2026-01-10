import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Truck, Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getSustainabilityMetrics } from '@/lib/shipment-service';

interface SustainabilityMetrics {
  totalCarbonSaved: number;
  totalDeliveries: number;
  activeDeliveries: number;
  maintenanceCostPerKm: number;
  fuelEfficiencyData: Array<{ month: string; standard: number; efficient: number }>;
}

const SustainabilityCard: React.FC = () => {
  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await getSustainabilityMetrics();
      // Add mock data for chart and maintenance cost
      setMetrics({
        ...data,
        maintenanceCostPerKm: 2.45,
        fuelEfficiencyData: [
          { month: 'Jan', standard: 12.5, efficient: 8.2 },
          { month: 'Feb', standard: 11.8, efficient: 7.9 },
          { month: 'Mar', standard: 13.2, efficient: 8.5 },
          { month: 'Apr', standard: 12.1, efficient: 7.6 },
          { month: 'May', standard: 11.5, efficient: 7.2 },
          { month: 'Jun', standard: 12.8, efficient: 8.0 },
        ],
      });
      setIsLoading(false);
    };
    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-secondary rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Carbon Saved',
      value: `${metrics.totalCarbonSaved.toLocaleString()} kg`,
      subtitle: 'CO₂ emissions prevented',
      icon: Leaf,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Active Deliveries',
      value: metrics.activeDeliveries.toString(),
      subtitle: 'Currently in transit',
      icon: Truck,
      iconBg: 'bg-transit/10',
      iconColor: 'text-transit',
      trend: '+3',
      trendUp: true,
    },
    {
      title: 'Maintenance Cost/km',
      value: `₹${metrics.maintenanceCostPerKm.toFixed(2)}`,
      subtitle: 'Fleet average',
      icon: Wrench,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      trend: '-8.3%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className={`flex items-center gap-1 mt-4 text-sm ${stat.trendUp ? 'text-success' : 'text-accent'}`}>
                  {stat.trendUp ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">{stat.trend}</span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Fuel Efficiency Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-success" />
              Fuel Efficiency: Standard vs Optimized Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.fuelEfficiencyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${value}L`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} L/100km`, '']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="standard" 
                    name="Standard Fleet" 
                    fill="hsl(var(--muted-foreground))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="efficient" 
                    name="Routezy Optimized" 
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-success/10 rounded-lg flex items-center gap-3">
              <Leaf className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium text-success">40% More Efficient</p>
                <p className="text-sm text-muted-foreground">
                  Routezy's optimized routes save an average of 3.5L/100km compared to standard fleet operations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SustainabilityCard;
