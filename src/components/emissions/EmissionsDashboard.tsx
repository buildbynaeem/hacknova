import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, BarChart3, Users, Car, FileText, Lightbulb } from 'lucide-react';
import EmissionsOverview from './EmissionsOverview';
import EmissionsCharts from './EmissionsCharts';
import DriverEcoLeaderboard from './DriverEcoLeaderboard';
import VehicleEmissions from './VehicleEmissions';
import EmissionInsights from './EmissionInsights';
import EmissionReports from './EmissionReports';

const EmissionsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-success/10">
          <Leaf className="w-8 h-8 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Carbon Emissions Tracker</h1>
          <p className="text-muted-foreground">
            Monitor, analyze, and reduce your fleet's environmental impact
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            <span className="hidden sm:inline">Vehicles</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Drivers</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <EmissionsOverview />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <EmissionsCharts />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          <VehicleEmissions />
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <DriverEcoLeaderboard />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <EmissionInsights />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <EmissionReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmissionsDashboard;
