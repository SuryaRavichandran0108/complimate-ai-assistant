
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Document {
  id: string;
  name: string;
  type: string;
  storage_path: string;
  user_id: string;
}

interface DocumentChunk {
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  chunk_metadata?: Record<string, any>;
}

// Function to split text into chunks
function chunkText(text: string, chunkSize: number = 250, overlap: number = 20): string[] {
  const chunks: string[] = [];
  
  // Simple approach: split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk and start new one
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Add overlap from previous chunk
      const words = currentChunk.split(' ');
      const overlapText = words.slice(-overlap).join(' ');
      currentChunk = overlapText + ' ' + paragraph;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + paragraph;
    }
    
    // Check if current chunk is large enough to split
    while (currentChunk.length > chunkSize) {
      // Find a good split point around chunkSize
      const splitPoint = currentChunk.lastIndexOf('. ', chunkSize);
      if (splitPoint > chunkSize / 2) {
        chunks.push(currentChunk.slice(0, splitPoint + 1).trim());
        
        // Add overlap
        const overlapStart = Math.max(0, splitPoint - overlap * 10);
        currentChunk = currentChunk.slice(overlapStart);
      } else {
        // No good sentence boundary, just split at chunkSize
        chunks.push(currentChunk.slice(0, chunkSize).trim());
        currentChunk = currentChunk.slice(chunkSize - (overlap * 10));
      }
    }
  }
  
  // Add the last chunk if there's anything left
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

async function extractTextFromUrl(url: string, fileType: string): Promise<string> {
  console.log(`Extracting text from ${url} of type ${fileType}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
    }
    
    // For this demo, we're simulating text extraction
    // In a real implementation, you would use specific libraries based on file type
    const blob = await response.blob();
    
    // Simple text extraction simulation
    // In production, use proper PDF/DOCX extraction libraries
    let text = "";
    
    if (fileType === 'text/plain') {
      text = await blob.text();
    } else if (fileType.includes('pdf') || fileType.includes('word')) {
      // Simulating extracted text - in production use proper extraction
      text = `This is simulated extracted text from ${fileType} document. 
      In a production environment, you would use proper libraries to extract text.
      For PDF files, you might use pdf.js or a server-side library.
      For Word documents, you might use mammoth.js or a similar library.
      
      Multiple paragraphs would be extracted from the document.
      These would be processed and split into semantic chunks.
      
      The chunks would then be embedded using OpenAI's embedding API.
      These embeddings would be stored in the database for retrieval.
      
      When a user asks a question, their query would be embedded.
      Similar chunks would be retrieved using vector similarity.
      These chunks would be used as context for the LLM to generate an answer.`;
    } else {
      text = "Unsupported document type for text extraction.";
    }
    
    return text;
  } catch (error) {
    console.error("Error extracting text:", error);
    return "";
  }
}

async function processDocument(doc: Document, supabaseClient: any): Promise<boolean> {
  console.log(`Processing document: ${doc.name} (${doc.id})`);
  
  try {
    // Get signed URL to access the document
    const { data: urlData, error: urlError } = await supabaseClient.storage
      .from('compliance_documents')
      .createSignedUrl(doc.storage_path, 60);
    
    if (urlError) {
      console.error("Error getting signed URL:", urlError);
      return false;
    }
    
    // Extract text from the document
    const extractedText = await extractTextFromUrl(urlData.signedUrl, doc.type);
    
    if (!extractedText) {
      console.error("Failed to extract text from document");
      return false;
    }
    
    console.log(`Extracted ${extractedText.length} characters from document`);
    
    // Split text into chunks
    const chunks = chunkText(extractedText);
    console.log(`Created ${chunks.length} chunks from document`);
    
    // Insert chunks into database
    const chunkInsertPromises = chunks.map((chunk, index) => {
      const chunkData: DocumentChunk = {
        document_id: doc.id,
        chunk_text: chunk,
        chunk_index: index,
        chunk_metadata: { 
          character_count: chunk.length,
          word_count: chunk.split(/\s+/).length,
        }
      };
      
      return supabaseClient
        .from('document_chunks')
        .insert(chunkData);
    });
    
    const results = await Promise.all(chunkInsertPromises);
    
    // Check for errors
    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
      console.error(`${errors.length} errors inserting chunks:`, errors[0]);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error processing document:", error);
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
    const { document_id, user_id } = requestData;
    
    if (!document_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Document ID and user ID are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch document details
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .eq('user_id', user_id)
      .single();
    
    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found or not authorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process the document
    const success = await processDocument(document, supabaseClient);
    
    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to process document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Document processed successfully' }),
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
