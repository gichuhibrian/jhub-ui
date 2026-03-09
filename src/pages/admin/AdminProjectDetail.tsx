import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { projectMemberService } from '@/services/projectMemberService';
import { projectImageService } from '@/services/projectImageService';
import { projectDocumentService } from '@/services/projectDocumentService';
import { objectiveService } from '@/services/objectiveService';
import { ArrowLeft, Users as UsersIcon, ListTodo, BarChart3, Image as ImageIcon, Plus, Trash2, Calendar, Crown, X, Edit, FileText, Download, Upload, MessageCircle } from 'lucide-react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PROJECT_STATUS_LABELS, ProjectStatus, TaskStatus, Priority } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { uploadFileToS3, getFileIcon, formatFileSize } from '@/lib/s3Upload';
import { ConversationsPanel } from '@/components/conversations/ConversationsPanel';
import { useCurrentUser } from '@/hooks/usePermissions';

// ─── Status Maps ───
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

// ─── Modal ───
function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-800 grid place-items-center text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 pt-0">{children}</div>
        {footer && <div className="px-6 pb-6 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export default function AdminProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'gallery' | 'resources' | 'conversations'>('overview');
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [addImageModal, setAddImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [addDocumentModal, setAddDocumentModal] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getById(projectId!),
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

  // Fetch all users for member selection
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
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

  // Add members mutation (supports multiple via batch endpoint)
  const addMembersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      if (userIds.length === 1) {
        // Single user - use regular endpoint
        return [await projectMemberService.addMember({ 
          projectId: projectId!, 
          userId: userIds[0] 
        })];
      } else {
        // Multiple users - use batch endpoint
        return projectMemberService.addMembersBatch({
          projectId: projectId!,
          userIds: userIds
        });
      }
    },
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success(`${userIds.length} member${userIds.length > 1 ? 's' : ''} added to project`);
      setAddMemberModal(false);
      setSelectedUserIds([]);
    },
    onError: () => toast.error('Failed to add members'),
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => projectMemberService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Member removed from project');
    },
    onError: () => toast.error('Failed to remove member'),
  });

  // Set team lead mutation
  const setTeamLeadMutation = useMutation({
    mutationFn: ({ memberId, isTeamLead }: { memberId: string; isTeamLead: boolean }) =>
      projectMemberService.setTeamLead(memberId, isTeamLead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Team lead updated');
    },
    onError: () => toast.error('Failed to update team lead'),
  });

  // Add image mutation
  const addImageMutation = useMutation({
    mutationFn: (url: string) => projectImageService.create({ projectId: projectId!, imageUrl: url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-images', projectId] });
      toast.success('Image added');
      setAddImageModal(false);
      setImageUrl('');
      setImageFile(null);
      setImagePreview('');
    },
    onError: () => toast.error('Failed to add image'),
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (uploadMethod === 'url') {
      if (!imageUrl) {
        toast.error('Please enter an image URL');
        return;
      }
      addImageMutation.mutate(imageUrl);
    } else {
      if (!imageFile || !imagePreview) {
        toast.error('Please select an image file');
        return;
      }
      // Use the base64 data URL as the image URL
      addImageMutation.mutate(imagePreview);
    }
  };

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => projectImageService.delete(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-images', projectId] });
      toast.success('Image deleted');
    },
    onError: () => toast.error('Failed to delete image'),
  });

  // Add document mutation
  const addDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingDocument(true);
      try {
        const { url, fileName } = await uploadFileToS3(file);
        return projectDocumentService.create({
          projectId: projectId!,
          documentName: fileName,
          documentUrl: url,
        });
      } finally {
        setUploadingDocument(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Document added');
      setAddDocumentModal(false);
      setDocumentFile(null);
    },
    onError: () => {
      setUploadingDocument(false);
      toast.error('Failed to add document');
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => projectDocumentService.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  // Handle document file selection
  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Document must be less than 10MB');
      return;
    }

    setDocumentFile(file);
  };

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

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>
        <div className="text-center">
          <p className="text-slate-500 mb-4">Project not found.</p>
          <button
            onClick={() => navigate('/admin/projects')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const ps = projectStatusStyle[project.status] || projectStatusStyle.PLANNING;
  const availableUsers = allUsers.filter(u => !members.some(m => m.userId === u.id));
  const teamLead = members.find(m => m.isTeamLead);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Ambient BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgb(51,65,85) 1px, transparent 1px), linear-gradient(90deg, rgb(51,65,85) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/projects')}
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
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Members</div>
                <div className="text-3xl font-bold text-slate-100">{members.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Images</div>
                <div className="text-3xl font-bold text-slate-100">{images.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Status</div>
                <div className={`text-sm font-medium ${ps.text}`}>{PROJECT_STATUS_LABELS[project.status]}</div>
              </div>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div>
            <KanbanBoard projectId={projectId} />
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Project Members ({members.length})</h2>
              <button
                onClick={() => setAddMemberModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
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
                  <div className="flex items-center gap-2">
                    {!member.isTeamLead && (
                      <button
                        onClick={() => setTeamLeadMutation.mutate({ memberId: member.id, isTeamLead: true })}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 text-sm transition-all"
                      >
                        Make Lead
                      </button>
                    )}
                    {member.isTeamLead && (
                      <button
                        onClick={() => setTeamLeadMutation.mutate({ memberId: member.id, isTeamLead: false })}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 text-sm transition-all"
                      >
                        Remove Lead
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Remove this member from the project?')) {
                          removeMemberMutation.mutate(member.id);
                        }
                      }}
                      className="p-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                  <UsersIcon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No members yet. Add members to get started.</p>
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
              <button
                onClick={() => setAddImageModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Add Image
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/30 transition-all">
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => {
                        if (confirm('Delete this image?')) {
                          deleteImageMutation.mutate(img.id);
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}

              {images.length === 0 && (
                <div className="col-span-full text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No images yet. Add images to showcase your project.</p>
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
              <button
                onClick={() => setAddDocumentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Add Document
              </button>
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
                    <button
                      onClick={() => {
                        if (confirm('Delete this document?')) {
                          deleteDocumentMutation.mutate(doc.id);
                        }
                      }}
                      className="p-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                  <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No documents yet. Add documents to share with your team.</p>
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

      {/* Add Member Modal */}
      <Modal
        open={addMemberModal}
        onClose={() => {
          setAddMemberModal(false);
          setSelectedUserIds([]);
        }}
        title="Add Members to Project"
        footer={
          <>
            <button
              onClick={() => {
                setAddMemberModal(false);
                setSelectedUserIds([]);
              }}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedUserIds.length > 0 && addMembersMutation.mutate(selectedUserIds)}
              disabled={selectedUserIds.length === 0 || addMembersMutation.isPending}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addMembersMutation.isPending ? 'Adding...' : `Add ${selectedUserIds.length > 0 ? selectedUserIds.length : ''} Member${selectedUserIds.length !== 1 ? 's' : ''}`}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
              Select Users (hold Ctrl/Cmd to select multiple)
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950">
              {availableUsers.map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedUserIds.includes(user.id)
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds([...selectedUserIds, user.id]);
                      } else {
                        setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-slate-950"
                  />
                  <Avatar className="h-8 w-8 border-2 border-slate-800">
                    <AvatarFallback className="bg-amber-500/10 text-amber-400 font-bold text-xs">
                      {user.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-200 truncate">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedUserIds.length > 0 && (
              <div className="mt-2 text-sm text-amber-400">
                {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          {availableUsers.length === 0 && (
            <p className="text-sm text-slate-500">All users are already members of this project.</p>
          )}
        </div>
      </Modal>

      {/* Add Image Modal */}
      <Modal
        open={addImageModal}
        onClose={() => {
          setAddImageModal(false);
          setImageUrl('');
          setImageFile(null);
          setImagePreview('');
          setUploadMethod('file');
        }}
        title="Add Image to Gallery"
        footer={
          <>
            <button
              onClick={() => {
                setAddImageModal(false);
                setImageUrl('');
                setImageFile(null);
                setImagePreview('');
                setUploadMethod('file');
              }}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleImageUpload}
              disabled={(uploadMethod === 'url' && !imageUrl) || (uploadMethod === 'file' && !imageFile) || addImageMutation.isPending}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addImageMutation.isPending ? 'Adding...' : 'Add Image'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Upload Method Toggle */}
          <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
            <button
              onClick={() => setUploadMethod('file')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                uploadMethod === 'file'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setUploadMethod('url')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                uploadMethod === 'url'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Image URL
            </button>
          </div>

          {uploadMethod === 'file' ? (
            <>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Select Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 file:cursor-pointer"
                />
                <p className="text-xs text-slate-600 mt-1">Max size: 5MB. Supported: JPG, PNG, GIF, WebP</p>
              </div>
              {imagePreview && (
                <div className="aspect-video rounded-lg overflow-hidden border border-slate-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                />
              </div>
              {imageUrl && (
                <div className="aspect-video rounded-lg overflow-hidden border border-slate-800">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Add Document Modal */}
      <Modal
        open={addDocumentModal}
        onClose={() => {
          setAddDocumentModal(false);
          setDocumentFile(null);
        }}
        title="Add Document"
        footer={
          <>
            <button
              onClick={() => {
                setAddDocumentModal(false);
                setDocumentFile(null);
              }}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => documentFile && addDocumentMutation.mutate(documentFile)}
              disabled={!documentFile || uploadingDocument}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingDocument ? 'Uploading...' : 'Add Document'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
              Select Document
            </label>
            <input
              type="file"
              onChange={handleDocumentSelect}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 file:cursor-pointer"
            />
            <p className="text-xs text-slate-600 mt-1">Max size: 10MB. All file types supported.</p>
          </div>
          {documentFile && (
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getFileIcon(documentFile.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-200 truncate">{documentFile.name}</div>
                  <div className="text-sm text-slate-500">{formatFileSize(documentFile.size)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
