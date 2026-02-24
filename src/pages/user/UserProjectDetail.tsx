import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useDataStore, getProjectProgress } from '@/store/useStore';
import { PROJECT_STATUS_LABELS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function UserProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const { projects, tasks, users } = useDataStore();
  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  if (!project || !currentUser) return (
    <div className="p-8">
      Project not found.{' '}
      <Button variant="link" onClick={() => navigate('/dashboard')}>← Back</Button>
    </div>
  );

  const isLead = project.teamLeadId === currentUser.id;
  const progress = getProjectProgress(projectTasks);
  const members = users.filter(u => project.memberIds.includes(u.id));

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {PROJECT_STATUS_LABELS[project.status]} · {isLead ? 'Team Lead' : 'Member'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Progress</p>
            <div className="text-2xl font-bold text-primary">{progress}%</div>
            <Progress value={progress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
            <div className="text-2xl font-bold">{projectTasks.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">My Tasks</p>
            <div className="text-2xl font-bold">
              {projectTasks.filter(t => t.assignedMemberId === currentUser.id).length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Team</p>
            <div className="flex -space-x-2 mt-1">
              {members.slice(0, 5).map(m => (
                <Avatar key={m.id} className="h-7 w-7 border-2 border-card">
                  <AvatarImage src={m.avatarUrl} />
                  <AvatarFallback className="text-[9px] bg-muted">{m.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban board scoped to this project + current user */}
      <div>
        <h2 className="text-base font-semibold mb-4">Tasks</h2>
        <KanbanBoard
          projectId={projectId}
          userId={currentUser.id}
          readonly={false}
        />
      </div>
    </div>
  );
}
