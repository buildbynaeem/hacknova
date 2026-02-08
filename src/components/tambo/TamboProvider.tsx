import React, { useState, useEffect } from 'react';
import { TamboProvider as TamboSDKProvider, type InitialTamboThreadMessage, currentTimeContextHelper, currentPageContextHelper } from '@tambo-ai/react';
import { tamboComponents, FLEET_SYSTEM_PROMPT } from './TamboConfig';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TamboWrapperProps {
  children: React.ReactNode;
}

// Hook to fetch Tambo API key from edge function
const useTamboApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tambo-config`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Tambo configuration');
        }

        const data = await response.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          throw new Error('Tambo API key not configured');
        }
      } catch (err) {
        console.error('Error fetching Tambo API key:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  return { apiKey, loading, error };
};

// Fetch fleet context data for AI
const useFleetContext = () => {
  const { data: shipments } = useQuery({
    queryKey: ['tambo-shipments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('status, vehicle_type, estimated_cost, carbon_score')
        .limit(200);
      return data || [];
    },
    staleTime: 60000,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['tambo-vehicles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fleet_vehicles')
        .select('vehicle_type, is_active, fuel_type, lifetime_co2_kg, total_km_driven');
      return data || [];
    },
    staleTime: 60000,
  });

  const { data: fuelEntries } = useQuery({
    queryKey: ['tambo-fuel'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fuel_entries')
        .select('fuel_liters, fuel_type, co2_emitted_kg, trip_distance_km, entry_date')
        .order('entry_date', { ascending: false })
        .limit(100);
      return data || [];
    },
    staleTime: 60000,
  });

  // Aggregate data for context
  const statusCounts = shipments?.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const vehicleTypeCounts = vehicles?.reduce((acc, v) => {
    acc[v.vehicle_type] = (acc[v.vehicle_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalFuel = fuelEntries?.reduce((sum, e) => sum + (e.fuel_liters || 0), 0) || 0;
  const totalCO2 = fuelEntries?.reduce((sum, e) => sum + (e.co2_emitted_kg || 0), 0) || 0;
  const totalDistance = fuelEntries?.reduce((sum, e) => sum + (e.trip_distance_km || 0), 0) || 0;
  const activeVehicles = vehicles?.filter(v => v.is_active).length || 0;

  return `
CURRENT FLEET DATA:

Shipment Status Distribution:
${Object.entries(statusCounts).map(([status, count]) => `- ${status}: ${count}`).join('\n')}
Total Shipments: ${shipments?.length || 0}

Vehicle Fleet:
${Object.entries(vehicleTypeCounts).map(([type, count]) => `- ${type}: ${count}`).join('\n')}
Active Vehicles: ${activeVehicles}
Total Vehicles: ${vehicles?.length || 0}

Fuel & Emissions Summary:
- Total Fuel Consumed: ${Math.round(totalFuel)} liters
- Total CO2 Emitted: ${Math.round(totalCO2)} kg
- Total Distance Covered: ${Math.round(totalDistance)} km
- Average Fuel Efficiency: ${totalDistance > 0 ? (totalFuel / totalDistance * 100).toFixed(2) : 'N/A'} L/100km

Use this data to answer questions and generate appropriate visualizations.
`;
};

const TamboWrapper: React.FC<TamboWrapperProps> = ({ children }) => {
  const { apiKey, loading, error } = useTamboApiKey();
  const fleetContext = useFleetContext();

  // Create initial system message with context
  const systemContent = FLEET_SYSTEM_PROMPT + '\n\n' + fleetContext;
  const initialMessages: InitialTamboThreadMessage[] = [
    {
      role: 'assistant',
      content: [{ type: 'text', text: systemContent }],
    }
  ];

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading AI Assistant...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !apiKey) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-destructive font-medium">AI Assistant Unavailable</p>
          <p className="text-xs text-muted-foreground mt-1">{error || 'API key not configured'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TamboSDKProvider
      apiKey={apiKey}
      components={tamboComponents}
      initialMessages={initialMessages}
      contextHelpers={{
        currentTime: currentTimeContextHelper,
        currentPage: currentPageContextHelper,
      }}
    >
      {children}
    </TamboSDKProvider>
  );
};

export default TamboWrapper;
