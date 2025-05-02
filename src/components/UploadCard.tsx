
import React from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadCardProps {
  onFileUpload: () => void;
}

const UploadCard: React.FC<UploadCardProps> = ({ onFileUpload }) => {
  return (
    <Card className="pointer-events-auto">
      <CardContent className="p-6">
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-complimate-soft-gray rounded-full">
              <Upload className="h-6 w-6 text-complimate-purple" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-gray-900">
                Upload a policy, handbook, or compliance document
              </p>
              <p className="text-xs text-gray-500">
                PDF or DOCX up to 10MB
              </p>
            </div>
            <div className="mt-2 pointer-events-auto">
              <Button
                onClick={onFileUpload}
                className="bg-complimate-purple hover:bg-complimate-purple/90 text-white pointer-events-auto"
              >
                Sign in to upload
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Create an account to analyze your documents
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadCard;
