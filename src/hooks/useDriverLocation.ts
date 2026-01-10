import { useEffect, useState, useCallback } from 'react';
import { getDistance } from 'geolib';

interface Location {
  lat: number;
  lng: number;
}

interface UseDriverLocationReturn {
  location: Location;
  distanceToTarget: number | null;
  isNearTarget: boolean;
  simulateMovement: (target: Location) => void;
  stopSimulation: () => void;
}

export function useDriverLocation(
  initialLocation: Location,
  targetLocation?: Location,
  geofenceRadius: number = 500 // meters
): UseDriverLocationReturn {
  const [location, setLocation] = useState<Location>(initialLocation);
  const [isSimulating, setIsSimulating] = useState(false);
  const [targetLoc, setTargetLoc] = useState<Location | undefined>(targetLocation);

  const distanceToTarget = targetLoc
    ? getDistance(
        { latitude: location.lat, longitude: location.lng },
        { latitude: targetLoc.lat, longitude: targetLoc.lng }
      )
    : null;

  const isNearTarget = distanceToTarget !== null && distanceToTarget <= geofenceRadius;

  const simulateMovement = useCallback((target: Location) => {
    setTargetLoc(target);
    setIsSimulating(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  useEffect(() => {
    if (!isSimulating || !targetLoc) return;

    const interval = setInterval(() => {
      setLocation((current) => {
        const currentDist = getDistance(
          { latitude: current.lat, longitude: current.lng },
          { latitude: targetLoc.lat, longitude: targetLoc.lng }
        );

        // If close enough, stop simulating
        if (currentDist <= 50) {
          setIsSimulating(false);
          return { lat: targetLoc.lat, lng: targetLoc.lng };
        }

        // Move 10% closer each step (simulates driving)
        const newLat = current.lat + (targetLoc.lat - current.lat) * 0.15;
        const newLng = current.lng + (targetLoc.lng - current.lng) * 0.15;

        return { lat: newLat, lng: newLng };
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isSimulating, targetLoc]);

  return {
    location,
    distanceToTarget,
    isNearTarget,
    simulateMovement,
    stopSimulation,
  };
}
