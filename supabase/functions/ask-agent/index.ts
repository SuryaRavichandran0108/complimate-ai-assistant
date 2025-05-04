
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  query: string;
  document_id?: string;
  user_id: string;
}

interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  document_name: string;
  similarity: number;
}

const MIN_CHUNK_LENGTH = 30; // Minimum words in a chunk
const SIMILARITY_THRESHOLD = 0.75; // Minimum similarity score for relevant chunks

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
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    if (retries < 3) {
      // Exponential backoff for retries
      const delay = 1000 * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateEmbedding(text, retries + 1);
    }
    
    return null;
  }
}

async function validateDocument(
  supabaseClient: any,
  documentId: string,
  userId: string
): Promise<{ valid: boolean; status?: string; message?: string }> {
  try {
    // Check if document exists and belongs to user
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('status')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();
      
    if (docError) {
      console.error('Error validating document:', docError);
      return { valid: false, message: 'Document not found or you do not have access to it' };
    }
    
    // Check document status
    if (document.status !== 'ready') {
      return { 
        valid: false, 
        status: document.status,
        message: document.status === 'processing'
          ? 'Document is still processing. Please wait.'
          : 'Document processing failed. Please try re-uploading.'
      };
    }
    
    // Check if document has chunks
    const { count, error: countError } = await supabaseClient
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId)
      .not('embedding_vector', 'is', null);
    
    if (countError) {
      console.error('Error counting document chunks:', countError);
      return { valid: false, message: 'Failed to validate document chunks' };
    }
    
    if (!count || count === 0) {
      return { valid: false, message: 'No searchable content found in this document' };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Error in validateDocument:', error);
    return { valid: false, message: 'Error validating document' };
  }
}

async function searchSimilarChunks(
  supabaseClient: any, 
  queryEmbedding: number[], 
  userId: string,
  documentId?: string,
  threshold = SIMILARITY_THRESHOLD,
  limit = 5
): Promise<DocumentChunk[]> {
  try {
    // If document_id is provided, verify document first
    if (documentId) {
      const validation = await validateDocument(supabaseClient, documentId, userId);
      if (!validation.valid) {
        console.error('Document validation failed:', validation.message);
        return [];
      }
    }
    
    // Prepare the match parameters
    let matchFunctionParams: any = {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      user_id: userId
    };
    
    // Add document_id if provided
    if (documentId) {
      matchFunctionParams.document_id = documentId;
    }
    
    // Use Postgres function for similarity search
    const { data, error } = await supabaseClient.rpc(
      'match_document_chunks', 
      matchFunctionParams
    );
    
    if (error) {
      console.error('Error searching similar chunks:', error);
      
      // Fallback approach
      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('document_chunks')
        .select(`
          id, 
          document_id, 
          chunk_text,
          chunk_metadata,
          documents!inner(name, user_id)
        `)
        .eq('documents.user_id', userId)
        .limit(limit)
        .order('created_at', { ascending: false });
        
      if (fallbackError) {
        console.error('Fallback search failed:', fallbackError);
        return [];
      }
      
      // Filter out chunks that are too short
      const validChunks = (fallbackData || []).filter(chunk => {
        const wordCount = chunk.chunk_text.trim().split(/\s+/).length;
        return wordCount >= MIN_CHUNK_LENGTH;
      });
      
      // Format the fallback results to match expected structure
      return validChunks.map((chunk: any) => ({
        id: chunk.id,
        document_id: chunk.document_id,
        chunk_text: chunk.chunk_text,
        document_name: chunk.documents.name,
        similarity: 0 // Not a real similarity score
      }));
    }
    
    // Filter out chunks that are too short
    return (data || []).filter((chunk: DocumentChunk) => {
      const wordCount = chunk.chunk_text.trim().split(/\s+/).length;
      return wordCount >= MIN_CHUNK_LENGTH;
    });
  } catch (error) {
    console.error('Error in chunk similarity search:', error);
    return [];
  }
}

const generateComplianceResponse = async (
  query: string, 
  documentChunks: DocumentChunk[] = []
) => {
  console.log("🚀 Starting generateComplianceResponse with query:", query);
  console.log("📄 Document chunks:", documentChunks.length);
  
  try {
    // Prepare context from document chunks
    let documentContext = '';
    let useDocumentPrompt = documentChunks.length > 0;
    
    if (useDocumentPrompt) {
      documentContext = documentChunks.map((chunk, i) => 
        `[EXCERPT ${i+1} from ${chunk.document_name}]\n${chunk.chunk_text}\n`
      ).join('\n\n');
    }
    
    // Choose the appropriate prompt based on whether we have document context
    const prompt = useDocumentPrompt ? 
      `You are a compliance auditor AI reviewing uploaded internal documents.

Answer the user's question strictly using the document excerpts provided below. Do not rely on prior knowledge unless instructed.

If the document excerpts do not mention the topic, say clearly:
"This document does not appear to contain information related to [insert topic or keyword here]."

If excerpts are relevant, summarize them with exact section references or quoted lines where appropriate.

📄 Document Context:
${documentContext}

🧠 User Question:
"${query}"

💬 Your Answer:` :
      `You are an AI compliance assistant. The user asked a question, but no relevant content was found in their uploaded documents. Please answer using general compliance knowledge and label your response as general guidance.

User question: "${query}"

Please start your response with: "Based on general compliance knowledge (not your specific document):"`;

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log("🔌 Making request to OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful compliance assistant for SMBs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });
    
    console.log("🔍 OpenAI response status:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    
    if (!answer) {
      console.error("❌ No content in OpenAI response");
      throw new Error('No content in AI response');
    }
    
    // Extract suggested tasks from the response
    const suggestionsRegex = /💡\s*Recommended\s*Improvements:([^#]*?)(?:\n\n|$)/is;
    const suggestionsMatch = answer.match(suggestionsRegex);
    let suggestions = [];
    
    if (suggestionsMatch && suggestionsMatch[1]) {
      // Extract bullet points from the suggestions section
      const bulletPoints = suggestionsMatch[1].match(/[•\-\*]\s*([^\n]+)/g);
      if (bulletPoints) {
        suggestions = bulletPoints.map(point => 
          point.replace(/^[•\-\*]\s*/, '').trim()
        );
      }
    }
    
    return {
      rawResponse: answer,
      compliantSections: [],  // Could parse these out as well
      gaps: [],
      suggestions: suggestions,
      documentChunks: documentChunks.map(dc => ({
        chunk_text: dc.chunk_text,
        document_name: dc.document_name,
        similarity: dc.similarity
      }))
    };
  } catch (err) {
    console.error("❌ Error generating compliance response:", err);
    throw err;
  }
}

function logError(error: any, context: string) {
  console.error(`❌ Error in ${context}:`, error);
  
  // In a production system, you might want to log this to a centralized error tracking system
  // For now, we'll just log it to the console with a consistent format
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    message: error.message || 'Unknown error',
    stack: error.stack,
  };
  
  console.error('ERROR_LOG:', JSON.stringify(errorLog));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Initialize Supabase client with service role key instead of user auth
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get request body
    const requestData: RequestBody = await req.json();
    const { query, document_id, user_id } = requestData;
    
    console.log("📩 Received request with query:", query);
    console.log("📄 Document ID:", document_id || "none");
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: true, message: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (document_id) {
      // Validate document status before proceeding
      const validation = await validateDocument(supabaseClient, document_id, user_id);
      
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ 
            error: true, 
            status: validation.status || 'error',
            message: validation.message || 'Document validation failed' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate embedding for the query for similarity search
    let documentChunks: DocumentChunk[] = [];
    const queryEmbedding = await generateEmbedding(query);
    
    if (queryEmbedding) {
      // Search for similar document chunks
      documentChunks = await searchSimilarChunks(
        supabaseClient, 
        queryEmbedding, 
        user_id, 
        document_id
      );
      
      console.log(`📚 Found ${documentChunks.length} relevant document chunks`);
      
      if (document_id && documentChunks.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: true,
            message: "No relevant context found in this document. Try rephrasing your question."
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.warn("⚠️ Could not generate embedding for query");
    }

    // Generate the response using LLM
    console.log("🤖 Generating AI response...");
    let aiResponse;
    try {
      aiResponse = await generateComplianceResponse(query, documentChunks);
      console.log("✅ AI response generated, length:", aiResponse.rawResponse.length);
    } catch (error) {
      logError(error, 'generateComplianceResponse');
      
      return new Response(
        JSON.stringify({ 
          error: true,
          message: "Failed to generate an AI response. Please try again later."
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save the chat history if authenticated
    let chatId = null;
    try {
      const { data: chatData, error: chatError } = await supabaseClient
        .from('chats')
        .insert({
          user_id,
          document_id: document_id || null,
          query,
          response: aiResponse.rawResponse,
        })
        .select()
        .single();

      if (!chatError) {
        chatId = chatData?.id;
        console.log("💾 Chat saved with ID:", chatId);
      } else {
        console.error("❌ Error saving chat:", chatError);
      }
    } catch (error) {
      logError(error, 'saveChat');
      // Continue even if chat saving fails
    }

    return new Response(
      JSON.stringify({
        id: chatId,
        query,
        response: aiResponse.rawResponse,
        compliantSections: aiResponse.compliantSections,
        gaps: aiResponse.gaps,
        suggestions: aiResponse.suggestions,
        document_id: document_id || null,
        created_at: new Date().toISOString(),
        documentContext: aiResponse.documentChunks
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logError(error, 'askAgent');
    
    return new Response(
      JSON.stringify({ error: true, message: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
