import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Truck, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FleetMapSkeleton, StatsGridSkeleton, ChartSkeleton } from '@/components/dashboard/DashboardSkeletons';
import SustainabilityCard from '@/components/dashboard/SustainabilityCard';

const FleetMap = lazy(() => import('@/components/map/FleetMap'));

const ManagerDashboard: React.FC = () => {
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
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Fleet Analytics</h1>
                  <p className="text-xs text-muted-foreground">Sustainability & Performance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-bold hidden sm:block">Routezy</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Fleet Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5 text-accent" />
                Live Fleet Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<FleetMapSkeleton className="h-[400px]" />}>
                <FleetMap className="h-[400px]" />
              </Suspense>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sustainability Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SustainabilityCard />
        </motion.div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
