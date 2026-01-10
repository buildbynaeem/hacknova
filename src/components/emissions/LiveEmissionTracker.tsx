import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Flame, Zap, TrendingDown, Fuel, Route } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  calculateCO2FromFuel, 
  estimateFuelFromDistance, 
  calculateCO2Savings,
  EMISSION_FACTORS 
} from '@/lib/emissions-service';

interface LiveEmissionTrackerProps {
  distanceTraveled: number; // km traveled so far
  totalDistance: number; // total trip distance in km
  vehicleType?: string;
  fuelType?: string;
  isActive?: boolean;
  showDetails?: boolean;
}

const LiveEmissionTracker: React.FC<LiveEmissionTrackerProps> = ({
  distanceTraveled,
  totalDistance,
  vehicleType = 'MINI_TRUCK',
  fuelType = 'DIESEL',
  isActive = true,
  showDetails = true,
}) => {
  const [animatedCO2, setAnimatedCO2] = useState(0);
  const [animatedSaved, setAnimatedSaved] = useState(0);

  // Calculate real-time emissions
  const calculations = useMemo(() => {
    const fuelUsed = estimateFuelFromDistance(distanceTraveled, vehicleType);
    const currentCO2 = calculateCO2FromFuel(fuelUsed, fuelType);
    const co2Saved = calculateCO2Savings(distanceTraveled, fuelType, 0.3);
    
    // Calculate what would have been emitted without optimization
    const standardCO2 = currentCO2 * 1.3; // 30% more without optimization
    
    // Project total emissions
    const projectedFuel = estimateFuelFromDistance(totalDistance, vehicleType);
    const projectedCO2 = calculateCO2FromFuel(projectedFuel, fuelType);
    const projectedSaved = calculateCO2Savings(totalDistance, fuelType, 0.3);
    
    // Emission rate
    const emissionRate = distanceTraveled > 0 ? currentCO2 / distanceTraveled : 0;
    
    // Efficiency score (lower emissions = higher score)
    const maxRate = EMISSION_FACTORS[fuelType.toUpperCase()] * 0.15; // Expected max rate
    const efficiencyScore = Math.max(0, Math.min(100, (1 - emissionRate / maxRate) * 100));

    return {
      fuelUsed,
      currentCO2,
      co2Saved,
      standardCO2,
      projectedCO2,
      projectedSaved,
      emissionRate,
      efficiencyScore,
      progress: totalDistance > 0 ? (distanceTraveled / totalDistance) * 100 : 0,
    };
  }, [distanceTraveled, totalDistance, vehicleType, fuelType]);

  // Animate values
  useEffect(() => {
    const co2Target = calculations.currentCO2;
    const savedTarget = calculations.co2Saved;
    
    const duration = 500;
    const steps = 20;
    const co2Step = (co2Target - animatedCO2) / steps;
    const savedStep = (savedTarget - animatedSaved) / steps;
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnimatedCO2(prev => prev + co2Step);
      setAnimatedSaved(prev => prev + savedStep);
      
      if (step >= steps) {
        clearInterval(interval);
        setAnimatedCO2(co2Target);
        setAnimatedSaved(savedTarget);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [calculations.currentCO2, calculations.co2Saved]);

  // Determine efficiency status
  const getEfficiencyStatus = () => {
    if (calculations.efficiencyScore >= 80) return { label: 'Excellent', color: 'text-success', bg: 'bg-success/10' };
    if (calculations.efficiencyScore >= 60) return { label: 'Good', color: 'text-chart-1', bg: 'bg-chart-1/10' };
    if (calculations.efficiencyScore >= 40) return { label: 'Moderate', color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'Needs Improvement', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const status = getEfficiencyStatus();

  return (
    <Card className={`overflow-hidden ${isActive ? 'ring-2 ring-success/30' : ''}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${status.bg}`}>
              <Leaf className={`w-4 h-4 ${status.color}`} />
            </div>
            <span className="font-medium text-sm">Live Emissions</span>
          </div>
          {isActive && (
            <Badge variant="outline" className="gap-1 text-xs animate-pulse">
              <span className="w-1.5 h-1.5 bg-success rounded-full" />
              Tracking
            </Badge>
          )}
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Current CO2 */}
          <motion.div 
            className="p-3 bg-destructive/5 rounded-lg border border-destructive/10"
            animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs text-muted-foreground">Emitting</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-destructive">
                {animatedCO2.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">kg CO₂</span>
            </div>
          </motion.div>

          {/* CO2 Saved */}
          <motion.div 
            className="p-3 bg-success/5 rounded-lg border border-success/10"
            animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0, delay: 1 }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Leaf className="w-3.5 h-3.5 text-success" />
              <span className="text-xs text-muted-foreground">Saving</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-success">
                {animatedSaved.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">kg CO₂</span>
            </div>
          </motion.div>
        </div>

        {/* Trip Progress */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Trip Progress</span>
            <span className="font-medium">
              {distanceTraveled.toFixed(1)} / {totalDistance.toFixed(1)} km
            </span>
          </div>
          <div className="relative">
            <Progress value={calculations.progress} className="h-2" />
            <AnimatePresence>
              {isActive && calculations.progress > 0 && calculations.progress < 100 && (
                <motion.div
                  className="absolute top-0 h-2 w-2 bg-primary rounded-full shadow-lg"
                  style={{ left: `calc(${calculations.progress}% - 4px)` }}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(var(--primary), 0.4)',
                      '0 0 0 4px rgba(var(--primary), 0)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Detailed Stats */}
        {showDetails && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Fuel className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">{calculations.fuelUsed.toFixed(2)}L</p>
              <p className="text-[10px] text-muted-foreground">Fuel Used</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingDown className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">{calculations.emissionRate.toFixed(3)}</p>
              <p className="text-[10px] text-muted-foreground">kg/km</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Zap className={`w-3 h-3 ${status.color}`} />
              </div>
              <p className={`text-sm font-semibold ${status.color}`}>
                {calculations.efficiencyScore.toFixed(0)}%
              </p>
              <p className="text-[10px] text-muted-foreground">Efficiency</p>
            </div>
          </div>
        )}

        {/* Eco Message */}
        {isActive && calculations.co2Saved > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-success/10 rounded-lg"
          >
            <p className="text-xs text-success text-center flex items-center justify-center gap-1">
              <Leaf className="w-3 h-3" />
              Optimized route saving {(calculations.co2Saved * 100 / (calculations.currentCO2 + calculations.co2Saved)).toFixed(0)}% emissions!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveEmissionTracker;
