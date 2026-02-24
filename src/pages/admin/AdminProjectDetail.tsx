import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDataStore, getProjectProgress, getTaskProgress } from '@/store/useStore';
import { Task, TaskStatus, Objective, TASK_STATUS_LABELS, PROJECT_STATUS_LABELS, ProjectStatus } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, Edit, Image, Users as UsersIcon, ListTodo, BarChart3, X, ChevronDown, ChevronRight, Calendar, Target, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// ─── Status Maps ───
const taskStatusStyle: Record<TaskStatus, { dot: string; bg: string; text: string }> = {
  'todo': { dot: 'bg-slate-400', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  'in-progress': { dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'done': { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

const projectStatusStyle: Record<ProjectStatus, { dot: string; bg: string; text: string }> = {
  'not-started': { dot: 'bg-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  'in-progress': { dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'completed': { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'on-hold': { dot: 'bg-rose-400', bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

// ─── Sub-components ───
function DashCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/20 ${className}`}>
      {children}
    </div>
  );
}

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

function TextareaField({ label, value, onChange, placeholder = "", rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
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

function GhostBtn({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: (e?: any) => void; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-all duration-200 w-8 h-8 ${className}`}
      style={{ fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

// ─── Modal ───
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

// ─── Tab Button ───
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border-none ${
        active
          ? "bg-amber-500/10 text-amber-400"
          : "bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
      }`}
      style={{ fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

// ─── Main ───
export default function AdminProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, users, updateProject, addTask, updateTask, deleteTask } = useDataStore();
  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const allUsers = users;

  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'info' | 'gallery'>('tasks');
  const [taskDialog, setTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo' as TaskStatus, assignedMemberId: '', dueDate: '' });
  const [newObjective, setNewObjective] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>
        <div className="text-center">
          <p className="text-slate-500 mb-4">Project not found.</p>
          <OutlineBtn onClick={() => navigate('/admin/projects')}>
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </OutlineBtn>
        </div>
      </div>
    );
  }

  const progress = getProjectProgress(projectTasks);
  const members = allUsers.filter(u => project.memberIds.includes(u.id));
  const ps = projectStatusStyle[project.status] || projectStatusStyle['not-started'];

  const todoCount = projectTasks.filter(t => t.status === 'todo').length;
  const inProgressCount = projectTasks.filter(t => t.status === 'in-progress').length;
  const doneCount = projectTasks.filter(t => t.status === 'done').length;

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/projects')}
            className="w-10 h-10 rounded-xl border border-slate-800 bg-transparent grid place-items-center text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-all duration-200 cursor-pointer flex-shrink-0"
            style={{ fontFamily: "inherit" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{project.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-wide ${ps.bg} ${ps.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wide ${project.isPublic ? "bg-sky-500/10 text-sky-400" : "bg-slate-500/10 text-slate-500"}`}>
                {project.isPublic ? "Public" : "Private"}
              </span>
            </div>
            <p className="text-sm text-slate-500 truncate">{project.description}</p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashCard className="p-5">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Progress</div>
            <div className="text-3xl font-extrabold bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">{progress}%</div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </DashCard>
          <DashCard className="p-5">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Tasks</div>
            <div className="text-3xl font-extrabold text-slate-100">{projectTasks.length}</div>
            <div className="text-xs text-slate-500 mt-1">{doneCount} completed</div>
          </DashCard>
          <DashCard className="p-5">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Breakdown</div>
            <div className="flex items-center gap-3 mt-1">
              {[
                { label: "Todo", count: todoCount, color: "bg-slate-600" },
                { label: "Active", count: inProgressCount, color: "bg-amber-500" },
                { label: "Done", count: doneCount, color: "bg-emerald-500" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-slate-400">{s.count}</span>
                </div>
              ))}
            </div>
            {projectTasks.length > 0 && (
              <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-slate-800">
                {todoCount > 0 && <div className="bg-slate-600 transition-all" style={{ width: `${(todoCount / projectTasks.length) * 100}%` }} />}
                {inProgressCount > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${(inProgressCount / projectTasks.length) * 100}%` }} />}
                {doneCount > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(doneCount / projectTasks.length) * 100}%` }} />}
              </div>
            )}
          </DashCard>
          <DashCard className="p-5">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Team</div>
            <div className="flex -space-x-2 mt-1">
              {members.slice(0, 5).map(m => (
                <Avatar key={m.id} className="h-8 w-8 border-2 border-slate-900">
                  <AvatarImage src={m.avatarUrl} />
                  <AvatarFallback className="text-[0.6rem] bg-amber-500/10 text-amber-400 font-bold">{m.name?.[0]}</AvatarFallback>
                </Avatar>
              ))}
              {members.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 grid place-items-center text-[0.6rem] text-slate-400 font-mono font-bold">
                  +{members.length - 5}
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-2">{members.length} member{members.length !== 1 ? 's' : ''}</div>
          </DashCard>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit mb-8">
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>
            <ListTodo className="w-3.5 h-3.5" /> Tasks
          </TabButton>
          <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')}>
            <UsersIcon className="w-3.5 h-3.5" /> Team
          </TabButton>
          <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')}>
            <BarChart3 className="w-3.5 h-3.5" /> Info
          </TabButton>
          <TabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')}>
            <Image className="w-3.5 h-3.5" /> Gallery
          </TabButton>
        </div>

        {/* ═══ TASKS TAB ═══ */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Tasks <span className="text-slate-500 font-mono text-sm ml-1">({projectTasks.length})</span></h2>
              <PrimaryButton small onClick={openTaskCreate}>
                <Plus className="w-3.5 h-3.5" /> Add Task
              </PrimaryButton>
            </div>
            <div className="space-y-3">
              {projectTasks.map((task) => {
                const tp = getTaskProgress(task);
                const assignee = allUsers.find(u => u.id === task.assignedMemberId);
                const isExpanded = expandedTask === task.id;
                const ts = taskStatusStyle[task.status];
                return (
                  <DashCard key={task.id} className="p-0 overflow-hidden">
                    {/* Task header row */}
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    >
                      <div className="text-slate-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-200">{task.title}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-medium font-mono uppercase tracking-wide ${ts.bg} ${ts.text}`}>
                            <span className={`w-1 h-1 rounded-full ${ts.dot}`} />
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {assignee && (
                          <Avatar className="h-7 w-7 border-2 border-slate-900">
                            <AvatarImage src={assignee.avatarUrl} />
                            <AvatarFallback className="text-[0.55rem] bg-amber-500/10 text-amber-400 font-bold">{assignee.name[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="hidden sm:flex items-center gap-2 w-24">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700" style={{ width: `${tp}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 font-mono w-7 text-right">{tp}%</span>
                        </div>
                        <GhostBtn onClick={(e: any) => { e.stopPropagation(); openTaskEdit(task); }}>
                          <Edit className="w-3.5 h-3.5" />
                        </GhostBtn>
                        <GhostBtn onClick={(e: any) => { e.stopPropagation(); deleteTask(task.id); toast.success('Task deleted'); }} className="hover:text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </GhostBtn>
                      </div>
                    </div>

                    {/* Expanded: Objectives */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-800 mx-4 mb-2">
                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
                          <Target className="w-3 h-3 inline mr-1" />
                          Objectives ({task.objectives.filter(o => o.completed).length}/{task.objectives.length})
                        </p>
                        <div className="space-y-2">
                          {task.objectives.map((obj) => (
                            <div key={obj.id} className="flex items-center gap-3 group">
                              <button
                                onClick={() => toggleObjective(task.id, obj.id)}
                                className={`w-5 h-5 rounded border-2 flex-shrink-0 grid place-items-center transition-all cursor-pointer ${
                                  obj.completed
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-slate-700 bg-transparent hover:border-amber-500/50"
                                }`}
                                style={{ fontFamily: "inherit" }}
                              >
                                {obj.completed && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                )}
                              </button>
                              <span className={`text-sm flex-1 transition-colors ${obj.completed ? "line-through text-slate-600" : "text-slate-300"}`}>{obj.title}</span>
                              <button
                                onClick={() => removeObjective(task.id, obj.id)}
                                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded grid place-items-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer bg-transparent border-none"
                                style={{ fontFamily: "inherit" }}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <input
                            placeholder="New objective…"
                            value={newObjective}
                            onChange={(e) => setNewObjective(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addObjectiveToTask(task.id)}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 outline-none transition-all"
                            style={{ fontFamily: "inherit" }}
                          />
                          <OutlineBtn small onClick={() => addObjectiveToTask(task.id)}>Add</OutlineBtn>
                        </div>
                      </div>
                    )}
                  </DashCard>
                );
              })}
              {projectTasks.length === 0 && (
                <div className="text-center py-16">
                  <ListTodo className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No tasks yet. Create one to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TEAM TAB ═══ */}
        {activeTab === 'team' && (
          <div>
            <h2 className="text-lg font-semibold mb-5">Team Members</h2>
            <DashCard className="mb-6">
              <SelectField
                label="Team Lead"
                value={project.teamLeadId}
                onChange={(v) => {
                  const newMemberIds = project.memberIds.includes(v) ? project.memberIds : [...project.memberIds, v];
                  updateProject(project.id, { teamLeadId: v, memberIds: newMemberIds });
                }}
                options={allUsers.filter(u => u.role === 'user').map(u => ({ value: u.id, label: u.name }))}
                placeholder="Select lead..."
              />
            </DashCard>
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Members</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {allUsers.filter(u => u.role === 'user').map(u => {
                const isMember = project.memberIds.includes(u.id);
                const isLead = u.id === project.teamLeadId;
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isMember
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 grid place-items-center transition-all ${
                      isMember ? "bg-amber-500 border-amber-500 text-white" : "border-slate-700 bg-transparent"
                    }`}>
                      {isMember && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <Avatar className="h-8 w-8 border-2 border-slate-800">
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback className="text-[0.6rem] bg-amber-500/10 text-amber-400 font-bold">{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium flex-1">{u.name}</span>
                    {isLead && (
                      <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-mono uppercase tracking-wide bg-amber-500/10 text-amber-400">Lead</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ INFO TAB ═══ */}
        {activeTab === 'info' && (
          <DashCard>
            <div className="space-y-5">
              <InputField label="Project Name" value={project.name} onChange={(v) => updateProject(project.id, { name: v })} />
              <TextareaField label="Description" value={project.description} onChange={(v) => updateProject(project.id, { description: v })} />
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Status"
                  value={project.status}
                  onChange={(v) => updateProject(project.id, { status: v as ProjectStatus })}
                  options={(['not-started', 'in-progress', 'completed', 'on-hold'] as ProjectStatus[]).map(s => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
                />
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">Visibility</label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <Switch checked={project.isPublic} onCheckedChange={(c) => updateProject(project.id, { isPublic: c })} />
                    <span className="text-sm text-slate-400">{project.isPublic ? "Public" : "Private"}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Start Date" type="date" value={project.startDate} onChange={(v) => updateProject(project.id, { startDate: v })} />
                <InputField label="Due Date" type="date" value={project.dueDate} onChange={(v) => updateProject(project.id, { dueDate: v })} />
              </div>
            </div>
          </DashCard>
        )}

        {/* ═══ GALLERY TAB ═══ */}
        {activeTab === 'gallery' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Images</h2>
              <OutlineBtn small onClick={() => {
                const url = prompt('Enter image URL:');
                if (url) {
                  updateProject(project.id, { images: [...project.images, url], featuredImage: project.featuredImage || url });
                  toast.success('Image added');
                }
              }}>
                <Plus className="w-3.5 h-3.5" /> Add Image
              </OutlineBtn>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {project.images.map((img, i) => (
                <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/30 transition-all">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <OutlineBtn small onClick={() => { updateProject(project.id, { featuredImage: img }); toast.success('Featured image set'); }}>
                      {project.featuredImage === img ? '★ Featured' : 'Set Featured'}
                    </OutlineBtn>
                    <OutlineBtn small danger onClick={() => updateProject(project.id, { images: project.images.filter((_, j) => j !== i) })}>
                      <Trash2 className="w-3 h-3" />
                    </OutlineBtn>
                  </div>
                  {project.featuredImage === img && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[0.6rem] font-mono uppercase tracking-wide bg-amber-500/20 text-amber-400 backdrop-blur-sm border border-amber-500/20">
                      ★ Featured
                    </div>
                  )}
                </div>
              ))}
              {project.images.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Image className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No images yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ TASK DIALOG ═══ */}
      <Modal
        open={taskDialog}
        onClose={() => setTaskDialog(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
        footer={
          <>
            <OutlineBtn onClick={() => setTaskDialog(false)}>Cancel</OutlineBtn>
            <PrimaryButton small onClick={handleTaskSave}>{editingTask ? 'Update' : 'Create'}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <InputField label="Title" value={taskForm.title} onChange={(v) => setTaskForm({ ...taskForm, title: v })} placeholder="Task title" />
          <TextareaField label="Description" value={taskForm.description} onChange={(v) => setTaskForm({ ...taskForm, description: v })} placeholder="Describe the task..." />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Status"
              value={taskForm.status}
              onChange={(v) => setTaskForm({ ...taskForm, status: v as TaskStatus })}
              options={(['todo', 'in-progress', 'done'] as TaskStatus[]).map(s => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
            />
            <SelectField
              label="Assignee"
              value={taskForm.assignedMemberId}
              onChange={(v) => setTaskForm({ ...taskForm, assignedMemberId: v })}
              options={members.map(u => ({ value: u.id, label: u.name }))}
              placeholder="Select member..."
            />
          </div>
          <InputField label="Due Date" type="date" value={taskForm.dueDate} onChange={(v) => setTaskForm({ ...taskForm, dueDate: v })} />
        </div>
      </Modal>
    </div>
  );
}