
import React, { useState } from 'react';
import Layout from '../components/Layout';
import UploadCard from '../components/UploadCard';
import ChatInterface from '../components/ChatInterface';
import TaskPreview from '../components/TaskPreview';
import AgentSuggestions from '../components/AgentSuggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, LightbulbIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Index: React.FC = () => {
  const [activeDocument, setActiveDocument] = useState<File | null>(null);
  const [chatContext, setChatContext] = useState<'general' | 'document'>('general');
  
  const handleDocumentUpload = (file: File | null) => {
    setActiveDocument(file);
    if (file) {
      setChatContext('document');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
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
              <div>
                <h2 className="text-xl font-semibold text-complimate-purple mb-1">Upload your policy. Ask a question. Get smart compliance support in seconds.</h2>
                <p className="text-muted-foreground">
                  Our AI reviews every document against SOC 2, GDPR, and labor laws
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">Learn More</Button>
                <Button>Join Early Access</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="upload" className="mb-6">
              <TabsList>
                <TabsTrigger value="upload">Upload Document</TabsTrigger>
                <TabsTrigger value="policy">Create Policy</TabsTrigger>
                <TabsTrigger value="check">Quick Check</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-4">
                <UploadCard onFileUpload={handleDocumentUpload} />
              </TabsContent>
              <TabsContent value="policy" className="mt-4">
                <Card className="p-6">
                  <h3 className="font-medium text-lg mb-2">Create New Policy</h3>
                  <p className="text-muted-foreground mb-4">Generate a policy template based on your business needs</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer">
                      <Badge className="mb-2 bg-purple-900/40 text-purple-300 hover:bg-purple-900/60">Privacy</Badge>
                      <h4 className="font-medium">Privacy Policy</h4>
                      <p className="text-xs text-muted-foreground mt-1">GDPR, CCPA compliant templates</p>
                    </Card>
                    <Card className="p-4 hover:border-complimate-purple/50 transition-all cursor-pointer">
                      <Badge className="mb-2 bg-orange-900/40 text-orange-300 hover:bg-orange-900/60">HR</Badge>
                      <h4 className="font-medium">Employee Handbook</h4>
                      <p className="text-xs text-muted-foreground mt-1">Labor law compliant templates</p>
                    </Card>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="check" className="mt-4">
                <Card className="p-6">
                  <h3 className="font-medium text-lg mb-2">Quick Compliance Check</h3>
                  <p className="text-muted-foreground mb-4">Verify specific compliance requirements</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-3 px-4 justify-start">
                      <div className="text-left">
                        <div className="font-medium">GDPR Assessment</div>
                        <div className="text-xs text-muted-foreground">Evaluate EU data protection compliance</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 px-4 justify-start">
                      <div className="text-left">
                        <div className="font-medium">CCPA Assessment</div>
                        <div className="text-xs text-muted-foreground">Check California consumer privacy</div>
                      </div>
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
            
            {activeDocument && (
              <Card className="mb-6 p-4 border-complimate-purple/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-complimate-soft-gray rounded-full mr-3">
                      <LightbulbIcon className="h-5 w-5 text-complimate-purple" />
                    </div>
                    <div>
                      <h3 className="font-medium">Active Document</h3>
                      <p className="text-sm text-muted-foreground">{activeDocument.name}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveDocument(null)}>Clear</Button>
                </div>
              </Card>
            )}
            
            <ChatInterface documentContext={chatContext} activeDocument={activeDocument} />
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
