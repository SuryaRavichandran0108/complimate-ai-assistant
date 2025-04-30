
import React, { useState } from 'react';
import { Clock, Calendar, Check, List, ArrowRight, Plus, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  icon: 'calendar' | 'check' | 'list' | 'clock';
  category: 'privacy' | 'hr' | 'security' | 'general';
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Quarterly Privacy Policy Review',
    dueDate: 'Due in 5 days',
    status: 'upcoming',
    icon: 'calendar',
    category: 'privacy'
  },
  {
    id: '2',
    title: 'Annual Employee Handbook Update',
    dueDate: 'In Progress',
    status: 'in-progress',
    icon: 'list',
    category: 'hr'
  },
  {
    id: '3',
    title: 'GDPR Data Audit',
    dueDate: 'Due next month',
    status: 'upcoming',
    icon: 'check',
    category: 'privacy'
  },
  {
    id: '4',
    title: 'Security Policy Review',
    dueDate: 'Completed last week',
    status: 'completed',
    icon: 'clock',
    category: 'security'
  }
];

const TaskPreview: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'privacy' | 'hr' | 'security'>('all');
  
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === filter);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'calendar':
        return <Calendar className="h-5 w-5 text-complimate-purple" />;
      case 'check':
        return <Check className="h-5 w-5 text-complimate-purple" />;
      case 'list':
        return <List className="h-5 w-5 text-complimate-purple" />;
      case 'clock':
        return <Clock className="h-5 w-5 text-complimate-purple" />;
      default:
        return <Calendar className="h-5 w-5 text-complimate-purple" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="blue">Upcoming</Badge>;
      case 'in-progress':
        return <Badge variant="orange">In Progress</Badge>;
      case 'completed':
        return <Badge variant="green">Completed</Badge>;
      default:
        return null;
    }
  };

  const getCategoryIndicator = (category: string) => {
    switch (category) {
      case 'privacy':
        return <span className="w-2 h-full bg-purple-500 rounded-l-lg absolute left-0 top-0"></span>;
      case 'hr':
        return <span className="w-2 h-full bg-orange-500 rounded-l-lg absolute left-0 top-0"></span>;
      case 'security':
        return <span className="w-2 h-full bg-blue-500 rounded-l-lg absolute left-0 top-0"></span>;
      default:
        return <span className="w-2 h-full bg-gray-500 rounded-l-lg absolute left-0 top-0"></span>;
    }
  };

  const getCategoryCount = (category: 'privacy' | 'hr' | 'security') => {
    return tasks.filter(task => task.category === category).length;
  };

  return (
    <div className="bg-white rounded-xl shadow-md card-shadow mt-6 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Compliance Tasks</h2>
        <Button variant="ghost" className="text-complimate-purple hover:text-complimate-purple/80 p-0 h-auto text-sm">
          View All <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
      
      <div className="mb-4">
        <Tabs defaultValue="all" value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="privacy" className="relative">
              Privacy
              {getCategoryCount('privacy') > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {getCategoryCount('privacy')}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="hr" className="relative">
              HR
              {getCategoryCount('hr') > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {getCategoryCount('hr')}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="security" className="relative">
              Security
              {getCategoryCount('security') > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {getCategoryCount('security')}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div 
            key={task.id} 
            className="flex items-center p-3 hover:bg-complimate-soft-gray rounded-lg transition-colors duration-200 relative group"
          >
            {getCategoryIndicator(task.category)}
            <div className="flex-shrink-0 mr-4 pl-2">
              {getIcon(task.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-800 truncate">{task.title}</h3>
              <p className="text-xs text-gray-500">{task.dueDate}</p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              {getStatusBadge(task.status)}
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto">
                <ArrowRight size={14} className="text-gray-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <Button variant="outline" className="w-full text-sm flex items-center justify-center gap-1 hover:bg-complimate-soft-gray">
          <Plus size={14} /> 
          Add Task
        </Button>
      </div>
    </div>
  );
};

export default TaskPreview;
