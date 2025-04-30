
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
}

const mockAssistantResponse = `
**Document Analysis Complete**

✅ **Compliance Strengths**
- Privacy policy includes required CCPA disclosure sections
- Clear data retention policy that meets industry standards
- Well-structured consent mechanisms

⚠️ **Gaps Identified**
- Missing specific GDPR data subject access request procedures
- California employee privacy notice requirements not fully addressed
- Lacks updated references to Virginia's Consumer Data Protection Act

💡 **Suggested Updates**
1. Add a dedicated section for GDPR data subject rights with timeframes
2. Include California-specific employee privacy disclosures
3. Update third-party sharing disclosures to match latest regulations
4. Incorporate reference to Virginia CDPA compliance measures

Would you like me to help draft any of these missing sections?
`;

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputValue.trim()) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: inputValue
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      
      // Simulate AI typing
      setIsTyping(true);
      
      // Simulate response after delay
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: mockAssistantResponse
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderMessageContent = (content: string) => {
    // This is a simple renderer for markdown-like content
    return content.split('\n').map((line, i) => {
      if (line.startsWith('✅')) {
        return <p key={i} className="font-medium text-green-600">{line}</p>;
      } else if (line.startsWith('⚠️')) {
        return <p key={i} className="font-medium text-amber-600">{line}</p>;
      } else if (line.startsWith('💡')) {
        return <p key={i} className="font-medium text-blue-600">{line}</p>;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
      } else if (line.startsWith('- ')) {
        return <p key={i} className="ml-4">• {line.substring(2)}</p>;
      } else if (line.match(/^\d+\./)) {
        return <p key={i} className="ml-4">{line}</p>;
      } else {
        return <p key={i}>{line}</p>;
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md card-shadow mt-6 flex flex-col h-96 animate-fade-in">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Compliance Assistant</h2>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="bg-complimate-soft-gray rounded-lg p-4 text-gray-700">
            <p>Hi there 👋 — Ready to check your compliance? Upload a document or ask me a question about your compliance needs.</p>
          </div>
        )}
        
        {/* Chat messages */}
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg px-4 py-2 space-y-2 ${
                message.type === 'user' 
                  ? 'bg-complimate-purple text-white' 
                  : 'bg-complimate-soft-gray text-gray-800'
              }`}
            >
              {renderMessageContent(message.content)}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-complimate-soft-gray rounded-lg px-4 py-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about compliance requirements..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-complimate-purple focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className={`px-4 py-2 bg-complimate-purple text-white rounded-md ${
              !inputValue.trim() || isTyping
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-complimate-purple/90'
            } transition-colors duration-200`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
