
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Upload, FolderOpen, FileUp, Clock, Star, Filter, Grid, List, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDocuments, deleteDocument, getDocumentUrl } from '@/utils/documentUtils';
import DocumentUpload from '@/components/DocumentUpload';
import { useToast } from '@/hooks/use-toast';
import DocumentProcessingStatus from '@/components/DocumentProcessingStatus';

const Documents: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      loadDocuments();
    } else {
      setDocuments([]);
      setIsLoading(false);
    }
  }, [user]);
  
  const loadDocuments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const docs = await getUserDocuments(user.id);
    setDocuments(docs || []);
    setIsLoading(false);
  };
  
  const handleDeleteDocument = async (documentId: string, storagePath: string) => {
    if (!user) return;
    
    const result = await deleteDocument(documentId, storagePath);
    
    if (result.success) {
      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    } else {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the document.",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenDocument = async (storagePath: string) => {
    const url = await getDocumentUrl(storagePath);
    
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: "Error",
        description: "Could not open the document.",
        variant: "destructive",
      });
    }
  };
  
  const getFileIcon = (type: string) => {
    switch(type) {
      case 'application/pdf':
        return <FileText className="text-red-500" />;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <FileText className="text-blue-500" />;
      default:
        return <FileText className="text-gray-500" />;
    }
  };
  
  const DocumentCard = ({ document }) => (
    <Card className="tech-card hover:border-complimate-purple/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getFileIcon(document.type)}
            <div>
              <h3 className="font-medium text-foreground">{document.name}</h3>
              <p className="text-xs text-muted-foreground">
                {document.type.includes('pdf') ? 'PDF' : 'DOCX'} • {Math.round(document.size / 1024)} KB
              </p>
              <DocumentProcessingStatus documentId={document.id} onComplete={loadDocuments} />
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:text-red-500"
            onClick={() => handleDeleteDocument(document.id, document.storage_path)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock size={12} className="mr-1" />
            {new Date(document.created_at).toLocaleDateString()}
          </div>
          
          <Button
            size="sm" 
            variant="outline"
            onClick={() => handleOpenDocument(document.storage_path)}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  const DocumentRow = ({ document }) => (
    <div className="flex items-center p-3 border border-border rounded-lg bg-card hover:border-complimate-purple/30 transition-all">
      <Checkbox id={`doc-${document.id}`} className="mr-3" />
      <div className="flex items-center gap-3 flex-1">
        {getFileIcon(document.type)}
        <div>
          <h3 className="font-medium text-foreground">{document.name}</h3>
          <div className="text-xs text-muted-foreground">
            {document.type.includes('pdf') ? 'PDF' : 'DOCX'} • {Math.round(document.size / 1024)} KB
          </div>
          <DocumentProcessingStatus documentId={document.id} onComplete={loadDocuments} />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-xs text-muted-foreground">
          {new Date(document.created_at).toLocaleDateString()}
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenDocument(document.storage_path)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500"
            onClick={() => handleDeleteDocument(document.id, document.storage_path)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documents</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your compliance documents and files
            </p>
          </div>
          
          {user && (
            <div className="flex gap-3">
              <Button className="flex items-center gap-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
            </div>
          )}
        </div>
        
        {user ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Upload New Document</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentUpload onUploadComplete={loadDocuments} />
              </CardContent>
            </Card>
            
            <div className="mb-6">
              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="relative flex-grow max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        type="search"
                        placeholder="Search documents..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <p>Loading documents...</p>
              </div>
            ) : (
              documents.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map(doc => (
                        <DocumentCard key={doc.id} document={doc} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-muted rounded-lg text-sm font-medium">
                        <div className="w-6 mr-3"></div>
                        <div className="flex-1">Name</div>
                        <div className="flex items-center gap-6">
                          <div className="w-24">Date</div>
                          <div className="w-36"></div>
                        </div>
                      </div>
                      {documents.map(doc => (
                        <DocumentRow key={doc.id} document={doc} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <FileUp size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">No documents yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload your first document to get started with compliance analysis
                  </p>
                </div>
              )
            )}
          </>
        ) : (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
            <p className="mb-6 text-muted-foreground">
              Please sign in to view and manage your documents
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Documents;
