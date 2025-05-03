import { supabase } from '@/integrations/supabase/client';

// Add these functions to support document processing status and embedding generation
export const checkDocumentProcessingStatus = async (documentId: string) => {
  try {
    // Get document processing status from Supabase
    const { data, error } = await supabase.functions
      .invoke('get-document-status', {
        body: { document_id: documentId }
      });
      
    if (error) {
      console.error('Error checking document status:', error);
      throw error;
    }
    
    return {
      total: data.total || 0,
      embedded: data.embedded || 0,
      progress: data.progress || 0,
      isComplete: data.isComplete || false,
      status: data.status || 'processing'
    };
  } catch (error) {
    console.error('Error in checkDocumentProcessingStatus:', error);
    throw error;
  }
};

export const triggerEmbeddingGeneration = async (documentId: string, retries = 3) => {
  try {
    // Trigger the embedding generation process
    const { data, error } = await supabase.functions
      .invoke('generate-embeddings', {
        body: { 
          document_id: documentId,
          retries: retries 
        }
      });
      
    if (error) {
      console.error('Error triggering embedding generation:', error);
      throw error;
    }
    
    return {
      success: true,
      total: data.total || 0,
      processed: data.processed || 0
    };
  } catch (error) {
    console.error('Error in triggerEmbeddingGeneration:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Improved askAgent function with better error handling and document status checks
export const askAgent = async (query: string, documentId?: string) => {
  try {
    // If a document is specified, check its status first
    if (documentId) {
      try {
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('status')
          .eq('id', documentId)
          .single();
          
        if (docError) {
          console.error('Error checking document status:', docError);
          throw new Error('Unable to check document status');
        }
        
        if (document && document.status !== 'ready') {
          return {
            error: true,
            message: document.status === 'processing' 
              ? "⚠️ This document is still processing. Please wait until processing is complete before asking questions."
              : "⚠️ This document encountered an error during processing. Please try re-uploading it.",
            status: document.status
          };
        }
        
        // Check if there are any chunks for this document
        const { count, error: countError } = await supabase
          .from('document_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', documentId)
          .not('embedding_vector', 'is', null);
          
        if (countError) {
          console.error('Error checking document chunks:', countError);
        } else if (count === 0) {
          return {
            error: true,
            message: "⚠️ No searchable content found in this document. It may still be processing or could not be embedded properly."
          };
        }
      } catch (error) {
        console.error('Error in document status check:', error);
        // Continue with the query anyway, the edge function will handle this case
      }
    }
    
    // Invoke the edge function with the query and optional document ID
    const { data, error } = await supabase.functions.invoke('ask-agent', {
      body: { 
        query,
        document_id: documentId
      }
    });
    
    if (error) {
      console.error('Error asking agent:', error);
      throw new Error(error.message || 'Failed to get a response from the agent.');
    }
    
    // Check if the edge function returned an error message
    if (data && data.error) {
      return {
        error: true,
        message: data.message || 'There was an error processing your request.',
        details: data.details
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error in askAgent:', error);
    return {
      error: true,
      message: error.message || 'Failed to get a response. Please try again later.'
    };
  }
};

export const saveTaskFromSuggestion = async (
  userId: string, 
  documentId: string | null, 
  suggestion: string,
  source: string = 'agent_suggestion'
) => {
  try {
    const { data, error } = await supabase
      .from('compliance_tasks')
      .insert({
        description: suggestion,
        status: 'open',
        created_by: userId,
        source_type: source,
        related_doc_id: documentId,
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error saving task:', error);
      throw error;
    }
    
    return { success: true, task: data };
  } catch (error) {
    console.error('Error in saveTaskFromSuggestion:', error);
    return { success: false, error };
  }
};

// Function to extract suggestions from AI response
export const extractSuggestions = (text: string): string[] => {
  if (!text) return [];
  
  // Regular expressions to match various suggestion patterns
  const patterns = [
    /(?:You should|Consider|We recommend|It is recommended to|It's recommended to|I recommend|Recommend to|You need to|You must|You could|You might want to|You may want to|You may need to|You might need to)[^.!?]+(\.|\!|\?)/gi,
    /(?:It would be beneficial to|It's important to|It is important to|It is crucial to|It's crucial to)[^.!?]+(\.|\!|\?)/gi,
    /(?:Make sure to|Ensure that|Be sure to)[^.!?]+(\.|\!|\?)/gi,
  ];
  
  let suggestions: string[] = [];
  
  // Apply each pattern to extract suggestions
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      suggestions = [...suggestions, ...matches];
    }
  });
  
  // Remove duplicates and clean up
  return [...new Set(suggestions)].map(s => s.trim());
};

export const getUserChatHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserChatHistory:', error);
    return [];
  }
};
