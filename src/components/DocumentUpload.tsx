
import React, { useState } from 'react';
import { Upload, X, FileText, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { uploadDocument } from '@/utils/documentUtils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface DocumentUploadProps {
  onUploadComplete?: (documentId: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean;
    progress: number;
    error: string | null;
  }>({
    isUploading: false,
    progress: 0,
    error: null
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const validateAndSetFile = (file: File) => {
    const fileType = file.type;
    const fileSize = file.size;
    
    if (fileType === 'application/pdf' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'text/plain') {
      
      if (fileSize <= 10 * 1024 * 1024) { // 10MB max
        setFile(file);
        setUploadState(prev => ({ ...prev, error: null }));
      } else {
        setUploadState(prev => ({ 
          ...prev, 
          error: "File too large. Please upload a file smaller than 10MB."
        }));
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
      }
    } else {
      setUploadState(prev => ({ 
        ...prev, 
        error: "Invalid file type. Please upload a PDF, DOCX, or TXT file."
      }));
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null
    });
  };

  const simulateProgress = () => {
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 95) {
        progress = 95; // Max out at 95% until actual completion
        clearInterval(interval);
      }
      setUploadState(prev => ({ ...prev, progress: Math.min(95, progress) }));
    }, 300);
    
    return () => clearInterval(interval);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null
    });
    
    // Start progress simulation
    const stopProgress = simulateProgress();
    
    try {
      const result = await uploadDocument(file, user.id);
      
      // Stop progress simulation
      stopProgress();
      
      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          progress: 100
        }));
        
        toast({
          title: "✅ Document successfully uploaded",
          description: "Processing in background...",
        });
        
        setFile(null);
        
        if (onUploadComplete && result.document) {
          onUploadComplete(result.document.id);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      stopProgress();
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: "Upload failed. Please try again."
      }));
      
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
        isDragging ? 'border-complimate-purple bg-complimate-soft-gray' : 'border-gray-300'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {uploadState.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {uploadState.error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col items-center justify-center space-y-4">
        {!file ? (
          <>
            <div className="p-3 bg-complimate-soft-gray rounded-full">
              <Upload className="h-6 w-6 text-complimate-purple" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-gray-900">
                Upload a policy, handbook, or document you want reviewed
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOCX, or TXT up to 10MB
              </p>
            </div>
            <div className="mt-2">
              <label htmlFor="file-upload" className="inline-block cursor-pointer bg-complimate-purple hover:bg-complimate-purple/90 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200">
                Select a file
                <input id="file-upload" name="file-upload" type="file" accept=".pdf,.docx,.txt" className="sr-only" onChange={handleFileChange} />
              </label>
            </div>
            <p className="text-xs text-gray-500">or drag and drop</p>
          </>
        ) : uploadState.isUploading ? (
          <>
            <div className="p-3 bg-complimate-soft-gray rounded-full animate-pulse">
              <Upload className="h-6 w-6 text-complimate-purple" />
            </div>
            <p className="text-sm font-medium text-gray-900">Uploading {file.name}</p>
            <div className="w-full max-w-xs">
              <Progress value={uploadState.progress} className="h-2" />
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {Math.round(uploadState.progress)}%
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-complimate-soft-gray rounded-full">
              <FileText className="h-6 w-6 text-complimate-purple" />
            </div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRemoveFile}
                className="flex items-center gap-1"
              >
                <X size={14} /> Remove
              </Button>
              <Button 
                size="sm" 
                onClick={handleUpload} 
                disabled={uploadState.isUploading} 
                className="flex items-center gap-1"
              >
                <Upload size={14} /> Upload
              </Button>
            </div>
          </>
        )}
      </div>
      
      {!user && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" size={18} />
          <p className="text-sm text-foreground">Please sign in to upload documents.</p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
