import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Truck, 
  Phone, 
  FileText, 
  Package, 
  Eye,
  Navigation,
  Clock,
  Leaf
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealtimeShipment } from '@/hooks/useRealtimeShipments';
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

  return (
    <Card>
      <CardHeader className="pb-3">
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
              {/* Map with live driver position */}
              <div className="map-container h-48 relative rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto text-accent mb-2" />
                    <p className="text-sm text-muted-foreground">Live map view</p>
                  </div>
                </div>
                
                {/* Delivery destination marker */}
                <div className="absolute right-4 top-4">
                  <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center shadow-md">
                    <MapPin className="w-4 h-4 text-success-foreground" />
                  </div>
                </div>

                {/* Live driver position */}
                {shipment.status === 'IN_TRANSIT' && (
                  <motion.div 
                    className="absolute"
                    initial={{ left: '20%', top: '50%' }}
                    animate={{ 
                      left: driverLocation ? `${30 + Math.random() * 20}%` : '25%',
                      top: '50%'
                    }}
                    transition={{ 
                      duration: 2,
                      ease: 'easeInOut'
                    }}
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-accent rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                      <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-lg relative z-10">
                        <Truck className="w-5 h-5 text-accent-foreground" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Live coordinates display */}
                {driverLocation && shipment.status === 'IN_TRANSIT' && (
                  <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-accent" />
                    <span className="font-mono">
                      {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

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
                      Driver location updates in real-time
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
