import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDataStore, getProjectProgress, getTaskProgress } from '@/store/useStore';
import { Task, TaskStatus, Objective, TASK_STATUS_LABELS, PROJECT_STATUS_LABELS, ProjectStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2, Edit, Image, Users as UsersIcon, ListTodo, BarChart3, X } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const taskStatusColors: Record<TaskStatus, string> = {
  'todo': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-primary/10 text-primary',
  'done': 'bg-success/10 text-success',
};

export default function AdminProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, users, updateProject, addTask, updateTask, deleteTask } = useDataStore();
  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const allUsers = users;

  const [taskDialog, setTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo' as TaskStatus, assignedMemberId: '', dueDate: '' });
  const [newObjective, setNewObjective] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (!project) return <div className="p-8">Project not found. <Button variant="link" onClick={() => navigate('/admin/projects')}>← Back</Button></div>;

  const progress = getProjectProgress(projectTasks);
  const members = allUsers.filter(u => project.memberIds.includes(u.id));
  const teamLead = allUsers.find(u => u.id === project.teamLeadId);

  const pieData = [
    { name: 'To Do', value: projectTasks.filter(t => t.status === 'todo').length, color: 'hsl(var(--muted-foreground))' },
    { name: 'In Progress', value: projectTasks.filter(t => t.status === 'in-progress').length, color: 'hsl(var(--primary))' },
    { name: 'Done', value: projectTasks.filter(t => t.status === 'done').length, color: 'hsl(var(--success))' },
  ].filter(d => d.value > 0);

  const openTaskCreate = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', status: 'todo', assignedMemberId: '', dueDate: '' });
    setTaskDialog(true);
  };

  const openTaskEdit = (task: Task) => {
    setEditingTask(task);
    setTaskForm({ title: task.title, description: task.description, status: task.status, assignedMemberId: task.assignedMemberId, dueDate: task.dueDate });
    setTaskDialog(true);
  };

  const handleTaskSave = () => {
    if (!taskForm.title) return;
    if (editingTask) {
      updateTask(editingTask.id, taskForm);
      toast.success('Task updated');
    } else {
      addTask({ id: 't' + Date.now(), projectId: project.id, ...taskForm, objectives: [] });
      toast.success('Task created');
    }
    setTaskDialog(false);
  };

  const toggleObjective = (taskId: string, objId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const objectives = task.objectives.map(o => o.id === objId ? { ...o, completed: !o.completed } : o);
    updateTask(taskId, { objectives });
  };

  const addObjectiveToTask = (taskId: string) => {
    if (!newObjective.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTask(taskId, { objectives: [...task.objectives, { id: 'obj' + Date.now(), title: newObjective, completed: false }] });
    setNewObjective('');
  };

  const removeObjective = (taskId: string, objId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTask(taskId, { objectives: task.objectives.filter(o => o.id !== objId) });
  };

  const toggleMember = (userId: string) => {
    const mids = project.memberIds.includes(userId) ? project.memberIds.filter(id => id !== userId) : [...project.memberIds, userId];
    updateProject(project.id, { memberIds: mids });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/projects')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{PROJECT_STATUS_LABELS[project.status]}</p>
        </div>
        <Badge className={project.isPublic ? 'bg-primary/10 text-primary border-0' : 'bg-muted text-muted-foreground border-0'}>
          {project.isPublic ? 'Public' : 'Private'}
        </Badge>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
            <div className="text-3xl font-bold text-primary mb-2">{progress}%</div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Tasks</p>
            <div className="text-3xl font-bold">{projectTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{projectTasks.filter(t => t.status === 'done').length} completed</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No tasks yet</p>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="gap-1.5"><ListTodo className="h-3.5 w-3.5" />Tasks</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><UsersIcon className="h-3.5 w-3.5" />Team</TabsTrigger>
          <TabsTrigger value="info" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Info</TabsTrigger>
          <TabsTrigger value="gallery" className="gap-1.5"><Image className="h-3.5 w-3.5" />Gallery</TabsTrigger>
        </TabsList>

        {/* Tasks */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Tasks ({projectTasks.length})</h2>
            <Button size="sm" onClick={openTaskCreate}><Plus className="h-4 w-4 mr-1" />Add Task</Button>
          </div>
          <div className="space-y-3">
            {projectTasks.map((task) => {
              const tp = getTaskProgress(task);
              const assignee = allUsers.find(u => u.id === task.assignedMemberId);
              const isExpanded = expandedTask === task.id;
              return (
                <Card key={task.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          <Badge className={`${taskStatusColors[task.status]} border-0 text-[10px]`}>{TASK_STATUS_LABELS[task.status]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {assignee && (
                          <Avatar className="h-6 w-6"><AvatarImage src={assignee.avatarUrl} /><AvatarFallback className="text-[9px] bg-muted">{assignee.name[0]}</AvatarFallback></Avatar>
                        )}
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">{tp}%</span>
                          <Progress value={tp} className="w-16 h-1 mt-0.5" />
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openTaskEdit(task); }}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); toast.success('Task deleted'); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Objectives ({task.objectives.filter(o => o.completed).length}/{task.objectives.length})</p>
                        <div className="space-y-2">
                          {task.objectives.map((obj) => (
                            <div key={obj.id} className="flex items-center gap-2">
                              <Checkbox checked={obj.completed} onCheckedChange={() => toggleObjective(task.id, obj.id)} />
                              <span className={`text-sm flex-1 ${obj.completed ? 'line-through text-muted-foreground' : ''}`}>{obj.title}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeObjective(task.id, obj.id)}><X className="h-3 w-3" /></Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Input placeholder="New objective…" value={newObjective} onChange={(e) => setNewObjective(e.target.value)} className="h-8 text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addObjectiveToTask(task.id)} />
                          <Button size="sm" variant="outline" onClick={() => addObjectiveToTask(task.id)} className="h-8">Add</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {projectTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tasks yet. Create one to get started.</p>}
          </div>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-4">
          <h2 className="text-lg font-semibold">Team Members</h2>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Team Lead</Label>
              <Select value={project.teamLeadId} onValueChange={(v) => {
                const newMemberIds = project.memberIds.includes(v) ? project.memberIds : [...project.memberIds, v];
                updateProject(project.id, { teamLeadId: v, memberIds: newMemberIds });
              }}>
                <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                <SelectContent>
                  {allUsers.filter(u => u.role === 'user').map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Label className="mt-2">Members</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allUsers.filter(u => u.role === 'user').map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Checkbox checked={project.memberIds.includes(u.id)} onCheckedChange={() => toggleMember(u.id)} />
                  <Avatar className="h-7 w-7"><AvatarImage src={u.avatarUrl} /><AvatarFallback className="text-xs bg-muted">{u.name[0]}</AvatarFallback></Avatar>
                  <span className="text-sm">{u.name}</span>
                  {u.id === project.teamLeadId && <Badge variant="outline" className="text-[10px] ml-auto">Lead</Badge>}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Info */}
        <TabsContent value="info" className="space-y-4">
          <Card className="shadow-card">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2"><Label>Project Name</Label><Input value={project.name} onChange={(e) => updateProject(project.id, { name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={project.description} onChange={(e) => updateProject(project.id, { description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={project.status} onValueChange={(v) => updateProject(project.id, { status: v as ProjectStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['not-started', 'in-progress', 'completed', 'on-hold'] as ProjectStatus[]).map(s => <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={project.isPublic} onCheckedChange={(c) => updateProject(project.id, { isPublic: c })} />
                  <Label>Public</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={project.startDate} onChange={(e) => updateProject(project.id, { startDate: e.target.value })} /></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={project.dueDate} onChange={(e) => updateProject(project.id, { dueDate: e.target.value })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery */}
        <TabsContent value="gallery" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Images</h2>
            <Button size="sm" variant="outline" onClick={() => {
              const url = prompt('Enter image URL:');
              if (url) {
                updateProject(project.id, { images: [...project.images, url], featuredImage: project.featuredImage || url });
                toast.success('Image added');
              }
            }}><Plus className="h-4 w-4 mr-1" />Add Image</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {project.images.map((img, i) => (
              <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="secondary" onClick={() => { updateProject(project.id, { featuredImage: img }); toast.success('Featured image set'); }}>
                    {project.featuredImage === img ? '★ Featured' : 'Set Featured'}
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => updateProject(project.id, { images: project.images.filter((_, j) => j !== i) })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Dialog */}
      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v as TaskStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['todo', 'in-progress', 'done'] as TaskStatus[]).map(s => <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={taskForm.assignedMemberId} onValueChange={(v) => setTaskForm({ ...taskForm, assignedMemberId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {members.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleTaskSave}>{editingTask ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
