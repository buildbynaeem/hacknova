import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Camera, 
  Truck,
  Phone,
  Leaf,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDriverStore } from '@/store/driverStore';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { validatePickupOTP, validateDeliveryOTP, completeDelivery } from '@/lib/delivery-actions';
import ShipmentMap from '@/components/map/ShipmentMap';
import { toast } from 'sonner';

type DeliveryState = 'pickup' | 'transit' | 'delivery' | 'completed';

const ActiveDeliveryCard: React.FC = () => {
  const { currentShipment, updateShipmentStatus, completeDelivery: storeComplete } = useDriverStore();
  const [deliveryState, setDeliveryState] = useState<DeliveryState>('pickup');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);

  const dropLocation = currentShipment 
    ? { lat: currentShipment.dropLat, lng: currentShipment.dropLng }
    : { lat: 19.1136, lng: 72.8697 };

  const { location, distanceToTarget, isNearTarget, simulateMovement } = useDriverLocation(
    { lat: 19.0760, lng: 72.8777 },
    dropLocation,
    500
  );

  const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePickupVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await validatePickupOTP(currentShipment?.id || '', otpValue);
    
    setIsLoading(false);

    if (result.valid) {
      toast.success('Pickup verified! Package in custody.');
      updateShipmentStatus('IN_TRANSIT');
      setDeliveryState('transit');
      setOtp(['', '', '', '']);
      // Start simulating movement toward drop location
      simulateMovement(dropLocation);
    } else {
      setError(result.message);
      toast.error(result.message);
    }
  };

  const handleArrived = () => {
    setDeliveryState('delivery');
    setOtp(['', '', '', '']);
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeliveryComplete = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError('Please enter delivery OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await completeDelivery(
      currentShipment?.id || '',
      otpValue,
      proofImage || undefined
    );

    setIsLoading(false);

    if (result.success) {
      toast.success(
        <div className="flex items-center gap-2">
          <Leaf className="text-success" />
          <span>Saved {result.carbonSaved}kg CO₂!</span>
        </div>
      );
      updateShipmentStatus('DELIVERED');
      storeComplete(result.carbonSaved || 0);
      setDeliveryState('completed');
    } else {
      setError(result.message);
      toast.error(result.message);
    }
  };

  if (!currentShipment) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Active Delivery</h3>
          <p className="text-muted-foreground mt-2">
            You'll see your next delivery here when assigned.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header with tracking info */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-hero p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Tracking ID</p>
              <p className="font-mono font-bold">{currentShipment.trackingId}</p>
            </div>
            <Badge 
              variant={
                deliveryState === 'completed' ? 'delivered' :
                deliveryState === 'transit' ? 'transit' :
                deliveryState === 'delivery' ? 'transit' : 'pickup'
              }
              className="text-xs"
            >
              {deliveryState === 'pickup' && 'Pickup'}
              {deliveryState === 'transit' && 'In Transit'}
              {deliveryState === 'delivery' && 'At Location'}
              {deliveryState === 'completed' && 'Delivered'}
            </Badge>
          </div>
        </div>

        {/* Interactive Map with real Leaflet */}
        <ShipmentMap
          className="h-44"
          pickupPosition={{ lat: 19.076, lng: 72.8777 }}
          deliveryPosition={dropLocation}
          driverPosition={deliveryState !== 'pickup' ? location : null}
          pickupAddress={currentShipment.pickupAddress}
          deliveryAddress={currentShipment.dropAddress}
          driverName="You"
          showRoute={true}
          isLive={deliveryState === 'transit'}
        />
      </Card>

      {/* State-specific content */}
      <AnimatePresence mode="wait">
        {/* STATE 1: Pickup Verification */}
        {deliveryState === 'pickup' && (
          <motion.div
            key="pickup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-accent" />
                  Verify Pickup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground">Pickup Location</p>
                  <p className="font-medium text-sm mt-1">{currentShipment.pickupAddress}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Enter Pickup OTP</label>
                  <div className="flex gap-3 justify-center">
                    {otp.map((digit, idx) => (
                      <Input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="otp-input"
                      />
                    ))}
                  </div>
                  {error && (
                    <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                </div>

                <Button 
                  variant="accent" 
                  size="lg" 
                  className="w-full"
                  onClick={handlePickupVerify}
                  disabled={isLoading || otp.join('').length !== 4}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Verify & Start Delivery
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  OTP: <span className="font-mono">1234</span> (for demo)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STATE 2: In Transit - Geofence Lock */}
        {deliveryState === 'transit' && (
          <motion.div
            key="transit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Navigation className="w-5 h-5 text-transit" />
                  In Transit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground">Drop Location</p>
                  <p className="font-medium text-sm mt-1">{currentShipment.dropAddress}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-medium">{currentShipment.receiverName}</p>
                      <p className="text-sm text-muted-foreground">{currentShipment.receiverPhone}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" asChild>
                    <a href={`tel:${currentShipment.receiverPhone}`}>
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                </div>

                {/* Distance indicator */}
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-foreground">
                    {distanceToTarget ? `${(distanceToTarget / 1000).toFixed(1)} km` : '...'}
                  </p>
                  <p className="text-sm text-muted-foreground">to destination</p>
                </div>

                <Button 
                  variant={isNearTarget ? 'success' : 'secondary'} 
                  size="lg" 
                  className="w-full"
                  onClick={handleArrived}
                  disabled={!isNearTarget}
                >
                  {isNearTarget ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      I've Arrived
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Drive Closer to Unlock ({distanceToTarget ? Math.round(distanceToTarget) : 0}m away)
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Button unlocks within 500m of destination
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STATE 3: Delivery & Proof */}
        {deliveryState === 'delivery' && (
          <motion.div
            key="delivery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Complete Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Display Delivery OTP to driver */}
                <div className="p-4 bg-accent/10 border border-accent rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Delivery OTP (Show to receiver)</p>
                  <p className="text-3xl font-mono font-bold text-accent tracking-widest">
                    {currentShipment.deliveryOTP || '----'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ask the receiver to confirm this OTP
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Enter Delivery OTP from Receiver</label>
                  <div className="flex gap-3 justify-center">
                    {otp.map((digit, idx) => (
                      <Input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="otp-input"
                      />
                    ))}
                  </div>
                  {error && (
                    <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Proof of delivery upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Proof of Delivery (Optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageCapture}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {proofImage ? (
                      <div className="relative rounded-lg overflow-hidden h-32">
                        <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-success/20 flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-success" />
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition-colors">
                        <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Tap to capture photo</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  variant="success" 
                  size="lg" 
                  className="w-full"
                  onClick={handleDeliveryComplete}
                  disabled={isLoading || otp.join('').length !== 4}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Delivery
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  OTP: <span className="font-mono">5678</span> (for demo)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STATE 4: Completed */}
        {deliveryState === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="overflow-hidden">
              <div className="bg-gradient-success p-8 text-center text-success-foreground">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold">Delivery Complete!</h2>
                <p className="opacity-80 mt-2">Great job! Invoice generated automatically.</p>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 text-success py-4">
                  <Leaf className="w-5 h-5" />
                  <span className="font-semibold">1.88 kg CO₂ Saved</span>
                </div>
                <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActiveDeliveryCard;
