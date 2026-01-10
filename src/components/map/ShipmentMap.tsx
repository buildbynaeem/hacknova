import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDistance } from 'geolib';
import { Leaf, Clock, Route, Zap, DollarSign, TrendingDown, CheckCircle2, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
        font-size: 16px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

const pickupIcon = createCustomIcon('#22c55e', '📦');
const deliveryIcon = createCustomIcon('#3b82f6', '📍');

interface MapPosition {
  lat: number;
  lng: number;
}

interface RouteOption {
  id: 'eco' | 'standard' | 'fast';
  name: string;
  distance: number;
  duration: number;
  cost: number;
  carbonEmission: number;
  carbonSaved: number;
  color: string;
  isEcoFriendly: boolean;
  description: string;
}

interface ShipmentMapProps {
  driverPosition?: MapPosition | null;
  pickupPosition?: MapPosition | null;
  deliveryPosition?: MapPosition | null;
  showRoute?: boolean;
  showRouteOptimization?: boolean;
  showRouteComparison?: boolean;
  driverName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  className?: string;
  isLive?: boolean;
  onRouteSelect?: (routeId: 'eco' | 'standard' | 'fast') => void;
}

// Component to handle map view updates
function MapUpdater({ positions }: { positions: MapPosition[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [positions, map]);

  return null;
}

// Generate optimized route waypoints (simulating route optimization)
function generateOptimizedRoute(
  start: MapPosition,
  end: MapPosition,
  routeType: 'eco' | 'standard' | 'fast'
): [number, number][] {
  const waypoints: [number, number][] = [];
  
  // Different route characteristics
  const config = {
    eco: { steps: 10, offsetFactor: 0.18, jitter: 0.0008 },
    standard: { steps: 6, offsetFactor: 0.08, jitter: 0.0015 },
    fast: { steps: 4, offsetFactor: -0.05, jitter: 0.001 },
  };
  
  const { steps, offsetFactor, jitter } = config[routeType];
  
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const perpLat = -dx * offsetFactor;
  const perpLng = dy * offsetFactor;

  waypoints.push([start.lat, start.lng]);
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const curve = Math.sin(t * Math.PI) * 0.7;
    const lat = start.lat + (end.lat - start.lat) * t + perpLat * curve;
    const lng = start.lng + (end.lng - start.lng) * t + perpLng * curve;
    
    waypoints.push([
      lat + (Math.random() - 0.5) * jitter,
      lng + (Math.random() - 0.5) * jitter
    ]);
  }
  
  waypoints.push([end.lat, end.lng]);
  
  return waypoints;
}

// Calculate route options
function calculateRouteOptions(
  pickup: MapPosition,
  delivery: MapPosition,
  driver?: MapPosition | null
): RouteOption[] {
  const directDistance = getDistance(
    { latitude: pickup.lat, longitude: pickup.lng },
    { latitude: delivery.lat, longitude: delivery.lng }
  ) / 1000;

  let baseDistance = directDistance;
  if (driver) {
    const driverToPickup = getDistance(
      { latitude: driver.lat, longitude: driver.lng },
      { latitude: pickup.lat, longitude: pickup.lng }
    ) / 1000;
    baseDistance += driverToPickup;
  }

  // Base carbon emission per km (kg CO2)
  const baseEmission = 0.21;
  
  // Route configurations with realistic variations
  const routes: RouteOption[] = [
    {
      id: 'eco',
      name: 'Eco-Friendly',
      distance: Math.round((baseDistance * 1.12) * 10) / 10, // 12% longer
      duration: Math.round((baseDistance * 1.12) / 25 * 60), // 25 km/h avg
      cost: Math.round(baseDistance * 8 * 0.9), // 10% cheaper
      carbonEmission: Math.round(baseDistance * 1.12 * baseEmission * 0.7 * 100) / 100, // 30% less emissions
      carbonSaved: Math.round(baseDistance * baseEmission * 0.3 * 100) / 100,
      color: '#22c55e',
      isEcoFriendly: true,
      description: 'Optimized for lowest emissions',
    },
    {
      id: 'standard',
      name: 'Standard',
      distance: Math.round(baseDistance * 10) / 10,
      duration: Math.round(baseDistance / 30 * 60), // 30 km/h avg
      cost: Math.round(baseDistance * 8),
      carbonEmission: Math.round(baseDistance * baseEmission * 100) / 100,
      carbonSaved: 0,
      color: '#3b82f6',
      isEcoFriendly: false,
      description: 'Balanced time and cost',
    },
    {
      id: 'fast',
      name: 'Express',
      distance: Math.round((baseDistance * 0.95) * 10) / 10, // 5% shorter
      duration: Math.round((baseDistance * 0.95) / 40 * 60), // 40 km/h avg
      cost: Math.round(baseDistance * 8 * 1.25), // 25% more expensive
      carbonEmission: Math.round(baseDistance * 0.95 * baseEmission * 1.15 * 100) / 100, // 15% more emissions
      carbonSaved: -Math.round(baseDistance * baseEmission * 0.15 * 100) / 100,
      color: '#f97316',
      isEcoFriendly: false,
      description: 'Fastest delivery time',
    },
  ];

  return routes;
}

// Animated driver marker component
function AnimatedDriverMarker({ 
  position, 
  driverName, 
  isLive 
}: { 
  position: MapPosition; 
  driverName?: string;
  isLive?: boolean;
}) {
  const animatedDriverIcon = useMemo(() => L.divIcon({
    className: 'animated-driver-marker',
    html: `
      <div style="position: relative;">
        ${isLive ? `
          <div style="
            position: absolute;
            inset: -8px;
            background: rgba(249, 115, 22, 0.3);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
        <div style="
          background: linear-gradient(135deg, #f97316, #ea580c);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
          border: 3px solid white;
          font-size: 18px;
          position: relative;
          z-index: 10;
        ">
          🚚
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -25],
  }), [isLive]);

  return (
    <Marker position={[position.lat, position.lng]} icon={animatedDriverIcon}>
      <Popup>
        <div className="text-center">
          <strong className="text-orange-600">{driverName || 'Driver'}</strong>
          <p className="text-sm text-gray-600 mt-1">
            {isLive ? '📍 Live Location' : 'Last known location'}
          </p>
          <p className="text-xs text-gray-400 font-mono mt-1">
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

// Route comparison panel
function RouteComparisonPanel({ 
  routes, 
  selectedRoute, 
  onSelectRoute 
}: { 
  routes: RouteOption[];
  selectedRoute: 'eco' | 'standard' | 'fast';
  onSelectRoute: (id: 'eco' | 'standard' | 'fast') => void;
}) {
  return (
    <div className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur-sm rounded-xl shadow-lg z-[1000] border border-border overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-muted/50">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Route className="h-4 w-4 text-accent" />
          Route Options
        </h3>
      </div>
      
      <div className="grid grid-cols-3 divide-x divide-border">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => onSelectRoute(route.id)}
            className={cn(
              "p-3 text-left transition-all hover:bg-muted/50 relative",
              selectedRoute === route.id && "bg-muted"
            )}
          >
            {/* Selection indicator */}
            {selectedRoute === route.id && (
              <div 
                className="absolute top-0 left-0 right-0 h-0.5" 
                style={{ backgroundColor: route.color }}
              />
            )}
            
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: route.color }}
              />
              <span className="text-xs font-semibold text-foreground">{route.name}</span>
              {route.isEcoFriendly && (
                <Leaf className="h-3 w-3 text-success ml-auto" />
              )}
              {route.id === 'fast' && (
                <Zap className="h-3 w-3 text-warning ml-auto" />
              )}
              {selectedRoute === route.id && (
                <CheckCircle2 className="h-3.5 w-3.5 text-accent ml-auto" />
              )}
            </div>
            
            {/* Stats */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  {route.distance} km
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {route.duration} min
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ₹{route.cost}
                </span>
                <span 
                  className={cn(
                    "flex items-center gap-1",
                    route.carbonSaved > 0 ? "text-success" : route.carbonSaved < 0 ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {route.carbonSaved > 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3" />
                      -{route.carbonSaved} kg
                    </>
                  ) : route.carbonSaved < 0 ? (
                    <>
                      <Car className="h-3 w-3" />
                      +{Math.abs(route.carbonSaved)} kg
                    </>
                  ) : (
                    <>
                      <Leaf className="h-3 w-3" />
                      {route.carbonEmission} kg
                    </>
                  )}
                </span>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-[10px] text-muted-foreground mt-2 leading-tight">
              {route.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Simple route info panel (when comparison is disabled)
function RouteOptimizationPanel({ route }: { route: RouteOption }) {
  return (
    <div className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-[1000] border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-success/10">
          <Leaf className="h-4 w-4 text-success" />
        </div>
        <span className="text-sm font-semibold text-foreground">Optimized Route</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
          Eco-Friendly
        </span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <div className="flex items-center gap-1.5">
          <Route className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Distance</p>
            <p className="text-xs font-semibold text-foreground">{route.distance} km</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">ETA</p>
            <p className="text-xs font-semibold text-foreground">{route.duration} min</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Cost</p>
            <p className="text-xs font-semibold text-foreground">₹{route.cost}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-success" />
          <div>
            <p className="text-[10px] text-muted-foreground">CO₂ Saved</p>
            <p className="text-xs font-semibold text-success">{route.carbonSaved} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const ShipmentMap: React.FC<ShipmentMapProps> = ({
  driverPosition,
  pickupPosition,
  deliveryPosition,
  showRoute = true,
  showRouteOptimization = true,
  showRouteComparison = false,
  driverName,
  pickupAddress,
  deliveryAddress,
  className = '',
  isLive = false,
  onRouteSelect,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<'eco' | 'standard' | 'fast'>('eco');
  
  const defaultCenter: MapPosition = { lat: 19.076, lng: 72.8777 };
  
  const allPositions = useMemo(() => {
    const positions: MapPosition[] = [];
    if (pickupPosition) positions.push(pickupPosition);
    if (deliveryPosition) positions.push(deliveryPosition);
    if (driverPosition) positions.push(driverPosition);
    return positions;
  }, [pickupPosition, deliveryPosition, driverPosition]);

  const center = useMemo(() => {
    if (driverPosition) return driverPosition;
    if (allPositions.length > 0) {
      return {
        lat: allPositions.reduce((sum, p) => sum + p.lat, 0) / allPositions.length,
        lng: allPositions.reduce((sum, p) => sum + p.lng, 0) / allPositions.length,
      };
    }
    return defaultCenter;
  }, [driverPosition, allPositions]);

  // Calculate all route options
  const routeOptions = useMemo(() => {
    if (!pickupPosition || !deliveryPosition) return [];
    return calculateRouteOptions(pickupPosition, deliveryPosition, driverPosition);
  }, [pickupPosition, deliveryPosition, driverPosition]);

  // Generate route waypoints for each option
  const routeWaypoints = useMemo(() => {
    if (!pickupPosition || !deliveryPosition) return {};
    return {
      eco: generateOptimizedRoute(pickupPosition, deliveryPosition, 'eco'),
      standard: generateOptimizedRoute(pickupPosition, deliveryPosition, 'standard'),
      fast: generateOptimizedRoute(pickupPosition, deliveryPosition, 'fast'),
    };
  }, [pickupPosition, deliveryPosition]);

  // Driver to pickup route
  const driverToPickupRoute = useMemo(() => {
    if (!driverPosition || !pickupPosition) return null;
    return generateOptimizedRoute(driverPosition, pickupPosition, 'standard');
  }, [driverPosition, pickupPosition]);

  const handleRouteSelect = (routeId: 'eco' | 'standard' | 'fast') => {
    setSelectedRoute(routeId);
    onRouteSelect?.(routeId);
  };

  const selectedRouteOption = routeOptions.find(r => r.id === selectedRoute);

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%', minHeight: '200px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allPositions.length > 0 && <MapUpdater positions={allPositions} />}

        {/* Driver to Pickup route (dashed orange) */}
        {showRoute && driverToPickupRoute && [
          <Polyline
            key="driver-pickup-shadow"
            positions={driverToPickupRoute}
            pathOptions={{
              color: '#000',
              weight: 5,
              opacity: 0.1,
            }}
          />,
          <Polyline
            key="driver-pickup-line"
            positions={driverToPickupRoute}
            pathOptions={{
              color: '#f97316',
              weight: 3,
              opacity: 0.9,
              dashArray: '8, 8',
            }}
          />
        ]}

        {/* Route comparison mode - show all routes */}
        {showRoute && showRouteComparison && pickupPosition && deliveryPosition && 
          (['eco', 'standard', 'fast'] as const).filter(id => id !== selectedRoute).map((routeId) => {
            const route = routeOptions.find(r => r.id === routeId);
            const waypoints = routeWaypoints[routeId];
            if (!route || !waypoints) return null;
            
            return (
              <Polyline
                key={routeId}
                positions={waypoints}
                pathOptions={{
                  color: route.color,
                  weight: 3,
                  opacity: 0.3,
                  dashArray: '5, 10',
                }}
              />
            );
          })
        }
        
        {/* Selected route (highlighted) */}
        {showRoute && showRouteComparison && selectedRouteOption && routeWaypoints[selectedRoute] && [
          <Polyline
            key="selected-shadow"
            positions={routeWaypoints[selectedRoute]}
            pathOptions={{
              color: '#000',
              weight: 8,
              opacity: 0.1,
            }}
          />,
          <Polyline
            key="selected-glow"
            positions={routeWaypoints[selectedRoute]}
            pathOptions={{
              color: selectedRouteOption.color,
              weight: 10,
              opacity: 0.25,
            }}
          />,
          <Polyline
            key="selected-line"
            positions={routeWaypoints[selectedRoute]}
            pathOptions={{
              color: selectedRouteOption.color,
              weight: 4,
              opacity: 1,
            }}
          />
        ]}

        {/* Single route mode (eco by default) */}
        {showRoute && !showRouteComparison && routeWaypoints.eco && [
          <Polyline
            key="eco-shadow"
            positions={routeWaypoints.eco}
            pathOptions={{
              color: '#000',
              weight: 8,
              opacity: 0.1,
            }}
          />,
          <Polyline
            key="eco-glow"
            positions={routeWaypoints.eco}
            pathOptions={{
              color: '#22c55e',
              weight: 12,
              opacity: 0.2,
            }}
          />,
          <Polyline
            key="eco-line"
            positions={routeWaypoints.eco}
            pathOptions={{
              color: '#22c55e',
              weight: 4,
              opacity: 1,
            }}
          />
        ]}

        {/* Pickup marker */}
        {pickupPosition && (
          <Marker position={[pickupPosition.lat, pickupPosition.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-center">
                <strong className="text-green-600">📦 Pickup Point</strong>
                {pickupAddress && (
                  <p className="text-sm text-gray-600 mt-1 max-w-[200px]">{pickupAddress}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Delivery marker */}
        {deliveryPosition && (
          <Marker position={[deliveryPosition.lat, deliveryPosition.lng]} icon={deliveryIcon}>
            <Popup>
              <div className="text-center">
                <strong className="text-blue-600">📍 Delivery Point</strong>
                {deliveryAddress && (
                  <p className="text-sm text-gray-600 mt-1 max-w-[200px]">{deliveryAddress}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Driver marker */}
        {driverPosition && (
          <AnimatedDriverMarker 
            position={driverPosition} 
            driverName={driverName}
            isLive={isLive}
          />
        )}
      </MapContainer>

      {/* Live indicator overlay */}
      {isLive && driverPosition && (
        <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 shadow-md z-[1000]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-xs font-medium text-success">Live</span>
        </div>
      )}

      {/* Route panels */}
      {showRouteOptimization && pickupPosition && deliveryPosition && routeOptions.length > 0 && (
        showRouteComparison ? (
          <RouteComparisonPanel
            routes={routeOptions}
            selectedRoute={selectedRoute}
            onSelectRoute={handleRouteSelect}
          />
        ) : (
          routeOptions[0] && <RouteOptimizationPanel route={routeOptions[0]} />
        )
      )}
    </div>
  );
};

export default ShipmentMap;
