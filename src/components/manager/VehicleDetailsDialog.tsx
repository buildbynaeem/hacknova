import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, User, Fuel, Calendar, Package, IndianRupee, Wrench, Route, Bike, Car, UserPlus, X } from 'lucide-react';
import { FleetVehicle, updateFleetVehicle } from '@/lib/fleet-service';
import { VEHICLE_LABELS, type VehicleType } from '@/lib/pricing-service';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface VehicleDetailsDialogProps {
  vehicle: FleetVehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VEHICLE_ICONS: Record<VehicleType, React.ReactNode> = {
  BIKE: <Bike className="h-6 w-6" />,
  THREE_WHEELER: <Car className="h-6 w-6" />,
  MINI_TRUCK: <Truck className="h-6 w-6" />,
  TRUCK: <Truck className="h-7 w-7" />,
  LARGE_TRUCK: <Truck className="h-8 w-8" />,
};

export function VehicleDetailsDialog({ vehicle, open, onOpenChange }: VehicleDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const { data: driverInfo } = useQuery({
    queryKey: ['vehicle-driver', vehicle?.current_driver_id],
    queryFn: async () => {
      if (!vehicle?.current_driver_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', vehicle.current_driver_id)
        .maybeSingle();
      return data;
    },
    enabled: !!vehicle?.current_driver_id,
  });

  // Get available drivers for assignment
  const { data: availableDrivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => {
      // Get all driver roles
      const { data: driverRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver');

      if (rolesError || !driverRoles) return [];

      const driverUserIds = driverRoles.map(r => r.user_id);

      // Get profiles for drivers
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', driverUserIds);

      return profiles || [];
    },
    enabled: isAssigning,
  });

  const assignDriverMutation = useMutation({
    mutationFn: async (driverId: string | null) => {
      if (!vehicle) throw new Error('No vehicle selected');
      
      // If assigning a new driver, first unassign from any other vehicle
      if (driverId) {
        await supabase
          .from('fleet_vehicles')
          .update({ current_driver_id: null })
          .eq('current_driver_id', driverId);
      }
      
      return updateFleetVehicle(vehicle.id, { current_driver_id: driverId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-driver'] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-vehicles'] });
      toast.success(selectedDriverId ? 'Driver assigned successfully' : 'Driver unassigned');
      setIsAssigning(false);
      setSelectedDriverId('');
    },
    onError: (error) => {
      toast.error('Failed to assign driver: ' + (error as Error).message);
    },
  });

  const { data: deliveryStats } = useQuery({
    queryKey: ['vehicle-deliveries', vehicle?.id],
    queryFn: async () => {
      // For now, return mock data since we don't have vehicle_id on shipments yet
      // In production, you'd query shipments where vehicle_id = vehicle.id
      return {
        totalDeliveries: Math.floor(Math.random() * 500) + 50,
        thisMonth: Math.floor(Math.random() * 30) + 5,
        totalDistance: vehicle?.total_km_driven || Math.floor(Math.random() * 10000) + 1000,
      };
    },
    enabled: !!vehicle,
  });

  // Calculate estimated running costs
  const calculateRunningCosts = () => {
    if (!vehicle) return null;
    
    const totalKm = vehicle.total_km_driven || deliveryStats?.totalDistance || 0;
    const fuelCostPerKm = vehicle.fuel_type === 'DIESEL' ? 4.5 : 
                          vehicle.fuel_type === 'PETROL' ? 5.2 :
                          vehicle.fuel_type === 'CNG' ? 2.8 :
                          vehicle.fuel_type === 'ELECTRIC' ? 1.2 : 4.0;
    
    const maintenanceCostPerKm = 0.8;
    const insuranceMonthly = 2500;
    const depreciationMonthly = 5000;
    
    return {
      fuelCost: totalKm * fuelCostPerKm,
      maintenanceCost: totalKm * maintenanceCostPerKm,
      insuranceMonthly,
      depreciationMonthly,
      totalRunningCost: (totalKm * fuelCostPerKm) + (totalKm * maintenanceCostPerKm),
      costPerKm: fuelCostPerKm + maintenanceCostPerKm,
    };
  };

  const costs = calculateRunningCosts();

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {VEHICLE_ICONS[vehicle.vehicle_type]}
            </div>
            <div>
              <span className="font-mono text-xl">{vehicle.vehicle_number}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {VEHICLE_LABELS[vehicle.vehicle_type]} 
                {vehicle.make && vehicle.model && ` • ${vehicle.make} ${vehicle.model}`}
                {vehicle.year && ` (${vehicle.year})`}
              </p>
            </div>
            <Badge variant={vehicle.is_active ? 'default' : 'secondary'} className="ml-auto">
              {vehicle.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Driver Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned Driver
              </div>
              {!isAssigning && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAssigning(true)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  {vehicle.current_driver_id ? 'Change' : 'Assign'}
                </Button>
              )}
            </h3>
            
            {isAssigning ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Select Driver</Label>
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a driver..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers && availableDrivers.length > 0 ? (
                          availableDrivers.map((driver) => (
                            <SelectItem key={driver.user_id} value={driver.user_id}>
                              {driver.full_name || 'Unnamed'} {driver.phone ? `(${driver.phone})` : ''}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No drivers available. Add drivers first.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setIsAssigning(false); setSelectedDriverId(''); }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => assignDriverMutation.mutate(selectedDriverId || null)}
                      disabled={!selectedDriverId || assignDriverMutation.isPending}
                    >
                      {assignDriverMutation.isPending ? 'Assigning...' : 'Assign Driver'}
                    </Button>
                    {vehicle.current_driver_id && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => assignDriverMutation.mutate(null)}
                        disabled={assignDriverMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Unassign
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : vehicle.current_driver_id ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{driverInfo?.full_name || 'Loading...'}</p>
                      <p className="text-sm text-muted-foreground">{driverInfo?.phone || 'No phone'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No driver assigned</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Delivery Stats */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Delivery Statistics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{deliveryStats?.totalDeliveries || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Deliveries</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{deliveryStats?.thisMonth || 0}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {((deliveryStats?.totalDistance || 0) / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-muted-foreground">Total KM</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Running Costs */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Running Costs
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Fuel Cost</span>
                  </div>
                  <p className="text-xl font-bold">₹{costs?.fuelCost.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.fuel_type}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Maintenance</span>
                  </div>
                  <p className="text-xl font-bold">₹{costs?.maintenanceCost.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Estimated</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Cost per KM</span>
                  </div>
                  <p className="text-xl font-bold">₹{costs?.costPerKm.toFixed(2) || 0}</p>
                  <p className="text-xs text-muted-foreground">Fuel + Maintenance</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Total Running Cost</span>
                  </div>
                  <p className="text-xl font-bold text-primary">₹{costs?.totalRunningCost.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Maintenance Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Last Service</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {vehicle.last_maintenance_date 
                      ? format(new Date(vehicle.last_maintenance_date), 'dd MMM yyyy')
                      : 'Not recorded'}
                  </p>
                </CardContent>
              </Card>
              <Card className={!vehicle.next_maintenance_date ? '' : 
                new Date(vehicle.next_maintenance_date) < new Date() ? 'border-destructive' : 
                new Date(vehicle.next_maintenance_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'border-yellow-500' : ''
              }>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Next Service</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {vehicle.next_maintenance_date 
                      ? format(new Date(vehicle.next_maintenance_date), 'dd MMM yyyy')
                      : 'Not scheduled'}
                  </p>
                  {vehicle.next_maintenance_date && new Date(vehicle.next_maintenance_date) < new Date() && (
                    <Badge variant="destructive" className="mt-1">Overdue</Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Vehicle Info Footer */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Added:</span> {format(new Date(vehicle.created_at), 'dd MMM yyyy')}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {format(new Date(vehicle.updated_at), 'dd MMM yyyy')}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
