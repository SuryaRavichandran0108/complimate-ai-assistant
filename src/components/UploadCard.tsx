
import React, { useState } from 'react';
import { Upload } from 'lucide-react';

const UploadCard: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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
      const droppedFile = e.dataTransfer.files[0];
      const fileType = droppedFile.type;
      
      if (fileType === 'application/pdf' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(droppedFile);
      } else {
        alert('Please upload a PDF or DOCX file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      
      if (fileType === 'application/pdf' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(selectedFile);
      } else {
        alert('Please upload a PDF or DOCX file');
        e.target.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md card-shadow p-6 md:p-8 mt-4 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Document for Review</h2>
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
          <div className="p-3 bg-complimate-soft-gray rounded-full">
            <Upload className="h-6 w-6 text-complimate-purple" />
          </div>
          {file ? (
            <>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
              <button 
                onClick={() => setFile(null)}
                className="text-sm text-complimate-purple hover:text-complimate-purple/80 font-medium"
              >
                Upload a different file
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-gray-900">
                  Upload a policy, handbook, or document you want reviewed
                </p>
                <p className="text-xs text-gray-500">
                  PDF or DOCX up to 10MB
                </p>
              </div>
              <div className="mt-2">
                <label htmlFor="file-upload" className="cursor-pointer bg-complimate-purple hover:bg-complimate-purple/90 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200">
                  Select a file
                  <input id="file-upload" name="file-upload" type="file" accept=".pdf,.docx" className="sr-only" onChange={handleFileChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500">or drag and drop</p>
            </>
          )}
        </div>
      </div>
      
      {file && (
        <div className="mt-6 flex justify-end">
          <button 
            className="bg-complimate-purple hover:bg-complimate-purple/90 text-white py-2 px-6 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Analyze Document
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadCard;
