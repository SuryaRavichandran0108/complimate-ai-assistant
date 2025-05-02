
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

const generateComplianceResponse = async (query: string, documentContent?: string) => {
  // Mock LLM response for now (you would replace this with an actual OpenAI or Claude call)
  let responseContent = '';
  let compliantSections = [];
  let gaps = [];
  let suggestions = [];

  // Different responses based on query type
  if (query.toLowerCase().includes('gdpr')) {
    compliantSections = ['Data subject rights section', 'Lawful processing basis'];
    gaps = ['Missing data retention policy', 'No defined DPO role'];
    suggestions = ['Add clear retention schedules', 'Designate a Data Protection Officer'];
  } else if (query.toLowerCase().includes('hipaa')) {
    compliantSections = ['Patient consent procedures', 'Access controls'];
    gaps = ['Missing breach notification process', 'Weak technical safeguards'];
    suggestions = ['Add breach notification timeline', 'Implement stronger encryption'];
  } else if (query.toLowerCase().includes('soc 2')) {
    compliantSections = ['Security controls', 'Audit logging'];
    gaps = ['Missing vendor assessment procedure', 'Insufficient disaster recovery'];
    suggestions = ['Create vendor assessment program', 'Develop disaster recovery protocol'];
  } else {
    compliantSections = ['General compliance framework', 'Documentation structure'];
    gaps = ['Needs more specificity in key areas', 'Missing implementation details'];
    suggestions = ['Add concrete procedures', 'Include sample forms/templates'];
  }

  // Structure the response
  responseContent = `
## Analysis Results

### ✅ Compliant Sections
${compliantSections.map(item => `- ${item}`).join('\n')}

### ⚠️ Identified Gaps / Risks
${gaps.map(item => `- ${item}`).join('\n')}

### 💡 Suggested Changes
${suggestions.map(item => `- ${item}`).join('\n')}
  `;

  return {
    rawResponse: responseContent,
    compliantSections,
    gaps,
    suggestions
  };
};

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
