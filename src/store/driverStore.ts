import { create } from 'zustand';

interface DriverLocation {
  lat: number;
  lng: number;
}

interface Shipment {
  id: string;
  trackingId: string;
  status: 'PENDING' | 'PICKUP_READY' | 'IN_TRANSIT' | 'DELIVERED';
  pickupOTP: string;
  deliveryOTP: string;
  pickupAddress: string;
  dropAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  senderName: string;
  receiverName: string;
  receiverPhone: string;
  carbonScore: number;
  distance: number; // in km
  estimatedTime: string;
  driverName: string;
  vehicleNumber: string;
  createdAt: Date;
}

interface DriverState {
  location: DriverLocation;
  currentShipment: Shipment | null;
  isOnline: boolean;
  totalDeliveries: number;
  totalCarbonSaved: number;
  setLocation: (location: DriverLocation) => void;
  setCurrentShipment: (shipment: Shipment | null) => void;
  updateShipmentStatus: (status: Shipment['status']) => void;
  setOnline: (isOnline: boolean) => void;
  completeDelivery: (carbonSaved: number) => void;
}

// Mock shipment data
const mockShipment: Shipment = {
  id: '1',
  trackingId: 'BL-2024-001234',
  status: 'PICKUP_READY',
  pickupOTP: '1234',
  deliveryOTP: '5678',
  pickupAddress: '123 Warehouse District, Industrial Area, Mumbai',
  dropAddress: '456 Business Park, Andheri East, Mumbai',
  pickupLat: 19.0760,
  pickupLng: 72.8777,
  dropLat: 19.1136,
  dropLng: 72.8697,
  senderName: 'Sunrise Logistics Pvt. Ltd.',
  receiverName: 'Rahul Sharma',
  receiverPhone: '+91 98765 43210',
  carbonScore: 0,
  distance: 12.5,
  estimatedTime: '35 mins',
  driverName: 'Amit Kumar',
  vehicleNumber: 'MH 02 AB 1234',
  createdAt: new Date(),
};

export const useDriverStore = create<DriverState>((set) => ({
  location: { lat: 19.0760, lng: 72.8777 },
  currentShipment: mockShipment,
  isOnline: true,
  totalDeliveries: 47,
  totalCarbonSaved: 156.8,
  
  setLocation: (location) => set({ location }),
  
  setCurrentShipment: (shipment) => set({ currentShipment: shipment }),
  
  updateShipmentStatus: (status) => set((state) => ({
    currentShipment: state.currentShipment 
      ? { ...state.currentShipment, status }
      : null
  })),
  
  setOnline: (isOnline) => set({ isOnline }),
  
  completeDelivery: (carbonSaved) => set((state) => ({
    totalDeliveries: state.totalDeliveries + 1,
    totalCarbonSaved: state.totalCarbonSaved + carbonSaved,
    currentShipment: null,
  })),
}));
