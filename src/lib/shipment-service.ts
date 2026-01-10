import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Shipment = Database['public']['Tables']['shipments']['Row'];
type ShipmentInsert = Database['public']['Tables']['shipments']['Insert'];
type Invoice = Database['public']['Tables']['invoices']['Row'];

// Generate 4-digit OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate tracking ID
function generateTrackingId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RTZ-${dateStr}-${random}`;
}

export interface CreateShipmentData {
  pickupAddress: string;
  pickupCity: string;
  pickupPincode: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupDate: string;
  pickupTimeSlot?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPincode: string;
  receiverName: string;
  receiverPhone: string;
  packageType: 'DOCUMENTS' | 'PARCEL' | 'FRAGILE' | 'HEAVY' | 'PERISHABLE';
  weight?: number;
  dimensions?: string;
  description?: string;
  isFragile?: boolean;
  estimatedCost?: number;
}

export async function createShipment(data: CreateShipmentData): Promise<{ data: Shipment | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: 'User not authenticated' };
  }

  const shipmentData: ShipmentInsert = {
    tracking_id: generateTrackingId(),
    sender_id: user.id,
    pickup_address: data.pickupAddress,
    pickup_city: data.pickupCity,
    pickup_pincode: data.pickupPincode,
    pickup_contact_name: data.pickupContactName,
    pickup_contact_phone: data.pickupContactPhone,
    pickup_date: data.pickupDate,
    pickup_time_slot: data.pickupTimeSlot,
    delivery_address: data.deliveryAddress,
    delivery_city: data.deliveryCity,
    delivery_pincode: data.deliveryPincode,
    receiver_name: data.receiverName,
    receiver_phone: data.receiverPhone,
    package_type: data.packageType,
    weight: data.weight,
    dimensions: data.dimensions,
    description: data.description,
    is_fragile: data.isFragile ?? false,
    pickup_otp: generateOTP(),
    delivery_otp: generateOTP(),
    estimated_cost: data.estimatedCost,
    status: 'PENDING',
  };

  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert(shipmentData)
    .select()
    .single();

  if (error) {
    console.error('Error creating shipment:', error);
    return { data: null, error: error.message };
  }

  return { data: shipment, error: null };
}

export async function getUserShipments(): Promise<{ data: Shipment[]; error: string | null }> {
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shipments:', error);
    return { data: [], error: error.message };
  }

  return { data: shipments ?? [], error: null };
}

export async function getShipmentById(id: string): Promise<{ data: Shipment | null; error: string | null }> {
  const { data: shipment, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching shipment:', error);
    return { data: null, error: error.message };
  }

  return { data: shipment, error: null };
}

export async function validatePickupOTP(shipmentId: string, otp: string): Promise<{ success: boolean; error: string | null }> {
  const { data: shipment, error: fetchError } = await supabase
    .from('shipments')
    .select('pickup_otp, status')
    .eq('id', shipmentId)
    .single();

  if (fetchError || !shipment) {
    return { success: false, error: 'Shipment not found' };
  }

  if (shipment.pickup_otp !== otp) {
    return { success: false, error: 'Invalid OTP' };
  }

  const { error: updateError } = await supabase
    .from('shipments')
    .update({ 
      status: 'IN_TRANSIT',
      picked_up_at: new Date().toISOString()
    })
    .eq('id', shipmentId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
}

export async function completeDelivery(
  shipmentId: string, 
  otp: string, 
  proofImageUrl?: string,
  distanceKm?: number
): Promise<{ success: boolean; carbonSaved: number; invoiceId?: string; error: string | null }> {
  const { data: shipment, error: fetchError } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single();

  if (fetchError || !shipment) {
    return { success: false, carbonSaved: 0, error: 'Shipment not found' };
  }

  if (shipment.delivery_otp !== otp) {
    return { success: false, carbonSaved: 0, error: 'Invalid OTP' };
  }

  // Calculate carbon saved (0.15kg per km)
  const distance = distanceKm ?? (shipment.distance_km ?? 50);
  const carbonSaved = distance * 0.15;

  // Update shipment
  const { error: updateError } = await supabase
    .from('shipments')
    .update({ 
      status: 'DELIVERED',
      delivered_at: new Date().toISOString(),
      proof_of_delivery_url: proofImageUrl,
      carbon_score: carbonSaved,
      distance_km: distance,
      final_cost: shipment.estimated_cost ?? 250
    })
    .eq('id', shipmentId);

  if (updateError) {
    return { success: false, carbonSaved: 0, error: updateError.message };
  }

  // Create invoice
  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const amount = shipment.estimated_cost ?? 250;
  const taxAmount = amount * 0.18;
  const totalAmount = amount + taxAmount;

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      shipment_id: shipmentId,
      sender_id: shipment.sender_id,
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    })
    .select()
    .single();

  if (invoiceError) {
    console.error('Error creating invoice:', invoiceError);
  }

  return { 
    success: true, 
    carbonSaved, 
    invoiceId: invoice?.id,
    error: null 
  };
}

export async function updateDriverLocation(
  shipmentId: string, 
  lat: number, 
  lng: number
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('shipments')
    .update({ driver_lat: lat, driver_lng: lng })
    .eq('id', shipmentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function getSustainabilityMetrics(): Promise<{
  totalCarbonSaved: number;
  totalDeliveries: number;
  activeDeliveries: number;
}> {
  const { data: deliveredShipments } = await supabase
    .from('shipments')
    .select('carbon_score')
    .eq('status', 'DELIVERED');

  const { data: activeShipments } = await supabase
    .from('shipments')
    .select('id')
    .eq('status', 'IN_TRANSIT');

  const totalCarbonSaved = deliveredShipments?.reduce((sum, s) => sum + (s.carbon_score ?? 0), 0) ?? 0;
  
  return {
    totalCarbonSaved,
    totalDeliveries: deliveredShipments?.length ?? 0,
    activeDeliveries: activeShipments?.length ?? 0,
  };
}

export async function uploadProofOfDelivery(
  shipmentId: string, 
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { url: null, error: 'User not authenticated' };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${shipmentId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('proof-of-delivery')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { url: null, error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('proof-of-delivery')
    .getPublicUrl(fileName);

  return { url: publicUrl, error: null };
}
