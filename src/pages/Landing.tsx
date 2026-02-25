import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { projectService, ProjectResponse } from "@/services/projectService";

const PROJECTS = [
  { id: 1, name: "NexaPay Dashboard", desc: "Real-time financial analytics platform processing 2M+ daily transactions with sub-second latency and predictive fraud detection.", tags: ["React", "Node.js", "AWS"], status: "complete", progress: 100, category: "web", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", team: ["A", "K", "M"] },
  { id: 2, name: "HealthSync Mobile", desc: "Cross-platform health tracking app with AI-powered insights and deep wearable device integration for 100K+ users.", tags: ["Flutter", "Firebase", "ML"], status: "progress", progress: 78, category: "mobile", img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80", team: ["S", "R"] },
  { id: 3, name: "CloudForge Platform", desc: "Enterprise DevOps automation suite reducing deployment times by 85% across 200+ microservices.", tags: ["Kubernetes", "Go", "Terraform"], status: "complete", progress: 100, category: "cloud", img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", team: ["D", "L", "J", "P"] },
  { id: 4, name: "RetailIQ Analytics", desc: "Predictive analytics engine for retail chains, forecasting demand with 94% accuracy across 500+ SKUs.", tags: ["Python", "TensorFlow", "GCP"], status: "progress", progress: 62, category: "cloud", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", team: ["N", "B"] },
  { id: 5, name: "Vaultis Security", desc: "Zero-trust security framework with biometric authentication and real-time threat detection for fintech.", tags: ["Rust", "WASM", "Azure"], status: "complete", progress: 100, category: "web", img: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&q=80", team: ["E", "T", "C"] },
  { id: 6, name: "EduStream LMS", desc: "Adaptive learning platform serving 50K+ students with personalized curriculum paths and live collaboration.", tags: ["Next.js", "Postgres", "WebRTC"], status: "progress", progress: 45, category: "web", img: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80", team: ["G", "W"] },
];

const SERVICES = [
  { icon: "◆", title: "Web Applications", desc: "High-performance SPAs, progressive web apps, and enterprise dashboards built with modern frameworks." },
  { icon: "◈", title: "Mobile Development", desc: "Native and cross-platform mobile apps with seamless UX and deep device integration." },
  { icon: "△", title: "Cloud Architecture", desc: "Scalable, resilient cloud infrastructure on AWS, GCP, and Azure — designed for growth." },
  { icon: "⬡", title: "AI & Machine Learning", desc: "Intelligent features powered by custom ML models, NLP, and predictive analytics." },
  { icon: "◉", title: "Security & Compliance", desc: "SOC2, HIPAA, and GDPR-ready systems with zero-trust architecture and continuous monitoring." },
  { icon: "⟐", title: "DevOps & CI/CD", desc: "Automated pipelines, infrastructure as code, and observability that accelerates your release cycle." },
];

const STATS = [
  { value: 54, suffix: "", label: "Projects Shipped" },
  { value: 38, suffix: "+", label: "Happy Clients" },
  { value: 98, suffix: "%", label: "On-Time Delivery" },
  { value: 4.9, suffix: "", label: "Avg. Rating", isDecimal: true },
];

const TEAM_COLORS = [
  { bg: "bg-amber-500/10", text: "text-amber-400" },
  { bg: "bg-rose-500/10", text: "text-rose-400" },
  { bg: "bg-sky-500/10", text: "text-sky-400" },
  { bg: "bg-lime-500/10", text: "text-lime-400" },
  { bg: "bg-violet-500/10", text: "text-violet-400" },
  { bg: "bg-pink-500/10", text: "text-pink-400" },
];

const PROCESS = [
  { n: "01", t: "Discovery", d: "We deeply understand your business goals, users, and technical constraints through workshops." },
  { n: "02", t: "Design", d: "Wireframes, prototypes, and validated UI/UX mapping to your journey and KPIs." },
  { n: "03", t: "Build", d: "Agile sprints with continuous delivery. Working software every two weeks." },
  { n: "04", t: "Launch", d: "Thorough QA, deployment, monitoring, and ongoing support for long-term success." },
];

const CONTACT_ITEMS = [
  {
    label: "Email", value: "hello@projecthub.dev",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  },
  {
    label: "Phone", value: "+1 (555) 987-6543",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  },
  {
    label: "Location", value: "San Francisco, CA",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
];

// ─── Hooks ───
function useInView(): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function useCountUp(target, visible, duration = 1600, isDecimal = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(isDecimal ? parseFloat((target * ease).toFixed(1)) : Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration, isDecimal]);
  return val;
}

// ─── Reusable ───
function Reveal({ children, className = "", delay = 0 }) {
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

function SectionLabel({ children, center = false }) {
  return (
    <div className={`inline-flex items-center gap-2 font-mono text-xs text-amber-400 uppercase tracking-widest mb-3.5 ${center ? "justify-center" : ""}`}>
      <span className="w-5 h-px bg-amber-400" />
      {children}
      {center && <span className="w-5 h-px bg-amber-400" />}
    </div>
  );
}

function GradientButton({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 cursor-pointer border-none ${className}`}
      style={{ fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 bg-transparent text-slate-200 font-medium text-sm hover:border-amber-500 hover:text-amber-400 transition-all duration-300 cursor-pointer ${className}`}
      style={{ fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

// ─── Section Components ───
function StatCard({ stat, index, isLast }) {
  const [ref, visible] = useInView();
  const val = useCountUp(stat.value, visible, 1800, stat.isDecimal);
  return (
    <div
      ref={ref}
      className={`text-center py-8 px-4 relative transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">
        {val}{stat.suffix}
      </div>
      <div className="text-xs text-slate-600 uppercase tracking-widest font-mono mt-1.5">{stat.label}</div>
      {!isLast && (
        <div className="absolute right-0 top-[20%] h-[60%] w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent hidden md:block" />
      )}
    </div>
  );
}

function ProjectCard({ project, index }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };
  
  return (
    <Reveal delay={index * 0.08}>
      <div
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`bg-slate-900 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
          hovered
            ? "border border-amber-500/30 -translate-y-1.5 shadow-2xl shadow-black/50"
            : "border border-slate-800 translate-y-0 shadow-lg shadow-black/20"
        }`}
      >
        <div className="aspect-video overflow-hidden relative">
          <img
            src={project.img}
            alt={project.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-700 ${hovered ? "scale-105" : "scale-100"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          <span className={`absolute top-3.5 left-3.5 z-10 px-3 py-1 rounded-full text-xs font-semibold font-mono uppercase tracking-wide backdrop-blur-md ${
            project.status === "complete"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
          }`}>
            {project.status === "complete" ? "Completed" : "In Progress"}
          </span>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {project.tags.map(t => (
              <span key={t} className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-500 font-mono">{t}</span>
            ))}
          </div>
          <h3 className={`text-lg font-bold tracking-tight mb-2 transition-colors duration-200 ${hovered ? "text-amber-400" : "text-slate-100"}`}>
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{project.desc}</p>
          <div className="flex items-center justify-between">
            <div className="flex">
              {project.team.map((t, j) => (
                <div
                  key={j}
                  className={`w-7 h-7 rounded-full border-2 border-slate-900 grid place-items-center text-xs font-bold ${TEAM_COLORS[j % TEAM_COLORS.length].bg} ${TEAM_COLORS[j % TEAM_COLORS.length].text} ${j > 0 ? "-ml-2" : ""}`}
                >
                  {t}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 font-mono">{project.progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function ServiceCard({ service, index }) {
  return (
    <Reveal delay={index * 0.07}>
      <div className="group p-7 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-amber-500/25 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="w-12 h-12 rounded-xl bg-amber-500/5 group-hover:bg-amber-500/10 grid place-items-center text-xl text-amber-400 mb-5 transition-colors duration-300">
          {service.icon}
        </div>
        <h3 className="text-base font-semibold mb-2 text-slate-100">{service.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{service.desc}</p>
      </div>
    </Reveal>
  );
}

// ─── Main ───
export default function ProjectHub() {
  const [scrolled, setScrolled] = useState(false);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.getPublic();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch public projects:", error);
        // Silently fail - show empty state instead of redirecting
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Map backend projects to display format
  const mappedProjects = projects.map(p => ({
    id: p.id,
    name: p.title,
    desc: p.description || "No description available",
    tags: [], // Backend doesn't have tags, could be added later
    status: p.status === "COMPLETED" ? "complete" : "progress",
    progress: p.status === "COMPLETED" ? 100 : p.status === "IN_PROGRESS" ? 65 : 30,
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", // Default image
    team: p.members?.slice(0, 3).map(m => m.user.name?.charAt(0).toUpperCase() || "?") || [],
  }));

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes hub-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes hub-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.7); } }
        @keyframes hub-line { 0%,100% { opacity:.2; transform:scaleY(.5); } 50% { opacity:1; transform:scaleY(1); } }
        @keyframes hub-float1 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(40px,-30px); } 66% { transform:translate(-20px,40px); } }
        @keyframes hub-float2 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(-30px,40px); } 66% { transform:translate(30px,-20px); } }
        .font-mono { font-family: 'DM Mono', monospace !important; }
        html { scroll-behavior: smooth; }
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
        <div
          className="absolute w-96 h-96 rounded-full top-[45%] left-[45%] bg-sky-500/[0.03] blur-[120px]"
          style={{ animation: "hub-float1 18s ease-in-out infinite 3s" }}
        />
      </div>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 w-full z-50 px-6 transition-all duration-300 ${scrolled ? "bg-slate-950/90 backdrop-blur-xl border-b border-slate-800" : "border-b border-transparent"}`}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between h-[72px]">
          <div
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center relative overflow-hidden">
              <div className="absolute inset-0.5 bg-slate-950 rounded-md" />
              <span className="relative z-10 text-xs font-extrabold text-amber-400">PH</span>
            </div>
            ProjectHub
          </div>
          <div className="flex items-center gap-7">
            {["projects", "services", "process", "contact"].map(s => (
              <button
                key={s}
                onClick={() => scrollTo(s)}
                className="hidden sm:block text-sm text-slate-500 hover:text-slate-100 transition-colors capitalize cursor-pointer bg-transparent border-none"
                style={{ fontFamily: "inherit" }}
              >
                {s}
              </button>
            ))}
            <GradientButton onClick={() => scrollTo("contact")} className="text-xs px-5 py-2.5">
              Start a Project
            </GradientButton>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-[72px] z-[2]">
        <div className="max-w-screen-xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400 font-mono uppercase tracking-wider mb-7">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-400"
                  style={{ animation: "hub-pulse 2s ease-in-out infinite" }}
                />
                Accepting new projects
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-none tracking-tighter mb-6">
                We engineer{" "}
                <span className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                  digital solutions
                </span>{" "}
                that scale your business
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-lg text-slate-500 leading-relaxed mb-9 max-w-xl">
                From rapid prototypes to enterprise platforms — we partner with forward-thinking companies to build software that creates measurable impact.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex gap-3 flex-wrap">
                <GradientButton onClick={() => scrollTo("projects")}>
                  View Our Work
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M7 7h10v10"/></svg>
                </GradientButton>
                <OutlineButton onClick={() => scrollTo("contact")}>Let's Talk</OutlineButton>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Orbital rings */}
        <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-[480px] h-[480px] z-[1] opacity-50 hidden lg:block">
          {[
            { inset: 0, border: "border-slate-700", speed: 30 },
            { inset: 70, border: "border-amber-500/15", speed: 25 },
            { inset: 140, border: "border-orange-500/10", speed: 20 },
          ].map((ring, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${ring.border} border`}
              style={{ inset: ring.inset, animation: `hub-spin ${ring.speed}s linear infinite ${i % 2 ? "reverse" : ""}` }}
            >
              {i < 2 && (
                <div className={`absolute w-2 h-2 rounded-full top-[-4px] left-1/2 shadow-lg ${
                  i === 0
                    ? "bg-amber-400 shadow-amber-400/50"
                    : "bg-orange-500 shadow-orange-500/50"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[2]">
          <span className="text-[0.65rem] uppercase tracking-[.15em] text-slate-600 font-mono">Scroll</span>
          <div
            className="w-px h-9 bg-gradient-to-b from-amber-400 to-transparent"
            style={{ animation: "hub-line 2.5s ease-in-out infinite" }}
          />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-t border-b border-slate-800 relative z-[2]">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <StatCard key={i} stat={s} index={i} isLast={i === STATS.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section id="projects" className="py-24 relative z-[2]">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
            <div>
              <Reveal><SectionLabel>Portfolio</SectionLabel></Reveal>
              <Reveal delay={0.05}>
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">Selected Work</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-slate-500 text-base leading-relaxed max-w-lg">
                  Projects that pushed boundaries and delivered real outcomes for ambitious companies.
                </p>
              </Reveal>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 mt-4">Loading projects...</p>
            </div>
          ) : mappedProjects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500">No public projects available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mappedProjects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-24 bg-slate-950/80 relative z-[2]">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center max-w-lg mx-auto mb-12">
            <Reveal><SectionLabel center>What We Do</SectionLabel></Reveal>
            <Reveal delay={0.05}>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">Full-Stack Capabilities</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-slate-500 text-base leading-relaxed">
                End-to-end services designed for companies building the next generation of digital products.
              </p>
            </Reveal>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => <ServiceCard key={i} service={s} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section id="process" className="py-24 relative z-[2]">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center max-w-lg mx-auto mb-14">
            <Reveal><SectionLabel center>How We Work</SectionLabel></Reveal>
            <Reveal delay={0.05}>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">Our Process</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-slate-500 text-base leading-relaxed">
                A structured yet flexible approach that keeps projects on track and stakeholders aligned.
              </p>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div
              className="absolute top-9 left-20 right-20 h-px hidden lg:block"
              style={{ background: "repeating-linear-gradient(90deg, rgb(30,42,54) 0, rgb(30,42,54) 8px, transparent 8px, transparent 16px)" }}
            />
            {PROCESS.map((step, i) => (
              <Reveal key={i} delay={i * 0.1} className="text-center">
                <div className="w-[72px] h-[72px] rounded-full border border-slate-800 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 grid place-items-center mx-auto mb-5 font-mono text-lg font-bold text-amber-400 bg-slate-950 relative z-10 transition-all duration-300">
                  {step.n}
                </div>
                <h3 className="text-base font-semibold mb-2 text-slate-100">{step.t}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-24 bg-slate-950/80 relative z-[2]">
        <div className="max-w-screen-xl mx-auto px-6">
          <Reveal><SectionLabel>Get In Touch</SectionLabel></Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">Let's Build Something Great</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-slate-500 text-base leading-relaxed max-w-lg mb-12">
              Ready to start your next project? Reach out and we'll respond within 24 hours.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <div className="flex flex-col gap-4">
              {CONTACT_ITEMS.map((item, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="flex items-center gap-4 p-5 rounded-xl border border-slate-800 bg-slate-950 hover:border-amber-500/30 transition-colors duration-200">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/5 grid place-items-center flex-shrink-0 text-amber-400">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 uppercase tracking-widest font-mono mb-1">{item.label}</div>
                      <div className="text-sm font-medium text-slate-200">{item.value}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Form */}
            <Reveal delay={0.1}>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Your Name", type: "text", placeholder: "Jane Smith" },
                  { label: "Email Address", type: "email", placeholder: "jane@company.com" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-mono text-slate-600 uppercase tracking-widest mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
                      style={{ fontFamily: "inherit" }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-mono text-slate-600 uppercase tracking-widest mb-1.5">Tell Us About Your Project</label>
                  <textarea
                    placeholder="We're looking to build..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 resize-y focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
                    style={{ fontFamily: "inherit" }}
                  />
                </div>
                <GradientButton onClick={() => {}} className="w-full justify-center">
                  Send Message
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </GradientButton>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 pt-10 pb-7 relative z-[2]">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center relative overflow-hidden">
              <div className="absolute inset-0.5 bg-slate-950 rounded" />
              <span className="relative z-10 text-[0.58rem] font-extrabold text-amber-400">PH</span>
            </div>
            <span className="font-semibold text-sm">ProjectHub</span>
          </div>
          <div className="flex gap-6">
            {["Projects", "Services", "Process", "Contact"].map(s => (
              <button
                key={s}
                onClick={() => scrollTo(s.toLowerCase())}
                className="text-xs text-slate-600 hover:text-amber-400 transition-colors cursor-pointer bg-transparent border-none"
                style={{ fontFamily: "inherit" }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-700">&copy; 2026 ProjectHub. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}