import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Truck, Bike, Car, Power, PowerOff, Eye } from 'lucide-react';
import { 
  getFleetVehicles, 
  addFleetVehicle, 
  updateFleetVehicle, 
  deleteFleetVehicle,
  FUEL_TYPES,
  type FleetVehicle 
} from '@/lib/fleet-service';
import { VEHICLE_LABELS, type VehicleType } from '@/lib/pricing-service';
import { VehicleDetailsDialog } from './VehicleDetailsDialog';
import { format } from 'date-fns';

const VEHICLE_TYPES: VehicleType[] = ['BIKE', 'THREE_WHEELER', 'MINI_TRUCK', 'TRUCK', 'LARGE_TRUCK'];

const VEHICLE_ICONS: Record<VehicleType, React.ReactNode> = {
  BIKE: <Bike className="h-4 w-4" />,
  THREE_WHEELER: <Car className="h-4 w-4" />,
  MINI_TRUCK: <Truck className="h-4 w-4" />,
  TRUCK: <Truck className="h-5 w-5" />,
  LARGE_TRUCK: <Truck className="h-6 w-6" />,
};

export function FleetManagement() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<FleetVehicle | null>(null);
  
  // Form state
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('MINI_TRUCK');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState('DIESEL');

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['fleet-vehicles'],
    queryFn: getFleetVehicles,
  });

  const addMutation = useMutation({
    mutationFn: addFleetVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
      toast.success('Vehicle added successfully');
      resetForm();
      setIsAddOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to add vehicle: ' + (error as Error).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FleetVehicle> }) =>
      updateFleetVehicle(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
      toast.success('Vehicle updated successfully');
      resetForm();
      setEditingVehicle(null);
    },
    onError: (error) => {
      toast.error('Failed to update vehicle: ' + (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFleetVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
      toast.success('Vehicle deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete vehicle: ' + (error as Error).message);
    },
  });

  const resetForm = () => {
    setVehicleNumber('');
    setVehicleType('MINI_TRUCK');
    setMake('');
    setModel('');
    setYear('');
    setFuelType('DIESEL');
  };

  const handleEdit = (vehicle: FleetVehicle) => {
    setEditingVehicle(vehicle);
    setVehicleNumber(vehicle.vehicle_number);
    setVehicleType(vehicle.vehicle_type);
    setMake(vehicle.make || '');
    setModel(vehicle.model || '');
    setYear(vehicle.year?.toString() || '');
    setFuelType(vehicle.fuel_type);
  };

  const handleSubmit = () => {
    if (!vehicleNumber.trim()) {
      toast.error('Vehicle number is required');
      return;
    }

    const vehicleData = {
      vehicle_number: vehicleNumber.toUpperCase().trim(),
      vehicle_type: vehicleType,
      make: make.trim() || null,
      model: model.trim() || null,
      year: year ? parseInt(year) : null,
      fuel_type: fuelType,
    };

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, updates: vehicleData });
    } else {
      addMutation.mutate(vehicleData as any);
    }
  };

  const toggleActive = (vehicle: FleetVehicle) => {
    updateMutation.mutate({
      id: vehicle.id,
      updates: { is_active: !vehicle.is_active },
    });
  };

  const activeCount = vehicles?.filter(v => v.is_active).length || 0;
  const totalCount = vehicles?.length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fleet Vehicles</CardTitle>
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
              <Truck className="h-5 w-5" />
              Fleet Vehicles
            </CardTitle>
            <CardDescription>
              {activeCount} active of {totalCount} vehicles
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
                <DialogDescription>
                  Enter the details of the new fleet vehicle
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                  <Input
                    id="vehicleNumber"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g., MH12AB1234"
                    className="uppercase"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Vehicle Type *</Label>
                  <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {VEHICLE_ICONS[type]}
                            {VEHICLE_LABELS[type]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="e.g., Tata"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g., Ace"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g., 2023"
                      min="2000"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fuel Type</Label>
                    <Select value={fuelType} onValueChange={setFuelType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map((fuel) => (
                          <SelectItem key={fuel} value={fuel}>
                            {fuel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Vehicle'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {vehicles && vehicles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-mono font-medium">
                    {vehicle.vehicle_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {VEHICLE_ICONS[vehicle.vehicle_type]}
                      <span className="text-sm">{VEHICLE_LABELS[vehicle.vehicle_type]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {vehicle.make || vehicle.model ? (
                      <span>{[vehicle.make, vehicle.model].filter(Boolean).join(' ')}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                    {vehicle.year && <span className="text-muted-foreground ml-1">({vehicle.year})</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{vehicle.fuel_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingVehicle(vehicle)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(vehicle)}
                        title={vehicle.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {vehicle.is_active ? (
                          <PowerOff className="h-4 w-4 text-destructive" />
                        ) : (
                          <Power className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Dialog open={editingVehicle?.id === vehicle.id} onOpenChange={(open) => !open && setEditingVehicle(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Vehicle</DialogTitle>
                            <DialogDescription>
                              Update the vehicle details
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="editVehicleNumber">Vehicle Number *</Label>
                              <Input
                                id="editVehicleNumber"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value)}
                                className="uppercase"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Vehicle Type *</Label>
                              <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {VEHICLE_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      <div className="flex items-center gap-2">
                                        {VEHICLE_ICONS[type]}
                                        {VEHICLE_LABELS[type]}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="editMake">Make</Label>
                                <Input
                                  id="editMake"
                                  value={make}
                                  onChange={(e) => setMake(e.target.value)}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="editModel">Model</Label>
                                <Input
                                  id="editModel"
                                  value={model}
                                  onChange={(e) => setModel(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="editYear">Year</Label>
                                <Input
                                  id="editYear"
                                  type="number"
                                  value={year}
                                  onChange={(e) => setYear(e.target.value)}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Fuel Type</Label>
                                <Select value={fuelType} onValueChange={setFuelType}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FUEL_TYPES.map((fuel) => (
                                      <SelectItem key={fuel} value={fuel}>
                                        {fuel}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setEditingVehicle(null); resetForm(); }}>
                              Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this vehicle?')) {
                            deleteMutation.mutate(vehicle.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vehicles in your fleet yet</p>
            <p className="text-sm">Click "Add Vehicle" to get started</p>
          </div>
        )}
      </CardContent>

      {/* Vehicle Details Dialog */}
      <VehicleDetailsDialog
        vehicle={viewingVehicle}
        open={!!viewingVehicle}
        onOpenChange={(open) => !open && setViewingVehicle(null)}
      />
    </Card>
  );
}
