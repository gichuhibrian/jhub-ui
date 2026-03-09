import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { projectMemberService } from '@/services/projectMemberService';
import { projectImageService } from '@/services/projectImageService';
import { projectDocumentService } from '@/services/projectDocumentService';
import { useCurrentUser } from '@/hooks/usePermissions';
import { ArrowLeft, Users as UsersIcon, CheckCircle, Clock, TrendingUp, ListTodo, BarChart3, Image as ImageIcon, Calendar, Crown, FileText, Download, MessageCircle } from 'lucide-react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PROJECT_STATUS_LABELS, ProjectStatus } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getFileIcon } from '@/lib/s3Upload';
import { ConversationsPanel } from '@/components/conversations/ConversationsPanel';

const projectStatusStyle: Record<ProjectStatus, { dot: string; bg: string; text: string }> = {
  PLANNING: { dot: 'bg-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  IN_PROGRESS: { dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  COMPLETED: { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  ON_HOLD: { dot: 'bg-rose-400', bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

// ─── Tab Button ───
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border-none ${
        active ? 'bg-amber-500/10 text-amber-400' : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
      }`}
      style={{ fontFamily: 'inherit' }}
    >
      {children}
    </button>
  );
}

export default function UserProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'gallery' | 'resources' | 'conversations'>('overview');

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getById(projectId!),
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getAll(),
    enabled: !!projectId,
  });

  // Fetch project members
  const { data: members = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const allMembers = await projectMemberService.getAll();
      return allMembers.filter(m => m.projectId === projectId);
    },
    enabled: !!projectId,
  });

  // Fetch project images
  const { data: images = [] } = useQuery({
    queryKey: ['project-images', projectId],
    queryFn: async () => {
      const allImages = await projectImageService.getAll();
      return allImages.filter(img => img.projectId === projectId);
    },
    enabled: !!projectId,
  });

  // Fetch project documents
  const { data: documents = [] } = useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const allDocs = await projectDocumentService.getAll();
      return allDocs.filter(doc => doc.projectId === projectId);
    },
    enabled: !!projectId,
  });

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>
        <div className="text-center">
          <p className="text-slate-500 mb-4">Project not found.</p>
          <button
            onClick={() => navigate('/dashboard/projects')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const ps = projectStatusStyle[project.status] || projectStatusStyle.PLANNING;
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const myTasks = projectTasks.filter(t => t.userId === currentUser.id);
  const completedTasks = projectTasks.filter(t => t.status === 'DONE');
  const progress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
  const isTeamLead = members.some((m: any) => m.userId === currentUser.id && m.isTeamLead);
  const teamLead = members.find(m => m.isTeamLead);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* Ambient BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgb(51,65,85) 1px, transparent 1px), linear-gradient(90deg, rgb(51,65,85) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard/projects')}
            className="w-10 h-10 rounded-xl border border-slate-800 bg-transparent grid place-items-center text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{project.title}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase ${ps.bg} ${ps.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs uppercase ${project.isPublic ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-500/10 text-slate-500'}`}>
                {project.isPublic ? 'Public' : 'Private'}
              </span>
              {isTeamLead && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                  <Crown className="w-3 h-3" /> Team Lead
                </span>
              )}
            </div>
            {project.description && <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit mb-8">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            <BarChart3 className="w-3.5 h-3.5" /> Overview
          </TabButton>
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>
            <ListTodo className="w-3.5 h-3.5" /> Tasks
          </TabButton>
          <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
            <UsersIcon className="w-3.5 h-3.5" /> Members
          </TabButton>
          <TabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')}>
            <ImageIcon className="w-3.5 h-3.5" /> Gallery
          </TabButton>
          <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')}>
            <FileText className="w-3.5 h-3.5" /> Resources
          </TabButton>
          <TabButton active={activeTab === 'conversations'} onClick={() => setActiveTab('conversations')}>
            <MessageCircle className="w-3.5 h-3.5" /> Conversations
          </TabButton>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Project Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Title</div>
                  <div className="text-slate-200">{project.title}</div>
                </div>
                {project.description && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Description</div>
                    <div className="text-slate-200">{project.description}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {project.startDate && (
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Start Date</div>
                      <div className="text-slate-200 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {new Date(project.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">End Date</div>
                      <div className="text-slate-200 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {new Date(project.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
                {(project.siteUrl || project.githubUrl) && (
                  <div className="grid grid-cols-2 gap-4">
                    {project.siteUrl && (
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Site URL</div>
                        <a href={project.siteUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 text-sm">
                          {project.siteUrl}
                        </a>
                      </div>
                    )}
                    {project.githubUrl && (
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">GitHub URL</div>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 text-sm">
                          {project.githubUrl}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Team Lead */}
            {teamLead && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Team Lead</h2>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-amber-500/20">
                    <AvatarFallback className="bg-amber-500/10 text-amber-400 font-bold">
                      {teamLead.user.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{teamLead.user.name}</div>
                    <div className="text-sm text-slate-500">{teamLead.user.email}</div>
                  </div>
                  <Crown className="w-4 h-4 text-amber-400 ml-auto" />
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 grid place-items-center">
                    <TrendingUp className="h-5 w-5 text-amber-400" />
                  </div>
                  <span className="text-xs text-slate-600 font-mono uppercase tracking-wider">Progress</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">
                  {progress}%
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 grid place-items-center">
                    <CheckCircle className="h-5 w-5 text-sky-400" />
                  </div>
                  <span className="text-xs text-slate-600 font-mono uppercase tracking-wider">Total Tasks</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-slate-200">
                  {projectTasks.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {completedTasks.length} completed
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 grid place-items-center">
                    <Clock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-600 font-mono uppercase tracking-wider">My Tasks</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-slate-200">
                  {myTasks.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {myTasks.filter(t => t.status === 'DONE').length} completed
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 grid place-items-center">
                    <UsersIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-xs text-slate-600 font-mono uppercase tracking-wider">Team</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-slate-200">
                  {members.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  members
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div>
            <KanbanBoard projectId={projectId} readonly={false} />
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Project Members ({members.length})</h2>
            </div>

            <div className="grid gap-3">
              {members.map((member) => (
                <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <Avatar className="h-10 w-10 border-2 border-slate-800">
                    <AvatarFallback className="bg-amber-500/10 text-amber-400 font-bold">
                      {member.user.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {member.user.name}
                      {member.isTeamLead && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Team Lead
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{member.user.email}</div>
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                  <UsersIcon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No members yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Project Gallery ({images.length})</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/30 transition-all">
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}

              {images.length === 0 && (
                <div className="col-span-full text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No images yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Project Resources ({documents.length})</h2>
            </div>

            <div className="grid gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-all">
                  <div className="text-4xl">{getFileIcon(doc.documentName)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 truncate">{doc.documentName}</div>
                    <div className="text-sm text-slate-500">
                      Added {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.documentUrl}
                      download={doc.documentName}
                      className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                  <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No documents yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {activeTab === 'conversations' && currentUser && (
          <div>
            <ConversationsPanel
              projectId={projectId!}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || currentUser.email}
            />
          </div>
        )}
      </div>
    </div>
  );
}
