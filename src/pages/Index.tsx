
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskPreview from '../components/TaskPreview';
import AgentSuggestions from '../components/AgentSuggestions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, FileText, MessageSquare, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDocuments } from '@/utils/documentUtils';

const Index: React.FC = () => {
  const [activeDocument, setActiveDocument] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);
  
  const loadUserData = async () => {
    if (!user) return;
    
    // Get user documents
    const docs = await getUserDocuments(user.id);
    setDocuments(docs || []);
  };
  
  const handleDocumentSelect = async (doc: any) => {
    setActiveDocument(doc);
    
    toast({
      title: "Document Selected",
      description: `${doc.name} is ready for analysis`,
    });
  };

  const clearActiveDocument = () => {
    setActiveDocument(null);
  };

  const complianceStats = [
    { label: 'Compliance Score', value: '72%', color: 'text-complimate-purple' },
    { label: 'Tasks Completed', value: '8/12', color: 'text-green-500' },
    { label: 'Issues Found', value: '3', color: 'text-amber-500' },
    { label: 'Improvement Areas', value: '4', color: 'text-blue-500' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="mb-6 pointer-events-auto">
          <div className="flex items-center mb-2 pointer-events-auto">
            <Shield className="mr-3 text-complimate-purple" size={28} />
            <h1 className="text-3xl font-bold text-foreground">CompliMate</h1>
          </div>
          <p className="text-lg text-muted-foreground">Your AI Compliance Officer — 24/7, Affordable, and Always Up to Date</p>
        </div>
        
        <Card className="tech-card mb-6 bg-complimate-tech-dark border-complimate-dark-purple/40 overflow-hidden pointer-events-auto">
          <div className="absolute inset-0 tech-gradient opacity-30"></div>
          <CardContent className="p-6 relative pointer-events-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-auto">
              <div className="max-w-2xl pointer-events-auto">
                <h2 className="text-xl font-semibold text-complimate-purple mb-1">
                  Upload your policy. Ask a question. Get smart compliance support in seconds.
                </h2>
                <p className="text-muted-foreground">
                  Our AI reviews every document against SOC 2, GDPR, HIPAA, and state-specific labor laws to identify gaps and provide actionable recommendations.
                </p>
              </div>
              <div className="flex gap-3 pointer-events-auto">
                <Button 
                  onClick={() => navigate('/documents')} 
                  className="flex items-center gap-2 pointer-events-auto"
                >
                  <FileText size={16} /> Upload Document
                </Button>
                <Button 
                  onClick={() => navigate('/ask-agent')} 
                  variant="outline" 
                  className="flex items-center gap-2 pointer-events-auto"
                >
                  <MessageSquare size={16} /> Quick Check
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {activeDocument && (
          <Card className="mb-6 animate-fade-in pointer-events-auto">
            <CardContent className="p-4 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-complimate-soft-gray flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-complimate-purple" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Document Analysis</h3>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      Analysis Complete
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activeDocument.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-4 gap-4">
                  {complianceStats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-lg font-semibold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={clearActiveDocument}>Clear</Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pointer-events-auto">
          <div className="lg:col-span-2 pointer-events-auto">
            {!activeDocument && !loading && (
              <>
                {user ? (
                  documents.length > 0 ? (
                    <Card className="mb-6">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Your Documents</h3>
                          <div className="space-y-2">
                            {documents.slice(0, 3).map((doc) => (
                              <div 
                                key={doc.id} 
                                className="p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:border-complimate-purple/50 transition-colors"
                                onClick={() => handleDocumentSelect(doc)}
                              >
                                <div className="flex items-center">
                                  <FileText className="mr-2 text-complimate-purple" size={18} />
                                  <div>
                                    <p className="font-medium">{doc.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(doc.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <ArrowRight size={16} className="text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                          
                          {documents.length > 3 && (
                            <Button 
                              variant="link" 
                              className="w-full" 
                              onClick={() => navigate('/documents')}
                            >
                              View all documents ({documents.length})
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="mb-6">
                      <CardContent className="p-6">
                        <div className="text-center py-6">
                          <FileText size={36} className="mb-3 mx-auto text-muted-foreground" />
                          <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                          <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
                          <Button onClick={() => navigate('/documents')} className="flex items-center gap-2">
                            <FileText size={16} /> Upload Document
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="text-center py-6">
                        <LogIn size={36} className="mb-3 mx-auto text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">Sign in to get started</h3>
                        <p className="text-muted-foreground mb-4">Access all features and secure your compliance journey</p>
                        <Button onClick={() => navigate('/auth')}>Sign In</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-3">Quick Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-2.5" 
                    onClick={() => navigate('/ask-agent')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-complimate-soft-gray flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-complimate-purple" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Ask CompliMate</p>
                        <p className="text-xs text-muted-foreground">Get answers to compliance questions</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-2.5" 
                    onClick={() => navigate('/documents')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-complimate-soft-gray flex items-center justify-center">
                        <FileText className="h-4 w-4 text-complimate-purple" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Documents</p>
                        <p className="text-xs text-muted-foreground">Upload and manage your files</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-2.5" 
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-complimate-soft-gray flex items-center justify-center">
                        <FileText className="h-4 w-4 text-complimate-purple" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Tasks</p>
                        <p className="text-xs text-muted-foreground">Track compliance tasks</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 pointer-events-auto">
            <AgentSuggestions />
            <TaskPreview />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
