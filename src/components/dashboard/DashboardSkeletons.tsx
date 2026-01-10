import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const ShipmentCardSkeleton: React.FC = () => (
  <Card className="animate-fade-in">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardContent>
  </Card>
);

export const ShipmentListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ShipmentCardSkeleton key={i} />
    ))}
  </div>
);

export const TrackingPanelSkeleton: React.FC = () => (
  <div className="space-y-4 animate-fade-in">
    {/* Map skeleton */}
    <Skeleton className="h-52 w-full rounded-lg" />
    
    {/* Details skeleton */}
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
    
    {/* Actions skeleton */}
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 flex-1" />
    </div>
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <Card className="animate-fade-in">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardContent>
  </Card>
);

export const StatsGridSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid gap-4 md:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <Card className="animate-fade-in">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-64" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full rounded-lg" />
      <div className="mt-4 p-4 rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const FleetMapSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative rounded-xl overflow-hidden border border-border ${className}`}>
    <Skeleton className="h-full w-full min-h-[400px]" />
    
    {/* Legend skeleton */}
    <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
      <Skeleton className="h-3 w-16 mb-2" />
      <div className="space-y-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Live indicator skeleton */}
    <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg z-10">
      <Skeleton className="h-2 w-2 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const DashboardHeaderSkeleton: React.FC = () => (
  <header className="bg-card border-b border-border p-4 animate-fade-in">
    <div className="container mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-5" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  </header>
);
