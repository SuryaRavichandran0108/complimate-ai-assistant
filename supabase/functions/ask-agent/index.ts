import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

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

async function generateEmbedding(text: string): Promise<number[] | null> {
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
    return null;
  }
}

async function searchSimilarChunks(
  supabaseClient: any, 
  queryEmbedding: number[], 
  userId: string,
  documentId?: string,
  threshold = 0.7,
  limit = 5
): Promise<DocumentChunk[]> {
  try {
    // If document_id is provided, only search within that document
    // Otherwise, search across all user's documents
    let matchFunctionParams: any = {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      user_id: userId
    };
    
    // Use Postgres function for similarity search
    // This requires the match_document_chunks function to be created
    const { data, error } = await supabaseClient.rpc(
      'match_document_chunks', 
      matchFunctionParams
    );
    
    if (error) {
      console.error('Error searching similar chunks:', error);
      
      // If we don't have the vector search function or pgvector, fallback to simpler approach
      // In a real implementation, you would implement a JavaScript-based similarity search here
      
      // For now, just return chunks from the specified document or recent chunks
      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('document_chunks')
        .select(`
          id, 
          document_id, 
          chunk_text,
          documents!inner(name)
        `)
        .eq('documents.user_id', userId)
        .limit(limit)
        .order('created_at', { ascending: false });
        
      if (fallbackError) {
        console.error('Fallback search failed:', fallbackError);
        return [];
      }
      
      // Format the fallback results to match expected structure
      return (fallbackData || []).map((chunk: any) => ({
        id: chunk.id,
        document_id: chunk.document_id,
        chunk_text: chunk.chunk_text,
        document_name: chunk.documents.name,
        similarity: 0 // Not a real similarity score
      }));
    }
    
    return data || [];
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
  
  // Prepare context from document chunks
  let documentContext = '';
  if (documentChunks.length > 0) {
    documentContext = `
You are analyzing the following document excerpts:

${documentChunks.map((chunk, i) => `[EXCERPT ${i+1} from ${chunk.document_name}]
${chunk.chunk_text}
`).join('\n\n')}

Based on these excerpts, `;
  }
  
  const prompt = `
${documentContext}You are a compliance advisor for small U.S. businesses. ${documentChunks.length > 0 ? 'Use the provided excerpts to ' : ''}Answer this question:
"${query}"

Respond with 3 structured sections:
✅ Compliant Aspects:
⚠️ Noncompliant or Risky Areas:
💡 Recommended Improvements:

Use plain language. Reference relevant U.S. laws or common best practices if possible.
${documentChunks.length > 0 ? 'Make specific references to the document content when applicable.' : ''}
`

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  console.log("🔑 OpenAI API key present:", !!openaiKey);

  try {
    console.log("🔌 Making request to OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Updated to use an available model
        messages: [
          { role: 'system', content: 'You are a helpful compliance assistant for SMBs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });
    
    console.log("🔍 OpenAI response status:", response.status, response.statusText);
    
    const raw = await response.text();
    console.log("🔍 OpenAI raw body:", raw.substring(0, 500) + (raw.length > 500 ? "..." : ""));
    
    try {
      const data = JSON.parse(raw);
      const answer = data.choices?.[0]?.message?.content;
      
      if (!answer) {
        console.error("❌ No content in OpenAI response");
        return {
          rawResponse: `The agent couldn't generate a response. API returned: ${raw.substring(0, 200)}...`,
          compliantSections: [],
          gaps: [],
          suggestions: [],
          documentChunks: documentChunks.map(dc => ({
            chunk_text: dc.chunk_text,
            document_name: dc.document_name,
            similarity: dc.similarity
          }))
        };
      }
      
      return {
        rawResponse: answer,
        compliantSections: [],  // You can optionally parse these later
        gaps: [],
        suggestions: [],
        documentChunks: documentChunks.map(dc => ({
          chunk_text: dc.chunk_text,
          document_name: dc.document_name,
          similarity: dc.similarity
        }))
      };
    } catch (err) {
      console.error("❌ Failed to parse OpenAI response:", err);
      return {
        rawResponse: `The agent couldn't parse the AI response. Raw output: ${raw.substring(0, 200)}...`,
        compliantSections: [],
        gaps: [],
        suggestions: [],
        documentChunks: []
      };
    }
  } catch (err) {
    console.error("❌ Error calling OpenAI:", err);
    return {
      rawResponse: `The agent couldn't generate a response due to an error: ${err.message}`,
      compliantSections: [],
      gaps: [],
      suggestions: [],
      documentChunks: []
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log("🔐 Supabase URL and service key present:", !!supabaseUrl, !!supabaseServiceRoleKey);
    
    // Initialize Supabase client with service role key instead of user auth
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get request body
    const requestData: RequestBody = await req.json();
    const { query, document_id, user_id } = requestData;
    
    console.log("📩 Received request with query:", query);
    console.log("📄 Document ID:", document_id || "none");
    console.log("👤 User ID:", user_id);

    if (!query || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Query and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    } else {
      console.warn("⚠️ Could not generate embedding for query");
    }

    // Generate the response using LLM
    console.log("🤖 Generating AI response...");
    const aiResponse = await generateComplianceResponse(query, documentChunks);
    console.log("✅ AI response generated, length:", aiResponse.rawResponse.length);

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
      console.error('❌ Error saving chat:', error);
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
    console.error('❌ Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
