import React, { useEffect, useState } from 'react';
import { TamboProvider as TamboSDKProvider } from '@tambo-ai/react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { tamboComponents, FLEET_SYSTEM_PROMPT } from './TamboConfig';
import { Loader2 } from 'lucide-react';

interface TamboWrapperProps {
  children: React.ReactNode;
}

const TamboWrapper: React.FC<TamboWrapperProps> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fleet data for context
  const { data: shipments } = useQuery({
    queryKey: ['tambo-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shipments').select('*').limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: vehicles } = useQuery({
    queryKey: ['tambo-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fleet_vehicles').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: fuelEntries } = useQuery({
    queryKey: ['tambo-fuel'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fuel_entries').select('*').limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch API key from edge function
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('tambo-config');
        if (error) throw error;
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setError('API key not found');
        }
      } catch (err) {
        console.error('Error fetching Tambo config:', err);
        setError('Failed to load Tambo configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // Build context helpers from fleet data
  const buildContextHelpers = () => {
    const statusCounts = shipments?.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const vehicleTypeCounts = vehicles?.reduce((acc, v) => {
      acc[v.vehicle_type] = (acc[v.vehicle_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const totalFuel = fuelEntries?.reduce((sum, f) => sum + (f.fuel_liters || 0), 0) || 0;
    const totalCO2 = fuelEntries?.reduce((sum, f) => sum + (f.co2_emitted_kg || 0), 0) || 0;

    const fleetContext = `
${FLEET_SYSTEM_PROMPT}

Current Fleet Data Context:

SHIPMENT STATUS BREAKDOWN:
${Object.entries(statusCounts).map(([status, count]) => `- ${status}: ${count} shipments`).join('\n')}
Total Shipments: ${shipments?.length || 0}

VEHICLE FLEET BREAKDOWN:
${Object.entries(vehicleTypeCounts).map(([type, count]) => `- ${type}: ${count} vehicles`).join('\n')}
Total Vehicles: ${vehicles?.length || 0}
Active Vehicles: ${vehicles?.filter(v => v.is_active).length || 0}

FUEL & EMISSIONS:
- Total Fuel Consumed: ${totalFuel.toFixed(2)} liters
- Total CO2 Emitted: ${totalCO2.toFixed(2)} kg

Use this data to create accurate visualizations when requested.
    `;

    return {
      fleetData: () => fleetContext
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !apiKey) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        <p>{error || 'Tambo AI is not configured'}</p>
      </div>
    );
  }

  return (
    <TamboSDKProvider
      apiKey={apiKey}
      components={tamboComponents}
      contextHelpers={buildContextHelpers()}
    >
      {children}
    </TamboSDKProvider>
  );
};

export default TamboWrapper;
