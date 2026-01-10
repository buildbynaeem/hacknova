import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Clock, 
  Search,
  Filter,
  Plus,
  LogOut,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import BookingDialog from '@/components/sender/BookingDialog';
import LiveTrackingPanel from '@/components/sender/LiveTrackingPanel';
import { 
  ShipmentListSkeleton, 
  DashboardHeaderSkeleton 
} from '@/components/dashboard/DashboardSkeletons';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeShipments } from '@/hooks/useRealtimeShipments';
import { createShipment, type CreateShipmentData } from '@/lib/shipment-service';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Shipment = Database['public']['Tables']['shipments']['Row'];

const SenderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Real-time shipments with live updates
  const handleLocationUpdate = useCallback((shipmentId: string, lat: number, lng: number) => {
    console.log(`📍 Live location update for ${shipmentId}: ${lat}, ${lng}`);
  }, []);

  const handleStatusChange = useCallback((shipment: Shipment) => {
    toast.info(`Shipment ${shipment.tracking_id} status: ${shipment.status}`, {
      icon: <Radio className="w-4 h-4 text-accent" />,
    });
  }, []);

  const { shipments, loading, refetch } = useRealtimeShipments({
    onLocationUpdate: handleLocationUpdate,
    onStatusChange: handleStatusChange,
  });

  const filteredShipments = shipments.filter(
    (s) =>
      s.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiver_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookingComplete = async (booking: any) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create a shipment');
      navigate('/auth');
      return;
    }

    const packageTypeMap: Record<string, CreateShipmentData['packageType']> = {
      documents: 'DOCUMENTS',
      parcel: 'PARCEL',
      box: 'PARCEL',
      pallet: 'HEAVY',
      fragile: 'FRAGILE',
    };

    const shipmentData: CreateShipmentData = {
      pickupAddress: booking.pickupAddress,
      pickupCity: booking.pickupCity,
      pickupPincode: booking.pickupPincode,
      pickupContactName: booking.pickupContactName,
      pickupContactPhone: booking.pickupContactPhone,
      pickupDate: booking.pickupDate,
      pickupTimeSlot: booking.pickupTimeSlot,
      deliveryAddress: booking.dropAddress,
      deliveryCity: booking.dropCity,
      deliveryPincode: booking.dropPincode,
      receiverName: booking.receiverName,
      receiverPhone: booking.receiverPhone,
      packageType: packageTypeMap[booking.packageType] || 'PARCEL',
      weight: parseFloat(booking.weight) || undefined,
      dimensions: booking.dimensions,
      description: booking.description,
      isFragile: booking.isFragile,
      estimatedCost: 50 + (parseFloat(booking.weight) || 1) * 15,
    };

    const { data: newShipment, error } = await createShipment(shipmentData);
    
    if (error) {
      toast.error(`Failed to create shipment: ${error}`);
    } else if (newShipment) {
      refetch(); // Refresh the shipments list
      toast.success('Shipment created successfully!');
    }
  };

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

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeaderSkeleton />
        <main className="container mx-auto p-4 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 h-10 bg-muted/50 rounded-md animate-pulse" />
              <div className="h-10 w-10 bg-muted/50 rounded-md animate-pulse" />
            </div>
            <ShipmentListSkeleton count={4} />
          </div>
          <div className="space-y-4">
            <Card className="animate-fade-in">
              <CardContent className="p-6">
                <div className="h-52 bg-muted/50 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Sender Dashboard</h1>
                  <p className="text-xs text-muted-foreground">
                    {isAuthenticated ? user?.email : 'Guest Mode'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button variant="accent" onClick={() => setBookingOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Shipment
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button variant="accent" onClick={() => navigate('/auth')}>
                  Sign In to Book
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 grid lg:grid-cols-3 gap-6">
        {/* Shipments List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by tracking ID or receiver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Loading State */}
          {loading ? (
            <ShipmentListSkeleton count={4} />
          ) : !isAuthenticated ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Sign in to view shipments</h3>
                <p className="text-muted-foreground mb-4">
                  Create an account or sign in to start booking and tracking shipments.
                </p>
                <Button variant="accent" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          ) : filteredShipments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No shipments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first shipment to get started.
                </p>
                <Button variant="accent" onClick={() => setBookingOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Shipment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredShipments.map((shipment, index) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`cursor-pointer hover:shadow-md transition-all ${
                      selectedShipmentId === shipment.id ? 'ring-2 ring-accent' : ''
                    }`}
                    onClick={() => setSelectedShipmentId(shipment.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono font-bold text-sm">{shipment.tracking_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(shipment.created_at)}
                          </p>
                        </div>
                        {getStatusBadge(shipment.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">From</p>
                          <p className="font-medium truncate">
                            {shipment.pickup_address}, {shipment.pickup_city}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">To</p>
                          <p className="font-medium truncate">
                            {shipment.delivery_address}, {shipment.delivery_city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span>{shipment.receiver_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-accent">
                          <Clock className="w-4 h-4" />
                          <span>
                            {shipment.status === 'DELIVERED' 
                              ? 'Delivered' 
                              : shipment.status === 'IN_TRANSIT'
                              ? 'In Transit'
                              : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Live Tracking Panel */}
        <div className="space-y-4">
          <LiveTrackingPanel selectedShipmentId={selectedShipmentId} />
        </div>
      </main>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onBookingComplete={handleBookingComplete}
      />
    </div>
  );
};

export default SenderDashboard;
