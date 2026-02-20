import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore, getProjectProgress } from '@/store/useStore';
import { Project, ProjectStatus, PROJECT_STATUS_LABELS } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, LayoutGrid, List, Trash2, Edit, Eye, EyeOff, GripVertical, ArrowRight, FolderKanban, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectService } from '@/services/projectService';
import { 
  mapBackendProjectToFrontend, 
  mapFrontendFormToCreatePayload, 
  mapFrontendFormToUpdatePayload 
} from '@/lib/projectMapper';

// ─── Status Maps ───
const statusStyle: Record<ProjectStatus, { dot: string; bg: string; text: string; border: string }> = {
  'not-started': { dot: 'bg-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-700' },
  'in-progress': { dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'completed': { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'on-hold': { dot: 'bg-rose-400', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

const kanbanColumns: ProjectStatus[] = ['not-started', 'in-progress', 'completed', 'on-hold'];

// ─── Sub-components ───
function InputField({ label, type = "text", value, onChange, placeholder = "" }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 resize-y focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "Select..." }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200 appearance-none cursor-pointer"
        style={{ fontFamily: "inherit" }}
      >
        <option value="" className="bg-slate-950 text-slate-500">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-slate-950 text-slate-200">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function PrimaryButton({ children, onClick, className = "", small = false }: {
  children: React.ReactNode; onClick?: () => void; className?: string; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 cursor-pointer border-none ${small ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-sm"} ${className}`}
      style={{ fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

function OutlineBtn({ children, onClick, className = "", small = false, danger = false }: {
  children: React.ReactNode; onClick?: (e?: any) => void; className?: string; small?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border bg-transparent cursor-pointer transition-all duration-200 ${
        danger
          ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50"
          : "border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400"
      } ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${className}`}
      style={{ fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, className = "", title = "" }: {
  children: React.ReactNode; onClick?: (e?: any) => void; className?: string; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-all duration-200 w-8 h-8 ${className}`}
      style={{ fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <GhostBtn onClick={onClose}><X className="w-4 h-4" /></GhostBtn>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 pb-6 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-400 uppercase tracking-widest mb-3.5">
      <span className="w-5 h-px bg-amber-400" />
      {children}
    </div>
  );
}

// ─── Main ───
export default function ProjectsManagement() {
  const navigate = useNavigate();
  const { tasks, users } = useDataStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ProjectStatus | null>(null);

  const [form, setForm] = useState({ name: '', description: '', status: 'not-started' as ProjectStatus, startDate: '', dueDate: '', isPublic: false });

  // Load projects from API
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const backendProjects = await projectService.getAll();
      const mappedProjects = backendProjects.map(mapBackendProjectToFrontend);
      setProjects(mappedProjects);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      toast.error(error.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!form.name || !form.startDate) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setSaving(true);
      
      if (editProject) {
        // Update existing project
        const payload = mapFrontendFormToUpdatePayload(form);
        const updated = await projectService.update(editProject.id, payload);
        const mappedProject = mapBackendProjectToFrontend(updated);
        
        setProjects(prev => prev.map(p => p.id === editProject.id ? mappedProject : p));
        toast.success('Project updated successfully');
      } else {
        // Create new project
        const payload = mapFrontendFormToCreatePayload(form);
        const created = await projectService.create(payload);
        const mappedProject = mapBackendProjectToFrontend(created);
        
        setProjects(prev => [...prev, mappedProject]);
        toast.success('Project created successfully');
      }
      
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to save project:', error);
      toast.error(error.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e?: any) => {
    e?.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await projectService.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleToggleVisibility = async (project: Project, e: any) => {
    e.stopPropagation();
    
    try {
      const payload = mapFrontendFormToUpdatePayload({ isPublic: !project.isPublic });
      const updated = await projectService.update(project.id, payload);
      const mappedProject = mapBackendProjectToFrontend(updated);
      
      setProjects(prev => prev.map(p => p.id === project.id ? mappedProject : p));
      toast.success(project.isPublic ? 'Made private' : 'Made public');
    } catch (error: any) {
      console.error('Failed to update visibility:', error);
      toast.error(error.response?.data?.message || 'Failed to update visibility');
    }
  };

  const handleDrop = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const payload = mapFrontendFormToUpdatePayload({ status: newStatus });
      const updated = await projectService.update(projectId, payload);
      const mappedProject = mapBackendProjectToFrontend(updated);
      
      setProjects(prev => prev.map(p => p.id === projectId ? mappedProject : p));
      toast.success('Status updated successfully');
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setDraggedId(null);
      setDragOverCol(null);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes hub-float1 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(40px,-30px); } 66% { transform:translate(-20px,40px); } }
        @keyframes hub-float2 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(-30px,40px); } 66% { transform:translate(30px,-20px); } }
        .font-mono { font-family: 'DM Mono', monospace !important; }
      `}</style>

      {/* ── Ambient BG ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "linear-gradient(rgb(51,65,85) 1px, transparent 1px), linear-gradient(90deg, rgb(51,65,85) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 10%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 10%, transparent 70%)",
        }} />
        <div className="absolute w-[600px] h-[600px] rounded-full -top-52 -left-24 bg-amber-500/5 blur-[140px]" style={{ animation: "hub-float1 22s ease-in-out infinite" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full -bottom-52 -right-24 bg-orange-500/5 blur-[140px]" style={{ animation: "hub-float2 26s ease-in-out infinite" }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <SectionLabel>Management</SectionLabel>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">Projects</h1>
            <p className="text-slate-500 text-sm">{projects.length} total project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <PrimaryButton onClick={openCreate}>
            <Plus className="w-4 h-4" /> New Project
          </PrimaryButton>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
              style={{ fontFamily: "inherit" }}
            />
          </div>
          <div className="flex rounded-xl border border-slate-800 overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`w-9 h-9 grid place-items-center cursor-pointer border-none transition-all duration-200 ${
                view === 'table' ? 'bg-amber-500/10 text-amber-400' : 'bg-transparent text-slate-500 hover:text-slate-300'
              }`}
              style={{ fontFamily: "inherit" }}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`w-9 h-9 grid place-items-center cursor-pointer border-none border-l border-slate-800 transition-all duration-200 ${
                view === 'kanban' ? 'bg-amber-500/10 text-amber-400' : 'bg-transparent text-slate-500 hover:text-slate-300'
              }`}
              style={{ fontFamily: "inherit" }}
              title="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═══ TABLE VIEW ═══ */}
        {view === 'table' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-widest">
              <div className="col-span-3">Project</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Progress</div>
              <div className="col-span-1">Lead</div>
              <div className="col-span-1">Start</div>
              <div className="col-span-1">Due</div>
              <div className="col-span-1 text-center">Vis.</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-slate-500">Loading projects...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-16">
                <FolderKanban className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  {search ? 'No projects match your search.' : 'No projects yet. Create one to get started.'}
                </p>
              </div>
            )}

            {/* Table rows */}
            {!loading && filtered.map((p) => {
              const pTasks = tasks.filter((t) => t.projectId === p.id);
              const progress = getProjectProgress(pTasks);
              const lead = users.find((u) => u.id === p.teamLeadId);
              const ss = statusStyle[p.status];

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/admin/projects/${p.id}`)}
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-b-0 items-center cursor-pointer hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Name */}
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">{p.name}</p>
                    <p className="text-xs text-slate-600 truncate">{p.description}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.65rem] font-medium font-mono uppercase tracking-wide ${ss.bg} ${ss.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                      {PROJECT_STATUS_LABELS[p.status]}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-20">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-mono w-8">{progress}%</span>
                  </div>

                  {/* Lead */}
                  <div className="col-span-1">
                    {lead ? (
                      <Avatar className="h-7 w-7 border-2 border-slate-800">
                        <AvatarImage src={lead.avatarUrl} />
                        <AvatarFallback className="text-[0.55rem] bg-amber-500/10 text-amber-400 font-bold">{lead.name[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </div>

                  {/* Start */}
                  <div className="col-span-1">
                    <span className="text-xs text-slate-500 font-mono">{p.startDate || '—'}</span>
                  </div>

                  {/* Due */}
                  <div className="col-span-1">
                    <span className="text-xs text-slate-500 font-mono">{p.dueDate || '—'}</span>
                  </div>

                  {/* Visibility */}
                  <div className="col-span-1 text-center">
                    <GhostBtn
                      onClick={(e: any) => handleToggleVisibility(p, e)}
                      title={p.isPublic ? 'Public — click to make private' : 'Private — click to make public'}
                    >
                      {p.isPublic
                        ? <Eye className="w-4 h-4 text-sky-400" />
                        : <EyeOff className="w-4 h-4 text-slate-600" />
                      }
                    </GhostBtn>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-0.5">
                    <GhostBtn onClick={(e: any) => { e.stopPropagation(); openEdit(p); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </GhostBtn>
                    <GhostBtn onClick={(e: any) => handleDelete(p.id, e)} className="hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </GhostBtn>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ KANBAN VIEW ═══ */}
        {view === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {kanbanColumns.map((status) => {
              const ss = statusStyle[status];
              const colProjects = filtered.filter(p => p.status === status);
              const isOver = dragOverCol === status;

              return (
                <div
                  key={status}
                  onDragOver={(e) => { e.preventDefault(); setDragOverCol(status); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={() => draggedId && handleDrop(draggedId, status)}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-medium font-mono uppercase tracking-wide ${ss.bg} ${ss.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                      {PROJECT_STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">{colProjects.length}</span>
                  </div>

                  {/* Drop zone */}
                  <div className={`space-y-2.5 min-h-[120px] p-2.5 rounded-xl border border-dashed transition-all duration-200 ${
                    isOver
                      ? `${ss.border} bg-slate-900/60`
                      : "border-slate-800 bg-slate-900/30"
                  }`}>
                    {colProjects.map((p) => {
                      const pTasks = tasks.filter(t => t.projectId === p.id);
                      const progress = getProjectProgress(pTasks);
                      const members = users.filter(u => p.memberIds?.includes(u.id));

                      return (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={() => setDraggedId(p.id)}
                          onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                          onClick={() => navigate(`/admin/projects/${p.id}`)}
                          className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-amber-500/30 transition-all duration-200 group ${
                            draggedId === p.id ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-slate-200 group-hover:text-amber-400 transition-colors leading-tight flex-1 mr-2">{p.name}</p>
                            <GripVertical className="w-3.5 h-3.5 text-slate-700 flex-shrink-0 mt-0.5" />
                          </div>
                          {p.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-1.5">
                              {members.slice(0, 3).map(m => (
                                <Avatar key={m.id} className="h-6 w-6 border-2 border-slate-900">
                                  <AvatarImage src={m.avatarUrl} />
                                  <AvatarFallback className="text-[0.5rem] bg-amber-500/10 text-amber-400 font-bold">{m.name?.[0]}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-14 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-[0.65rem] text-slate-500 font-mono">{progress}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {colProjects.length === 0 && (
                      <div className="flex items-center justify-center h-20">
                        <p className="text-xs text-slate-600">Drop here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editProject ? 'Edit Project' : 'New Project'}
        footer={
          <>
            <OutlineBtn onClick={() => setDialogOpen(false)} className={saving ? 'opacity-50 pointer-events-none' : ''}>
              Cancel
            </OutlineBtn>
            <PrimaryButton small onClick={handleSave} className={saving ? 'opacity-75' : ''}>
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {editProject ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editProject ? 'Update' : 'Create'
              )}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <InputField 
            label="Name *" 
            value={form.name} 
            onChange={(v) => setForm({ ...form, name: v })} 
            placeholder="Project name" 
          />
          <TextareaField 
            label="Description" 
            value={form.description} 
            onChange={(v) => setForm({ ...form, description: v })} 
            placeholder="Describe the project..." 
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as ProjectStatus })}
              options={kanbanColumns.map(s => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
            />
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">Visibility</label>
              <div className="flex items-center gap-3 h-[42px]">
                <Switch checked={form.isPublic} onCheckedChange={(c) => setForm({ ...form, isPublic: c })} />
                <span className="text-sm text-slate-400">{form.isPublic ? "Public" : "Private"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="Start Date *" 
              type="date" 
              value={form.startDate} 
              onChange={(v) => setForm({ ...form, startDate: v })} 
            />
            <InputField 
              label="Due Date" 
              type="date" 
              value={form.dueDate} 
              onChange={(v) => setForm({ ...form, dueDate: v })} 
            />
          </div>
          <p className="text-xs text-slate-600 mt-2">* Required fields</p>
        </div>
      </Modal>
    </div>
  );
}