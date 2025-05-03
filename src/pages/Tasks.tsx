
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  CheckIcon, 
  ClockIcon, 
  AlertTriangleIcon, 
  Filter, 
  Plus,
  FileTextIcon,
  Calendar,
  CalendarDaysIcon,
  Edit,
  Trash2 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, isValid, addDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ComplianceTask {
  id: string;
  description: string;
  status: string;
  due_date: string | null;
  created_at: string;
  created_by: string | null;
  related_doc_id: string | null;
  source_type: string | null;
  document?: {
    name: string;
    id: string;
  };
}

const TaskStatusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Completed' }
];

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    description: '',
    due_date: '',
    status: 'open'
  });
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Filtered task lists
  const openTasks = tasks.filter(task => task.status === 'open');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'done');

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('compliance_tasks')
        .select(`
          *,
          document:documents(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setTasks(data as ComplianceTask[]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance tasks.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('compliance_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      toast({
        title: 'Task updated',
        description: `Task status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      toast({
        title: 'Task deleted',
        description: 'The task has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the task.',
        variant: 'destructive',
      });
    }
  };

  const handleNewTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.description.trim()) {
      toast({
        title: 'Error',
        description: 'Task description is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('compliance_tasks')
        .insert({
          description: newTask.description,
          due_date: newTask.due_date || null,
          status: newTask.status,
          created_by: user?.id || 'manual',
          source_type: 'manual'
        })
        .select();

      if (error) {
        throw error;
      }

      if (data) {
        setTasks(prevTasks => [data[0] as ComplianceTask, ...prevTasks]);
      }

      // Reset form and close dialog
      setNewTask({
        description: '',
        due_date: '',
        status: 'open'
      });
      setNewTaskOpen(false);

      toast({
        title: 'Task created',
        description: 'The task has been successfully created.',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create the task.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-900/40 text-blue-300">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-900/40 text-yellow-300">In Progress</Badge>;
      case 'done':
        return <Badge className="bg-green-900/40 text-green-300">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getSourceLabel = (task: ComplianceTask) => {
    if (task.source_type === 'agent_suggestion') {
      return 'AI Suggestion';
    } else if (task.source_type === 'manual') {
      return 'Manual Entry';
    } else if (task.source_type) {
      return task.source_type;
    }
    return 'Unknown';
  };

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
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Compliance Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to track compliance requirements or actions.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleNewTaskSubmit} className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Describe the compliance task..."
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="due_date">Due Date (Optional)</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={newTask.status} 
                        onValueChange={(value) => setNewTask({...newTask, status: value})}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {TaskStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Task</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="mb-6">
          <Card className="tech-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-medium text-complimate-purple">Compliance Overview</h2>
                  <p className="text-muted-foreground mt-1">
                    {isLoading ? "Loading tasks..." : `${openTasks.length} tasks requiring action`}
                  </p>
                </div>
                
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-blue-500">{openTasks.length}</div>
                    <div className="text-xs text-muted-foreground">Open</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-yellow-500">{inProgressTasks.length}</div>
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
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="open" className="relative">
              Open
              {openTasks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-xs flex items-center justify-center text-white">
                  {openTasks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">Loading tasks...</TableCell>
                    </TableRow>
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">No tasks found. Create a new task to get started.</TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium max-w-[300px]">
                          <div className="truncate" title={task.description}>
                            {task.description}
                          </div>
                          {task.document && (
                            <div className="mt-1">
                              <span className="text-xs flex items-center text-muted-foreground">
                                <FileTextIcon size={12} className="mr-1" />
                                {task.document.name}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-auto py-1">
                                {getStatusBadge(task.status)}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {TaskStatusOptions.map((option) => (
                                <DropdownMenuItem 
                                  key={option.value} 
                                  onClick={() => updateTaskStatus(task.id, option.value)}
                                  disabled={task.status === option.value}
                                  className={task.status === option.value ? "bg-muted" : ""}
                                >
                                  {option.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          {task.due_date ? formatDate(task.due_date) : 'No due date'}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                            {getSourceLabel(task)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(task.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          
          <TabsContent value="open">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">Loading tasks...</TableCell>
                    </TableRow>
                  ) : openTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">No open tasks found.</TableCell>
                    </TableRow>
                  ) : (
                    openTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium max-w-[300px]">
                          <div className="truncate" title={task.description}>
                            {task.description}
                          </div>
                          {task.document && (
                            <div className="mt-1">
                              <span className="text-xs flex items-center text-muted-foreground">
                                <FileTextIcon size={12} className="mr-1" />
                                {task.document.name}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.due_date ? formatDate(task.due_date) : 'No due date'}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                            {getSourceLabel(task)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(task.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            >
                              Start Task
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          
          <TabsContent value="in_progress">
            {/* Similar table structure for in-progress tasks */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">Loading tasks...</TableCell>
                    </TableRow>
                  ) : inProgressTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">No in-progress tasks found.</TableCell>
                    </TableRow>
                  ) : (
                    inProgressTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium max-w-[300px]">
                          <div className="truncate" title={task.description}>
                            {task.description}
                          </div>
                          {task.document && (
                            <div className="mt-1">
                              <span className="text-xs flex items-center text-muted-foreground">
                                <FileTextIcon size={12} className="mr-1" />
                                {task.document.name}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.due_date ? formatDate(task.due_date) : 'No due date'}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                            {getSourceLabel(task)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(task.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-green-900/20 text-green-500 border-green-500/30 hover:bg-green-900/30"
                              onClick={() => updateTaskStatus(task.id, 'done')}
                            >
                              <CheckIcon size={16} className="mr-1" />
                              Complete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          
          <TabsContent value="done">
            {/* Similar table structure for completed tasks */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">Loading tasks...</TableCell>
                    </TableRow>
                  ) : completedTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">No completed tasks found.</TableCell>
                    </TableRow>
                  ) : (
                    completedTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium max-w-[300px]">
                          <div className="truncate" title={task.description}>
                            {task.description}
                          </div>
                          {task.document && (
                            <div className="mt-1">
                              <span className="text-xs flex items-center text-muted-foreground">
                                <FileTextIcon size={12} className="mr-1" />
                                {task.document.name}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(task.created_at)}</TableCell>
                        <TableCell>
                          <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                            {getSourceLabel(task)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'open')}
                            >
                              Reopen
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Tasks;
