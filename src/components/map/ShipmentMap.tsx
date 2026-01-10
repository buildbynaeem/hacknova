import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface ShipmentMapProps {
  driverPosition?: MapPosition | null;
  pickupPosition?: MapPosition | null;
  deliveryPosition?: MapPosition | null;
  showRoute?: boolean;
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

const ShipmentMap: React.FC<ShipmentMapProps> = ({
  driverPosition,
  pickupPosition,
  deliveryPosition,
  showRoute = true,
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

  // Create route polyline
  const routePositions = useMemo(() => {
    const route: [number, number][] = [];
    if (pickupPosition) route.push([pickupPosition.lat, pickupPosition.lng]);
    if (driverPosition) route.push([driverPosition.lat, driverPosition.lng]);
    if (deliveryPosition) route.push([deliveryPosition.lat, deliveryPosition.lng]);
    return route;
  }, [pickupPosition, driverPosition, deliveryPosition]);

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

        {/* Route line */}
        {showRoute && routePositions.length >= 2 && (
          <>
            {/* Shadow line */}
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#000',
                weight: 6,
                opacity: 0.1,
              }}
            />
            {/* Main route */}
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#f97316',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10',
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
    </div>
  );
};

export default ShipmentMap;
