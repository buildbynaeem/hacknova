import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, User, Truck, UserPlus, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DriverWithProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  assigned_vehicle: {
    id: string;
    vehicle_number: string;
  } | null;
}

export function DriverManagement() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Get all drivers with their profiles and assigned vehicles
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers-with-vehicles'],
    queryFn: async () => {
      // Get all driver roles
      const { data: driverRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver');

      if (rolesError) throw rolesError;
      if (!driverRoles || driverRoles.length === 0) return [];

      const driverUserIds = driverRoles.map(r => r.user_id);

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, avatar_url')
        .in('user_id', driverUserIds);

      if (profilesError) throw profilesError;

      // Get vehicle assignments
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('fleet_vehicles')
        .select('id, vehicle_number, current_driver_id')
        .in('current_driver_id', driverUserIds);

      if (vehiclesError) throw vehiclesError;

      return driverUserIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const vehicle = vehicles?.find(v => v.current_driver_id === userId);
        
        return {
          user_id: userId,
          full_name: profile?.full_name || null,
          phone: profile?.phone || null,
          avatar_url: profile?.avatar_url || null,
          assigned_vehicle: vehicle ? { id: vehicle.id, vehicle_number: vehicle.vehicle_number } : null,
        } as DriverWithProfile;
      });
    },
  });

  const addDriverMutation = useMutation({
    mutationFn: async ({ email, fullName, phone }: { email: string; fullName: string; phone: string }) => {
      // Call edge function to add driver
      const { data, error } = await supabase.functions.invoke('add-driver', {
        body: { email, fullName, phone },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drivers-with-vehicles'] });
      toast.success(data?.message || 'Driver added successfully');
      resetForm();
      setIsAddOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to add driver: ' + (error as Error).message);
    },
  });

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPhone('');
  };

  const handleSubmit = () => {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    
    addDriverMutation.mutate({ email: email.trim(), fullName: fullName.trim(), phone: phone.trim() });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Drivers
            </CardTitle>
            <CardDescription>
              {drivers?.length || 0} registered drivers
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Driver</DialogTitle>
                <DialogDescription>
                  Enter the driver's email to invite them or add them to the system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="driverEmail">Email Address *</Label>
                  <Input
                    id="driverEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="driverName">Full Name</Label>
                  <Input
                    id="driverName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="driverPhone">Phone Number</Label>
                  <Input
                    id="driverPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={addDriverMutation.isPending}>
                  {addDriverMutation.isPending ? 'Adding...' : 'Add Driver'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {drivers && drivers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Assigned Vehicle</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{driver.full_name || 'Unnamed Driver'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {driver.phone ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {driver.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {driver.assigned_vehicle ? (
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{driver.assigned_vehicle.vehicle_number}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={driver.assigned_vehicle ? 'default' : 'secondary'}>
                      {driver.assigned_vehicle ? 'On Duty' : 'Available'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No drivers registered yet</p>
            <p className="text-sm">Add drivers to assign them to vehicles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
