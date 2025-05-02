
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
