import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<{ access_token: string; user: any }>('/auth/login', {
        email,
        password,
      });

      // Store the access token
      localStorage.setItem('access_token', response.access_token);

      // Update auth store with user data from backend (assume admin role)
      const userWithRole = { ...response.user, role: 'admin' };
      useAuthStore.setState({ currentUser: userWithRole });

      // Redirect to admin dashboard
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes hub-float1 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(40px,-30px); } 66% { transform:translate(-20px,40px); } }
        @keyframes hub-float2 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(-30px,40px); } 66% { transform:translate(30px,-20px); } }
        @keyframes hub-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.7); } }
        .font-mono { font-family: 'DM Mono', monospace !important; }
      `}</style>

      {/* Ambient BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgb(51,65,85) 1px, transparent 1px), linear-gradient(90deg, rgb(51,65,85) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black 10%, transparent 70%)",
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
      </div>

      {/* Login Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center relative overflow-hidden">
              <div className="absolute inset-0.5 bg-slate-950 rounded-md" />
              <span className="relative z-10 text-sm font-extrabold text-amber-400">PH</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">ProjectHub</span>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h1>
              <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="sarah@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
                  style={{ fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
                  style={{ fontFamily: "inherit" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ fontFamily: "inherit" }}
              >
                {loading ? (
                  <>
                    <span
                      className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full"
                      style={{ animation: "hub-pulse 1s linear infinite" }}
                    />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Demo Credentials</p>
              <div className="space-y-2 text-xs text-slate-400">
                <p>
                  <span className="text-amber-400 font-medium">Admin:</span> sarah@company.com / admin123
                </p>
                <p>
                  <span className="text-amber-400 font-medium">User:</span> emily@company.com / user123
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-8">
            &copy; 2026 ProjectHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
