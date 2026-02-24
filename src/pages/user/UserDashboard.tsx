import { useAuthStore } from '@/store/useStore';
import { useCurrentUser, usePermissions } from '@/hooks/usePermissions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FolderKanban, CheckCircle, Clock, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { projectService, ProjectResponse } from '@/services/projectService';
import { taskService, TaskResponse } from '@/services/taskService';
import { toast } from 'sonner';
import { isAfter, isBefore, addDays, parseISO, formatDistanceToNow } from 'date-fns';

// ─── Reusable ───
function DashCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/20 ${className}`}>
      {children}
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

const statusColor: Record<string, { dot: string; bg: string; text: string }> = {
  'PLANNING': { dot: 'bg-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  'IN_PROGRESS': { dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'COMPLETED': { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'ON_HOLD': { dot: 'bg-rose-400', bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

const priorityColor: Record<string, { bg: string; text: string }> = {
  'URGENT': { bg: 'bg-rose-500/10', text: 'text-rose-400' },
  'HIGH': { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  'MEDIUM': { bg: 'bg-sky-500/10', text: 'text-sky-400' },
  'LOW': { bg: 'bg-slate-500/10', text: 'text-slate-400' },
};

export default function UserDashboard() {
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [projectsData, tasksData] = await Promise.all([
          projectService.getAll(),
          taskService.getAll(),
        ]);
        setProjects(projectsData);
        setTasks(tasksData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (!currentUser) return null;

  // Filter to user's projects and tasks
  const myProjects = projects.filter(p => 
    p.members?.some(m => m.userId === currentUser.id)
  );
  
  const myTasks = tasks.filter(t => t.userId === currentUser.id);
  const activeTasks = myTasks.filter(t => t.status !== 'DONE');
  const completedTasks = myTasks.filter(t => t.status === 'DONE');

  // Upcoming deadlines (next 7 days)
  const now = new Date();
  const sevenDaysFromNow = addDays(now, 7);
  const upcomingTasks = myTasks
    .filter(t => {
      if (!t.endDate || t.status === 'DONE') return false;
      const dueDate = parseISO(t.endDate);
      return isAfter(dueDate, now) && isBefore(dueDate, sevenDaysFromNow);
    })
    .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
    .slice(0, 5);

  // Overdue tasks
  const overdueTasks = myTasks.filter(t => {
    if (!t.endDate || t.status === 'DONE') return false;
    return isAfter(now, parseISO(t.endDate));
  });

  const stats = [
    { label: 'My Projects', value: myProjects.length, icon: FolderKanban, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    { label: 'Active Tasks', value: activeTasks.length, icon: Clock, color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
    { label: 'Completed', value: completedTasks.length, icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    { label: 'Overdue', value: overdueTasks.length, icon: AlertCircle, color: 'text-rose-400', bgColor: 'bg-rose-500/10' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgb(51,65,85) 1px, transparent 1px), linear-gradient(90deg, rgb(51,65,85) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 10%, transparent 70%)",
          }}
        />
        <div className="absolute w-[600px] h-[600px] rounded-full -top-52 -left-24 bg-amber-500/5 blur-[140px]" style={{ animation: "hub-float1 22s ease-in-out infinite" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full -bottom-52 -right-24 bg-orange-500/5 blur-[140px]" style={{ animation: "hub-float2 26s ease-in-out infinite" }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-12">

        {/* ── Header ── */}
        <div className="mb-10">
          <SectionLabel>My Dashboard</SectionLabel>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Welcome back, {currentUser.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-slate-500 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <DashCard key={i} className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-xl ${stat.bgColor} grid place-items-center flex-shrink-0`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-mono mt-0.5">{stat.label}</div>
              </div>
            </DashCard>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">

          {/* ── My Projects (2 cols) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projects */}
            <DashCard>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 grid place-items-center">
                    <FolderKanban className="h-4 w-4 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-semibold">My Projects</h2>
                </div>
                <span className="text-xs text-slate-600 font-mono">{myProjects.length} total</span>
              </div>
              <div className="space-y-2">
                {myProjects.slice(0, 5).map((project) => {
                  const sc = statusColor[project.status] || statusColor['PLANNING'];
                  const projectTasks = tasks.filter(t => t.projectId === project.id);
                  const completedCount = projectTasks.filter(t => t.status === 'DONE').length;
                  const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/dashboard/project/${project.id}`)}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-slate-800 hover:border-amber-500/30 hover:bg-slate-950/60 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">{project.title}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.65rem] font-medium font-mono uppercase tracking-wide ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {project.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0 w-28">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 font-mono w-8 text-right">{progress}%</span>
                      </div>
                    </div>
                  );
                })}
                {myProjects.length === 0 && (
                  <div className="text-center py-12 text-slate-600 text-sm">
                    No projects assigned yet.
                  </div>
                )}
              </div>
            </DashCard>
          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-6">

            {/* Upcoming Deadlines */}
            <DashCard>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 grid place-items-center">
                  <Calendar className="h-4 w-4 text-sky-400" />
                </div>
                <h2 className="text-sm font-semibold">Upcoming Deadlines</h2>
              </div>
              <div className="space-y-2">
                {upcomingTasks.map((task) => {
                  const pc = priorityColor[task.priority] || priorityColor['MEDIUM'];
                  return (
                    <div key={task.id} className="p-3 rounded-lg border border-slate-800 hover:bg-slate-950/60 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm text-slate-200 leading-tight flex-1">{task.title}</p>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[0.6rem] font-mono uppercase ${pc.bg} ${pc.text}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-[0.65rem] text-slate-600 font-mono">
                        Due {formatDistanceToNow(parseISO(task.endDate!), { addSuffix: true })}
                      </p>
                    </div>
                  );
                })}
                {upcomingTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-600 text-sm">No upcoming deadlines</div>
                )}
              </div>
            </DashCard>

            {/* Overdue Alert */}
            {overdueTasks.length > 0 && (
              <DashCard className="border-rose-500/20 bg-rose-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 grid place-items-center">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-rose-400">Overdue Tasks</h2>
                </div>
                <p className="text-sm text-slate-400 mb-2">
                  You have <span className="font-bold text-rose-400">{overdueTasks.length}</span> overdue task{overdueTasks.length !== 1 ? 's' : ''}.
                </p>
                <p className="text-xs text-slate-500">Please update their status or extend deadlines.</p>
              </DashCard>
            )}
          </div>
        </div>

        {/* ── My Tasks Kanban ── */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 grid place-items-center">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold">My Tasks</h2>
          </div>
          <KanbanBoard userId={currentUser.id} readonly={!permissions.can.dragTasks} />
        </div>
      </div>
    </div>
  );
}
