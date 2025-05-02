
import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { uploadDocument } from '@/utils/documentUtils';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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
      } else {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    
    setLoading(true);
    const result = await uploadDocument(file, user.id);
    
    if (result.success) {
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully and is being processed.",
      });
      setFile(null);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } else {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-complimate-purple bg-complimate-soft-gray' : 'border-gray-300'
      } transition-colors duration-200`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
                disabled={loading} 
                className="flex items-center gap-1"
              >
                <Upload size={14} /> {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </>
        )}
      </div>
      
      {!user && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md flex items-center gap-2">
          <AlertCircle className="text-yellow-500" size={18} />
          <p className="text-sm text-foreground">Please sign in to upload documents.</p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
