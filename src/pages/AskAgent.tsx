
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Code, Send, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AskAgent: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: 'Welcome to CompliMate Agent. I can help you with compliance questions and regulatory guidance.'
    }
  ]);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Add user message
      setMessages([...messages, { role: 'user', content: input }]);
      
      // Simulate AI response
      setTimeout(() => {
        let response;
        if (input.toLowerCase().includes('gdpr') || input.toLowerCase().includes('ccpa')) {
          response = `
Based on your question about ${input.toLowerCase().includes('gdpr') ? 'GDPR' : 'CCPA'} compliance:

✅ **Compliance Strengths:**
- Your document has clear user consent mechanisms
- Data retention policies are well-defined

⚠️ **Gaps Identified:**
- Missing specific language around user data deletion requests
- Insufficient details on third-party data sharing

💡 **Suggested Updates:**
- Add a dedicated section on user rights to deletion
- Define specific timeframes for responding to privacy requests
- Include a comprehensive list of third parties with access to data

Would you like me to help draft the missing sections?`;
        } else {
          response = "I'd be happy to analyze your compliance needs. Could you provide more specific information about your regulatory concerns or upload a document for me to review?";
        }
        
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }, 1000);
      
      // Clear input
      setInput('');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">CompliMate Agent</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Ask questions about regulations, compliance requirements, or document reviews
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="tech-card h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bot className="text-complimate-purple" />
                  <CardTitle>AI Compliance Assistant</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow flex flex-col">
                <Tabs defaultValue="chat" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="code">Code Analyzer</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chat" className="flex-grow flex flex-col">
                    <div className="flex-grow mb-4 space-y-4 overflow-y-auto max-h-[60vh]">
                      {messages.map((msg, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg max-w-[85%] ${
                            msg.role === 'user' 
                              ? 'bg-secondary ml-auto text-secondary-foreground' 
                              : 'bg-muted mr-auto'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      ))}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="flex gap-2 mt-auto">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about compliance requirements..."
                        className="flex-grow"
                      />
                      <Button type="submit">
                        <Send size={18} />
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="code" className="space-y-4">
                    <div className="rounded-md bg-secondary/30 p-4 border border-border">
                      <div className="flex items-center mb-3">
                        <Code className="text-complimate-purple mr-2" size={18} />
                        <h3 className="font-medium">Code Compliance Analysis</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Upload or paste code snippets for security and compliance analysis.
                      </p>
                    </div>
                    <div className="flex justify-center items-center border border-dashed border-border rounded-lg p-8">
                      <p className="text-muted-foreground">
                        Drag and drop code files or click to upload
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="tech-card h-full">
              <CardHeader>
                <CardTitle>Compliance Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-3 border border-border rounded-lg hover:border-complimate-purple/50 transition-colors">
                    <h3 className="font-medium text-complimate-purple">GDPR Guidelines</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      European data protection regulations explained.
                    </p>
                  </div>
                  
                  <div className="p-3 border border-border rounded-lg hover:border-complimate-purple/50 transition-colors">
                    <h3 className="font-medium text-complimate-purple">CCPA Compliance</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      California Consumer Privacy Act requirements.
                    </p>
                  </div>
                  
                  <div className="p-3 border border-border rounded-lg hover:border-complimate-purple/50 transition-colors">
                    <h3 className="font-medium text-complimate-purple">HIPAA Framework</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Healthcare data security standards.
                    </p>
                  </div>
                  
                  <div className="p-3 border border-border rounded-lg hover:border-complimate-purple/50 transition-colors">
                    <h3 className="font-medium text-complimate-purple">SOC 2 Guide</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Security compliance for service organizations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AskAgent;
