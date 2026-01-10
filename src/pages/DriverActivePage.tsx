import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Wifi, WifiOff, Power, MapPin, Clock, Package, Route, Fuel, TrendingDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDriverStore } from '@/store/driverStore';
import ActiveDeliveryCard from '@/components/driver/ActiveDeliveryCard';
import DriverCheckInForm, { CheckInData } from '@/components/driver/DriverCheckInForm';
import DriverCheckOutForm, { CheckOutSummary } from '@/components/driver/DriverCheckOutForm';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const DriverActivePage: React.FC = () => {
  const { user } = useAuth();
  const { 
    isOnline, 
    totalDeliveries, 
    totalCarbonSaved, 
    currentShipment,
    checkInData,
    lastTripSummary,
    checkIn,
    checkOut
  } = useDriverStore();

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);
  const [driverProfile, setDriverProfile] = useState<{ fullName: string; vehicleNumber: string } | null>(null);

  // Fetch driver profile data
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user) return;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get assigned vehicle
      const { data: vehicle } = await supabase
        .from('fleet_vehicles')
        .select('vehicle_number')
        .eq('current_driver_id', user.id)
        .maybeSingle();

      setDriverProfile({
        fullName: profile?.full_name || user.email?.split('@')[0] || 'Driver',
        vehicleNumber: vehicle?.vehicle_number || 'No vehicle assigned',
      });
    };

    fetchDriverData();
  }, [user]);

  const handleCheckIn = (data: CheckInData) => {
    checkIn(data);
    setShowCheckInForm(false);
    toast.success('You are now online! Ready to receive deliveries.');
  };

  const handleCheckOut = (summary: CheckOutSummary) => {
    checkOut(summary);
    setShowCheckOutForm(false);
    toast.success(`Trip completed! You drove ${summary.kmDriven.toFixed(1)} km using ${summary.fuelUsed.toFixed(1)}% fuel.`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Link to="/login" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          {isOnline && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCheckOutForm(true)}
                className="gap-2"
              >
                <WifiOff className="w-4 h-4" />
                Go Offline
              </Button>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
            {checkInData?.selfieUrl ? (
              <img src={checkInData.selfieUrl} alt="Driver" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-accent" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{driverProfile?.fullName || 'Driver'}</h1>
            <p className="text-primary-foreground/70 text-sm">{driverProfile?.vehicleNumber || 'Loading...'}</p>
          </div>
        </motion.div>

        {/* Quick Stats - Only show when online */}
        {isOnline && (
          <motion.div 
            className="flex gap-6 mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <p className="text-2xl font-bold">{totalDeliveries}</p>
              <p className="text-xs text-primary-foreground/70">Deliveries</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCarbonSaved.toFixed(1)} kg</p>
              <p className="text-xs text-primary-foreground/70">CO₂ Saved</p>
            </div>
            {checkInData && (
              <div>
                <p className="text-2xl font-bold">{checkInData.fuelLevel}%</p>
                <p className="text-xs text-primary-foreground/70">Start Fuel</p>
              </div>
            )}
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4 -mt-2">
        <AnimatePresence mode="wait">
          {showCheckInForm ? (
            <DriverCheckInForm 
              key="checkin"
              onComplete={handleCheckIn}
              onCancel={() => setShowCheckInForm(false)}
            />
          ) : showCheckOutForm && checkInData ? (
            <DriverCheckOutForm
              key="checkout"
              checkInData={checkInData}
              onComplete={handleCheckOut}
              onCancel={() => setShowCheckOutForm(false)}
            />
          ) : !isOnline ? (
            /* Offline State - Go Online Form */
            <motion.div
              key="offline"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Last Trip Summary */}
              {lastTripSummary && (
                <Card className="mb-4 border-green-200 bg-green-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-700">Last Trip Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <Route className="w-4 h-4 mx-auto mb-1 text-green-600" />
                        <p className="font-semibold text-green-700">{lastTripSummary.kmDriven.toFixed(1)} km</p>
                        <p className="text-xs text-muted-foreground">Distance</p>
                      </div>
                      <div className="text-center">
                        <Fuel className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                        <p className="font-semibold text-orange-600">{lastTripSummary.fuelUsed.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Fuel Used</p>
                      </div>
                      <div className="text-center">
                        <TrendingDown className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <p className="font-semibold text-blue-600">{lastTripSummary.avgFuelEfficiency.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">km/%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2 border-dashed border-muted-foreground/20">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <WifiOff className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl">You're Currently Offline</CardTitle>
                  <p className="text-muted-foreground text-sm mt-2">
                    Go online to start receiving delivery tasks
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Info Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Pending Tasks</p>
                      <p className="font-semibold">3</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Nearby</p>
                      <p className="font-semibold">5 km</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Avg. Time</p>
                      <p className="font-semibold">25 min</p>
                    </div>
                  </div>

                  {/* Go Online Button */}
                  <Button
                    onClick={() => setShowCheckInForm(true)}
                    size="lg"
                    className="w-full gap-3 h-14 text-lg bg-gradient-hero hover:opacity-90"
                  >
                    <Power className="w-6 h-6" />
                    Go Online
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    You'll need to take a selfie and enter vehicle readings
                  </p>
                </CardContent>
              </Card>

              {/* Stats Summary */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Your Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold">{totalDeliveries}</p>
                      <p className="text-xs text-muted-foreground">Total Deliveries</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{totalCarbonSaved.toFixed(1)} kg</p>
                      <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Online State - Show Active Delivery or Waiting */
            <motion.div
              key="online"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
            >
              {/* Current Session Info */}
              {checkInData && (
                <Card className="mb-4 bg-primary/5 border-primary/20">
                  <CardContent className="py-3">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-muted-foreground">Session started</span>
                      </div>
                      <div className="flex gap-4">
                        <span>
                          <strong>{checkInData.odometerReading.toLocaleString()}</strong> km
                        </span>
                        <span>
                          <strong>{checkInData.fuelLevel}%</strong> fuel
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentShipment ? (
                <ActiveDeliveryCard />
              ) : (
                /* Waiting for Task Assignment */
                <Card className="border-2 border-dashed border-primary/20">
                  <CardContent className="py-12 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <Wifi className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">You're Online</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Waiting for task assignment...
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Actively searching for nearby deliveries
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DriverActivePage;
