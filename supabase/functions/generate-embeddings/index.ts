
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Batch size for processing chunks
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
}

async function generateEmbedding(text: string, retries = 0): Promise<number[] | null> {
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`OpenAI API error: ${error}`);
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms (${retries + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return generateEmbedding(text, retries + 1);
      }
      
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    if (retries < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms (${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return generateEmbedding(text, retries + 1);
    }
    
    return null;
  }
}

async function processChunkBatch(chunks: DocumentChunk[], supabaseClient: any): Promise<number> {
  let successCount = 0;
  
  for (const chunk of chunks) {
    try {
      console.log(`Processing chunk ${chunk.id} (index: ${chunk.chunk_index})`);
      
      // Generate embedding for chunk text
      const embedding = await generateEmbedding(chunk.chunk_text);
      
      if (!embedding) {
        console.error(`Failed to generate embedding for chunk ${chunk.id}`);
        continue;
      }
      
      // Update chunk with embedding
      const { error } = await supabaseClient
        .from('document_chunks')
        .update({ embedding_vector: embedding })
        .eq('id', chunk.id);
      
      if (error) {
        console.error(`Error updating chunk ${chunk.id}:`, error);
        continue;
      }
      
      successCount++;
    } catch (error) {
      console.error(`Error processing chunk ${chunk.id}:`, error);
    }
  }
  
  return successCount;
}

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
    const { document_id, user_id, limit = 50 } = requestData;
    
    // Verify user_id is provided for security
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Construct query to get chunks without embeddings
    let query = supabaseClient
      .from('document_chunks')
      .select('id, document_id, chunk_text, chunk_index')
      .is('embedding_vector', null)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    // Add document_id filter if provided
    if (document_id) {
      // Also verify document belongs to user
      const { data: document, error: docError } = await supabaseClient
        .from('documents')
        .select('id')
        .eq('id', document_id)
        .eq('user_id', user_id)
        .single();
      
      if (docError || !document) {
        return new Response(
          JSON.stringify({ error: 'Document not found or not authorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      query = query.eq('document_id', document_id);
    } else {
      // If no document_id, ensure we only process user's documents
      query = query.in('document_id', 
        supabaseClient.from('documents').select('id').eq('user_id', user_id)
      );
    }
    
    // Fetch chunks
    const { data: chunks, error: chunksError } = await query;
    
    if (chunksError) {
      console.error('Error fetching chunks:', chunksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch chunks', details: chunksError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No chunks to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${chunks.length} chunks to process`);
    
    // Process chunks in batches for better rate limit handling
    let processedCount = 0;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchSuccess = await processChunkBatch(batch, supabaseClient);
      processedCount += batchSuccess;
      
      // Add a small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${processedCount}/${chunks.length} chunks`,
        processed: processedCount,
        total: chunks.length
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
