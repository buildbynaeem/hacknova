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

export interface CheckInData {
  selfieUrl: string;
  odometerReading: number;
  fuelLevel: number;
  timestamp: Date;
}

export interface TripSummary {
  checkInData: CheckInData;
  checkOutSelfieUrl: string;
  checkOutOdometer: number;
  checkOutFuel: number;
  checkOutTimestamp: Date;
  kmDriven: number;
  fuelUsed: number;
  avgFuelEfficiency: number;
}

interface DriverState {
  location: DriverLocation;
  currentShipment: Shipment | null;
  isOnline: boolean;
  totalDeliveries: number;
  totalCarbonSaved: number;
  checkInData: CheckInData | null;
  lastTripSummary: TripSummary | null;
  tripHistory: TripSummary[];
  setLocation: (location: DriverLocation) => void;
  setCurrentShipment: (shipment: Shipment | null) => void;
  updateShipmentStatus: (status: Shipment['status']) => void;
  setOnline: (isOnline: boolean) => void;
  completeDelivery: (carbonSaved: number) => void;
  checkIn: (data: CheckInData) => void;
  checkOut: (summary: TripSummary) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  location: { lat: 0, lng: 0 },
  currentShipment: null,
  isOnline: false,
  totalDeliveries: 0,
  totalCarbonSaved: 0,
  checkInData: null,
  lastTripSummary: null,
  tripHistory: [],
  
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

  checkIn: (data) => set({ 
    checkInData: data,
    isOnline: true,
  }),

  checkOut: (summary) => set((state) => ({
    isOnline: false,
    checkInData: null,
    lastTripSummary: summary,
    tripHistory: [...state.tripHistory, summary],
  })),
}));
