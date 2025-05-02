
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
const RETRY_DELAY_MS = 1000;
const MIN_CHUNK_LENGTH = 50; // Minimum words in a chunk

interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
}

async function generateEmbedding(text: string, retries = 0): Promise<number[] | null> {
  // Skip short text chunks
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < MIN_CHUNK_LENGTH) {
    console.log(`Skipping chunk with only ${wordCount} words (minimum ${MIN_CHUNK_LENGTH})`);
    return null;
  }
  
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
        const delayMs = RETRY_DELAY_MS * Math.pow(2, retries); // Exponential backoff
        console.log(`Retrying in ${delayMs}ms (${retries + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return generateEmbedding(text, retries + 1);
      }
      
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    if (retries < MAX_RETRIES) {
      const delayMs = RETRY_DELAY_MS * Math.pow(2, retries); // Exponential backoff
      console.log(`Retrying in ${delayMs}ms (${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
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
      
      // Skip chunks that are too short
      const wordCount = chunk.chunk_text.trim().split(/\s+/).length;
      if (wordCount < MIN_CHUNK_LENGTH) {
        console.log(`Skipping chunk ${chunk.id} with only ${wordCount} words (minimum ${MIN_CHUNK_LENGTH})`);
        
        // Mark as skipped by setting a flag in metadata
        await supabaseClient
          .from('document_chunks')
          .update({ 
            embedding_vector: [],
            chunk_metadata: { ...chunk.chunk_metadata, skipped: true, reason: 'too_short', word_count: wordCount }
          })
          .eq('id', chunk.id);
        
        continue;
      }
      
      // Generate embedding for chunk text
      const embedding = await generateEmbedding(chunk.chunk_text);
      
      if (!embedding) {
        console.error(`Failed to generate embedding for chunk ${chunk.id}`);
        
        // Mark as failed
        await supabaseClient
          .from('document_chunks')
          .update({ 
            chunk_metadata: { ...chunk.chunk_metadata, embedding_failed: true }
          })
          .eq('id', chunk.id);
        
        continue;
      }
      
      // Update chunk with embedding
      const { error } = await supabaseClient
        .from('document_chunks')
        .update({ 
          embedding_vector: embedding,
          chunk_metadata: { ...chunk.chunk_metadata, embedding_completed: true }
        })
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

async function updateDocumentStatus(documentId: string, supabaseClient: any) {
  try {
    // Check total chunks
    const { count: totalCount, error: countError } = await supabaseClient
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId);
      
    if (countError) throw countError;
    
    if (totalCount === 0) {
      // No chunks found, mark as error
      await supabaseClient
        .from('documents')
        .update({ status: 'error' })
        .eq('id', documentId);
      
      return false;
    }
    
    // Get embedded chunks (including skipped ones)
    const { count: embeddedCount, error: embeddedError } = await supabaseClient
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId)
      .not('embedding_vector', 'is', null);
      
    if (embeddedError) throw embeddedError;
    
    const isComplete = embeddedCount === totalCount;
    
    if (isComplete) {
      // All chunks are embedded, mark as ready
      await supabaseClient
        .from('documents')
        .update({ status: 'ready' })
        .eq('id', documentId);
      
      console.log(`Document ${documentId} marked as ready (${embeddedCount}/${totalCount} chunks embedded)`);
      return true;
    }
    
    // Still processing
    console.log(`Document ${documentId} still processing (${embeddedCount}/${totalCount} chunks embedded)`);
    return false;
  } catch (error) {
    console.error(`Error updating document status:`, error);
    return false;
  }
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
    const { document_id, user_id, limit = 50, retries = MAX_RETRIES } = requestData;
    
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
      .select('id, document_id, chunk_text, chunk_index, chunk_metadata')
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
      // No chunks to process, check if processing is complete
      if (document_id) {
        const isComplete = await updateDocumentStatus(document_id, supabaseClient);
        
        return new Response(
          JSON.stringify({ 
            message: isComplete ? 'Document processing complete' : 'No more chunks to process',
            processed: 0,
            status: isComplete ? 'ready' : 'processing'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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
    
    // Update document status if processing a single document
    if (document_id) {
      await updateDocumentStatus(document_id, supabaseClient);
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
