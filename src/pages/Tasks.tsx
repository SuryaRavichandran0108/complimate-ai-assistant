
import React from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, CheckIcon, ClockIcon, AlertTriangleIcon, Filter, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

const Tasks: React.FC = () => {
  const upcomingTasks = [
    {
      id: 1,
      title: 'Quarterly Privacy Policy Review',
      description: 'Review and update privacy policy to comply with latest regulations',
      priority: 'high',
      dueDate: '2025-05-05',
      daysLeft: 5,
      category: 'Privacy',
      progress: 0
    },
    {
      id: 2,
      title: 'Annual Employee Handbook Update',
      description: 'Ensure handbook reflects current labor laws and company policies',
      priority: 'medium',
      dueDate: '2025-05-15',
      daysLeft: 15,
      category: 'HR',
      progress: 30
    },
    {
      id: 3,
      title: 'GDPR Cookie Consent Implementation',
      description: 'Update website cookie consent to comply with GDPR requirements',
      priority: 'high',
      dueDate: '2025-05-10',
      daysLeft: 10,
      category: 'Technical',
      progress: 0
    }
  ];

  const inProgressTasks = [
    {
      id: 4,
      title: 'Data Retention Policy Documentation',
      description: 'Create comprehensive data retention policy',
      priority: 'medium',
      dueDate: '2025-05-20',
      daysLeft: 20,
      category: 'Data Management',
      progress: 65
    },
    {
      id: 5,
      title: 'Third-Party Vendor Assessment',
      description: 'Review security practices of current vendors',
      priority: 'medium',
      dueDate: '2025-06-01',
      daysLeft: 32,
      category: 'Security',
      progress: 45
    }
  ];

  const completedTasks = [
    {
      id: 6,
      title: 'Internal Data Protection Training',
      description: 'Train team on data protection best practices',
      priority: 'high',
      completionDate: '2025-04-15',
      category: 'Training'
    },
    {
      id: 7,
      title: 'Security Incident Response Plan',
      description: 'Document procedures for responding to data breaches',
      priority: 'high',
      completionDate: '2025-04-10',
      category: 'Security'
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-900/30 text-red-300">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-900/30 text-yellow-300">Medium</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-900/30 text-green-300">Low</span>;
    }
  };

  const TaskCard = ({ task, showProgress = false, isCompleted = false }) => (
    <div className="p-4 border border-border rounded-lg bg-card hover:border-complimate-purple/30 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <Checkbox id={`task-${task.id}`} checked={isCompleted} className="mt-1" />
          <div>
            <h3 className="font-medium text-foreground">{task.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          </div>
        </div>
        {getPriorityBadge(task.priority)}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary/50 text-secondary-foreground">
            {task.category}
          </span>
          
          {!isCompleted && (
            <span className="inline-flex items-center">
              <ClockIcon size={12} className="mr-1" />
              {task.daysLeft} days left
            </span>
          )}
          
          {isCompleted && (
            <span className="inline-flex items-center">
              <CheckIcon size={12} className="mr-1 text-green-500" />
              Completed {task.completionDate}
            </span>
          )}
        </div>
        
        {showProgress && !isCompleted && (
          <div className="w-full mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1.5" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compliance Tasks</h1>
            <p className="mt-1 text-muted-foreground">
              Track and manage your compliance activities
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              Filter
            </Button>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              New Task
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <Card className="tech-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-medium text-complimate-purple">Compliance Overview</h2>
                  <p className="text-muted-foreground mt-1">3 tasks requiring action this month</p>
                </div>
                
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-complimate-purple">{upcomingTasks.length}</div>
                    <div className="text-xs text-muted-foreground">Upcoming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-complimate-neon-blue">{inProgressTasks.length}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-500">{completedTasks.length}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming" className="relative">
              Upcoming
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-complimate-purple text-xs flex items-center justify-center">
                {upcomingTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </TabsContent>
          
          <TabsContent value="in-progress" className="space-y-4">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} showProgress={true} />
            ))}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} isCompleted={true} />
            ))}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center">
                <AlertTriangleIcon size={16} className="text-red-400 mr-2" />
                Upcoming
              </h3>
              <div className="space-y-4">
                {upcomingTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center">
                <ClockIcon size={16} className="text-blue-400 mr-2" />
                In Progress
              </h3>
              <div className="space-y-4">
                {inProgressTasks.map(task => (
                  <TaskCard key={task.id} task={task} showProgress={true} />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center">
                <CheckIcon size={16} className="text-green-500 mr-2" />
                Completed
              </h3>
              <div className="space-y-4">
                {completedTasks.map(task => (
                  <TaskCard key={task.id} task={task} isCompleted={true} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Tasks;
