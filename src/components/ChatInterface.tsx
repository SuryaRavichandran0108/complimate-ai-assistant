
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader, ChevronDown, ChevronUp, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { askAgent, saveTaskFromSuggestion } from '@/utils/chatService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentContext {
  chunk_text: string;
  document_name: string;
  similarity: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  compliantSections?: string[];
  gaps?: string[];
  suggestions?: string[];
  documentContext?: DocumentContext[];
}

interface ChatInterfaceProps {
  documentContext: 'general' | 'document';
  activeDocument: any | null;
  onChatComplete?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  documentContext, 
  activeDocument,
  onChatComplete
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedContext, setExpandedContext] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Check if the document is ready for querying
      if (documentContext === 'document' && activeDocument) {
        if (activeDocument.status === 'processing') {
          const systemMessage: ChatMessage = {
            role: 'system',
            content: "⚠️ This document is still processing. Please wait until processing is complete before asking questions.",
          };
          setMessages((prev) => [...prev, systemMessage]);
          setIsLoading(false);
          return;
        } else if (activeDocument.status === 'error') {
          const systemMessage: ChatMessage = {
            role: 'system',
            content: "⚠️ This document encountered an error during processing. Please try re-uploading it.",
          };
          setMessages((prev) => [...prev, systemMessage]);
          setIsLoading(false);
          return;
        }
      }
      
      const response = await askAgent(
        input, 
        documentContext === 'document' && activeDocument ? activeDocument.id : undefined
      );
      
      if (response.error) {
        // Handle error responses
        const errorMessage: ChatMessage = {
          role: 'system',
          content: response.message || "I'm sorry, I couldn't process your request. Please try again later.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        // Process successful response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response || response.rawResponse,
          id: response.id,
          compliantSections: response.compliantSections,
          gaps: response.gaps,
          suggestions: response.suggestions,
          documentContext: response.documentContext,
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      }
      
      if (onChatComplete) {
        onChatComplete();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get a response from the agent.",
        variant: "destructive",
      });
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: "I'm sorry, I couldn't process your request. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async (suggestion: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save tasks.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await saveTaskFromSuggestion(
        user.id,
        activeDocument?.id || null,
        suggestion
      );
      
      if (result.success) {
        toast({
          title: "Task saved",
          description: "The suggestion has been added to your tasks.",
        });
        
        if (onChatComplete) {
          onChatComplete();
        }
      } else {
        toast({
          title: "Failed to save task",
          description: "There was an error saving the task.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Error",
        description: "Failed to save the task.",
        variant: "destructive",
      });
    }
  };

  const toggleContext = (id: string) => {
    if (expandedContext === id) {
      setExpandedContext(null);
    } else {
      setExpandedContext(id);
    }
  };
  
  // Display warning if document is processing
  const showDocumentProcessingWarning = documentContext === 'document' && 
    activeDocument && 
    activeDocument.status === 'processing';
    
  // Display error if document has errored
  const showDocumentErrorWarning = documentContext === 'document' && 
    activeDocument && 
    activeDocument.status === 'error';

  return (
    <Card className="border-complimate-dark-purple/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${activeDocument?.status === 'ready' ? 'bg-green-500' : activeDocument?.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'} ${activeDocument?.status === 'processing' ? 'animate-pulse' : ''}`}></div>
          {documentContext === 'document' && activeDocument
            ? `Chat about ${activeDocument.name}`
            : 'CompliMate Assistant'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showDocumentProcessingWarning && (
          <Alert variant="warning" className="mb-4 bg-yellow-500/10 border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm">
              This document is still being processed. You can ask questions when processing is complete.
            </AlertDescription>
          </Alert>
        )}
        
        {showDocumentErrorWarning && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              There was an error processing this document. Please try re-uploading it.
            </AlertDescription>
          </Alert>
        )}
      
        <div className="flex flex-col space-y-4 mb-4 max-h-[500px] overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                How can I help with your compliance questions today?
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-complimate-purple text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-500/10 border border-yellow-500/30 text-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                
                {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 ml-2 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Suggested Tasks:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline"
                          className="py-1 h-auto text-xs flex items-center gap-1"
                          onClick={() => handleSaveTask(suggestion)}
                        >
                          <span className="block truncate max-w-[200px]">{suggestion}</span>
                          <span className="text-complimate-purple">+</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {message.role === 'assistant' && message.documentContext && message.documentContext.length > 0 && (
                  <div className="mt-3 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs flex items-center gap-1 h-6"
                      onClick={() => toggleContext(message.id || index.toString())}
                    >
                      <span>View Document Context</span>
                      {expandedContext === (message.id || index.toString()) ? 
                        <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                    
                    {expandedContext === (message.id || index.toString()) && (
                      <div className="mt-2 space-y-2 ml-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Sources used to generate this response:
                        </p>
                        {message.documentContext.map((context, i) => (
                          <div 
                            key={i} 
                            className="border border-border rounded-md p-2 bg-background/50 text-sm"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <FileText size={14} className="text-complimate-purple" />
                              <span className="font-medium text-xs">
                                {context.document_name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground overflow-hidden text-ellipsis">
                              {context.chunk_text.length > 150 
                                ? `${context.chunk_text.substring(0, 150)}...` 
                                : context.chunk_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <Loader className="animate-spin h-5 w-5 text-complimate-purple" />
              <span className="ml-2 text-sm text-muted-foreground">Processing...</span>
            </div>
          )}
        </div>

        {!user && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md flex items-center gap-2">
            <p className="text-sm text-foreground">You can use the chat without signing in, but some features like saving tasks will require authentication.</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            placeholder="Ask about compliance, regulations, or best practices..."
            value={input}
            onChange={handleInputChange}
            className="flex-1"
            disabled={showDocumentProcessingWarning || showDocumentErrorWarning}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || showDocumentProcessingWarning || showDocumentErrorWarning}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
