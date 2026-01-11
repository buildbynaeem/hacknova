import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Pencil, History, Truck, Bike, Car, Leaf, Zap, Route } from 'lucide-react';
import { 
  getActivePricing, 
  updatePricing, 
  getPricingHistory,
  VEHICLE_LABELS, 
  ROUTE_TYPE_LABELS,
  ROUTE_TYPE_COLORS,
  type VehicleType,
  type RouteType,
  type PricingConfig 
} from '@/lib/pricing-service';
import { format } from 'date-fns';

const VEHICLE_ICONS: Record<VehicleType, React.ReactNode> = {
  BIKE: <Bike className="h-5 w-5" />,
  THREE_WHEELER: <Car className="h-5 w-5" />,
  MINI_TRUCK: <Truck className="h-5 w-5" />,
  TRUCK: <Truck className="h-6 w-6" />,
  LARGE_TRUCK: <Truck className="h-7 w-7" />,
};

const ROUTE_TYPE_ICONS: Record<RouteType, React.ReactNode> = {
  eco: <Leaf className="h-4 w-4" />,
  standard: <Route className="h-4 w-4" />,
  express: <Zap className="h-4 w-4" />,
};

const ROUTE_TYPES: RouteType[] = ['eco', 'standard', 'express'];
const VEHICLE_TYPES: VehicleType[] = ['BIKE', 'THREE_WHEELER', 'MINI_TRUCK', 'TRUCK', 'LARGE_TRUCK'];

export function PricingManagement() {
  const queryClient = useQueryClient();
  const [activeRouteTab, setActiveRouteTab] = useState<RouteType>('standard');
  const [editingConfig, setEditingConfig] = useState<{ vehicleType: VehicleType; routeType: RouteType } | null>(null);
  const [historyConfig, setHistoryConfig] = useState<{ vehicleType: VehicleType; routeType: RouteType } | null>(null);
  const [costPerKm, setCostPerKm] = useState('');
  const [baseFare, setBaseFare] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');

  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: getActivePricing,
  });

  const { data: history } = useQuery({
    queryKey: ['pricing-history', historyConfig?.vehicleType, historyConfig?.routeType],
    queryFn: () => historyConfig ? getPricingHistory(historyConfig.vehicleType, historyConfig.routeType) : Promise.resolve([]),
    enabled: !!historyConfig,
  });

  const updateMutation = useMutation({
    mutationFn: ({ vehicleType, routeType, costPerKm, baseFare, minWeight, maxWeight }: { 
      vehicleType: VehicleType; 
      routeType: RouteType;
      costPerKm: number; 
      baseFare: number;
      minWeight: number;
      maxWeight: number;
    }) =>
      updatePricing(vehicleType, routeType, costPerKm, baseFare, minWeight, maxWeight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
      toast.success('Pricing updated successfully');
      setEditingConfig(null);
      setCostPerKm('');
      setBaseFare('');
      setMinWeight('');
      setMaxWeight('');
    },
    onError: (error) => {
      toast.error('Failed to update pricing: ' + (error as Error).message);
    },
  });

  const handleEdit = (config: PricingConfig) => {
    setEditingConfig({ vehicleType: config.vehicle_type, routeType: config.route_type });
    setCostPerKm(config.cost_per_km.toString());
    setBaseFare(config.base_fare.toString());
    setMinWeight(config.min_weight.toString());
    setMaxWeight(config.max_weight.toString());
  };

  const handleCreateNew = (vehicleType: VehicleType, routeType: RouteType) => {
    setEditingConfig({ vehicleType, routeType });
    setCostPerKm('');
    setBaseFare('50');
    setMinWeight('0');
    setMaxWeight('20');
  };

  const handleSave = () => {
    if (!editingConfig || !costPerKm || !baseFare || !maxWeight) return;
    updateMutation.mutate({
      vehicleType: editingConfig.vehicleType,
      routeType: editingConfig.routeType,
      costPerKm: parseFloat(costPerKm),
      baseFare: parseFloat(baseFare),
      minWeight: parseFloat(minWeight || '0'),
      maxWeight: parseFloat(maxWeight),
    });
  };

  const getPricingForVehicleAndRoute = (vehicleType: VehicleType, routeType: RouteType) => {
    return pricing?.find(p => p.vehicle_type === vehicleType && p.route_type === routeType);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Vehicle Pricing Configuration
        </CardTitle>
        <CardDescription>
          Set per-kilometer rates and base fares for each vehicle type and route option
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeRouteTab} onValueChange={(v) => setActiveRouteTab(v as RouteType)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {ROUTE_TYPES.map((routeType) => {
              const colors = ROUTE_TYPE_COLORS[routeType];
              return (
                <TabsTrigger 
                  key={routeType} 
                  value={routeType}
                  className="flex items-center gap-2"
                >
                  {ROUTE_TYPE_ICONS[routeType]}
                  {ROUTE_TYPE_LABELS[routeType]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ROUTE_TYPES.map((routeType) => (
            <TabsContent key={routeType} value={routeType}>
              <div className="grid gap-4">
                {VEHICLE_TYPES.map((vehicleType) => {
                  const config = getPricingForVehicleAndRoute(vehicleType, routeType);
                  const colors = ROUTE_TYPE_COLORS[routeType];
                  
                  return (
                    <div
                      key={vehicleType}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          {VEHICLE_ICONS[vehicleType]}
                        </div>
                        <div>
                          <h4 className="font-medium">{VEHICLE_LABELS[vehicleType]}</h4>
                          <p className="text-sm text-muted-foreground">
                            {config ? `${config.min_weight}kg - ${config.max_weight}kg capacity` : 'Not configured'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {config ? (
                          <>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-primary">
                                ₹{config.cost_per_km}/km
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Base: ₹{config.base_fare}
                              </p>
                            </div>
                            
                            <Badge variant="outline" className={`text-xs ${colors.bg} ${colors.text} ${colors.border}`}>
                              {ROUTE_TYPE_LABELS[routeType]}
                            </Badge>
                            
                            <Badge variant="outline" className="text-xs">
                              From {format(new Date(config.effective_from), 'dd MMM yyyy')}
                            </Badge>
                            
                            <div className="flex gap-2">
                              <Dialog 
                                open={editingConfig?.vehicleType === vehicleType && editingConfig?.routeType === routeType} 
                                onOpenChange={(open) => !open && setEditingConfig(null)}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => handleEdit(config)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      Update {VEHICLE_LABELS[vehicleType]} - 
                                      <span className={`flex items-center gap-1 ${colors.text}`}>
                                        {ROUTE_TYPE_ICONS[routeType]}
                                        {ROUTE_TYPE_LABELS[routeType]}
                                      </span>
                                    </DialogTitle>
                                    <DialogDescription>
                                      Set new rates. Previous pricing will be archived automatically.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="costPerKm">Cost per Kilometer (₹)</Label>
                                      <Input
                                        id="costPerKm"
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={costPerKm}
                                        onChange={(e) => setCostPerKm(e.target.value)}
                                        placeholder="e.g., 5"
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="baseFare">Base Fare (₹)</Label>
                                      <Input
                                        id="baseFare"
                                        type="number"
                                        step="10"
                                        min="0"
                                        value={baseFare}
                                        onChange={(e) => setBaseFare(e.target.value)}
                                        placeholder="e.g., 50"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="minWeight">Min Weight (kg)</Label>
                                        <Input
                                          id="minWeight"
                                          type="number"
                                          step="1"
                                          min="0"
                                          value={minWeight}
                                          onChange={(e) => setMinWeight(e.target.value)}
                                          placeholder="e.g., 0"
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="maxWeight">Max Weight (kg)</Label>
                                        <Input
                                          id="maxWeight"
                                          type="number"
                                          step="1"
                                          min="1"
                                          value={maxWeight}
                                          onChange={(e) => setMaxWeight(e.target.value)}
                                          placeholder="e.g., 20"
                                        />
                                      </div>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-sm text-muted-foreground">
                                        Example: 10km delivery = ₹{baseFare || 0} + (10 × ₹{costPerKm || 0}) = 
                                        <span className="font-semibold text-foreground ml-1">
                                          ₹{(parseFloat(baseFare || '0') + 10 * parseFloat(costPerKm || '0')).toFixed(2)}
                                        </span>
                                      </p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Weight capacity: {minWeight || 0}kg - {maxWeight || 0}kg
                                      </p>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingConfig(null)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <Dialog 
                                open={historyConfig?.vehicleType === vehicleType && historyConfig?.routeType === routeType} 
                                onOpenChange={(open) => !open && setHistoryConfig(null)}
                              >
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setHistoryConfig({ vehicleType, routeType })}
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {VEHICLE_LABELS[vehicleType]} - {ROUTE_TYPE_LABELS[routeType]} Pricing History
                                    </DialogTitle>
                                    <DialogDescription>
                                      View all previous pricing configurations
                                    </DialogDescription>
                                  </DialogHeader>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Cost/km</TableHead>
                                        <TableHead>Base Fare</TableHead>
                                        <TableHead>Weight Range</TableHead>
                                        <TableHead>Effective From</TableHead>
                                        <TableHead>Effective To</TableHead>
                                        <TableHead>Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {history?.map((h) => (
                                        <TableRow key={h.id}>
                                          <TableCell>₹{h.cost_per_km}</TableCell>
                                          <TableCell>₹{h.base_fare}</TableCell>
                                          <TableCell>{h.min_weight}-{h.max_weight}kg</TableCell>
                                          <TableCell>{format(new Date(h.effective_from), 'dd MMM yyyy')}</TableCell>
                                          <TableCell>
                                            {h.effective_to ? format(new Date(h.effective_to), 'dd MMM yyyy') : '-'}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={h.is_active ? 'default' : 'secondary'}>
                                              {h.is_active ? 'Active' : 'Archived'}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </>
                        ) : (
                          <Dialog 
                            open={editingConfig?.vehicleType === vehicleType && editingConfig?.routeType === routeType} 
                            onOpenChange={(open) => !open && setEditingConfig(null)}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                onClick={() => handleCreateNew(vehicleType, routeType)}
                              >
                                Configure Pricing
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  Configure {VEHICLE_LABELS[vehicleType]} - 
                                  <span className={`flex items-center gap-1 ${colors.text}`}>
                                    {ROUTE_TYPE_ICONS[routeType]}
                                    {ROUTE_TYPE_LABELS[routeType]}
                                  </span>
                                </DialogTitle>
                                <DialogDescription>
                                  Set initial rates for this vehicle and route type.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="costPerKm">Cost per Kilometer (₹)</Label>
                                  <Input
                                    id="costPerKm"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={costPerKm}
                                    onChange={(e) => setCostPerKm(e.target.value)}
                                    placeholder="e.g., 5"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="baseFare">Base Fare (₹)</Label>
                                  <Input
                                    id="baseFare"
                                    type="number"
                                    step="10"
                                    min="0"
                                    value={baseFare}
                                    onChange={(e) => setBaseFare(e.target.value)}
                                    placeholder="e.g., 50"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="minWeight">Min Weight (kg)</Label>
                                    <Input
                                      id="minWeight"
                                      type="number"
                                      step="1"
                                      min="0"
                                      value={minWeight}
                                      onChange={(e) => setMinWeight(e.target.value)}
                                      placeholder="e.g., 0"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="maxWeight">Max Weight (kg)</Label>
                                    <Input
                                      id="maxWeight"
                                      type="number"
                                      step="1"
                                      min="1"
                                      value={maxWeight}
                                      onChange={(e) => setMaxWeight(e.target.value)}
                                      placeholder="e.g., 20"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">
                                    Example: 10km delivery = ₹{baseFare || 0} + (10 × ₹{costPerKm || 0}) = 
                                    <span className="font-semibold text-foreground ml-1">
                                      ₹{(parseFloat(baseFare || '0') + 10 * parseFloat(costPerKm || '0')).toFixed(2)}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingConfig(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                  {updateMutation.isPending ? 'Saving...' : 'Save Pricing'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
