
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, Clock, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: 'update' | 'action' | 'review';
  category: 'privacy' | 'hr' | 'security';
  priority: 'high' | 'medium' | 'low';
  timeEstimate: string;
}

const suggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Update GDPR Data Subject Rights',
    description: 'Your privacy policy is missing specific procedures for handling data subject access requests.',
    type: 'update',
    category: 'privacy',
    priority: 'high',
    timeEstimate: '20 min'
  },
  {
    id: '2',
    title: 'Add California Employee Notices',
    description: 'Recent changes to California law require additional employee privacy disclosures.',
    type: 'action',
    category: 'hr',
    priority: 'medium',
    timeEstimate: '15 min'
  },
  {
    id: '3',
    title: 'Review Third-Party Data Sharing',
    description: 'Your current third-party sharing disclosures need updating to match latest regulations.',
    type: 'review',
    category: 'privacy',
    priority: 'medium',
    timeEstimate: '30 min'
  },
  {
    id: '4',
    title: 'Security Access Controls Review',
    description: 'Your security policy needs updated access control procedures for SOC 2 compliance.',
    type: 'review',
    category: 'security',
    priority: 'high',
    timeEstimate: '45 min'
  }
];

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'privacy':
      return <Badge className="bg-purple-900/40 text-purple-300 hover:bg-purple-900/60">Privacy</Badge>;
    case 'hr':
      return <Badge className="bg-orange-900/40 text-orange-300 hover:bg-orange-900/60">HR</Badge>;
    case 'security':
      return <Badge className="bg-blue-900/40 text-blue-300 hover:bg-blue-900/60">Security</Badge>;
    default:
      return null;
  }
};

const getPriorityIndicator = (priority: string) => {
  switch (priority) {
    case 'high':
      return <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>;
    case 'medium':
      return <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>;
    case 'low':
      return <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>;
    default:
      return null;
  }
};

const AgentSuggestions: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'privacy' | 'hr' | 'security'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();
  
  const filteredSuggestions = activeFilter === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === activeFilter);
    
  const handleAction = (id: string, title: string) => {
    toast({
      title: 'Action started',
      description: `Working on: ${title}`,
    });
  };
  
  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };
  
  const totalByCategory = (category: 'privacy' | 'hr' | 'security') => {
    return suggestions.filter(s => s.category === category).length;
  };

  return (
    <Card className="bg-white rounded-xl shadow-md card-shadow mb-6 animate-fade-in">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Lightbulb className="mr-2 text-complimate-purple" size={18} />
            <CardTitle className="text-lg font-semibold text-gray-800">Agent Suggestions</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
            <Filter size={12} />
            Filter
          </Button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button 
            variant={activeFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="text-xs h-7"
            onClick={() => setActiveFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={activeFilter === 'privacy' ? 'default' : 'outline'} 
            size="sm" 
            className="text-xs h-7"
            onClick={() => setActiveFilter('privacy')}
          >
            Privacy ({totalByCategory('privacy')})
          </Button>
          <Button 
            variant={activeFilter === 'hr' ? 'default' : 'outline'} 
            size="sm" 
            className="text-xs h-7"
            onClick={() => setActiveFilter('hr')}
          >
            HR ({totalByCategory('hr')})
          </Button>
          <Button 
            variant={activeFilter === 'security' ? 'default' : 'outline'} 
            size="sm" 
            className="text-xs h-7"
            onClick={() => setActiveFilter('security')}
          >
            Security ({totalByCategory('security')})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {filteredSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id} 
              className="p-4 hover:bg-complimate-soft-gray transition-colors cursor-pointer"
              onClick={() => toggleExpand(suggestion.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  {getPriorityIndicator(suggestion.priority)}
                  <h3 className="font-medium text-gray-800">{suggestion.title}</h3>
                </div>
                {getCategoryBadge(suggestion.category)}
              </div>
              <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={12} className="mr-1" />
                  <span>{suggestion.timeEstimate}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-complimate-purple hover:text-complimate-purple/80 p-0 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(suggestion.id, suggestion.title);
                  }}
                >
                  Take Action <ArrowRight size={12} className="ml-1" />
                </Button>
              </div>
              
              {expanded === suggestion.id && (
                <div className="mt-4 pt-3 border-t border-gray-100 animate-fade-in">
                  <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Review current documentation</li>
                    <li>• Generate updated policy section</li>
                    <li>• Get stakeholder approval</li>
                    <li>• Implement changes by next quarter</li>
                  </ul>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Save for Later
                    </Button>
                    <Button size="sm" className="text-xs h-7">
                      Start Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {filteredSuggestions.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500">No suggestions found in this category</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentSuggestions;
