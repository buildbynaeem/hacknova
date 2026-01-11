import React, { Suspense, lazy, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Truck, Map, IndianRupee, Users, Shield, Leaf, Package, Fuel, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FleetMapSkeleton, StatsGridSkeleton, ChartSkeleton } from '@/components/dashboard/DashboardSkeletons';
import SustainabilityCard from '@/components/dashboard/SustainabilityCard';
import { PricingManagement } from '@/components/manager/PricingManagement';
import { FleetManagement } from '@/components/manager/FleetManagement';
import { DriverManagement } from '@/components/manager/DriverManagement';
import { DriverApprovalPanel } from '@/components/manager/DriverApprovalPanel';
import { ActiveDeliveriesPanel } from '@/components/manager/ActiveDeliveriesPanel';
import { DamageReportsPanel } from '@/components/manager/DamageReportsPanel';
import FuelMetricsPanel from '@/components/manager/FuelMetricsPanel';
import EmissionsDashboard from '@/components/emissions/EmissionsDashboard';
import DemandForecast from '@/components/manager/DemandForecast';
import { useUserRole } from '@/hooks/useUserRole';

const FleetMap = lazy(() => import('@/components/map/FleetMap'));

const ManagerDashboard: React.FC = () => {
  const { isAdmin, isManager } = useUserRole();
  const [activeTab, setActiveTab] = useState('overview');

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
              {(isAdmin || isManager) && (
                <Badge variant="outline" className="gap-1 ml-2">
                  <Shield className="w-3 h-3" />
                  {isAdmin ? 'Admin' : 'Manager'}
                </Badge>
              )}
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
      <main className="container mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Deliveries</span>
            </TabsTrigger>
            <TabsTrigger value="fuel" className="flex items-center gap-2">
              <Fuel className="w-4 h-4" />
              <span className="hidden sm:inline">Fuel Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="emissions" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              <span className="hidden sm:inline">Emissions</span>
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Demand Forecast</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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

            {/* Fleet Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FleetManagement />
            </motion.div>

            {/* Damage Reports */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <DamageReportsPanel />
            </motion.div>

            {/* Driver Approval Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <DriverApprovalPanel />
            </motion.div>

            {/* Driver Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <DriverManagement />
            </motion.div>

            {/* Pricing Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <PricingManagement />
            </motion.div>
          </TabsContent>

          <TabsContent value="deliveries">
            <ActiveDeliveriesPanel />
          </TabsContent>

          <TabsContent value="fuel">
            <FuelMetricsPanel />
          </TabsContent>

          <TabsContent value="emissions">
            <EmissionsDashboard />
          </TabsContent>

          <TabsContent value="forecast">
            <DemandForecast />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ManagerDashboard;
