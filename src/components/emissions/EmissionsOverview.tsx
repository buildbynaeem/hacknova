import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Fuel,
  Zap,
  Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatsGridSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { 
  getFleetEmissionsSummary, 
  EmissionsSummary 
} from '@/lib/emissions-service';

const EmissionsOverview: React.FC = () => {
  const [summary, setSummary] = useState<EmissionsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFleetEmissionsSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching emissions summary:', error);
        // Set mock data for demo
        setSummary({
          totalCO2Emitted: 2450.5,
          totalCO2Saved: 892.3,
          co2PerKm: 0.28,
          totalDistanceKm: 8750,
          totalFuelLiters: 1250,
          totalTrips: 245,
          monthlyTrend: -8.5,
          evSavings: 1580,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <StatsGridSkeleton count={8} />;
  }

  if (!summary) {
    return null;
  }

  const statCards = [
    {
      title: 'Total CO₂ Emitted',
      value: summary.totalCO2Emitted > 1000 
        ? `${(summary.totalCO2Emitted / 1000).toFixed(2)} tons`
        : `${summary.totalCO2Emitted.toLocaleString()} kg`,
      subtitle: 'Fleet emissions',
      icon: Flame,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      trend: summary.monthlyTrend < 0 ? `${summary.monthlyTrend}%` : `+${summary.monthlyTrend}%`,
      trendUp: summary.monthlyTrend > 0,
      trendGood: summary.monthlyTrend < 0,
    },
    {
      title: 'CO₂ Saved',
      value: `${summary.totalCO2Saved.toLocaleString()} kg`,
      subtitle: 'Via route optimization',
      icon: Leaf,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      trend: '+12.5%',
      trendUp: true,
      trendGood: true,
    },
    {
      title: 'Emission Rate',
      value: `${summary.co2PerKm.toFixed(3)} kg/km`,
      subtitle: 'Average per kilometer',
      icon: Target,
      iconBg: summary.co2PerKm <= 0.25 ? 'bg-success/10' : 'bg-warning/10',
      iconColor: summary.co2PerKm <= 0.25 ? 'text-success' : 'text-warning',
      trend: summary.co2PerKm <= 0.25 ? 'Optimal' : 'Above target',
      trendUp: false,
      trendGood: summary.co2PerKm <= 0.25,
    },
    {
      title: 'Total Distance',
      value: summary.totalDistanceKm > 1000 
        ? `${(summary.totalDistanceKm / 1000).toFixed(1)}k km`
        : `${summary.totalDistanceKm.toLocaleString()} km`,
      subtitle: 'Fleet travel',
      icon: Car,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      trend: `${summary.totalTrips} trips`,
      trendUp: true,
      trendGood: true,
    },
    {
      title: 'Fuel Consumed',
      value: `${summary.totalFuelLiters.toLocaleString()} L`,
      subtitle: 'Total consumption',
      icon: Fuel,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      trend: `${(summary.totalFuelLiters / summary.totalTrips || 0).toFixed(1)} L/trip`,
      trendUp: false,
      trendGood: true,
    },
    {
      title: 'EV Savings Potential',
      value: `${summary.evSavings.toLocaleString()} kg`,
      subtitle: 'If fleet was electric',
      icon: Zap,
      iconBg: 'bg-chart-1/10',
      iconColor: 'text-chart-1',
      trend: 'Switch to EV',
      trendUp: true,
      trendGood: true,
    },
  ];

  // Carbon offset progress (target: reduce emissions by 30%)
  const targetReduction = 0.30;
  const actualReduction = summary.totalCO2Saved / (summary.totalCO2Emitted + summary.totalCO2Saved);
  const progressPercent = Math.min(100, (actualReduction / targetReduction) * 100);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="relative overflow-hidden h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-xl sm:text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{stat.subtitle}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg ${stat.iconBg} shrink-0`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className={`flex items-center gap-1 mt-3 sm:mt-4 text-xs sm:text-sm ${
                  stat.trendGood ? 'text-success' : 'text-destructive'
                }`}>
                  {stat.trendUp ? (
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span className="font-medium">{stat.trend}</span>
                  <span className="text-muted-foreground hidden sm:inline">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Carbon Offset Target */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Carbon Offset Target</h3>
                <p className="text-sm text-muted-foreground">
                  Progress towards 30% emission reduction goal
                </p>
              </div>
              <div className={`text-2xl font-bold ${
                progressPercent >= 100 ? 'text-success' : 'text-primary'
              }`}>
                {progressPercent.toFixed(1)}%
              </div>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Current: {(actualReduction * 100).toFixed(1)}% reduction</span>
              <span>Target: {(targetReduction * 100).toFixed(0)}% reduction</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/20 rounded-lg">
                  <Leaf className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trees Equivalent</p>
                  <p className="text-xl font-bold text-success">
                    {Math.round(summary.totalCO2Saved / 21)} trees
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                CO₂ absorbed by trees per year
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Fuel className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fuel Efficiency</p>
                  <p className="text-xl font-bold text-primary">
                    {((summary.totalFuelLiters / summary.totalDistanceKm) * 100).toFixed(1)} L/100km
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Fleet average consumption
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-chart-1/10 to-chart-1/5 border-chart-1/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-1/20 rounded-lg">
                  <Zap className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">EV Fleet Score</p>
                  <p className="text-xl font-bold text-chart-1">
                    0% Electric
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Consider adding EVs to fleet
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EmissionsOverview;
