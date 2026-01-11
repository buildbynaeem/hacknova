import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, MapPin, Truck, AlertTriangle, Sparkles, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ForecastMetrics {
  totalShipments: number;
  deliveredShipments: number;
  avgDistance: string;
  activeVehicles: number;
  totalFuelUsed: string;
  totalCO2: string;
  topCities: [string, number][];
  vehicleTypes: [string, number][];
}

interface ForecastData {
  forecast: string;
  metrics: ForecastMetrics;
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demand-forecast`;

const DemandForecast: React.FC = () => {
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchForecast = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 402) {
          toast.error('AI credits exhausted. Please add funds to continue.');
        } else {
          toast.error(errorData.error || 'Failed to generate forecast');
        }
        return;
      }

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      toast.success('Demand forecast generated successfully');
    } catch (error) {
      console.error('Forecast error:', error);
      toast.error('Failed to connect to AI service');
    } finally {
      setIsLoading(false);
    }
  };

  const formatForecast = (text: string) => {
    // Split by numbered sections or headers
    const sections = text.split(/(?=\d+\.\s+[A-Z]|\*\*[A-Z])/);
    return sections.map((section, index) => (
      <div key={index} className="mb-4">
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {section.trim()}
        </p>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    AI Demand Forecast
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      Powered by AI
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered insights for fleet expansion and optimization
                  </CardDescription>
                </div>
              </div>
              <Button 
                onClick={fetchForecast} 
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Generate Forecast
                  </>
                )}
              </Button>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Clock className="w-3 h-3" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </CardHeader>
        </Card>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Metrics Grid */}
      {data && !isLoading && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Shipments</p>
                    <p className="text-2xl font-bold">{data.metrics.totalShipments}</p>
                    <p className="text-xs text-muted-foreground">Analyzed period</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Distance</p>
                    <p className="text-2xl font-bold">{data.metrics.avgDistance} km</p>
                    <p className="text-xs text-muted-foreground">Per shipment</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Fleet</p>
                    <p className="text-2xl font-bold">{data.metrics.activeVehicles}</p>
                    <p className="text-xs text-muted-foreground">Vehicles</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">CO₂ Emitted</p>
                    <p className="text-2xl font-bold">{data.metrics.totalCO2} kg</p>
                    <p className="text-xs text-muted-foreground">Total emissions</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Cities & Vehicle Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 md:grid-cols-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Top Cities by Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.metrics.topCities.length > 0 ? (
                    data.metrics.topCities.map(([city, count], index) => (
                      <div key={city} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium">{city}</span>
                        </div>
                        <Badge variant="secondary">{count} shipments</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No city data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5 text-primary" />
                  Vehicle Type Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.metrics.vehicleTypes.length > 0 ? (
                    data.metrics.vehicleTypes.map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{type.replace('_', ' ')}</span>
                        <Badge variant="outline">{count} orders</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No vehicle data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI-Powered Expansion Insights
                </CardTitle>
                <CardDescription>
                  Strategic recommendations based on your fleet data analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {formatForecast(data.forecast)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Empty State */}
      {!data && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Brain className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Forecast Generated</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Click "Generate Forecast" to analyze your fleet data and get AI-powered insights 
                for demand prediction and expansion opportunities.
              </p>
              <Button onClick={fetchForecast} disabled={isLoading}>
                <Brain className="w-4 h-4 mr-2" />
                Generate Your First Forecast
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DemandForecast;
