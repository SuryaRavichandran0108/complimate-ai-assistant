
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, History, Document } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDocuments } from '@/utils/documentUtils';
import { getUserChatHistory } from '@/utils/chatService';

const AskAgent: React.FC = () => {
  const [activeDocument, setActiveDocument] = useState<any | null>(null);
  const [chatContext, setChatContext] = useState<'general' | 'document'>('general');
  const [documents, setDocuments] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const { user } = useAuth();
  
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
    
    // Get chat history
    const history = await getUserChatHistory(user.id);
    setChatHistory(history || []);
  };
  
  const handleDocumentSelect = (doc: any) => {
    setActiveDocument(doc);
    setChatContext('document');
  };
  
  const clearActiveDocument = () => {
    setActiveDocument(null);
    setChatContext('general');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 lg:w-1/4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="text-complimate-purple" size={18} />
                  Compliance AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="context">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="context">Context</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="context" className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Current Context</h3>
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                        <MessageSquare size={16} className="text-complimate-purple" />
                        <span>
                          {activeDocument 
                            ? `Discussing ${activeDocument.name}` 
                            : 'General compliance questions'
                          }
                        </span>
                      </div>
                    </div>
                    
                    {activeDocument && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearActiveDocument}
                        className="w-full"
                      >
                        Clear Document Context
                      </Button>
                    )}
                    
                    {documents.length > 0 && !activeDocument && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Your Documents</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {documents.map(doc => (
                            <Button
                              key={doc.id}
                              variant="ghost"
                              className="w-full justify-start text-left p-2 h-auto"
                              onClick={() => handleDocumentSelect(doc)}
                            >
                              <div className="flex items-center gap-2">
                                <Document size={14} className="shrink-0" />
                                <span className="truncate">{doc.name}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {chatHistory.length > 0 ? (
                        chatHistory.map((chat) => (
                          <div 
                            key={chat.id} 
                            className="p-2 hover:bg-muted rounded-md cursor-pointer"
                          >
                            <p className="text-sm font-medium truncate">{chat.query}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {new Date(chat.created_at).toLocaleDateString()}
                              </span>
                              {chat.document_id && (
                                <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-full">
                                  Document
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          No chat history yet
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Suggested Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-2 h-auto"
                  onClick={() => {}}
                >
                  How do I comply with GDPR?
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-2 h-auto"
                  onClick={() => {}}
                >
                  What are SOC 2 requirements?
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-2 h-auto"
                  onClick={() => {}}
                >
                  Explain HIPAA compliance
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-2 h-auto"
                  onClick={() => {}}
                >
                  California labor law changes 2025
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:w-2/3 lg:w-3/4">
            <ChatInterface 
              documentContext={chatContext} 
              activeDocument={activeDocument}
              onChatComplete={loadUserData}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AskAgent;
