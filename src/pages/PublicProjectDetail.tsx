import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { projectService, ProjectResponse } from '@/services/projectService';
import { projectImageService, ProjectImageResponse } from '@/services/projectImageService';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, ExternalLink, Github, X } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
};

export default function PublicProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [images, setImages] = useState<ProjectImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const data = await projectService.getById(projectId);
        
        // Check if project is public
        if (!data.isPublic) {
          setError(true);
          return;
        }
        
        setProject(data);
        
        // Fetch project images
        try {
          const projectImages = await projectImageService.getByProject(projectId);
          setImages(projectImages);
        } catch (imgError) {
          console.error('Failed to fetch project images:', imgError);
          // Continue even if images fail to load
        }
      } catch (err) {
        console.error('Failed to fetch project:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-slate-100">Project Not Found</h1>
          <p className="text-slate-400 mb-4">This project is not publicly available.</p>
          <Link to="/" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to portfolio
          </Link>
        </div>
      </div>
    );
  }

  const progress = project.status === 'COMPLETED' ? 100 : project.status === 'IN_PROGRESS' ? 65 : 30;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80" 
          alt={project.title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-6 pb-8 max-w-6xl">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm mb-4 text-slate-300 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to portfolio
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-slate-100">{project.title}</h1>
            <Badge 
              className={`${
                project.status === 'COMPLETED' 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
              } border`}
            >
              {STATUS_LABELS[project.status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-semibold mb-4 text-slate-100">About This Project</h2>
              <p className="text-slate-400 leading-relaxed">
                {project.description || 'No description available.'}
              </p>
            </motion.div>

            {/* Gallery */}
            {images.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-slate-100">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((img, i) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all hover:scale-105 duration-300 bg-slate-900 border border-slate-800"
                      onClick={() => setLightboxImage(img.imageUrl)}
                    >
                      <img 
                        src={img.imageUrl} 
                        alt={`${project.title} - Image ${i + 1}`} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Lightbox Dialog */}
            <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
              <DialogContent className="max-w-5xl p-0 bg-slate-950 border-slate-800">
                <div className="relative">
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  {lightboxImage && (
                    <img 
                      src={lightboxImage} 
                      alt="Full size" 
                      className="w-full rounded-lg"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Links */}
            {(project.siteUrl || project.githubUrl) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-slate-100">Links</h2>
                <div className="flex gap-3 flex-wrap">
                  {project.siteUrl && (
                    <a
                      href={project.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-all"
                    >
                      <Github className="h-4 w-4" />
                      View on GitHub
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-100">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-400 mb-3">{progress}%</div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-slate-100">
                  <Calendar className="h-4 w-4" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Start</span>
                  <span className="text-slate-300">{new Date(project.startDate).toLocaleDateString()}</span>
                </div>
                {project.endDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">End</span>
                    <span className="text-slate-300">{new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {project.members && project.members.length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-100">Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-slate-800 text-slate-300">
                          {member.user.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{member.user.name || 'Team Member'}</p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
