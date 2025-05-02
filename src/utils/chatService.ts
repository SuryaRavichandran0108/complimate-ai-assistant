
import { supabase } from '@/integrations/supabase/client';

export interface ChatResponse {
  id: string;
  query: string;
  response: string;
  compliantSections: string[];
  gaps: string[];
  suggestions: string[];
  document_id: string | null;
  created_at: string;
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
