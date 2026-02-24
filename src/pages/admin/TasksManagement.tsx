import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService, TaskResponse, CreateTaskPayload } from '@/services/taskService';
import { projectService, ProjectResponse } from '@/services/projectService';
import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

// Components
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
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function PrimaryButton({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 ${className}`}
    >
      {children}
    </button>
  );
}

function OutlineBtn({ children, onClick, className = "", danger = false }: {
  children: React.ReactNode; onClick?: () => void; className?: string; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-all duration-200 ${
        danger
          ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50"
          : "border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400"
      } ${className}`}
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
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">{title}</h2>
          {children}
        </div>
        {footer && <div className="px-6 pb-6 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export default function TasksManagement() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskDialog, setTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);
  const [taskForm, setTaskForm] = useState<CreateTaskPayload>({
    projectId: '',
    title: '',
    description: '',
    status: 'TODO',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        taskService.getAll(),
        projectService.getAll(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openTaskCreate = () => {
    setEditingTask(null);
    setTaskForm({
      projectId: '',
      title: '',
      description: '',
      status: 'TODO',
      startDate: '',
      endDate: '',
    });
    setTaskDialog(true);
  };

  const openTaskEdit = (task: TaskResponse) => {
    setEditingTask(task);
    setTaskForm({
      projectId: task.projectId,
      title: task.title,
      description: task.description || '',
      status: task.status,
      startDate: task.startDate || '',
      endDate: task.endDate || '',
    });
    setTaskDialog(true);
  };

  const handleTaskSave = async () => {
    if (!taskForm.title || !taskForm.projectId) {
      toast.error('Title and Project are required');
      return;
    }

    try {
      if (editingTask) {
        await taskService.update(editingTask.id, taskForm);
        toast.success('Task updated successfully');
      } else {
        await taskService.create(taskForm);
        toast.success('Task created successfully');
      }
      setTaskDialog(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save task');
      console.error(error);
    }
  };

  const handleTaskDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.delete(id);
      toast.success('Task deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete task');
      console.error(error);
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.title || 'Unknown Project';
  };

  const statusCounts = {
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    REVIEW: tasks.filter(t => t.status === 'REVIEW').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "linear-gradient(rgb(51,65,85) 1px, transparent 1px), linear-gradient(90deg, rgb(51,65,85) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Task Management</h1>
            <p className="text-slate-500">Manage all project tasks</p>
          </div>
          <PrimaryButton onClick={openTaskCreate}>
            <Plus className="w-4 h-4" /> Create Task
          </PrimaryButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashCard className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-500/10 grid place-items-center">
                <AlertCircle className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{statusCounts.TODO}</div>
                <div className="text-xs text-slate-500">To Do</div>
              </div>
            </div>
          </DashCard>
          <DashCard className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 grid place-items-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{statusCounts.IN_PROGRESS}</div>
                <div className="text-xs text-slate-500">In Progress</div>
              </div>
            </div>
          </DashCard>
          <DashCard className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 grid place-items-center">
                <ListTodo className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{statusCounts.REVIEW}</div>
                <div className="text-xs text-slate-500">Review</div>
              </div>
            </div>
          </DashCard>
          <DashCard className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 grid place-items-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{statusCounts.DONE}</div>
                <div className="text-xs text-slate-500">Done</div>
              </div>
            </div>
          </DashCard>
        </div>

        {/* Kanban Board */}
        <KanbanBoard />
      </div>

      {/* Task Dialog */}
      <Modal
        open={taskDialog}
        onClose={() => setTaskDialog(false)}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        footer={
          <>
            <OutlineBtn onClick={() => setTaskDialog(false)}>Cancel</OutlineBtn>
            <PrimaryButton onClick={handleTaskSave}>
              {editingTask ? 'Update' : 'Create'}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField
            label="Project"
            value={taskForm.projectId}
            onChange={(v) => setTaskForm({ ...taskForm, projectId: v })}
            options={projects.map(p => ({ value: p.id, label: p.title }))}
            placeholder="Select project..."
          />
          <InputField
            label="Title"
            value={taskForm.title}
            onChange={(v) => setTaskForm({ ...taskForm, title: v })}
            placeholder="Task title"
          />
          <TextareaField
            label="Description"
            value={taskForm.description || ''}
            onChange={(v) => setTaskForm({ ...taskForm, description: v })}
            placeholder="Task description"
          />
          <SelectField
            label="Status"
            value={taskForm.status || 'TODO'}
            onChange={(v) => setTaskForm({ ...taskForm, status: v as any })}
            options={[
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'REVIEW', label: 'Review' },
              { value: 'DONE', label: 'Done' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Start Date"
              type="date"
              value={taskForm.startDate || ''}
              onChange={(v) => setTaskForm({ ...taskForm, startDate: v })}
            />
            <InputField
              label="End Date"
              type="date"
              value={taskForm.endDate || ''}
              onChange={(v) => setTaskForm({ ...taskForm, endDate: v })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
