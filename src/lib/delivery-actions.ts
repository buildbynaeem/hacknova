import { z } from 'zod';

// Validation schemas
export const otpSchema = z.string().length(4, 'OTP must be 4 digits').regex(/^\d{4}$/, 'OTP must contain only digits');

export const deliveryCompletionSchema = z.object({
  shipmentId: z.string().min(1, 'Shipment ID is required'),
  otp: otpSchema,
  proofImage: z.string().optional(),
});

// Types
export interface ShipmentData {
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
  distance: number;
  estimatedTime: string;
  driverName: string;
  vehicleNumber: string;
  invoiceUrl?: string;
  proofOfDeliveryUrl?: string;
}

export interface DeliveryResult {
  success: boolean;
  carbonSaved?: number;
  invoiceId?: string;
  message: string;
}

// Simulate server actions (in a real app, these would be API calls)
export async function validatePickupOTP(shipmentId: string, otp: string): Promise<{ valid: boolean; message: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  const validOtp = otpSchema.safeParse(otp);
  if (!validOtp.success) {
    return { valid: false, message: 'Invalid OTP format' };
  }

  // Mock validation - in real app, check against database
  if (otp === '1234') {
    return { valid: true, message: 'Pickup verified successfully' };
  }
  
  return { valid: false, message: 'Incorrect OTP. Please try again.' };
}

export async function validateDeliveryOTP(shipmentId: string, otp: string): Promise<{ valid: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  const validOtp = otpSchema.safeParse(otp);
  if (!validOtp.success) {
    return { valid: false, message: 'Invalid OTP format' };
  }

  if (otp === '5678') {
    return { valid: true, message: 'Delivery OTP verified' };
  }
  
  return { valid: false, message: 'Incorrect OTP. Please try again.' };
}

export async function completeDelivery(
  shipmentId: string, 
  otp: string,
  proofImage?: string
): Promise<DeliveryResult> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Validate input
  const validation = deliveryCompletionSchema.safeParse({
    shipmentId,
    otp,
    proofImage,
  });

  if (!validation.success) {
    return { 
      success: false, 
      message: validation.error.errors[0]?.message || 'Validation failed' 
    };
  }

  // Validate OTP
  if (otp !== '5678') {
    return { success: false, message: 'Incorrect delivery OTP' };
  }

  // Calculate carbon saved (Distance * 0.15 kg CO2 per km saved via route optimization)
  const distanceKm = 12.5; // Would come from shipment data
  const carbonSaved = parseFloat((distanceKm * 0.15).toFixed(2));

  // In real app: Create invoice, update shipment status, save proof image
  const invoiceId = `INV-${Date.now()}`;

  return {
    success: true,
    carbonSaved,
    invoiceId,
    message: 'Delivery completed successfully!',
  };
}

// Analytics data
export interface SustainabilityMetrics {
  totalCarbonSaved: number;
  activeDeliveries: number;
  maintenanceCostPerKm: number;
  fuelEfficiencyData: Array<{
    month: string;
    standard: number;
    efficient: number;
  }>;
}

export async function getSustainabilityMetrics(): Promise<SustainabilityMetrics> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    totalCarbonSaved: 2847.5,
    activeDeliveries: 23,
    maintenanceCostPerKm: 4.25,
    fuelEfficiencyData: [
      { month: 'Aug', standard: 8.5, efficient: 6.2 },
      { month: 'Sep', standard: 8.8, efficient: 6.0 },
      { month: 'Oct', standard: 9.2, efficient: 5.8 },
      { month: 'Nov', standard: 8.9, efficient: 5.5 },
      { month: 'Dec', standard: 9.5, efficient: 5.3 },
      { month: 'Jan', standard: 9.8, efficient: 5.1 },
    ],
  };
}
