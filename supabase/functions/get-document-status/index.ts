
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get request body
    const { document_id } = await req.json();
    
    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'document_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First check document status from documents table
    const { data: document, error: documentError } = await supabaseClient
      .from('documents')
      .select('status')
      .eq('id', document_id)
      .single();
    
    if (documentError) {
      return new Response(
        JSON.stringify({ error: 'Document not found', details: documentError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If document status is explicitly set, return it
    if (document.status === 'ready' || document.status === 'error') {
      return new Response(
        JSON.stringify({
          total: 0,
          embedded: 0,
          isComplete: document.status === 'ready',
          progress: document.status === 'ready' ? 100 : 0,
          status: document.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get total chunks
    const { count: totalCount, error: countError } = await supabaseClient
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', document_id);
      
    if (countError) {
      return new Response(
        JSON.stringify({ error: 'Error getting document chunks', details: countError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (totalCount === 0) {
      return new Response(
        JSON.stringify({
          total: 0,
          embedded: 0,
          isComplete: false,
          progress: 0,
          status: 'processing'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get embedded chunks
    const { count: embeddedCount, error: embeddedError } = await supabaseClient
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', document_id)
      .not('embedding_vector', 'is', null);
      
    if (embeddedError) {
      return new Response(
        JSON.stringify({ error: 'Error getting embedded chunks', details: embeddedError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const isComplete = totalCount > 0 && embeddedCount === totalCount;
    
    // If embedding is complete, update document status to 'ready'
    if (isComplete && document.status !== 'ready') {
      await supabaseClient
        .from('documents')
        .update({ status: 'ready' })
        .eq('id', document_id);
    }
    
    return new Response(
      JSON.stringify({
        total: totalCount,
        embedded: embeddedCount,
        isComplete,
        progress: totalCount ? Math.round((embeddedCount / totalCount) * 100) : 0,
        status: isComplete ? 'ready' : 'processing'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting document status:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
