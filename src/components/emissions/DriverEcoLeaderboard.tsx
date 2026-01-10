import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  Award, 
  Leaf, 
  Fuel, 
  TrendingUp,
  Star,
  Crown
} from 'lucide-react';
import { getDriverLeaderboard, DriverEcoScore } from '@/lib/emissions-service';
import { StatsGridSkeleton } from '@/components/dashboard/DashboardSkeletons';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-500" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />;
    case 3:
      return <Medal className="w-6 h-6 text-amber-600" />;
    default:
      return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankColor = (rank: string) => {
  switch (rank) {
    case 'Eco Champion':
      return 'bg-success text-success-foreground';
    case 'Green Driver':
      return 'bg-chart-1 text-white';
    case 'Eco Learner':
      return 'bg-primary text-primary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const DriverEcoLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Array<DriverEcoScore & { rank: number; driverName?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDriverLeaderboard(10);
        
        // Use mock data if no real data
        if (data.length === 0) {
          setLeaderboard([
            {
              id: '1',
              driver_id: 'driver1',
              rank: 1,
              driverName: 'Rajesh Kumar',
              overall_eco_score: 92,
              fuel_efficiency_score: 95,
              idling_score: 88,
              acceleration_score: 90,
              braking_score: 92,
              total_deliveries: 156,
              total_distance_km: 4520,
              total_fuel_liters: 380,
              total_co2_emitted_kg: 1018.4,
              avg_fuel_efficiency: 8.4,
              monthly_deliveries: 28,
              monthly_distance_km: 820,
              monthly_fuel_liters: 68,
              monthly_co2_emitted_kg: 182.24,
              eco_rank: 'Eco Champion',
              badges: ['Eco Star', 'Century Driver', 'Low Emission Hero'],
            },
            {
              id: '2',
              driver_id: 'driver2',
              rank: 2,
              driverName: 'Amit Singh',
              overall_eco_score: 85,
              fuel_efficiency_score: 88,
              idling_score: 82,
              acceleration_score: 85,
              braking_score: 84,
              total_deliveries: 134,
              total_distance_km: 3890,
              total_fuel_liters: 350,
              total_co2_emitted_kg: 938,
              avg_fuel_efficiency: 9.0,
              monthly_deliveries: 24,
              monthly_distance_km: 720,
              monthly_fuel_liters: 62,
              monthly_co2_emitted_kg: 166.16,
              eco_rank: 'Green Driver',
              badges: ['Century Driver'],
            },
            {
              id: '3',
              driver_id: 'driver3',
              rank: 3,
              driverName: 'Suresh Patel',
              overall_eco_score: 78,
              fuel_efficiency_score: 80,
              idling_score: 75,
              acceleration_score: 78,
              braking_score: 80,
              total_deliveries: 98,
              total_distance_km: 2850,
              total_fuel_liters: 285,
              total_co2_emitted_kg: 763.8,
              avg_fuel_efficiency: 10.0,
              monthly_deliveries: 18,
              monthly_distance_km: 540,
              monthly_fuel_liters: 52,
              monthly_co2_emitted_kg: 139.36,
              eco_rank: 'Green Driver',
              badges: [],
            },
            {
              id: '4',
              driver_id: 'driver4',
              rank: 4,
              driverName: 'Mohammed Ali',
              overall_eco_score: 72,
              fuel_efficiency_score: 75,
              idling_score: 68,
              acceleration_score: 72,
              braking_score: 74,
              total_deliveries: 87,
              total_distance_km: 2450,
              total_fuel_liters: 265,
              total_co2_emitted_kg: 710.2,
              avg_fuel_efficiency: 10.8,
              monthly_deliveries: 16,
              monthly_distance_km: 480,
              monthly_fuel_liters: 50,
              monthly_co2_emitted_kg: 134,
              eco_rank: 'Eco Learner',
              badges: [],
            },
            {
              id: '5',
              driver_id: 'driver5',
              rank: 5,
              driverName: 'Vikram Sharma',
              overall_eco_score: 65,
              fuel_efficiency_score: 68,
              idling_score: 62,
              acceleration_score: 65,
              braking_score: 66,
              total_deliveries: 72,
              total_distance_km: 2100,
              total_fuel_liters: 245,
              total_co2_emitted_kg: 656.6,
              avg_fuel_efficiency: 11.7,
              monthly_deliveries: 14,
              monthly_distance_km: 420,
              monthly_fuel_liters: 48,
              monthly_co2_emitted_kg: 128.64,
              eco_rank: 'Developing',
              badges: [],
            },
          ]);
        } else {
          setLeaderboard(data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <StatsGridSkeleton count={5} />;
  }

  const topDriver = leaderboard[0];

  return (
    <div className="space-y-6">
      {/* Top Driver Spotlight */}
      {topDriver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-4 border-yellow-500">
                    <AvatarFallback className="text-2xl bg-yellow-500/20 text-yellow-700">
                      {topDriver.driverName?.split(' ').map(n => n[0]).join('') ?? 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2">
                    <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500/30" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{topDriver.driverName}</h3>
                    <Badge className={getRankColor(topDriver.eco_rank)}>
                      {topDriver.eco_rank}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">Eco Champion of the Month</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-3xl font-bold text-yellow-600">
                      {topDriver.overall_eco_score}/100
                    </span>
                    <div className="flex gap-1">
                      {topDriver.badges.slice(0, 3).map((badge, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-success">{topDriver.total_deliveries}</p>
                    <p className="text-xs text-muted-foreground">Deliveries</p>
                  </div>
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{topDriver.total_co2_emitted_kg.toFixed(0)} kg</p>
                    <p className="text-xs text-muted-foreground">Total CO₂</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Driver Eco Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((driver, index) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    driver.rank <= 3 ? 'bg-muted/50' : 'bg-background'
                  }`}
                >
                  {/* Rank */}
                  <div className="shrink-0">
                    {getRankIcon(driver.rank)}
                  </div>

                  {/* Driver Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar>
                      <AvatarFallback className="text-sm">
                        {driver.driverName?.split(' ').map(n => n[0]).join('') ?? 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{driver.driverName}</p>
                      <Badge variant="outline" className={`text-xs ${getRankColor(driver.eco_rank)}`}>
                        {driver.eco_rank}
                      </Badge>
                    </div>
                  </div>

                  {/* Eco Score */}
                  <div className="hidden sm:block w-32">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Eco Score</span>
                      <span className="font-medium">{driver.overall_eco_score}</span>
                    </div>
                    <Progress 
                      value={driver.overall_eco_score} 
                      className="h-2"
                    />
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium">{driver.total_deliveries}</p>
                      <p className="text-xs text-muted-foreground">Trips</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{driver.avg_fuel_efficiency.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">L/100km</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-success">
                        {(driver.total_co2_emitted_kg / driver.total_distance_km).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">kg/km</p>
                    </div>
                  </div>

                  {/* Badges Count */}
                  <div className="shrink-0">
                    {driver.badges.length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Award className="w-3 h-3" />
                        {driver.badges.length}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Score Breakdown for Top Driver */}
      {topDriver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown - {topDriver.driverName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Fuel Efficiency', score: topDriver.fuel_efficiency_score, icon: Fuel, color: 'text-success' },
                  { label: 'Low Idling', score: topDriver.idling_score, icon: TrendingUp, color: 'text-primary' },
                  { label: 'Smooth Acceleration', score: topDriver.acceleration_score, icon: TrendingUp, color: 'text-chart-1' },
                  { label: 'Gentle Braking', score: topDriver.braking_score, icon: TrendingUp, color: 'text-chart-2' },
                ].map((item, index) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-bold">{item.score}</span>
                    </div>
                    <Progress value={item.score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DriverEcoLeaderboard;
