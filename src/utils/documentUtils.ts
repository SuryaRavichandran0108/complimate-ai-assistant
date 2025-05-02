
import { supabase } from '@/integrations/supabase/client';

export const uploadDocument = async (file: File, userId: string) => {
  try {
    // Create a storage path using the user ID
    const folderPath = `${userId}`;
    const filePath = `${folderPath}/${Date.now()}_${file.name}`;
    
    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('compliance_documents')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    // Store document metadata in the database
    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        name: file.name,
        type: file.type,
        size: file.size,
        storage_path: filePath,
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // Trigger document processing
    if (data) {
      processDocument(data.id, userId);
    }
    
    return { success: true, document: data };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { success: false, error };
  }
};

export const processDocument = async (documentId: string, userId: string) => {
  try {
    // Call the process-document edge function
    const { data: processResult, error: processError } = await supabase.functions
      .invoke('process-document', {
        body: { 
          document_id: documentId,
          user_id: userId
        }
      });
    
    if (processError) {
      console.error('Error processing document:', processError);
      return { success: false, error: processError };
    }
    
    // Generate embeddings for the document chunks
    const { data: embedResult, error: embedError } = await supabase.functions
      .invoke('generate-embeddings', {
        body: { 
          document_id: documentId,
          user_id: userId,
          limit: 20 // Process up to 20 chunks at a time
        }
      });
    
    if (embedError) {
      console.error('Error generating embeddings:', embedError);
      // Still return success since document processing worked
    }
    
    return { 
      success: true, 
      processed: processResult?.success,
      embedded: embedResult?.processed || 0
    };
  } catch (error) {
    console.error('Error in document processing workflow:', error);
    return { success: false, error };
  }
};

export const getDocumentUrl = async (storagePath: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('compliance_documents')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting document URL:', error);
    return null;
  }
};

export const getUserDocuments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

export const deleteDocument = async (documentId: string, storagePath: string) => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('compliance_documents')
      .remove([storagePath]);
    
    if (storageError) throw storageError;
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (dbError) throw dbError;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error };
  }
};

export const getDocumentChunks = async (documentId: string) => {
  try {
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching document chunks:', error);
    return [];
  }
};

export const getDocumentProcessingStatus = async (documentId: string) => {
  try {
    // Get total chunks
    const { count: totalCount, error: countError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId);
      
    if (countError) throw countError;
    
    // Get embedded chunks
    const { count: embeddedCount, error: embeddedError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId)
      .not('embedding_vector', 'is', null);
      
    if (embeddedError) throw embeddedError;
    
    return {
      total: totalCount || 0,
      embedded: embeddedCount || 0,
      isComplete: totalCount > 0 && embeddedCount === totalCount,
      progress: totalCount ? Math.round((embeddedCount / totalCount) * 100) : 0
    };
  } catch (error) {
    console.error('Error getting document processing status:', error);
    return { total: 0, embedded: 0, isComplete: false, progress: 0 };
  }
};
