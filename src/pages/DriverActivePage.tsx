import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDriverStore } from '@/store/driverStore';
import ActiveDeliveryCard from '@/components/driver/ActiveDeliveryCard';

const DriverActivePage: React.FC = () => {
  const { isOnline, setOnline, totalDeliveries, totalCarbonSaved } = useDriverStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Link to="/login" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant={isOnline ? 'success' : 'secondary'}
              size="sm"
              onClick={() => setOnline(!isOnline)}
              className="gap-2"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Offline
                </>
              )}
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
            <Truck className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Amit Kumar</h1>
            <p className="text-primary-foreground/70 text-sm">MH 02 AB 1234</p>
          </div>
        </motion.div>

        {/* Quick Stats */}
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
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="p-4 -mt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ActiveDeliveryCard />
        </motion.div>
      </main>
    </div>
  );
};

export default DriverActivePage;
