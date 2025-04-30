
import React from 'react';
import { Clock, Calendar, Check, List } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  icon: 'calendar' | 'check' | 'list' | 'clock';
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Quarterly Privacy Policy Review',
    dueDate: 'Due in 5 days',
    status: 'upcoming',
    icon: 'calendar'
  },
  {
    id: '2',
    title: 'Annual Employee Handbook Update',
    dueDate: 'In Progress',
    status: 'in-progress',
    icon: 'list'
  },
  {
    id: '3',
    title: 'GDPR Data Audit',
    dueDate: 'Due next month',
    status: 'upcoming',
    icon: 'check'
  },
  {
    id: '4',
    title: 'Security Policy Review',
    dueDate: 'Completed last week',
    status: 'completed',
    icon: 'clock'
  }
];

const TaskPreview: React.FC = () => {
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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Upcoming</span>;
      case 'in-progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Progress</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md card-shadow mt-6 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Compliance Tasks</h2>
        <a href="#" className="text-sm font-medium text-complimate-purple hover:text-complimate-purple/80">
          View All
        </a>
      </div>
      
      <div className="space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="flex items-center p-3 hover:bg-complimate-soft-gray rounded-lg transition-colors duration-200"
          >
            <div className="flex-shrink-0 mr-4">
              {getIcon(task.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-800 truncate">{task.title}</h3>
              <p className="text-xs text-gray-500">{task.dueDate}</p>
            </div>
            <div className="ml-4">
              {getStatusBadge(task.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskPreview;
