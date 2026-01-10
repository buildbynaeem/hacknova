import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  MapPin, 
  User, 
  Phone,
  Calendar,
  Navigation,
  History,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tables } from '@/integrations/supabase/types';

type Shipment = Tables<'shipments'>;

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PICKUP_READY: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  IN_TRANSIT: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  DELIVERED: 'bg-green-500/10 text-green-600 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4" />,
  CONFIRMED: <CheckCircle className="w-4 h-4" />,
  PICKUP_READY: <Package className="w-4 h-4" />,
  IN_TRANSIT: <Truck className="w-4 h-4" />,
  DELIVERED: <CheckCircle className="w-4 h-4" />,
  CANCELLED: <AlertCircle className="w-4 h-4" />,
};

const DeliveryCard: React.FC<{ shipment: Shipment }> = ({ shipment }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-sm">{shipment.tracking_id}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(shipment.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <Badge className={`${statusColors[shipment.status]} border`}>
            <span className="flex items-center gap-1">
              {statusIcons[shipment.status]}
              {shipment.status.replace('_', ' ')}
            </span>
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Pickup Details */}
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5">
              <MapPin className="w-3 h-3 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium truncate">{shipment.pickup_address}</p>
              <p className="text-xs text-muted-foreground">{shipment.pickup_city}, {shipment.pickup_pincode}</p>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center mt-0.5">
              <Navigation className="w-3 h-3 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Delivery</p>
              <p className="text-sm font-medium truncate">{shipment.delivery_address}</p>
              <p className="text-xs text-muted-foreground">{shipment.delivery_city}, {shipment.delivery_pincode}</p>
            </div>
          </div>

          {/* Receiver Info */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              {shipment.receiver_name}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              {shipment.receiver_phone}
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {shipment.package_type}
              </Badge>
              {shipment.weight && (
                <span className="text-xs text-muted-foreground">{shipment.weight} kg</span>
              )}
            </div>
            {shipment.estimated_cost && (
              <span className="text-sm font-semibold text-accent">
                ₹{shipment.estimated_cost.toFixed(0)}
              </span>
            )}
          </div>

          {/* Delivery timestamps */}
          {shipment.status === 'DELIVERED' && shipment.delivered_at && (
            <div className="flex items-center gap-2 pt-2 border-t border-border text-xs text-green-600">
              <CheckCircle className="w-3 h-3" />
              Delivered on {format(new Date(shipment.delivered_at), 'MMM dd, yyyy HH:mm')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DeliverySkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </CardContent>
  </Card>
);

export const ActiveDeliveriesPanel: React.FC = () => {
  const [deliveryTab, setDeliveryTab] = useState('active');

  const { data: activeDeliveries, isLoading: loadingActive } = useQuery({
    queryKey: ['active-deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .in('status', ['PENDING', 'CONFIRMED', 'PICKUP_READY', 'IN_TRANSIT'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Shipment[];
    },
  });

  const { data: deliveredShipments, isLoading: loadingDelivered } = useQuery({
    queryKey: ['delivered-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'DELIVERED')
        .order('delivered_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Shipment[];
    },
  });

  const pendingCount = activeDeliveries?.filter(d => d.status === 'PENDING' || d.status === 'CONFIRMED' || d.status === 'PICKUP_READY').length || 0;
  const inTransitCount = activeDeliveries?.filter(d => d.status === 'IN_TRANSIT').length || 0;
  const deliveredCount = deliveredShipments?.length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Pickup</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inTransitCount}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveredCount}</p>
                <p className="text-sm text-muted-foreground">Delivered (Recent)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            Deliveries Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={deliveryTab} onValueChange={setDeliveryTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Active ({(activeDeliveries?.length || 0)})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Delivered ({deliveredCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {loadingActive ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <DeliverySkeleton key={i} />
                  ))}
                </div>
              ) : activeDeliveries && activeDeliveries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeDeliveries.map((shipment) => (
                    <DeliveryCard key={shipment.id} shipment={shipment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Deliveries</h3>
                  <p className="text-muted-foreground">All deliveries have been completed</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {loadingDelivered ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <DeliverySkeleton key={i} />
                  ))}
                </div>
              ) : deliveredShipments && deliveredShipments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliveredShipments.map((shipment) => (
                    <DeliveryCard key={shipment.id} shipment={shipment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Delivery History</h3>
                  <p className="text-muted-foreground">Completed deliveries will appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
