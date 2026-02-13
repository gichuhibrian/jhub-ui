import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore, getProjectProgress } from '@/store/useStore';
import { Project, ProjectStatus, PROJECT_STATUS_LABELS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, LayoutGrid, List, Trash2, Edit, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const statusColors: Record<ProjectStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-primary/10 text-primary',
  'completed': 'bg-success/10 text-success',
  'on-hold': 'bg-warning/10 text-warning',
};

const kanbanColumns: ProjectStatus[] = ['not-started', 'in-progress', 'completed', 'on-hold'];

export default function ProjectsManagement() {
  const navigate = useNavigate();
  const { projects, tasks, users, addProject, updateProject, deleteProject, addActivity } = useDataStore();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', status: 'not-started' as ProjectStatus, startDate: '', dueDate: '', isPublic: false });

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: '', description: '', status: 'not-started', startDate: '', dueDate: '', isPublic: false });
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setForm({ name: p.name, description: p.description, status: p.status, startDate: p.startDate, dueDate: p.dueDate, isPublic: p.isPublic });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editProject) {
      updateProject(editProject.id, form);
      toast.success('Project updated');
    } else {
      const newProject: Project = {
        id: 'p' + Date.now(),
        ...form,
        images: [],
        featuredImage: '',
        teamLeadId: '',
        memberIds: [],
      };
      addProject(newProject);
      toast.success('Project created');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    toast.success('Project deleted');
  };

  const handleDrop = (projectId: string, newStatus: ProjectStatus) => {
    updateProject(projectId, { status: newStatus });
    setDraggedId(null);
    toast.success('Status updated');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm">{projects.length} total projects</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Project</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex rounded-lg border border-border">
          <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('table')}><List className="h-4 w-4" /></Button>
          <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('kanban')}><LayoutGrid className="h-4 w-4" /></Button>
        </div>
      </div>

      {view === 'table' ? (
        <Card className="shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const pTasks = tasks.filter((t) => t.projectId === p.id);
                const progress = getProjectProgress(pTasks);
                const lead = users.find((u) => u.id === p.teamLeadId);
                return (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/admin/projects/${p.id}`)}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge className={`${statusColors[p.status]} border-0 text-xs`}>{PROJECT_STATUS_LABELS[p.status]}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={progress} className="w-16 h-1.5" /><span className="text-xs text-muted-foreground">{progress}%</span></div></TableCell>
                    <TableCell className="text-sm">{lead?.name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.startDate}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.dueDate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); updateProject(p.id, { isPublic: !p.isPublic }); toast.success(p.isPublic ? 'Made private' : 'Made public'); }}>
                        {p.isPublic ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((status) => (
            <div
              key={status}
              className="space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => draggedId && handleDrop(draggedId, status)}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${statusColors[status]} border-0 text-xs`}>{PROJECT_STATUS_LABELS[status]}</Badge>
                <span className="text-xs text-muted-foreground">{filtered.filter(p => p.status === status).length}</span>
              </div>
              <div className="space-y-2 min-h-[100px] p-2 rounded-lg bg-muted/30 border border-dashed border-border">
                {filtered.filter(p => p.status === status).map((p) => {
                  const pTasks = tasks.filter(t => t.projectId === p.id);
                  const progress = getProjectProgress(pTasks);
                  return (
                    <Card
                      key={p.id}
                      draggable
                      onDragStart={() => setDraggedId(p.id)}
                      onClick={() => navigate(`/admin/projects/${p.id}`)}
                      className="shadow-card cursor-grab active:cursor-grabbing hover:shadow-card-hover transition-shadow"
                    >
                      <CardContent className="p-3">
                        <p className="font-medium text-sm mb-2">{p.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                          <Progress value={progress} className="w-16 h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {kanbanColumns.map(s => <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.isPublic} onCheckedChange={(c) => setForm({ ...form, isPublic: c })} />
                <Label>Public</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editProject ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
