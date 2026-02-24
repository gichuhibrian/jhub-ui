import { useAuthStore, useDataStore, getProjectProgress } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PROJECT_STATUS_LABELS, ProjectStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const statusColors: Record<ProjectStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-primary/10 text-primary',
  'completed': 'bg-success/10 text-success',
  'on-hold': 'bg-warning/10 text-warning',
};

export default function UserDashboard() {
  const currentUser = useAuthStore(s => s.currentUser);
  const { projects, tasks } = useDataStore();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const myProjects = projects.filter(p => p.memberIds.includes(currentUser.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {currentUser.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm">Here are your assigned projects</p>
      </div>

      {myProjects.length === 0 ? (
        <Card className="shadow-card"><CardContent className="p-8 text-center text-muted-foreground">You're not assigned to any projects yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myProjects.map((project, i) => {
            const pTasks = tasks.filter(t => t.projectId === project.id);
            const progress = getProjectProgress(pTasks);
            const isLead = project.teamLeadId === currentUser.id;
            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate(`/dashboard/project/${project.id}`)}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${statusColors[project.status]} border-0 text-xs`}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
                      {isLead && <Badge variant="outline" className="text-[10px]">Team Lead</Badge>}
                    </div>
                    <h3 className="font-semibold mb-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{progress}% complete</span>
                      <Progress value={progress} className="w-20 h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
