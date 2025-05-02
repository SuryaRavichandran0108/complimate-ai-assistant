
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { checkDocumentProcessingStatus, triggerEmbeddingGeneration } from '@/utils/chatService';
import { useToast } from '@/hooks/use-toast';

interface DocumentProcessingStatusProps {
  documentId: string;
  onComplete?: () => void;
}

export type ProcessingStatus = 'not_started' | 'processing' | 'ready' | 'error';

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
    isProcessing: false,
    hasError: false,
    processingStatus: 'not_started' as ProcessingStatus
  });
  const { toast } = useToast();
  
  const checkStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true }));
      const processingStatus = await checkDocumentProcessingStatus(documentId);
      
      const newProcessingStatus: ProcessingStatus = 
        processingStatus.status === 'ready' ? 'ready' : 
        processingStatus.status === 'error' ? 'error' : 
        processingStatus.total > 0 ? 'processing' : 
        'not_started';
      
      setStatus({
        ...processingStatus,
        isLoading: false,
        isProcessing: false,
        hasError: newProcessingStatus === 'error',
        processingStatus: newProcessingStatus
      });
      
      if (newProcessingStatus === 'ready' && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error checking document status:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        isProcessing: false,
        hasError: true,
        processingStatus: 'error'
      }));
    }
  };
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (documentId) {
      checkStatus();
      
      // Check status every 10 seconds if document is processing
      interval = setInterval(() => {
        if (status.processingStatus === 'processing' || status.processingStatus === 'not_started') {
          checkStatus();
        }
      }, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [documentId, status.processingStatus]);
  
  const handleTriggerEmbedding = async () => {
    setStatus(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const result = await triggerEmbeddingGeneration(documentId);
      
      if (result.success) {
        toast({
          title: "Processing started",
          description: `Processing ${result.total} chunks. This may take a few minutes.`,
        });
        
        setStatus(prev => ({
          ...prev,
          processingStatus: 'processing'
        }));
        
        // Check status again after a delay
        setTimeout(checkStatus, 5000);
      } else {
        throw new Error('Failed to start document processing');
      }
    } catch (error) {
      console.error('Error triggering embedding:', error);
      toast({
        title: "Processing failed",
        description: "Failed to start document processing.",
        variant: "destructive",
      });
      
      setStatus(prev => ({
        ...prev,
        isProcessing: false,
        hasError: true,
        processingStatus: 'error'
      }));
    }
  };
  
  const renderStatus = () => {
    switch (status.processingStatus) {
      case 'ready':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 transition-colors flex items-center gap-1">
            <CheckCircle2 size={12} /> Ready for Analysis
          </Badge>
        );
        
      case 'processing':
        return (
          <div className="space-y-1 min-h-[40px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} /> Processing document ({status.embedded}/{status.total} chunks)
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
        
      case 'error':
        return (
          <div className="space-y-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle size={12} /> Processing Error
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={handleTriggerEmbedding}
              disabled={status.isProcessing}
            >
              {status.isProcessing ? 'Retrying...' : 'Retry Processing'}
            </Button>
          </div>
        );
        
      case 'not_started':
      default:
        return (
          <div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock size={12} /> Not yet processed
            </Badge>
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
  };
  
  return (
    <div className="mt-2 min-h-[30px]">
      {renderStatus()}
    </div>
  );
};

export default DocumentProcessingStatus;
