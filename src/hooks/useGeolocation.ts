import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AddressComponents {
  address: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
}

interface GeolocationState {
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    isLoading: false,
    error: null,
  });

  const reverseGeocode = async (lat: number, lng: number): Promise<AddressComponents | null> => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const address = data.address || {};
      
      // Build the street address
      const streetParts = [
        address.house_number,
        address.road,
        address.neighbourhood || address.suburb,
      ].filter(Boolean);
      
      const streetAddress = streetParts.length > 0 
        ? streetParts.join(', ')
        : data.display_name?.split(',').slice(0, 3).join(', ') || '';

      // Get city (try multiple fields)
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.county ||
                   address.state_district ||
                   '';

      // Get pincode/postal code
      const pincode = address.postcode || '';

      return {
        address: streetAddress,
        city,
        pincode,
        lat,
        lng,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const getCurrentLocation = useCallback(async (): Promise<AddressComponents | null> => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return null;
    }

    setState({ isLoading: true, error: null });

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          toast.info('Fetching address...', { duration: 2000 });
          
          const addressData = await reverseGeocode(latitude, longitude);
          
          if (addressData) {
            setState({ isLoading: false, error: null });
            toast.success('Location detected!');
            resolve(addressData);
          } else {
            setState({ isLoading: false, error: 'Could not fetch address' });
            toast.error('Could not fetch address for this location');
            resolve(null);
          }
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          setState({ isLoading: false, error: errorMessage });
          toast.error(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return {
    getCurrentLocation,
    isLoading: state.isLoading,
    error: state.error,
  };
}
