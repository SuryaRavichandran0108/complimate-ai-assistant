
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
      isComplete: data.isComplete || false
    };
  } catch (error) {
    console.error('Error in checkDocumentProcessingStatus:', error);
    throw error;
  }
};

export const triggerEmbeddingGeneration = async (documentId: string) => {
  try {
    // Trigger the embedding generation process
    const { data, error } = await supabase.functions
      .invoke('generate-embeddings', {
        body: { document_id: documentId }
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

// Add missing functions that are being imported by other components
export const askAgent = async (query: string, documentId?: string) => {
  try {
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
    
    return data;
  } catch (error) {
    console.error('Error in askAgent:', error);
    throw error;
  }
};

export const saveTaskFromSuggestion = async (
  userId: string, 
  documentId: string | null, 
  suggestion: string
) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: suggestion,
        document_id: documentId,
        category: documentId ? 'document' : 'general',
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
