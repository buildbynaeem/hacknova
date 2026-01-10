import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Driver {
  id: string;
  name: string;
  vehicleNumber: string;
  status: 'active' | 'idle' | 'offline';
  position: { lat: number; lng: number };
  currentDelivery?: string;
}

// Create driver icon based on status
const createDriverIcon = (status: Driver['status']) => {
  const colors = {
    active: '#22c55e',
    idle: '#f97316',
    offline: '#6b7280',
  };
  
  return L.divIcon({
    className: 'driver-marker',
    html: `
      <div style="position: relative;">
        ${status === 'active' ? `
          <div style="
            position: absolute;
            inset: -6px;
            background: ${colors[status]}33;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
        <div style="
          background: ${colors[status]};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          border: 2px solid white;
          font-size: 14px;
        ">
          🚚
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0; }
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

// Component to handle map bounds
function FitBounds({ positions }: { positions: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [positions, map]);

  return null;
}

interface FleetMapProps {
  className?: string;
}

const FleetMap: React.FC<FleetMapProps> = ({ className = '' }) => {
  const [drivers, setDrivers] = useState<Driver[]>([
    { 
      id: '1', 
      name: 'Amit Kumar', 
      vehicleNumber: 'MH 02 AB 1234', 
      status: 'active',
      position: { lat: 19.082, lng: 72.881 },
      currentDelivery: 'RTZ-250110-A3F2'
    },
    { 
      id: '2', 
      name: 'Vijay Singh', 
      vehicleNumber: 'MH 04 CD 5678', 
      status: 'active',
      position: { lat: 19.115, lng: 72.855 },
      currentDelivery: 'RTZ-250110-B7D1'
    },
    { 
      id: '3', 
      name: 'Rahul Sharma', 
      vehicleNumber: 'MH 01 EF 9012', 
      status: 'idle',
      position: { lat: 19.045, lng: 72.820 }
    },
    { 
      id: '4', 
      name: 'Suresh Patel', 
      vehicleNumber: 'MH 03 GH 3456', 
      status: 'active',
      position: { lat: 19.138, lng: 72.912 },
      currentDelivery: 'RTZ-250110-C9E4'
    },
    { 
      id: '5', 
      name: 'Deepak Verma', 
      vehicleNumber: 'MH 02 IJ 7890', 
      status: 'offline',
      position: { lat: 19.021, lng: 72.842 }
    },
  ]);

  // Simulate driver movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(driver => {
        if (driver.status === 'active') {
          return {
            ...driver,
            position: {
              lat: driver.position.lat + (Math.random() - 0.5) * 0.002,
              lng: driver.position.lng + (Math.random() - 0.5) * 0.002,
            }
          };
        }
        return driver;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const center = { lat: 19.076, lng: 72.8777 };

  const statusCounts = {
    active: drivers.filter(d => d.status === 'active').length,
    idle: drivers.filter(d => d.status === 'idle').length,
    offline: drivers.filter(d => d.status === 'offline').length,
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds positions={drivers.map(d => d.position)} />

        {drivers.map(driver => (
          <Marker
            key={driver.id}
            position={[driver.position.lat, driver.position.lng]}
            icon={createDriverIcon(driver.status)}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${
                    driver.status === 'active' ? 'bg-green-500' : 
                    driver.status === 'idle' ? 'bg-orange-500' : 'bg-gray-500'
                  }`} />
                  <strong className="text-sm">{driver.name}</strong>
                </div>
                <p className="text-xs text-gray-600 font-mono">{driver.vehicleNumber}</p>
                {driver.currentDelivery && (
                  <p className="text-xs mt-2 bg-green-100 text-green-700 px-2 py-1 rounded">
                    📦 {driver.currentDelivery}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  {driver.position.lat.toFixed(5)}, {driver.position.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Fleet Status</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <span>Active ({statusCounts.active})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-accent" />
            <span>Idle ({statusCounts.idle})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span>Offline ({statusCounts.offline})</span>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg z-[1000]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <span className="text-xs font-medium">Live Fleet View</span>
      </div>
    </div>
  );
};

export default FleetMap;
