import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { FolderKanban, Users, CheckCircle, Clock, TrendingUp, Search } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<string, { dot: string; bg: string; text: string }> = {
  'PLANNING': { dot: 'bg-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  'IN_PROGRESS': { dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'COMPLETED': { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'ON_HOLD': { dot: 'bg-rose-400', bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

export default function UserProjectsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getAll(),
  });

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      
      {/* Ambient BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgb(51,65,85) 1px, transparent 1px), linear-gradient(90deg, rgb(51,65,85) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 10%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-400 uppercase tracking-widest mb-3.5">
            <span className="w-5 h-px bg-amber-400" />
            My Projects
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Projects
          </h1>
          <p className="text-slate-500 text-sm">
            View and manage your assigned projects
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 grid place-items-center mx-auto mb-4">
              <FolderKanban className="h-7 w-7 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-slate-500 text-sm">
              {searchQuery ? 'Try adjusting your search' : 'You have no assigned projects yet'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const sc = statusColor[project.status] || statusColor['PLANNING'];
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const completedCount = projectTasks.filter(t => t.status === 'DONE').length;
              const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;
              const memberCount = (project as any).members?.length || 0;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/dashboard/project/${project.id}`)}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/30 hover:bg-slate-950/60 transition-all duration-200 cursor-pointer"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-medium font-mono uppercase tracking-wide ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {project.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-5 line-clamp-2 min-h-[2.5rem]">
                    {project.description || 'No description'}
                  </p>

                  {/* Progress */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-600 font-mono uppercase tracking-wider">Progress</span>
                      <span className="text-xs text-slate-500 font-mono">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{completedCount}/{projectTasks.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{memberCount} members</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
