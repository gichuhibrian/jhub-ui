import { useParams, Link } from 'react-router-dom';
import { useDataStore, getProjectProgress, getTaskProgress } from '@/store/useStore';
import { PROJECT_STATUS_LABELS, TASK_STATUS_LABELS } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Users as UsersIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PublicProjectDetail() {
  const { projectId } = useParams();
  const { projects, tasks, users } = useDataStore();
  const project = projects.find((p) => p.id === projectId);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!project || !project.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <Link to="/" className="text-primary hover:underline">← Back to portfolio</Link>
        </div>
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const progress = getProjectProgress(projectTasks);
  const members = users.filter((u) => project.memberIds.includes(u.id));
  const teamLead = users.find((u) => u.id === project.teamLeadId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative h-80 overflow-hidden">
        <img src={project.featuredImage} alt={project.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: 'hsl(210 20% 80%)' }}>
              <ArrowLeft className="h-4 w-4" /> Back to portfolio
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>{project.name}</h1>
            <Badge className="bg-primary/20 text-primary border-0">{PROJECT_STATUS_LABELS[project.status]}</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-semibold mb-3">About This Project</h2>
              <p className="text-muted-foreground leading-relaxed">{project.description}</p>
            </motion.div>

            {/* Gallery */}
            {project.images.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {project.images.map((img, i) => (
                    <Dialog key={i} open={lightboxImage === img} onOpenChange={(open) => setLightboxImage(open ? img : null)}>
                      <DialogTrigger asChild>
                        <div className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition">
                          <img src={img} alt={`${project.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-2">
                        <img src={img} alt="" className="w-full rounded-lg" />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Progress Breakdown</h2>
              <div className="space-y-3">
                {projectTasks.map((task) => {
                  const tp = getTaskProgress(task);
                  return (
                    <Card key={task.id} className="shadow-card">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{TASK_STATUS_LABELS[task.status]} · {tp}% complete</p>
                        </div>
                        <Progress value={tp} className="w-24 h-1.5" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">{progress}%</div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Timeline</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span>{project.startDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span>{project.dueDate}</span></div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><UsersIcon className="h-4 w-4" /> Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.avatarUrl} />
                      <AvatarFallback className="text-xs bg-muted">{m.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.id === project.teamLeadId ? 'Team Lead' : 'Member'}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
