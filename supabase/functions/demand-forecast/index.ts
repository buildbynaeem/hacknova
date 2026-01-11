import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch historical data for analysis
    const [shipmentsResult, fuelResult, vehiclesResult] = await Promise.all([
      supabase
        .from("shipments")
        .select("id, created_at, status, distance_km, vehicle_type, pickup_city, delivery_city")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("fuel_entries")
        .select("id, entry_date, fuel_liters, trip_distance_km, co2_emitted_kg")
        .order("entry_date", { ascending: false })
        .limit(50),
      supabase
        .from("fleet_vehicles")
        .select("id, vehicle_type, is_active, total_km_driven")
        .eq("is_active", true),
    ]);

    const shipments = shipmentsResult.data || [];
    const fuelEntries = fuelResult.data || [];
    const vehicles = vehiclesResult.data || [];

    // Calculate summary metrics
    const totalShipments = shipments.length;
    const deliveredShipments = shipments.filter((s) => s.status === "DELIVERED").length;
    const avgDistance = shipments.reduce((acc, s) => acc + (s.distance_km || 0), 0) / (totalShipments || 1);
    const activeVehicles = vehicles.length;
    const totalFuelUsed = fuelEntries.reduce((acc, f) => acc + (f.fuel_liters || 0), 0);
    const totalCO2 = fuelEntries.reduce((acc, f) => acc + (f.co2_emitted_kg || 0), 0);

    // Aggregate by city
    const cityDemand: Record<string, number> = {};
    shipments.forEach((s) => {
      if (s.pickup_city) cityDemand[s.pickup_city] = (cityDemand[s.pickup_city] || 0) + 1;
      if (s.delivery_city) cityDemand[s.delivery_city] = (cityDemand[s.delivery_city] || 0) + 1;
    });

    // Aggregate by vehicle type
    const vehicleTypeDemand: Record<string, number> = {};
    shipments.forEach((s) => {
      if (s.vehicle_type) vehicleTypeDemand[s.vehicle_type] = (vehicleTypeDemand[s.vehicle_type] || 0) + 1;
    });

    // Build context for AI
    const dataContext = `
FLEET ANALYTICS DATA:
- Total Shipments (last 100): ${totalShipments}
- Delivered: ${deliveredShipments} (${((deliveredShipments / totalShipments) * 100 || 0).toFixed(1)}%)
- Average Distance: ${avgDistance.toFixed(1)} km
- Active Vehicles: ${activeVehicles}
- Total Fuel Used: ${totalFuelUsed.toFixed(1)} liters
- Total CO2 Emissions: ${totalCO2.toFixed(1)} kg

DEMAND BY CITY:
${Object.entries(cityDemand)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([city, count]) => `- ${city}: ${count} shipments`)
  .join("\n")}

DEMAND BY VEHICLE TYPE:
${Object.entries(vehicleTypeDemand)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- ${type}: ${count} shipments`)
  .join("\n")}

FLEET COMPOSITION:
${vehicles.map((v) => `- ${v.vehicle_type}: ${(v.total_km_driven || 0).toFixed(0)} km driven`).join("\n")}
`;

    const systemPrompt = `You are an expert logistics and fleet management analyst for Routezy, a delivery and transportation company in India. 
Analyze the provided fleet data and provide actionable insights for business expansion and optimization.

Your analysis should include:
1. DEMAND FORECAST: Predict future demand trends based on patterns
2. EXPANSION OPPORTUNITIES: Identify cities/regions with growth potential
3. FLEET OPTIMIZATION: Recommend vehicle type adjustments
4. TIMING INSIGHTS: Best times for expansion or resource allocation
5. RISK FACTORS: Potential challenges to consider

Be specific with numbers, percentages, and actionable recommendations. Format your response in clear sections with bullet points.`;

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
          { role: "user", content: `Analyze this fleet data and provide demand forecast insights:\n\n${dataContext}` },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate forecast" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const forecast = aiData.choices?.[0]?.message?.content || "Unable to generate forecast";

    return new Response(
      JSON.stringify({
        forecast,
        metrics: {
          totalShipments,
          deliveredShipments,
          avgDistance: avgDistance.toFixed(1),
          activeVehicles,
          totalFuelUsed: totalFuelUsed.toFixed(1),
          totalCO2: totalCO2.toFixed(1),
          topCities: Object.entries(cityDemand)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
          vehicleTypes: Object.entries(vehicleTypeDemand),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("demand-forecast error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
