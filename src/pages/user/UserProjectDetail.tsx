import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore, useDataStore, getProjectProgress, getTaskProgress } from '@/store/useStore';
import { Task, TaskStatus, TASK_STATUS_LABELS, PROJECT_STATUS_LABELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const taskStatusColors: Record<TaskStatus, string> = {
  'todo': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-primary/10 text-primary',
  'done': 'bg-success/10 text-success',
};

export default function UserProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const { projects, tasks, users, updateTask, addTask, deleteTask } = useDataStore();
  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newObjective, setNewObjective] = useState('');
  const [taskDialog, setTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo' as TaskStatus, assignedMemberId: '', dueDate: '' });

  if (!project || !currentUser) return <div className="p-8">Project not found. <Button variant="link" onClick={() => navigate('/dashboard')}>← Back</Button></div>;

  const isLead = project.teamLeadId === currentUser.id;
  const progress = getProjectProgress(projectTasks);
  const members = users.filter(u => project.memberIds.includes(u.id));

  const toggleObjective = (taskId: string, objId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    // Members can only toggle their own task objectives
    if (!isLead && task.assignedMemberId !== currentUser.id) return;
    const objectives = task.objectives.map(o => o.id === objId ? { ...o, completed: !o.completed } : o);
    updateTask(taskId, { objectives });
  };

  const addObjectiveToTask = (taskId: string) => {
    if (!newObjective.trim() || !isLead) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTask(taskId, { objectives: [...task.objectives, { id: 'obj' + Date.now(), title: newObjective, completed: false }] });
    setNewObjective('');
  };

  const openTaskCreate = () => {
    if (!isLead) return;
    setEditingTask(null);
    setTaskForm({ title: '', description: '', status: 'todo', assignedMemberId: '', dueDate: '' });
    setTaskDialog(true);
  };

  const openTaskEdit = (task: Task) => {
    if (!isLead) return;
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{PROJECT_STATUS_LABELS[project.status]} · {isLead ? 'Team Lead' : 'Member'}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Progress</p>
          <div className="text-2xl font-bold text-primary">{progress}%</div>
          <Progress value={progress} className="h-1.5 mt-2" />
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
          <div className="text-2xl font-bold">{projectTasks.length}</div>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">My Tasks</p>
          <div className="text-2xl font-bold">{projectTasks.filter(t => t.assignedMemberId === currentUser.id).length}</div>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Team</p>
          <div className="flex -space-x-2 mt-1">
            {members.slice(0, 5).map(m => (
              <Avatar key={m.id} className="h-7 w-7 border-2 border-card"><AvatarImage src={m.avatarUrl} /><AvatarFallback className="text-[9px] bg-muted">{m.name[0]}</AvatarFallback></Avatar>
            ))}
          </div>
        </CardContent></Card>
      </div>

      {/* Tasks */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {isLead && <Button size="sm" onClick={openTaskCreate}><Plus className="h-4 w-4 mr-1" />Add Task</Button>}
      </div>

      <div className="space-y-3">
        {projectTasks.map(task => {
          const tp = getTaskProgress(task);
          const assignee = users.find(u => u.id === task.assignedMemberId);
          const isExpanded = expandedTask === task.id;
          const canEditObjectives = isLead || task.assignedMemberId === currentUser.id;

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
                    {isLead && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openTaskEdit(task); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); toast.success('Deleted'); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Objectives ({task.objectives.filter(o => o.completed).length}/{task.objectives.length})</p>
                    <div className="space-y-2">
                      {task.objectives.map(obj => (
                        <div key={obj.id} className="flex items-center gap-2">
                          <Checkbox checked={obj.completed} onCheckedChange={() => canEditObjectives && toggleObjective(task.id, obj.id)} disabled={!canEditObjectives} />
                          <span className={`text-sm flex-1 ${obj.completed ? 'line-through text-muted-foreground' : ''}`}>{obj.title}</span>
                          {isLead && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const t = tasks.find(x => x.id === task.id); if (t) updateTask(task.id, { objectives: t.objectives.filter(o => o.id !== obj.id) }); }}><X className="h-3 w-3" /></Button>}
                        </div>
                      ))}
                    </div>
                    {isLead && (
                      <div className="flex gap-2 mt-3">
                        <Input placeholder="New objective…" value={newObjective} onChange={(e) => setNewObjective(e.target.value)} className="h-8 text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && addObjectiveToTask(task.id)} />
                        <Button size="sm" variant="outline" onClick={() => addObjectiveToTask(task.id)} className="h-8">Add</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Dialog (Team Lead only) */}
      {isLead && (
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
      )}
    </div>
  );
}
