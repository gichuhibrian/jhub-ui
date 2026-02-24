import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FolderKanban, Users, CheckCircle, Activity, ArrowRight, Clock, TrendingUp, Layers, BarChart3, Settings, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { PROJECT_STATUS_LABELS, ProjectStatus } from '@/types';
import { reportsService, DashboardStats, RecentProject, RecentActivity, ProjectStatusBreakdown } from '@/services/reports.service';

// ─── Hooks ───
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

function useCountUp(target: number, visible: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return val;
}

// ─── Reusable ───
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
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

function DashCard({ children, className = "", hoverAccent = true }: { children: React.ReactNode; className?: string; hoverAccent?: boolean }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all duration-300 ${hoverAccent ? "hover:border-amber-500/30" : ""} ${className}`}>
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

const statusLabels: Record<string, string> = {
  'PLANNING': 'Planning',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'ON_HOLD': 'On Hold',
};

// ─── Stat Card ───
function StatCard({ stat, index }: {
  stat: { value: number; label: string; icon: any; color: string; bgColor: string };
  index: number;
}) {
  const [ref, visible] = useInView();
  const val = useCountUp(stat.value, visible, 1800);
  return (
    <div
      ref={ref}
      className={`relative transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <DashCard className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-xl ${stat.bgColor} grid place-items-center flex-shrink-0`}>
          <stat.icon className={`h-6 w-6 ${stat.color}`} />
        </div>
        <div>
          <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">
            {val}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-widest font-mono mt-0.5">{stat.label}</div>
        </div>
      </DashCard>
    </div>
  );
}

// ─── Project Row ───
function ProjectRow({ project, index }: {
  project: RecentProject;
  index: number;
}) {
  const sc = statusColor[project.status] || statusColor['PLANNING'];

  return (
    <Reveal delay={index * 0.05}>
      <Link
        to={`/admin/projects/${project.id}`}
        className="group flex items-center gap-4 p-4 rounded-xl border border-slate-800 hover:border-amber-500/30 hover:bg-slate-950/60 transition-all duration-200"
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-slate-800">
          {project.featuredImage ? (
            <img src={project.featuredImage} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800 grid place-items-center">
              <FolderKanban className="w-5 h-5 text-slate-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">{project.title}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.65rem] font-medium font-mono uppercase tracking-wide ${sc.bg} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {statusLabels[project.status]}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">{project.description}</p>
        </div>

        {/* Team */}
        <div className="hidden sm:flex -space-x-2 flex-shrink-0">
          {project.members.slice(0, 3).map((m) => (
            <Avatar key={m.id} className="h-7 w-7 border-2 border-slate-900">
              <AvatarImage src={''} />
              <AvatarFallback className="text-[0.6rem] bg-amber-500/10 text-amber-400 font-bold">{m.name?.[0]}</AvatarFallback>
            </Avatar>
          ))}
          {project.members.length > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800 grid place-items-center text-[0.6rem] text-slate-400 font-mono font-bold">
              +{project.members.length - 3}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="hidden md:flex items-center gap-2.5 flex-shrink-0 w-28">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 font-mono w-8 text-right">{project.progress}%</span>
        </div>

        <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-amber-400 transition-colors flex-shrink-0" />
      </Link>
    </Reveal>
  );
}

// ─── Main ───
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<ProjectStatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, projectsData, activitiesData, breakdownData] = await Promise.all([
          reportsService.getDashboardStats(),
          reportsService.getRecentProjects(5),
          reportsService.getRecentActivities(6),
          reportsService.getProjectStatusBreakdown(),
        ]);
        
        setStats(statsData);
        setRecentProjects(projectsData);
        setRecentActivities(activitiesData);
        setStatusBreakdown(breakdownData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    { label: 'Active', value: stats?.activeProjects || 0, icon: Activity, color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
    { label: 'Completed', value: stats?.completedProjects || 0, icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    { label: 'Team Members', value: stats?.totalUsers || 0, icon: Users, color: 'text-violet-400', bgColor: 'bg-violet-500/10' },
  ];

  const taskCompletionRate = stats?.taskCompletionRate || 0;

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
            WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 10%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full -top-52 -left-24 bg-amber-500/5 blur-[140px]"
          style={{ animation: "hub-float1 22s ease-in-out infinite" }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full -bottom-52 -right-24 bg-orange-500/5 blur-[140px]"
          style={{ animation: "hub-float2 26s ease-in-out infinite" }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-12">

        {/* ── Header ── */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <SectionLabel>Admin Dashboard</SectionLabel>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">Overview</h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                Monitor all projects and team activity in real-time.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/admin/projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Link>
              <Link
                to="/admin/settings"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-amber-500/40 hover:text-amber-400 transition-all duration-300"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Reveal>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {dashboardStats.map((s, i) => (
            <StatCard key={i} stat={s} index={i} />
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">

          {/* ── Projects List (2 cols) ── */}
          <Reveal delay={0.05} className="lg:col-span-2">
            <DashCard>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 grid place-items-center">
                    <Layers className="h-4 w-4 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-semibold">Recent Projects</h2>
                </div>
                <Link to="/admin/projects" className="text-xs text-slate-500 hover:text-amber-400 transition-colors font-mono uppercase tracking-wider flex items-center gap-1">
                  View All <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {recentProjects.map((project, i) => (
                  <ProjectRow key={project.id} project={project} index={i} />
                ))}
                {recentProjects.length === 0 && (
                  <div className="text-center py-12 text-slate-600 text-sm">
                    No projects yet. Create your first project to get started.
                  </div>
                )}
              </div>
            </DashCard>
          </Reveal>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-6">

            {/* Task Completion */}
            <Reveal delay={0.1}>
              <DashCard>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 grid place-items-center">
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <h2 className="text-sm font-semibold">Task Completion</h2>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="stroke-slate-800" />
                      <circle
                        cx="60" cy="60" r="52" fill="none" strokeWidth="8"
                        strokeLinecap="round"
                        className="stroke-emerald-400"
                        strokeDasharray={`${taskCompletionRate * 3.27} 327`}
                        style={{ transition: "stroke-dasharray 1.5s ease-out" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-100">{taskCompletionRate}%</span>
                      <span className="text-[0.6rem] text-slate-500 font-mono uppercase tracking-wider">Complete</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-mono border-t border-slate-800 pt-3 mt-1">
                  <span>{stats?.completedTasks || 0} done</span>
                  <span>{(stats?.totalTasks || 0) - (stats?.completedTasks || 0)} remaining</span>
                </div>
              </DashCard>
            </Reveal>

            {/* Project Breakdown */}
            <Reveal delay={0.15}>
              <DashCard>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 grid place-items-center">
                    <TrendingUp className="h-4 w-4 text-sky-400" />
                  </div>
                  <h2 className="text-sm font-semibold">Status Breakdown</h2>
                </div>
                <div className="space-y-3">
                  {statusBreakdown.map((item) => {
                    const sc = statusColor[item.status] || statusColor['PLANNING'];
                    return (
                      <div key={item.status}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                            <span className="text-xs text-slate-400">{statusLabels[item.status]}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-500">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              item.status === 'COMPLETED' ? 'bg-emerald-500' :
                              item.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                              item.status === 'ON_HOLD' ? 'bg-rose-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DashCard>
            </Reveal>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Recent Activity */}
          <Reveal delay={0.1}>
            <DashCard>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 grid place-items-center">
                    <Clock className="h-4 w-4 text-violet-400" />
                  </div>
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                </div>
                <span className="text-xs text-slate-600 font-mono">{recentActivities.length} recent</span>
              </div>
              <div className="space-y-1">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-950/60 transition-colors">
                    <Avatar className="h-8 w-8 mt-0.5 border-2 border-slate-800 flex-shrink-0">
                      <AvatarImage src={''} />
                      <AvatarFallback className="text-[0.6rem] bg-amber-500/10 text-amber-400 font-bold">{a.userName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">
                        <span className="font-medium text-slate-200">{a.userName}</span>{' '}
                        <span className="text-slate-500">{a.action}</span>{' '}
                        <span className="font-medium text-amber-400">{a.target}</span>
                      </p>
                      <p className="text-[0.65rem] text-slate-600 font-mono mt-0.5">
                        {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-slate-600 text-sm">No recent activity</div>
                )}
              </div>
            </DashCard>
          </Reveal>

          {/* Quick Actions */}
          <Reveal delay={0.15}>
            <DashCard>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 grid place-items-center">
                  <ArrowRight className="h-4 w-4 text-orange-400" />
                </div>
                <h2 className="text-sm font-semibold">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: "/admin/projects", label: "Projects", icon: FolderKanban, color: "text-amber-400", bg: "bg-amber-500/10" },
                  { to: "/admin/users", label: "Users", icon: Users, color: "text-sky-400", bg: "bg-sky-500/10" },
                  { to: "/admin/tasks", label: "Tasks", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { to: "/admin/settings", label: "Settings", icon: Settings, color: "text-violet-400", bg: "bg-violet-500/10" },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-800 hover:border-amber-500/30 hover:bg-slate-950/60 transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-lg ${action.bg} grid place-items-center`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{action.label}</span>
                  </Link>
                ))}
              </div>
            </DashCard>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
