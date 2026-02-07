import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, queryType } = await req.json() as { messages: Message[]; queryType?: string };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current data for context
    const [shipmentsRes, vehiclesRes, fuelRes, emissionsRes] = await Promise.all([
      supabase.from('shipments').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('fleet_vehicles').select('*'),
      supabase.from('fuel_entries').select('*').order('entry_date', { ascending: false }).limit(50),
      supabase.from('vehicle_emissions').select('*').order('period_start', { ascending: false }).limit(30),
    ]);

    const shipments = shipmentsRes.data || [];
    const vehicles = vehiclesRes.data || [];
    const fuelEntries = fuelRes.data || [];
    const emissions = emissionsRes.data || [];

    // Calculate summary metrics
    const totalShipments = shipments.length;
    const deliveredCount = shipments.filter(s => s.status === 'DELIVERED').length;
    const inTransitCount = shipments.filter(s => s.status === 'IN_TRANSIT').length;
    const pendingCount = shipments.filter(s => s.status === 'PENDING').length;
    const cancelledCount = shipments.filter(s => s.status === 'CANCELLED').length;
    
    const activeVehicles = vehicles.filter(v => v.is_active).length;
    const totalVehicles = vehicles.length;
    
    const totalFuelUsed = fuelEntries.reduce((sum, e) => sum + (e.fuel_liters || 0), 0);
    const totalCO2 = fuelEntries.reduce((sum, e) => sum + (e.co2_emitted_kg || 0), 0);
    const totalDistance = fuelEntries.reduce((sum, e) => sum + (e.trip_distance_km || 0), 0);
    
    const totalRevenue = shipments.reduce((sum, s) => sum + (s.final_cost || s.estimated_cost || 0), 0);
    
    // Shipments by city
    const cityStats: Record<string, number> = {};
    shipments.forEach(s => {
      cityStats[s.pickup_city] = (cityStats[s.pickup_city] || 0) + 1;
      cityStats[s.delivery_city] = (cityStats[s.delivery_city] || 0) + 1;
    });
    
    // Vehicle type distribution
    const vehicleTypeStats: Record<string, number> = {};
    vehicles.forEach(v => {
      vehicleTypeStats[v.vehicle_type] = (vehicleTypeStats[v.vehicle_type] || 0) + 1;
    });

    // Status breakdown for charts
    const statusData = [
      { name: 'Delivered', value: deliveredCount, color: '#22c55e' },
      { name: 'In Transit', value: inTransitCount, color: '#3b82f6' },
      { name: 'Pending', value: pendingCount, color: '#f59e0b' },
      { name: 'Cancelled', value: cancelledCount, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const dataContext = `
CURRENT FLEET & LOGISTICS DATA:

SHIPMENTS SUMMARY:
- Total Shipments: ${totalShipments}
- Delivered: ${deliveredCount} (${totalShipments > 0 ? ((deliveredCount/totalShipments)*100).toFixed(1) : 0}%)
- In Transit: ${inTransitCount}
- Pending: ${pendingCount}
- Cancelled: ${cancelledCount}
- Total Revenue: ₹${totalRevenue.toLocaleString()}

FLEET STATUS:
- Total Vehicles: ${totalVehicles}
- Active Vehicles: ${activeVehicles}
- Vehicle Types: ${JSON.stringify(vehicleTypeStats)}

FUEL & EMISSIONS:
- Total Fuel Used: ${totalFuelUsed.toFixed(1)} liters
- Total CO2 Emitted: ${totalCO2.toFixed(1)} kg
- Total Distance Covered: ${totalDistance.toFixed(1)} km
- Avg Fuel Efficiency: ${totalDistance > 0 ? (totalFuelUsed / totalDistance * 100).toFixed(2) : 0} L/100km

CITY ACTIVITY: ${JSON.stringify(cityStats)}

STATUS CHART DATA: ${JSON.stringify(statusData)}
`;

    const systemPrompt = `You are an AI-powered fleet analytics assistant for Routezy, a logistics and delivery management platform. You help managers understand their fleet performance, shipment trends, emissions data, and provide actionable insights.

${dataContext}

CAPABILITIES:
1. Answer questions about shipments, deliveries, fleet status, fuel consumption, and emissions
2. Generate insights and recommendations based on the data
3. When asked for charts or visualizations, respond with a special JSON block that the frontend will render

RESPONSE FORMAT FOR CHARTS:
When the user asks for a chart, graph, or visualization, include this JSON block in your response:
\`\`\`chart
{
  "type": "pie|bar|line|area",
  "title": "Chart Title",
  "data": [{"name": "Label", "value": 123, "color": "#hex"}],
  "xKey": "name",
  "yKey": "value"
}
\`\`\`

GUIDELINES:
- Be concise and data-driven
- Use Indian Rupees (₹) for currency
- Provide specific numbers and percentages
- Suggest actionable improvements
- When appropriate, offer to show visualizations
- Format responses with markdown for readability`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI insights request processed successfully");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("AI insights error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
