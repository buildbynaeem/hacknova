import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDistance } from 'geolib';
import { Leaf, Clock, Route, Zap } from 'lucide-react';

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

const driverIcon = createCustomIcon('#f97316', '🚚');
const pickupIcon = createCustomIcon('#22c55e', '📦');
const deliveryIcon = createCustomIcon('#3b82f6', '📍');

interface MapPosition {
  lat: number;
  lng: number;
}

interface RouteInfo {
  distance: number; // in km
  duration: number; // in minutes
  carbonSaved: number; // in kg CO2
  isEcoFriendly: boolean;
}

interface ShipmentMapProps {
  driverPosition?: MapPosition | null;
  pickupPosition?: MapPosition | null;
  deliveryPosition?: MapPosition | null;
  showRoute?: boolean;
  showRouteOptimization?: boolean;
  driverName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  className?: string;
  isLive?: boolean;
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
  isEcoFriendly: boolean
): [number, number][] {
  const waypoints: [number, number][] = [];
  const steps = isEcoFriendly ? 8 : 5; // Eco route has more waypoints for smoother path
  
  // Add slight curve to make it look like a real route
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  
  // Calculate perpendicular offset for curve
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const offsetFactor = isEcoFriendly ? 0.15 : 0.08;
  const perpLat = -dx * offsetFactor;
  const perpLng = dy * offsetFactor;

  waypoints.push([start.lat, start.lng]);
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    // Bezier curve interpolation
    const curve = Math.sin(t * Math.PI) * (isEcoFriendly ? 0.8 : 0.5);
    const lat = start.lat + (end.lat - start.lat) * t + perpLat * curve;
    const lng = start.lng + (end.lng - start.lng) * t + perpLng * curve;
    
    // Add slight randomness for realism
    const jitter = isEcoFriendly ? 0.001 : 0.002;
    waypoints.push([
      lat + (Math.random() - 0.5) * jitter,
      lng + (Math.random() - 0.5) * jitter
    ]);
  }
  
  waypoints.push([end.lat, end.lng]);
  
  return waypoints;
}

// Calculate route info
function calculateRouteInfo(
  pickup: MapPosition,
  delivery: MapPosition,
  driver?: MapPosition | null
): RouteInfo {
  // Calculate direct distance
  const directDistance = getDistance(
    { latitude: pickup.lat, longitude: pickup.lng },
    { latitude: delivery.lat, longitude: delivery.lng }
  ) / 1000; // Convert to km

  // Add driver to pickup if available
  let totalDistance = directDistance;
  if (driver) {
    const driverToPickup = getDistance(
      { latitude: driver.lat, longitude: driver.lng },
      { latitude: pickup.lat, longitude: pickup.lng }
    ) / 1000;
    totalDistance += driverToPickup;
  }

  // Estimate duration (avg speed 30 km/h in city)
  const duration = Math.round(totalDistance / 30 * 60);

  // Calculate carbon saved (eco-friendly routes save ~15% CO2)
  // Average car emits 0.21 kg CO2 per km
  const standardCarbon = totalDistance * 0.21;
  const ecoCarbon = standardCarbon * 0.85;
  const carbonSaved = standardCarbon - ecoCarbon;

  return {
    distance: Math.round(totalDistance * 10) / 10,
    duration,
    carbonSaved: Math.round(carbonSaved * 100) / 100,
    isEcoFriendly: true,
  };
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

// Route optimization info panel
function RouteOptimizationPanel({ routeInfo }: { routeInfo: RouteInfo }) {
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
      
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <Route className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-sm font-semibold text-foreground">{routeInfo.distance} km</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">ETA</p>
            <p className="text-sm font-semibold text-foreground">{routeInfo.duration} min</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-success" />
          <div>
            <p className="text-xs text-muted-foreground">CO₂ Saved</p>
            <p className="text-sm font-semibold text-success">{routeInfo.carbonSaved} kg</p>
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
  driverName,
  pickupAddress,
  deliveryAddress,
  className = '',
  isLive = false,
}) => {
  // Default to Mumbai area if no positions provided
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

  // Generate optimized route waypoints
  const optimizedRoute = useMemo(() => {
    if (!pickupPosition || !deliveryPosition) return null;
    return generateOptimizedRoute(pickupPosition, deliveryPosition, true);
  }, [pickupPosition, deliveryPosition]);

  // Driver to pickup route
  const driverToPickupRoute = useMemo(() => {
    if (!driverPosition || !pickupPosition) return null;
    return generateOptimizedRoute(driverPosition, pickupPosition, true);
  }, [driverPosition, pickupPosition]);

  // Calculate route info
  const routeInfo = useMemo(() => {
    if (!pickupPosition || !deliveryPosition) return null;
    return calculateRouteInfo(pickupPosition, deliveryPosition, driverPosition);
  }, [pickupPosition, deliveryPosition, driverPosition]);

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
        {showRoute && driverToPickupRoute && (
          <>
            <Polyline
              positions={driverToPickupRoute}
              pathOptions={{
                color: '#000',
                weight: 5,
                opacity: 0.1,
              }}
            />
            <Polyline
              positions={driverToPickupRoute}
              pathOptions={{
                color: '#f97316',
                weight: 3,
                opacity: 0.9,
                dashArray: '8, 8',
              }}
            />
          </>
        )}

        {/* Pickup to Delivery route (solid green for eco-friendly) */}
        {showRoute && optimizedRoute && (
          <>
            {/* Shadow */}
            <Polyline
              positions={optimizedRoute}
              pathOptions={{
                color: '#000',
                weight: 8,
                opacity: 0.1,
              }}
            />
            {/* Glow effect for eco route */}
            <Polyline
              positions={optimizedRoute}
              pathOptions={{
                color: '#22c55e',
                weight: 12,
                opacity: 0.2,
              }}
            />
            {/* Main route */}
            <Polyline
              positions={optimizedRoute}
              pathOptions={{
                color: '#22c55e',
                weight: 4,
                opacity: 1,
              }}
            />
            {/* Direction arrows overlay */}
            <Polyline
              positions={optimizedRoute}
              pathOptions={{
                color: '#16a34a',
                weight: 2,
                opacity: 0.7,
                dashArray: '1, 15',
              }}
            />
          </>
        )}

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

      {/* Route optimization panel */}
      {showRouteOptimization && routeInfo && pickupPosition && deliveryPosition && (
        <RouteOptimizationPanel routeInfo={routeInfo} />
      )}
    </div>
  );
};

export default ShipmentMap;
