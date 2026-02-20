import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import {
  LayoutDashboard, FolderKanban, Users, LogOut, ChevronRight, Menu, X, Layers, ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/users', label: 'Users', icon: Users },
];

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function BackofficeLayout() {

  const { currentUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);


    console.log(currentUser);


  if (!currentUser) return null;

  const links = currentUser.role === 'admin' ? adminLinks : userLinks;

  const isActive = (path: string) => {
    if (path === '/admin' || path === '/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    path: '/' + pathParts.slice(0, i + 1).join('/'),
  }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Logo */}
      <div className={`flex items-center gap-2.5 h-16 border-b border-slate-800 ${sidebarOpen ? 'px-5' : 'px-3 justify-center'}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0.5 bg-slate-900 rounded-md" />
          <span className="relative z-10 text-[0.6rem] font-extrabold text-amber-400">PH</span>
        </div>
        {sidebarOpen && <span className="font-bold text-base tracking-tight text-slate-100">ProjectHub</span>}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-1 ${sidebarOpen ? 'px-3' : 'px-2'}`}>
        {links.map((link) => {
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                sidebarOpen ? 'px-3.5 py-2.5' : 'px-0 py-2.5 justify-center'
              } ${
                active
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={!sidebarOpen ? link.label : undefined}
            >
              <link.icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-amber-400' : ''}`} />
              {sidebarOpen && <span>{link.label}</span>}
              {sidebarOpen && active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={`border-t border-slate-800 ${sidebarOpen ? 'p-4' : 'p-2 flex justify-center'}`}>
        <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'flex-col gap-2'}`}>
          <Avatar className="h-8 w-8 border-2 border-slate-800 flex-shrink-0">
            <AvatarImage src={currentUser.avatarUrl} />
            <AvatarFallback className="text-[0.6rem] bg-amber-500/10 text-amber-400 font-bold">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-[0.65rem] text-slate-600 font-mono uppercase tracking-wider">{currentUser.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log out"
            className={`grid place-items-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer bg-transparent border-none flex-shrink-0 ${
              sidebarOpen ? 'w-8 h-8' : 'w-8 h-8'
            }`}
            style={{ fontFamily: "inherit" }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-950" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        .font-mono { font-family: 'DM Mono', monospace !important; }
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ${
        sidebarOpen ? 'w-60' : 'w-[68px]'
      }`}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 shadow-2xl shadow-black/50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 bg-slate-900/60 backdrop-blur-md flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all cursor-pointer bg-transparent border-none"
              style={{ fontFamily: "inherit" }}
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Desktop toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:grid w-8 h-8 place-items-center rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all cursor-pointer bg-transparent border-none"
              style={{ fontFamily: "inherit" }}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-700" />}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-slate-200">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.path} className="text-slate-500 hover:text-amber-400 transition-colors">{crumb.label}</Link>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors font-mono uppercase tracking-wider"
          >
            Portfolio <ExternalLink className="w-3 h-3" />
          </Link>
        </header>

        {/* Content — no extra bg since child pages supply their own */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}