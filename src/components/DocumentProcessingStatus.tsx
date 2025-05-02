
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { checkDocumentProcessingStatus, triggerEmbeddingGeneration } from '@/utils/chatService';
import { useToast } from '@/hooks/use-toast';

interface DocumentProcessingStatusProps {
  documentId: string;
  onComplete?: () => void;
}

const DocumentProcessingStatus: React.FC<DocumentProcessingStatusProps> = ({ 
  documentId,
  onComplete
}) => {
  const [status, setStatus] = useState({
    total: 0,
    embedded: 0,
    progress: 0,
    isComplete: false,
    isLoading: true,
    isProcessing: false
  });
  const { toast } = useToast();
  
  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));
    const processingStatus = await checkDocumentProcessingStatus(documentId);
    setStatus({
      ...processingStatus,
      isLoading: false,
      isProcessing: false
    });
    
    if (processingStatus.isComplete && onComplete) {
      onComplete();
    }
  };
  
  useEffect(() => {
    if (documentId) {
      checkStatus();
      
      // Check status every 10 seconds
      const interval = setInterval(checkStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [documentId]);
  
  const handleTriggerEmbedding = async () => {
    setStatus(prev => ({ ...prev, isProcessing: true }));
    
    const result = await triggerEmbeddingGeneration(documentId);
    
    if (result.success) {
      toast({
        title: "Processing started",
        description: `Processing ${result.total} chunks. This may take a few minutes.`,
      });
      
      // Check status again after a delay
      setTimeout(checkStatus, 5000);
    } else {
      toast({
        title: "Processing failed",
        description: "Failed to start document processing.",
        variant: "destructive",
      });
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };
  
  if (status.isComplete) {
    return (
      <div className="mt-2">
        <Badge className="bg-green-500">Processing Complete</Badge>
      </div>
    );
  }
  
  if (status.total === 0) {
    return (
      <div className="mt-2">
        <Badge variant="outline">Not yet processed</Badge>
        <Button 
          size="sm"
          variant="outline"
          className="ml-2"
          onClick={handleTriggerEmbedding}
          disabled={status.isProcessing}
        >
          {status.isProcessing ? 'Starting...' : 'Start Processing'}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">
          Processing document ({status.embedded}/{status.total} chunks)
        </span>
        <Button 
          size="icon" 
          variant="ghost" 
          className="w-6 h-6" 
          onClick={checkStatus} 
          disabled={status.isLoading}
        >
          <RefreshCw 
            size={14} 
            className={`${status.isLoading ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>
      <Progress value={status.progress} className="h-1" />
    </div>
  );
};

export default DocumentProcessingStatus;
