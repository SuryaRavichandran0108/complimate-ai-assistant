
import React, { useState, useEffect, useCallback } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

const Documents: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const loadDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const docs = await getUserDocuments(user.id);
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Failed to load documents",
        description: "There was an error loading your documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshTrigger]);
  
  const handleDeleteDocument = async (documentId: string, storagePath: string) => {
    if (!user) return;
    
    try {
      const result = await deleteDocument(documentId, storagePath);
      
      if (result.success) {
        // Update UI optimistically
        setDocuments(documents.filter(doc => doc.id !== documentId));
        
        toast({
          title: "Document deleted",
          description: "The document has been successfully deleted.",
        });
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      
      toast({
        title: "Delete failed",
        description: "There was an error deleting the document.",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenDocument = async (storagePath: string) => {
    try {
      const url = await getDocumentUrl(storagePath);
      
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('Could not get document URL');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      
      toast({
        title: "Error",
        description: "Could not open the document.",
        variant: "destructive",
      });
    }
  };
  
  const handleUploadComplete = (documentId: string) => {
    // Refresh the document list after a short delay
    // This gives time for the backend to process the document
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 500);
  };
  
  const handleProcessingComplete = () => {
    // Refresh the document list when processing is complete
    setRefreshTrigger(prev => prev + 1);
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
  
  const filteredDocuments = searchQuery 
    ? documents.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;
  
  const DocumentCard = ({ document }) => (
    <Card className="tech-card hover:border-complimate-purple/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getFileIcon(document.type)}
            <div>
              <h3 className="font-medium text-foreground">{document.name}</h3>
              <p className="text-xs text-muted-foreground">
                {document.type.includes('pdf') ? 'PDF' : 
                 document.type.includes('word') ? 'DOCX' : 'TXT'} • {Math.round(document.size / 1024)} KB
              </p>
              <DocumentProcessingStatus 
                documentId={document.id} 
                onComplete={handleProcessingComplete} 
              />
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
            {document.type.includes('pdf') ? 'PDF' : 
             document.type.includes('word') ? 'DOCX' : 'TXT'} • {Math.round(document.size / 1024)} KB
          </div>
          <DocumentProcessingStatus 
            documentId={document.id}
            onComplete={handleProcessingComplete}
          />
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
                <DocumentUpload onUploadComplete={handleUploadComplete} />
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
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setRefreshTrigger(prev => prev + 1)}
                      className="ml-2"
                    >
                      <RefreshCw size={16} className="mr-1" /> Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <p>Loading documents...</p>
              </div>
            ) : (
              filteredDocuments.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredDocuments.map(doc => (
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
                      {filteredDocuments.map(doc => (
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
