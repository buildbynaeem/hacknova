import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Package, 
  User, 
  Phone, 
  Truck,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Weight,
  Box,
  Clock,
  CreditCard,
  LocateFixed,
  Loader2,
  Leaf,
  Zap,
  Route
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { openRazorpayCheckout, verifyRazorpayPayment } from '@/lib/razorpay';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingComplete: (booking: BookingData) => void;
}

interface BookingData {
  // Pickup details
  pickupAddress: string;
  pickupCity: string;
  pickupPincode: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupDate: string;
  pickupTimeSlot: string;
  // Delivery details
  dropAddress: string;
  dropCity: string;
  dropPincode: string;
  receiverName: string;
  receiverPhone: string;
  // Package details
  packageType: string;
  weight: string;
  dimensions: string;
  description: string;
  isFragile: boolean;
  // Route type
  routeType: 'eco' | 'standard' | 'express';
}

const initialFormData: BookingData = {
  pickupAddress: '',
  pickupCity: '',
  pickupPincode: '',
  pickupContactName: '',
  pickupContactPhone: '',
  pickupDate: '',
  pickupTimeSlot: '',
  dropAddress: '',
  dropCity: '',
  dropPincode: '',
  receiverName: '',
  receiverPhone: '',
  packageType: '',
  weight: '',
  dimensions: '',
  description: '',
  isFragile: false,
  routeType: 'standard',
};

const steps = [
  { id: 1, title: 'Pickup', icon: MapPin },
  { id: 2, title: 'Delivery', icon: Truck },
  { id: 3, title: 'Package', icon: Package },
  { id: 4, title: 'Route', icon: Route },
  { id: 5, title: 'Confirm', icon: Check },
];

const routeTypes = [
  { 
    value: 'eco' as const, 
    label: 'Eco-Friendly', 
    icon: Leaf,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
    description: 'Lowest carbon footprint',
    deliveryTime: '3-5 days',
    priceModifier: 0.85,
    co2Savings: '40% less CO₂'
  },
  { 
    value: 'standard' as const, 
    label: 'Standard', 
    icon: Truck,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    description: 'Balanced speed & cost',
    deliveryTime: '24-48 hours',
    priceModifier: 1,
    co2Savings: 'Standard emissions'
  },
  { 
    value: 'express' as const, 
    label: 'Express', 
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
    description: 'Fastest delivery',
    deliveryTime: '6-12 hours',
    priceModifier: 1.5,
    co2Savings: 'Priority routing'
  },
];

const timeSlots = [
  '9:00 AM - 12:00 PM',
  '12:00 PM - 3:00 PM',
  '3:00 PM - 6:00 PM',
  '6:00 PM - 9:00 PM',
];

const packageTypes = [
  { value: 'documents', label: 'Documents', icon: '📄' },
  { value: 'parcel', label: 'Small Parcel', icon: '📦' },
  { value: 'box', label: 'Box/Carton', icon: '📤' },
  { value: 'pallet', label: 'Pallet', icon: '🏗️' },
  { value: 'fragile', label: 'Fragile Items', icon: '🔶' },
];

const BookingDialog: React.FC<BookingDialogProps> = ({
  open,
  onOpenChange,
  onBookingComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getCurrentLocation, isLoading: isGeoLoading } = useGeolocation();

  const handleUsePickupLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setFormData(prev => ({
        ...prev,
        pickupAddress: location.address,
        pickupCity: location.city,
        pickupPincode: location.pincode,
      }));
    }
  };

  const handleUseDeliveryLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setFormData(prev => ({
        ...prev,
        dropAddress: location.address,
        dropCity: location.city,
        dropPincode: location.pincode,
      }));
    }
  };

  const updateField = (field: keyof BookingData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.pickupAddress &&
          formData.pickupCity &&
          formData.pickupPincode &&
          formData.pickupContactName &&
          formData.pickupContactPhone &&
          formData.pickupDate &&
          formData.pickupTimeSlot
        );
      case 2:
        return !!(
          formData.dropAddress &&
          formData.dropCity &&
          formData.dropPincode &&
          formData.receiverName &&
          formData.receiverPhone
        );
      case 3:
        return !!(formData.packageType && formData.weight);
      case 4:
        return !!formData.routeType;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const selectedRoute = routeTypes.find(r => r.value === formData.routeType) || routeTypes[1];
    const baseCost = 50 + (parseFloat(formData.weight) || 1) * 15;
    const estimatedCost = Math.round(baseCost * selectedRoute.priceModifier);
    const receiptId = `RTZ-${Date.now()}`;
    
    try {
      await openRazorpayCheckout({
        amount: estimatedCost,
        receipt: receiptId,
        notes: {
          pickupCity: formData.pickupCity,
          dropCity: formData.dropCity,
          packageType: formData.packageType,
          routeType: formData.routeType,
        },
        prefill: {
          name: formData.pickupContactName,
          contact: formData.pickupContactPhone,
        },
        onSuccess: async (response) => {
          try {
            // Verify payment on server
            const verification = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            
            if (verification.success) {
              onBookingComplete(formData);
              toast.success('Payment successful! Shipment booked!', {
                description: `Payment ID: ${response.razorpay_payment_id}`,
              });
              
              setFormData(initialFormData);
              setCurrentStep(1);
              onOpenChange(false);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (verifyError) {
            console.error('Verification error:', verifyError);
            toast.error('Payment verification failed');
          }
          setIsSubmitting(false);
        },
        onError: (error) => {
          console.error('Payment error:', error);
          toast.error(error.description || error.message || 'Payment failed');
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate payment');
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pickupAddress">Pickup Address *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUsePickupLocation}
                  disabled={isGeoLoading}
                  className="h-7 text-xs text-accent hover:text-accent/80"
                >
                  {isGeoLoading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3 h-3 mr-1" />
                  )}
                  Use My Location
                </Button>
              </div>
              <Textarea
                id="pickupAddress"
                placeholder="Enter complete pickup address..."
                value={formData.pickupAddress}
                onChange={(e) => updateField('pickupAddress', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupCity">City *</Label>
                <AutocompleteInput
                  id="pickupCity"
                  placeholder="Mumbai"
                  value={formData.pickupCity}
                  onChange={(value) => updateField('pickupCity', value)}
                  onSelect={(suggestion) => {
                    if (suggestion.pincode && !formData.pickupPincode) {
                      updateField('pickupPincode', suggestion.pincode);
                    }
                  }}
                  type="city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupPincode">Pincode *</Label>
                <AutocompleteInput
                  id="pickupPincode"
                  placeholder="400001"
                  value={formData.pickupPincode}
                  onChange={(value) => updateField('pickupPincode', value)}
                  onSelect={(suggestion) => {
                    if (suggestion.city && !formData.pickupCity) {
                      updateField('pickupCity', suggestion.city);
                    }
                  }}
                  type="pincode"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupContactName">Contact Name *</Label>
                <Input
                  id="pickupContactName"
                  placeholder="John Doe"
                  value={formData.pickupContactName}
                  onChange={(e) => updateField('pickupContactName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupContactPhone">Contact Phone *</Label>
                <Input
                  id="pickupContactPhone"
                  placeholder="+91 98765 43210"
                  value={formData.pickupContactPhone}
                  onChange={(e) => updateField('pickupContactPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date *</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => updateField('pickupDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Time Slot *</Label>
                <Select
                  value={formData.pickupTimeSlot}
                  onValueChange={(value) => updateField('pickupTimeSlot', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dropAddress">Delivery Address *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUseDeliveryLocation}
                  disabled={isGeoLoading}
                  className="h-7 text-xs text-accent hover:text-accent/80"
                >
                  {isGeoLoading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3 h-3 mr-1" />
                  )}
                  Use My Location
                </Button>
              </div>
              <Textarea
                id="dropAddress"
                placeholder="Enter complete delivery address..."
                value={formData.dropAddress}
                onChange={(e) => updateField('dropAddress', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dropCity">City *</Label>
                <AutocompleteInput
                  id="dropCity"
                  placeholder="Pune"
                  value={formData.dropCity}
                  onChange={(value) => updateField('dropCity', value)}
                  onSelect={(suggestion) => {
                    if (suggestion.pincode && !formData.dropPincode) {
                      updateField('dropPincode', suggestion.pincode);
                    }
                  }}
                  type="city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropPincode">Pincode *</Label>
                <AutocompleteInput
                  id="dropPincode"
                  placeholder="411001"
                  value={formData.dropPincode}
                  onChange={(value) => updateField('dropPincode', value)}
                  onSelect={(suggestion) => {
                    if (suggestion.city && !formData.dropCity) {
                      updateField('dropCity', suggestion.city);
                    }
                  }}
                  type="pincode"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiverName">Receiver Name *</Label>
                <Input
                  id="receiverName"
                  placeholder="Jane Doe"
                  value={formData.receiverName}
                  onChange={(e) => updateField('receiverName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiverPhone">Receiver Phone *</Label>
                <Input
                  id="receiverPhone"
                  placeholder="+91 98765 43210"
                  value={formData.receiverPhone}
                  onChange={(e) => updateField('receiverPhone', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Package Type *</Label>
              <div className="grid grid-cols-3 gap-2">
                {packageTypes.map((type) => (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all ${
                      formData.packageType === type.value
                        ? 'ring-2 ring-accent bg-accent/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => updateField('packageType', type.value)}
                  >
                    <CardContent className="p-3 text-center">
                      <span className="text-2xl">{type.icon}</span>
                      <p className="text-xs mt-1 font-medium">{type.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg) *</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="weight"
                    placeholder="5"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions (LxWxH cm)</Label>
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dimensions"
                    placeholder="30x20x15"
                    value={formData.dimensions}
                    onChange={(e) => updateField('dimensions', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Package Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of contents..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            <Card className="bg-warning/10 border-warning/30">
              <CardContent className="p-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="fragile"
                  checked={formData.isFragile}
                  onChange={(e) => updateField('isFragile', e.target.checked)}
                  className="w-4 h-4 accent-warning"
                />
                <Label htmlFor="fragile" className="cursor-pointer text-sm">
                  Contains fragile items - Handle with care
                </Label>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">Choose Delivery Type</h3>
              <p className="text-sm text-muted-foreground">Select your preferred route based on speed and sustainability</p>
            </div>
            
            <div className="grid gap-3">
              {routeTypes.map((route) => {
                const RouteIcon = route.icon;
                const isSelected = formData.routeType === route.value;
                const baseCost = 50 + (parseFloat(formData.weight) || 1) * 15;
                const routeCost = Math.round(baseCost * route.priceModifier);
                
                return (
                  <Card
                    key={route.value}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? `ring-2 ${route.borderColor} ${route.bgColor}`
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => updateField('routeType', route.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${route.bgColor} flex items-center justify-center`}>
                            <RouteIcon className={`w-5 h-5 ${route.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{route.label}</span>
                              {route.value === 'eco' && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  {route.co2Savings}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{route.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${route.color}`}>₹{routeCost}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {route.deliveryTime}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        );

      case 5:
        const selectedRoute = routeTypes.find(r => r.value === formData.routeType) || routeTypes[1];
        const baseCostCalc = 50 + (parseFloat(formData.weight) || 1) * 15;
        const estimatedCost = Math.round(baseCostCalc * selectedRoute.priceModifier);
        const RouteIconSummary = selectedRoute.icon;
        
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Pickup Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-success" />
                  </div>
                  <h4 className="font-semibold">Pickup Details</h4>
                </div>
                <div className="space-y-1 text-sm pl-10">
                  <p>{formData.pickupAddress}</p>
                  <p className="text-muted-foreground">
                    {formData.pickupCity}, {formData.pickupPincode}
                  </p>
                  <p className="flex items-center gap-2 mt-2">
                    <User className="w-3 h-3" />
                    {formData.pickupContactName}
                    <Phone className="w-3 h-3 ml-2" />
                    {formData.pickupContactPhone}
                  </p>
                  <p className="flex items-center gap-2 text-accent">
                    <Calendar className="w-3 h-3" />
                    {formData.pickupDate} • {formData.pickupTimeSlot}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-accent" />
                  </div>
                  <h4 className="font-semibold">Delivery Details</h4>
                </div>
                <div className="space-y-1 text-sm pl-10">
                  <p>{formData.dropAddress}</p>
                  <p className="text-muted-foreground">
                    {formData.dropCity}, {formData.dropPincode}
                  </p>
                  <p className="flex items-center gap-2 mt-2">
                    <User className="w-3 h-3" />
                    {formData.receiverName}
                    <Phone className="w-3 h-3 ml-2" />
                    {formData.receiverPhone}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Package Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">Package Details</h4>
                </div>
                <div className="flex flex-wrap gap-2 pl-10">
                  <Badge variant="secondary">
                    {packageTypes.find((t) => t.value === formData.packageType)?.label}
                  </Badge>
                  <Badge variant="secondary">{formData.weight} kg</Badge>
                  {formData.dimensions && (
                    <Badge variant="secondary">{formData.dimensions} cm</Badge>
                  )}
                  {formData.isFragile && (
                    <Badge variant="pending">Fragile</Badge>
                  )}
                </div>
                {formData.description && (
                  <p className="text-sm text-muted-foreground mt-2 pl-10">
                    {formData.description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Route Type Summary */}
            <Card className={`${selectedRoute.bgColor} ${selectedRoute.borderColor} border`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-background flex items-center justify-center`}>
                      <RouteIconSummary className={`w-4 h-4 ${selectedRoute.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{selectedRoute.label} Delivery</h4>
                      <p className="text-sm text-muted-foreground">{selectedRoute.deliveryTime}</p>
                    </div>
                  </div>
                  {selectedRoute.value === 'eco' && (
                    <Badge className="bg-green-500 text-white">{selectedRoute.co2Savings}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price Estimate */}
            <Card className="bg-gradient-to-r from-accent/10 to-success/10 border-accent/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold text-accent">₹{estimatedCost}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                    <p className="flex items-center gap-1 font-semibold">
                      <Clock className="w-4 h-4" />
                      {selectedRoute.deliveryTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            Book New Shipment
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : isCompleted
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span className={`text-xs ${isActive ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-success' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button variant="accent" onClick={handleNext} className="gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <CreditCard className="w-4 h-4" />
                </motion.div>
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {isSubmitting ? 'Processing...' : 'Pay & Book'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
