import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  AlertTriangle, 
  Trophy, 
  TrendingDown, 
  TrendingUp,
  Zap,
  Route,
  ChevronRight,
  Leaf
} from 'lucide-react';
import { getEmissionInsights, EmissionInsight } from '@/lib/emissions-service';
import { StatsGridSkeleton } from '@/components/dashboard/DashboardSkeletons';

const getInsightIcon = (iconName: string) => {
  switch (iconName) {
    case 'AlertTriangle':
      return AlertTriangle;
    case 'Zap':
      return Zap;
    case 'Route':
      return Route;
    case 'Trophy':
      return Trophy;
    case 'TrendingDown':
      return TrendingDown;
    case 'TrendingUp':
      return TrendingUp;
    default:
      return Lightbulb;
  }
};

const getInsightStyle = (type: EmissionInsight['type']) => {
  switch (type) {
    case 'warning':
      return {
        bg: 'bg-destructive/10',
        border: 'border-destructive/30',
        iconBg: 'bg-destructive/20',
        iconColor: 'text-destructive',
        badge: 'bg-destructive/20 text-destructive',
      };
    case 'suggestion':
      return {
        bg: 'bg-primary/10',
        border: 'border-primary/30',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        badge: 'bg-primary/20 text-primary',
      };
    case 'achievement':
      return {
        bg: 'bg-success/10',
        border: 'border-success/30',
        iconBg: 'bg-success/20',
        iconColor: 'text-success',
        badge: 'bg-success/20 text-success',
      };
    default:
      return {
        bg: 'bg-muted/50',
        border: 'border-border',
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
      };
  }
};

const EmissionInsights: React.FC = () => {
  const [insights, setInsights] = useState<EmissionInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getEmissionInsights();
        
        // Use mock data if no real data
        if (data.length === 0) {
          setInsights([
            {
              id: 'high-emission-vehicles',
              type: 'warning',
              title: '2 vehicles have high emissions',
              description: 'Vehicles MH-12-CD-5678, MH-12-IJ-7890 are emitting above average CO₂. Consider maintenance or route optimization.',
              potentialSavings: 245.5,
              icon: 'AlertTriangle',
            },
            {
              id: 'ev-opportunity',
              type: 'suggestion',
              title: 'EV fleet transition opportunity',
              description: 'Switching 5 diesel vehicles to electric could save 2,450 kg CO₂. Consider EV alternatives for short-distance routes.',
              potentialSavings: 2450,
              icon: 'Zap',
            },
            {
              id: 'route-optimization',
              type: 'suggestion',
              title: 'Route optimization can reduce emissions',
              description: 'Optimizing delivery routes could reduce emissions by up to 380 kg CO₂ (15% reduction).',
              potentialSavings: 380,
              icon: 'Route',
            },
            {
              id: 'top-driver',
              type: 'achievement',
              title: 'Rajesh Kumar is your eco champion!',
              description: 'With an eco-score of 92/100, they\'re setting the standard for sustainable driving.',
              icon: 'Trophy',
            },
            {
              id: 'monthly-improvement',
              type: 'achievement',
              title: 'Emissions down 8.5% this month!',
              description: 'Great progress on reducing your fleet\'s carbon footprint. Keep up the sustainable practices!',
              icon: 'TrendingDown',
            },
          ]);
        } else {
          setInsights(data);
        }
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <StatsGridSkeleton count={4} />;
  }

  const warnings = insights.filter(i => i.type === 'warning');
  const suggestions = insights.filter(i => i.type === 'suggestion');
  const achievements = insights.filter(i => i.type === 'achievement');

  const totalPotentialSavings = insights.reduce((sum, i) => sum + (i.potentialSavings ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-chart-1/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Emission Intelligence</h2>
                <p className="text-muted-foreground">
                  AI-powered insights to reduce your carbon footprint
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-success">
                  {totalPotentialSavings.toLocaleString()} kg
                </p>
                <p className="text-sm text-muted-foreground">Potential CO₂ Savings</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                {warnings.length} Warnings
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Lightbulb className="w-3 h-3 text-primary" />
                {suggestions.length} Suggestions
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Trophy className="w-3 h-3 text-success" />
                {achievements.length} Achievements
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Attention Required
          </h3>
          {warnings.map((insight, index) => {
            const Icon = getInsightIcon(insight.icon);
            const style = getInsightStyle(insight.type);
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`${style.bg} ${style.border}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${style.iconBg} shrink-0`}>
                        <Icon className={`w-5 h-5 ${style.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        {insight.potentialSavings && (
                          <Badge className={`mt-2 ${style.badge}`}>
                            <Leaf className="w-3 h-3 mr-1" />
                            Save {insight.potentialSavings.toFixed(0)} kg CO₂
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Smart Suggestions
          </h3>
          {suggestions.map((insight, index) => {
            const Icon = getInsightIcon(insight.icon);
            const style = getInsightStyle(insight.type);
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (warnings.length + index) * 0.05 }}
              >
                <Card className={`${style.bg} ${style.border}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${style.iconBg} shrink-0`}>
                        <Icon className={`w-5 h-5 ${style.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        {insight.potentialSavings && (
                          <Badge className={`mt-2 ${style.badge}`}>
                            <Leaf className="w-3 h-3 mr-1" />
                            Save {insight.potentialSavings.toFixed(0)} kg CO₂
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-success" />
            Achievements
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {achievements.map((insight, index) => {
              const Icon = getInsightIcon(insight.icon);
              const style = getInsightStyle(insight.type);
              
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (warnings.length + suggestions.length + index) * 0.05 }}
                >
                  <Card className={`${style.bg} ${style.border} h-full`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${style.iconBg} shrink-0`}>
                          <Icon className={`w-5 h-5 ${style.iconColor}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Route className="w-5 h-5 text-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Optimize Routes</p>
                    <p className="text-xs text-muted-foreground">Reduce 15% emissions</p>
                  </div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">EV Assessment</p>
                    <p className="text-xs text-muted-foreground">Plan fleet transition</p>
                  </div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-chart-1/10 rounded-lg">
                    <Trophy className="w-5 h-5 text-chart-1" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Driver Training</p>
                    <p className="text-xs text-muted-foreground">Eco-driving program</p>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmissionInsights;
