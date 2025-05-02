
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

const generateComplianceResponse = async (query: string, documentContent = '') => {
  console.log("🚀 Starting generateComplianceResponse with query:", query);
  console.log("📄 Document content length:", documentContent.length);
  
  const prompt = `
You are a compliance advisor for small U.S. businesses. A user uploaded this document:

"""${documentContent}"""

They asked this question:
"${query}"

Respond with 3 structured sections:
✅ Compliant Aspects:
⚠️ Noncompliant or Risky Areas:
💡 Recommended Improvements:

Use plain language. Reference relevant U.S. laws or common best practices if possible.
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
          suggestions: []
        };
      }
      
      return {
        rawResponse: answer,
        compliantSections: [],  // You can optionally parse these later
        gaps: [],
        suggestions: []
      };
    } catch (err) {
      console.error("❌ Failed to parse OpenAI response:", err);
      return {
        rawResponse: `The agent couldn't parse the AI response. Raw output: ${raw.substring(0, 200)}...`,
        compliantSections: [],
        gaps: [],
        suggestions: []
      };
    }
  } catch (err) {
    console.error("❌ Error calling OpenAI:", err);
    return {
      rawResponse: `The agent couldn't generate a response due to an error: ${err.message}`,
      compliantSections: [],
      gaps: [],
      suggestions: []
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

    // If document_id is provided, get the document content
    let documentContent = '';
    if (document_id) {
      // Fetch document metadata
      const { data: docData, error: docError } = await supabaseClient
        .from('documents')
        .select('*')
        .eq('id', document_id)
        .single();

      if (docError || !docData) {
        console.error("❌ Error fetching document:", docError);
        return new Response(
          JSON.stringify({ error: 'Document not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log("📃 Found document:", docData.name);
      // In a real implementation, you would extract text from the document here
      documentContent = `Sample text extracted from ${docData.name}`;
    }

    // Generate the response using LLM
    console.log("🤖 Generating AI response...");
    const aiResponse = await generateComplianceResponse(query, documentContent);
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
