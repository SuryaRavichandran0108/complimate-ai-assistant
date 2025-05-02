
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UploadCard from '../components/UploadCard';
import DocumentUpload from '../components/DocumentUpload';
import ChatInterface from '../components/ChatInterface';
import TaskPreview from '../components/TaskPreview';
import AgentSuggestions from '../components/AgentSuggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, LightbulbIcon, FileText, CheckCircle, ArrowRight, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDocuments, getDocumentUrl } from '@/utils/documentUtils';
import { getUserChatHistory } from '@/utils/chatService';

const Index: React.FC = () => {
  const [activeDocument, setActiveDocument] = useState<any | null>(null);
  const [chatContext, setChatContext] = useState<'general' | 'document'>('general');
  const [documents, setDocuments] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
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
    
    // Get recent chats
    const chats = await getUserChatHistory(user.id);
    setRecentChats(chats.slice(0, 3));
  };
  
  const handleDocumentSelect = async (doc: any) => {
    setActiveDocument(doc);
    setChatContext('document');
    
    toast({
      title: "Document Selected",
      description: `${doc.name} is ready for analysis`,
    });
  };

  const clearActiveDocument = () => {
    setActiveDocument(null);
    setChatContext('general');
  };

  const complianceStats = [
    { label: 'Compliance Score', value: '72%', color: 'text-complimate-purple' },
    { label: 'Tasks Completed', value: '8/12', color: 'text-green-500' },
    { label: 'Issues Found', value: '3', color: 'text-amber-500' },
    { label: 'Improvement Areas', value: '4', color: 'text-blue-500' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Shield className="mr-3 text-complimate-purple" size={28} />
            <h1 className="text-3xl font-bold text-foreground">CompliMate</h1>
          </div>
          <p className="text-lg text-muted-foreground">Your AI Compliance Officer — 24/7, Affordable, and Always Up to Date</p>
        </div>
        
        <Card className="tech-card mb-6 bg-complimate-tech-dark border-complimate-dark-purple/40 overflow-hidden">
          <div className="absolute inset-0 tech-gradient opacity-30"></div>
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-complimate-purple mb-1">
                  Upload your policy. Ask a question. Get smart compliance support in seconds.
                </h2>
                <p className="text-muted-foreground">
                  Our AI reviews every document against SOC 2, GDPR, HIPAA, and state-specific labor laws to identify gaps and provide actionable recommendations.
                </p>
              </div>
              <div className="flex gap-3">
                {!user ? (
                  <Button onClick={() => navigate('/auth')} className="flex items-center gap-2">
                    <LogIn size={16} /> Sign In
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/documents')}>Manage Documents</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {activeDocument && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-complimate-soft-gray flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-complimate-purple" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Document Analysis</h3>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      <CheckCircle size={12} className="mr-1" /> Analysis Complete
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {!activeDocument && !loading && (
              <>
                {user ? (
                  documents.length > 0 ? (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Your Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
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
                            className="mt-4 w-full" 
                            onClick={() => navigate('/documents')}
                          >
                            View all documents ({documents.length})
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Tabs defaultValue="upload" className="mb-6">
                      <TabsList>
                        <TabsTrigger value="upload">Upload Document</TabsTrigger>
                        <TabsTrigger value="policy">Create Policy</TabsTrigger>
                        <TabsTrigger value="check">Quick Check</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upload" className="mt-4">
                        <DocumentUpload />
                      </TabsContent>
                      <TabsContent value="policy" className="mt-4">
                        <Card className="p-6">
                          <h3 className="font-medium text-lg mb-2">Create New Policy</h3>
                          <p className="text-muted-foreground mb-4">Generate a policy template based on your business needs</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer hover:shadow-md">
                              <Badge className="mb-2 bg-purple-900/40 text-purple-300 hover:bg-purple-900/60">Privacy</Badge>
                              <h4 className="font-medium">Privacy Policy</h4>
                              <p className="text-xs text-muted-foreground mt-1">GDPR, CCPA compliant templates</p>
                            </Card>
                            <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer hover:shadow-md">
                              <Badge className="mb-2 bg-orange-900/40 text-orange-300 hover:bg-orange-900/60">HR</Badge>
                              <h4 className="font-medium">Employee Handbook</h4>
                              <p className="text-xs text-muted-foreground mt-1">Labor law compliant templates</p>
                            </Card>
                            <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer hover:shadow-md">
                              <Badge className="mb-2 bg-blue-900/40 text-blue-300 hover:bg-blue-900/60">Security</Badge>
                              <h4 className="font-medium">Security Policy</h4>
                              <p className="text-xs text-muted-foreground mt-1">SOC 2 and ISO 27001 compliant</p>
                            </Card>
                            <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer hover:shadow-md">
                              <Badge className="mb-2 bg-green-900/40 text-green-300 hover:bg-green-900/60">Healthcare</Badge>
                              <h4 className="font-medium">HIPAA Policy</h4>
                              <p className="text-xs text-muted-foreground mt-1">Healthcare data protection standards</p>
                            </Card>
                          </div>
                        </Card>
                      </TabsContent>
                      <TabsContent value="check" className="mt-4">
                        <Card className="p-6">
                          <h3 className="font-medium text-lg mb-2">Quick Compliance Check</h3>
                          <p className="text-muted-foreground mb-4">Verify specific compliance requirements</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button variant="outline" className="h-auto py-3 px-4 justify-start hover:bg-complimate-soft-gray hover:border-complimate-purple/30">
                              <div className="text-left">
                                <div className="font-medium">GDPR Assessment</div>
                                <div className="text-xs text-muted-foreground">Evaluate EU data protection compliance</div>
                              </div>
                              <ArrowRight size={16} className="ml-auto text-gray-400" />
                            </Button>
                            <Button variant="outline" className="h-auto py-3 px-4 justify-start hover:bg-complimate-soft-gray hover:border-complimate-purple/30">
                              <div className="text-left">
                                <div className="font-medium">CCPA Assessment</div>
                                <div className="text-xs text-muted-foreground">Check California consumer privacy</div>
                              </div>
                              <ArrowRight size={16} className="ml-auto text-gray-400" />
                            </Button>
                            <Button variant="outline" className="h-auto py-3 px-4 justify-start hover:bg-complimate-soft-gray hover:border-complimate-purple/30">
                              <div className="text-left">
                                <div className="font-medium">SOC 2 Gap Analysis</div>
                                <div className="text-xs text-muted-foreground">Identify gaps in security controls</div>
                              </div>
                              <ArrowRight size={16} className="ml-auto text-gray-400" />
                            </Button>
                            <Button variant="outline" className="h-auto py-3 px-4 justify-start hover:bg-complimate-soft-gray hover:border-complimate-purple/30">
                              <div className="text-left">
                                <div className="font-medium">Cookie Compliance</div>
                                <div className="text-xs text-muted-foreground">Verify cookie consent implementation</div>
                              </div>
                              <ArrowRight size={16} className="ml-auto text-gray-400" />
                            </Button>
                          </div>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  )
                ) : (
                  <Tabs defaultValue="upload" className="mb-6">
                    <TabsList>
                      <TabsTrigger value="upload">Upload Document</TabsTrigger>
                      <TabsTrigger value="policy">Create Policy</TabsTrigger>
                      <TabsTrigger value="check">Quick Check</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="mt-4">
                      <UploadCard onFileUpload={() => navigate('/auth')} />
                    </TabsContent>
                    <TabsContent value="policy" className="mt-4">
                      <Card className="p-6">
                        <h3 className="font-medium text-lg mb-2">Create New Policy</h3>
                        <p className="text-muted-foreground mb-4">Generate a policy template based on your business needs</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer hover:shadow-md">
                            <Badge className="mb-2 bg-purple-900/40 text-purple-300 hover:bg-purple-900/60">Privacy</Badge>
                            <h4 className="font-medium">Privacy Policy</h4>
                            <p className="text-xs text-muted-foreground mt-1">GDPR, CCPA compliant templates</p>
                          </Card>
                          <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer hover:shadow-md">
                            <Badge className="mb-2 bg-orange-900/40 text-orange-300 hover:bg-orange-900/60">HR</Badge>
                            <h4 className="font-medium">Employee Handbook</h4>
                            <p className="text-xs text-muted-foreground mt-1">Labor law compliant templates</p>
                          </Card>
                          <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer hover:shadow-md">
                            <Badge className="mb-2 bg-blue-900/40 text-blue-300 hover:bg-blue-900/60">Security</Badge>
                            <h4 className="font-medium">Security Policy</h4>
                            <p className="text-xs text-muted-foreground mt-1">SOC 2 and ISO 27001 compliant</p>
                          </Card>
                          <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer hover:shadow-md">
                            <Badge className="mb-2 bg-green-900/40 text-green-300 hover:bg-green-900/60">Healthcare</Badge>
                            <h4 className="font-medium">HIPAA Policy</h4>
                            <p className="text-xs text-muted-foreground mt-1">Healthcare data protection standards</p>
                          </Card>
                        </div>
                      </Card>
                    </TabsContent>
                    <TabsContent value="check" className="mt-4">
                      <Card className="p-6">
                        <h3 className="font-medium text-lg mb-2">Quick Compliance Check</h3>
                        <p className="text-muted-foreground mb-4">Verify specific compliance requirements</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button variant="outline" className="h-auto py-3 px-4 justify-start hover:bg-complimate-soft-gray hover:border-complimate-purple/30">
                            <div className="text-left">
                              <div className="font-medium">GDPR Assessment</div>
                              <div className="text-xs text-muted-foreground">Evaluate EU data protection compliance</div>
                            </div>
                            <ArrowRight size={16} className="ml-auto text-gray-400" />
                          </Button>
                          <Button variant="outline" className="h-auto py-3 px-4 justify-start hover:bg-complimate-soft-gray hover:border-complimate-purple/30">
                            <div className="text-left">
                              <div className="font-medium">CCPA Assessment</div>
                              <div className="text-xs text-muted-foreground">Check California consumer privacy</div>
                            </div>
                            <ArrowRight size={16} className="ml-auto text-gray-400" />
                          </Button>
                          <Button variant="outline" className="h-auto py-3 px-4 justify-start hover:bg-complimate-soft-gray hover:border-complimate-purple/30">
                            <div className="text-left">
                              <div className="font-medium">SOC 2 Gap Analysis</div>
                              <div className="text-xs text-muted-foreground">Identify gaps in security controls</div>
                            </div>
                            <ArrowRight size={16} className="ml-auto text-gray-400" />
                          </Button>
                          <Button variant="outline" className="h-auto py-3 px-4 justify-start hover:bg-complimate-soft-gray hover:border-complimate-purple/30">
                            <div className="text-left">
                              <div className="font-medium">Cookie Compliance</div>
                              <div className="text-xs text-muted-foreground">Verify cookie consent implementation</div>
                            </div>
                            <ArrowRight size={16} className="ml-auto text-gray-400" />
                          </Button>
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </>
            )}
            
            <ChatInterface 
              documentContext={chatContext} 
              activeDocument={activeDocument} 
              onChatComplete={loadUserData}
            />
          </div>
          <div className="lg:col-span-1">
            <AgentSuggestions />
            <TaskPreview />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
