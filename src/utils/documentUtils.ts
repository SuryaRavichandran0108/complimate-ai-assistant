
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
    
    return { success: true, document: data };
  } catch (error) {
    console.error('Error uploading document:', error);
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
