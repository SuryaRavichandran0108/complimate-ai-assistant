
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful compliance assistant for SMBs.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  })

  const data = await response.json()
  const answer = data.choices?.[0]?.message?.content ?? "The agent couldn't generate a response."

  return {
    rawResponse: answer,
    compliantSections: [],  // You can optionally parse these from the LLM response later
    gaps: [],
    suggestions: []
  }
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get request body
    const requestData: RequestBody = await req.json();
    const { query, document_id, user_id } = requestData;

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
        return new Response(
          JSON.stringify({ error: 'Document not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // In a real implementation, you would extract text from the document here
      documentContent = `Sample text extracted from ${docData.name}`;
    }

    // Generate the response using LLM (mocked for now)
    const aiResponse = await generateComplianceResponse(query, documentContent);

    // Save the chat history
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

    if (chatError) {
      console.error('Error saving chat:', chatError);
    }

    return new Response(
      JSON.stringify({
        id: chatData?.id,
        query,
        response: aiResponse.rawResponse,
        compliantSections: aiResponse.compliantSections,
        gaps: aiResponse.gaps,
        suggestions: aiResponse.suggestions,
        document_id: document_id || null,
        created_at: chatData?.created_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
