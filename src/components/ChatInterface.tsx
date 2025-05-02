
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { askAgent } from '@/utils/chatService';
import { saveTaskFromSuggestion } from '@/utils/chatService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  compliantSections?: string[];
  gaps?: string[];
  suggestions?: string[];
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
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the chat feature.",
        variant: "destructive",
      });
      return;
    }
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await askAgent(
        input, 
        documentContext === 'document' && activeDocument ? activeDocument.id : undefined
      );
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        id: response.id,
        compliantSections: response.compliantSections,
        gaps: response.gaps,
        suggestions: response.suggestions,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
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
          role: 'assistant',
          content: "I'm sorry, I couldn't process your request. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async (suggestion: string) => {
    if (!user) return;
    
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

  return (
    <Card className="border-complimate-dark-purple/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          {documentContext === 'document' && activeDocument
            ? `Chat about ${activeDocument.name}`
            : 'CompliMate Assistant'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 mb-4">
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
                  message.role === 'assistant' ? 'items-start' : 'items-end'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[85%] ${
                    message.role === 'assistant'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-complimate-purple text-white'
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
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={18} />
            <p className="text-sm text-foreground">Please sign in to use the chat feature.</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            placeholder="Ask about compliance, regulations, or best practices..."
            value={input}
            onChange={handleInputChange}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || !user}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
