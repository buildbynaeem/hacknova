import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TAMBO_API_KEY = Deno.env.get("TAMBO_API_KEY");
    
    if (!TAMBO_API_KEY) {
      return new Response(
        JSON.stringify({ error: "TAMBO_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the API key for client use
    // Note: This key is meant to be used client-side for Tambo SDK
    return new Response(
      JSON.stringify({ apiKey: TAMBO_API_KEY }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error fetching Tambo config:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch Tambo configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
