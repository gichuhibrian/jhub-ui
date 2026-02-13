import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDataStore, getProjectProgress } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PROJECT_STATUS_LABELS, ProjectStatus } from '@/types';
import { ArrowRight, Layers, Mail, MapPin, Phone, ChevronRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const statusVariant: Record<ProjectStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-primary/10 text-primary',
  'completed': 'bg-success/10 text-success',
  'on-hold': 'bg-warning/10 text-warning',
};

export default function Landing() {
  const { projects, tasks, users } = useDataStore();
  const navigate = useNavigate();
  const publicProjects = projects.filter((p) => p.isPublic);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Layers className="h-6 w-6 text-primary" />
            <span>ProjectHub</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Projects</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">About</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Contact</a>
            <Button size="sm" onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>
        <div className="relative container mx-auto px-4 py-32 lg:py-44">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-0 hover:bg-primary/20">
              Project Management
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6" style={{ color: 'hsl(0 0% 100%)' }}>
              Building Digital
              <span className="text-primary"> Experiences</span>
              <br />That Matter
            </h1>
            <p className="text-lg mb-8" style={{ color: 'hsl(210 20% 80%)' }}>
              We deliver exceptional software solutions — from concept to launch. Explore our portfolio of successful projects.
            </p>
            <div className="flex gap-3">
              <Button size="lg" onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}>
                View Projects <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate('/login')}>
                Client Portal
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-3">Portfolio</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Projects</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A selection of projects we've delivered for our clients across industries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicProjects.map((project, i) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const progress = getProjectProgress(projectTasks);
              const members = users.filter(u => project.memberIds.includes(u.id));

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="group overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border-border/50"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={project.featuredImage}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${statusVariant[project.status]} border-0 text-xs`}>
                          {PROJECT_STATUS_LABELS[project.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {members.slice(0, 4).map((m) => (
                            <Avatar key={m.id} className="h-7 w-7 border-2 border-card">
                              <AvatarImage src={m.avatarUrl} />
                              <AvatarFallback className="text-[10px] bg-muted">{m.name[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <Progress value={progress} className="w-20 h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-3">About Us</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">We Build What Matters</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              ProjectHub is a digital agency specializing in custom software solutions. Our team of designers, developers,
              and strategists work together to create products that drive real business results. With over 50 successful
              projects delivered, we bring expertise across web, mobile, and cloud technologies.
            </p>
            <div className="grid grid-cols-3 gap-8">
              {[
                { value: '50+', label: 'Projects Delivered' },
                { value: '30+', label: 'Happy Clients' },
                { value: '98%', label: 'On-Time Delivery' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <Badge variant="outline" className="mb-3">Contact</Badge>
            <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
            <p className="text-muted-foreground mb-8">Have a project in mind? We'd love to hear from you.</p>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-sm">hello@projecthub.com</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm">123 Innovation Drive, San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gradient-hero py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Layers className="h-5 w-5 text-primary" />
            <span className="font-bold" style={{ color: 'hsl(0 0% 100%)' }}>ProjectHub</span>
          </div>
          <p className="text-sm" style={{ color: 'hsl(210 20% 60%)' }}>© 2026 ProjectHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
