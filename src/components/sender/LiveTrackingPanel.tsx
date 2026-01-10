import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  FileText, 
  Package, 
  Eye,
  Clock,
  Leaf,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealtimeShipment } from '@/hooks/useRealtimeShipments';
import ShipmentMap from '@/components/map/ShipmentMap';
import type { Database } from '@/integrations/supabase/types';

type Shipment = Database['public']['Tables']['shipments']['Row'];

interface LiveTrackingPanelProps {
  selectedShipmentId: string | null;
  onClose?: () => void;
}

const LiveTrackingPanel: React.FC<LiveTrackingPanelProps> = ({ 
  selectedShipmentId,
}) => {
  const { shipment, driverLocation, loading } = useRealtimeShipment(selectedShipmentId);
  const [showRouteComparison, setShowRouteComparison] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<'eco' | 'standard' | 'fast'>('eco');

  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending">Pending</Badge>;
      case 'CONFIRMED':
        return <Badge variant="pickup">Confirmed</Badge>;
      case 'PICKUP_READY':
        return <Badge variant="pickup">Ready for Pickup</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="transit">In Transit</Badge>;
      case 'DELIVERED':
        return <Badge variant="delivered">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Generate mock positions based on shipment data for demo
  const mapPositions = useMemo(() => {
    if (!shipment) return { pickup: null, delivery: null, driver: null };
    
    // Mumbai area coordinates for demo
    const basePickup = { lat: 19.076 + Math.random() * 0.05, lng: 72.877 + Math.random() * 0.05 };
    const baseDelivery = { lat: 19.12 + Math.random() * 0.05, lng: 72.85 + Math.random() * 0.05 };
    
    // Use actual coordinates if available, otherwise use mock
    const pickup = shipment.pickup_lat && shipment.pickup_lng 
      ? { lat: shipment.pickup_lat, lng: shipment.pickup_lng }
      : basePickup;
      
    const delivery = shipment.delivery_lat && shipment.delivery_lng
      ? { lat: shipment.delivery_lat, lng: shipment.delivery_lng }
      : baseDelivery;

    // Driver position - between pickup and delivery based on status
    let driver = null;
    if (shipment.status === 'IN_TRANSIT') {
      if (driverLocation) {
        driver = driverLocation;
      } else if (shipment.driver_lat && shipment.driver_lng) {
        driver = { lat: shipment.driver_lat, lng: shipment.driver_lng };
      } else {
        // Mock driver position between pickup and delivery
        const progress = 0.3 + Math.random() * 0.4;
        driver = {
          lat: pickup.lat + (delivery.lat - pickup.lat) * progress,
          lng: pickup.lng + (delivery.lng - pickup.lng) * progress,
        };
      }
    } else if (shipment.status === 'DELIVERED') {
      driver = delivery;
    }

    return { pickup, delivery, driver };
  }, [shipment, driverLocation]);

  const handleRouteSelect = (routeId: 'eco' | 'standard' | 'fast') => {
    setSelectedRoute(routeId);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" />
            Live Tracking
            {shipment?.status === 'IN_TRANSIT' && (
              <span className="relative flex h-2 w-2 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
            )}
          </CardTitle>
          {shipment && (shipment.status === 'PENDING' || shipment.status === 'CONFIRMED') && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 h-7"
              onClick={() => setShowRouteComparison(!showRouteComparison)}
            >
              {showRouteComparison ? (
                <ToggleRight className="w-4 h-4 text-accent" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              Compare Routes
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : shipment ? (
            <motion.div
              key={shipment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Interactive Map with Leaflet */}
              <ShipmentMap
                className={showRouteComparison ? "h-72" : "h-52"}
                driverPosition={mapPositions.driver}
                pickupPosition={mapPositions.pickup}
                deliveryPosition={mapPositions.delivery}
                pickupAddress={`${shipment.pickup_address}, ${shipment.pickup_city}`}
                deliveryAddress={`${shipment.delivery_address}, ${shipment.delivery_city}`}
                driverName="Driver"
                showRoute={true}
                showRouteOptimization={true}
                showRouteComparison={showRouteComparison}
                isLive={shipment.status === 'IN_TRANSIT'}
                onRouteSelect={handleRouteSelect}
              />

              {/* Route selection feedback */}
              {showRouteComparison && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-muted/50 rounded-lg p-3"
                >
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {selectedRoute === 'eco' ? 'Eco-Friendly' : selectedRoute === 'fast' ? 'Express' : 'Standard'}
                    </span>
                    {' '}route selected. 
                    {selectedRoute === 'eco' && ' Optimized for lowest carbon emissions.'}
                    {selectedRoute === 'fast' && ' Fastest delivery time with highway routes.'}
                    {selectedRoute === 'standard' && ' Balanced between time and cost.'}
                  </p>
                </motion.div>
              )}

              {/* Shipment Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(shipment.status)}
                    {shipment.status === 'IN_TRANSIT' && (
                      <span className="text-xs text-success animate-pulse">● Live</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tracking ID</span>
                  <span className="font-mono text-sm">{shipment.tracking_id}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Receiver</span>
                  <span className="font-medium">{shipment.receiver_name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Destination</span>
                  <span className="text-sm text-right max-w-[60%] truncate">
                    {shipment.delivery_city}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated Cost</span>
                  <span className="font-medium">₹{shipment.estimated_cost ?? '-'}</span>
                </div>
                
                {shipment.carbon_score && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Leaf className="w-3 h-3" />
                      Carbon Saved
                    </span>
                    <span className="font-medium text-success">
                      {shipment.carbon_score.toFixed(2)} kg CO₂
                    </span>
                  </div>
                )}

                {shipment.status === 'IN_TRANSIT' && (
                  <div className="bg-transit/10 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 text-transit">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Package in transit</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Driver location updates in real-time on the map
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                  <Phone className="w-4 h-4" />
                  Contact
                </Button>
                {shipment.status === 'DELIVERED' && (
                  <Button variant="accent" className="flex-1 gap-2" size="sm">
                    <FileText className="w-4 h-4" />
                    Invoice
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Select a shipment to track</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default LiveTrackingPanel;
