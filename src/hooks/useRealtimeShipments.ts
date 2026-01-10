import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Shipment = Database['public']['Tables']['shipments']['Row'];

interface UseRealtimeShipmentsOptions {
  userId?: string;
  onLocationUpdate?: (shipmentId: string, lat: number, lng: number) => void;
  onStatusChange?: (shipment: Shipment) => void;
}

export function useRealtimeShipments(options: UseRealtimeShipmentsOptions = {}) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial shipments
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setShipments([]);
    } else {
      setShipments(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchShipments();

    // Set up real-time subscription
    const channel = supabase
      .channel('shipments-realtime')
      .on<Shipment>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        (payload: RealtimePostgresChangesPayload<Shipment>) => {
          const newRecord = payload.new as Shipment;
          const oldRecord = payload.old as Partial<Shipment>;

          switch (payload.eventType) {
            case 'INSERT':
              setShipments((prev) => [newRecord, ...prev]);
              break;

            case 'UPDATE':
              setShipments((prev) =>
                prev.map((s) => (s.id === newRecord.id ? newRecord : s))
              );

              // Check for location update
              if (
                newRecord.driver_lat !== null &&
                newRecord.driver_lng !== null &&
                (newRecord.driver_lat !== oldRecord.driver_lat ||
                  newRecord.driver_lng !== oldRecord.driver_lng)
              ) {
                options.onLocationUpdate?.(
                  newRecord.id,
                  newRecord.driver_lat,
                  newRecord.driver_lng
                );
              }

              // Check for status change
              if (newRecord.status !== oldRecord.status) {
                options.onStatusChange?.(newRecord);
              }
              break;

            case 'DELETE':
              if (oldRecord.id) {
                setShipments((prev) => prev.filter((s) => s.id !== oldRecord.id));
              }
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchShipments, options.onLocationUpdate, options.onStatusChange]);

  const refetch = useCallback(() => {
    fetchShipments();
  }, [fetchShipments]);

  return {
    shipments,
    loading,
    error,
    refetch,
  };
}

// Hook for tracking a single shipment in real-time
export function useRealtimeShipment(shipmentId: string | null) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!shipmentId) {
      setShipment(null);
      setLoading(false);
      return;
    }

    // Fetch initial shipment
    const fetchShipment = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .maybeSingle();

      if (!error && data) {
        setShipment(data);
        if (data.driver_lat && data.driver_lng) {
          setDriverLocation({ lat: data.driver_lat, lng: data.driver_lng });
        }
      }
      setLoading(false);
    };

    fetchShipment();

    // Subscribe to changes for this specific shipment
    const channel = supabase
      .channel(`shipment-${shipmentId}`)
      .on<Shipment>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: `id=eq.${shipmentId}`,
        },
        (payload) => {
          const updated = payload.new as Shipment;
          setShipment(updated);
          
          if (updated.driver_lat && updated.driver_lng) {
            setDriverLocation({ lat: updated.driver_lat, lng: updated.driver_lng });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  return {
    shipment,
    loading,
    driverLocation,
  };
}
