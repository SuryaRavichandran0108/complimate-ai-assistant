
import { supabase } from '@/integrations/supabase/client';

export interface DocumentContext {
  chunk_text: string;
  document_name: string;
  similarity: number;
}

export interface ChatResponse {
  id: string;
  query: string;
  response: string;
  compliantSections: string[];
  gaps: string[];
  suggestions: string[];
  document_id: string | null;
  created_at: string;
  documentContext?: DocumentContext[];
}

export interface ChatHistoryItem {
  id: string;
  query: string;
  response: string;
  document_id: string | null;
  created_at: string;
}

export const askAgent = async (query: string, documentId?: string) => {
  try {
    // We still need a user ID for database relations, but can use a dummy one for testing
    // or get the actual user ID if authenticated
    let userId = 'test-user-id';
    
    // Try to get the actual user ID if available
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      userId = userData.user.id;
    }

    const { data, error } = await supabase.functions.invoke('ask-agent', {
      body: { 
        query,
        document_id: documentId,
        user_id: userId
      },
    });

    if (error) throw error;
    
    return data as ChatResponse;
  } catch (error) {
    console.error('Error asking agent:', error);
    throw error;
  }
};

export const getUserChatHistory = async (userId: string, documentId?: string) => {
  try {
    let query = supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (documentId) {
      query = query.eq('document_id', documentId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data as ChatHistoryItem[];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
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
        document_id: documentId,
        title: suggestion,
        status: 'upcoming',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, task: data };
  } catch (error) {
    console.error('Error saving task:', error);
    return { success: false, error };
  }
};

// Add these utility functions to check document processing status 

export const checkDocumentProcessingStatus = async (documentId: string) => {
  try {
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, embedding_vector')
      .eq('document_id', documentId);
      
    if (error) throw error;
    
    const total = chunks?.length || 0;
    const embedded = chunks?.filter(c => c.embedding_vector).length || 0;
    
    return {
      total,
      embedded,
      progress: total > 0 ? Math.round((embedded / total) * 100) : 0,
      isComplete: total > 0 && embedded === total
    };
  } catch (error) {
    console.error('Error checking document processing status:', error);
    return { total: 0, embedded: 0, progress: 0, isComplete: false };
  }
};

export const triggerEmbeddingGeneration = async (documentId: string) => {
  try {
    // We need a user ID for security verification
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('User must be authenticated');
    }
    
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { 
        document_id: documentId,
        user_id: userData.user.id
      },
    });
    
    if (error) throw error;
    
    return { 
      success: true,
      processed: data.processed || 0,
      total: data.total || 0
    };
  } catch (error) {
    console.error('Error triggering embedding generation:', error);
    return { success: false, error };
  }
};
