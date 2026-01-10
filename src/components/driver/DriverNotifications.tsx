import React, { useState, useEffect } from 'react';
import { Bell, Package, Wrench, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'pickup' | 'pending' | 'maintenance';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  shipmentId?: string;
  data?: any;
}

const DriverNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    
    const notifs: Notification[] = [];

    // Fetch pickup orders assigned to this driver
    const { data: assignedPickups } = await supabase
      .from('shipments')
      .select('id, tracking_id, pickup_address, pickup_city, created_at, status')
      .eq('driver_id', user.id)
      .in('status', ['CONFIRMED', 'PICKUP_READY', 'IN_TRANSIT'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (assignedPickups) {
      assignedPickups.forEach((pickup) => {
        notifs.push({
          id: `pickup-${pickup.id}`,
          type: 'pickup',
          title: pickup.status === 'IN_TRANSIT' ? 'Active Delivery' : 'Assigned Pickup',
          message: `${pickup.status === 'IN_TRANSIT' ? 'Deliver to' : 'Pickup from'} ${pickup.pickup_city} - ${pickup.tracking_id}`,
          timestamp: new Date(pickup.created_at),
          read: false,
          shipmentId: pickup.id,
          data: pickup,
        });
      });
    }

    // Fetch pending/unassigned shipments available for pickup
    const { data: pendingPickups } = await supabase
      .from('shipments')
      .select('id, tracking_id, pickup_address, pickup_city, created_at, estimated_cost')
      .is('driver_id', null)
      .in('status', ['PENDING', 'CONFIRMED'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (pendingPickups) {
      pendingPickups.forEach((pickup) => {
        notifs.push({
          id: `pending-${pickup.id}`,
          type: 'pending',
          title: 'New Order Available',
          message: `Pickup from ${pickup.pickup_city} - ${pickup.tracking_id}${pickup.estimated_cost ? ` · ₹${pickup.estimated_cost}` : ''}`,
          timestamp: new Date(pickup.created_at),
          read: false,
          shipmentId: pickup.id,
          data: pickup,
        });
      });
    }

    // Fetch maintenance reminders for driver's assigned vehicle
    const { data: vehicle } = await supabase
      .from('fleet_vehicles')
      .select('id, vehicle_number, next_maintenance_date, last_maintenance_date')
      .eq('current_driver_id', user.id)
      .maybeSingle();

    if (vehicle?.next_maintenance_date) {
      const maintenanceDate = new Date(vehicle.next_maintenance_date);
      const today = new Date();
      const daysUntil = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 7) {
        notifs.push({
          id: `maintenance-${vehicle.id}`,
          type: 'maintenance',
          title: 'Maintenance Due',
          message: daysUntil <= 0 
            ? `Vehicle ${vehicle.vehicle_number} maintenance is overdue!`
            : `Vehicle ${vehicle.vehicle_number} maintenance due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
          timestamp: maintenanceDate,
          read: false,
          data: vehicle,
        });
      }
    }

    setNotifications(notifs);
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Set up real-time subscription for shipment changes
    const channel = supabase
      .channel('driver-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const acceptOrder = async (notification: Notification) => {
    if (!user || !notification.shipmentId) return;

    setAcceptingId(notification.id);

    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          driver_id: user.id,
          status: 'CONFIRMED',
        })
        .eq('id', notification.shipmentId)
        .is('driver_id', null); // Only update if still unassigned

      if (error) throw error;

      toast.success('Order accepted! Check your assigned pickups.');
      // Remove from notifications immediately
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      // Refetch to get updated data
      fetchNotifications();
    } catch (error: any) {
      console.error('Error accepting order:', error);
      if (error.message?.includes('0 rows')) {
        toast.error('Order already taken by another driver');
        fetchNotifications();
      } else {
        toast.error('Failed to accept order. Please try again.');
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingCount = notifications.filter((n) => n.type === 'pending').length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <h4 className="font-semibold">Notifications</h4>
            {pendingCount > 0 && (
              <p className="text-xs text-muted-foreground">{pendingCount} orders available</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 transition-colors relative ${
                    !notification.read ? 'bg-primary/5' : ''
                  } ${notification.type === 'pending' ? 'border-l-2 border-l-green-500' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'pending'
                          ? 'bg-green-100 text-green-600'
                          : notification.type === 'pickup'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {notification.type === 'maintenance' ? (
                        <Wrench className="w-4 h-4" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{notification.title}</p>
                          {notification.type === 'pending' && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 text-green-600 border-green-300 mt-0.5">
                              Available
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-5 h-5 -mt-1 -mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                      
                      {/* Accept button for pending orders */}
                      {notification.type === 'pending' && (
                        <Button
                          size="sm"
                          className="mt-2 w-full h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            acceptOrder(notification);
                          }}
                          disabled={acceptingId === notification.id}
                        >
                          {acceptingId === notification.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              Accept Order
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full absolute right-3 top-3" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default DriverNotifications;
