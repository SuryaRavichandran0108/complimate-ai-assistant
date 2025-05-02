
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables');
    }
    
    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get request body
    const requestData = await req.json();
    const { document_id } = requestData;
    
    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'Document ID is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get total chunks
    const { count: totalCount, error: countError } = await supabaseClient
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', document_id);
      
    if (countError) {
      throw countError;
    }
    
    // Get embedded chunks
    const { count: embeddedCount, error: embeddedError } = await supabaseClient
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', document_id)
      .not('embedding_vector', 'is', null);
      
    if (embeddedError) {
      throw embeddedError;
    }
    
    const total = totalCount || 0;
    const embedded = embeddedCount || 0;
    const isComplete = total > 0 && embedded === total;
    const progress = total ? Math.round((embedded / total) * 100) : 0;
    
    return new Response(
      JSON.stringify({ 
        total, 
        embedded, 
        isComplete, 
        progress 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
