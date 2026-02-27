import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { invitationService } from '@/services/invitationService';
import { apiService } from '@/lib/api';
import { Loader2, CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';

// ─── Design tokens (matching app dark theme) ───
const cardBase =
  'w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 p-8';

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: 'inherit' }}
      />
    </div>
  );
}

// ─── Phase states ───
type Phase =
  | { kind: 'loading' }
  | { kind: 'existing_user'; email: string }
  | { kind: 'new_user'; email: string; token: string; role: string }
  | { kind: 'registered' }
  | { kind: 'error'; message: string }
  | { kind: 'no_token' };

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Countdown for the auto-redirect after existing-user accept
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!token) {
      setPhase({ kind: 'no_token' });
      return;
    }

    invitationService
      .acceptInvitation(token)
      .then((result) => {
        if (result.type === 'EXISTING_USER') {
          setPhase({ kind: 'existing_user', email: result.email });
        } else {
          setPhase({
            kind: 'new_user',
            email: result.email,
            token: result.token,
            role: result.role,
          });
        }
      })
      .catch((err) => {
        const msg: string =
          err?.response?.data?.message ??
          'Something went wrong. The link may be invalid or expired.';
        setPhase({ kind: 'error', message: Array.isArray(msg) ? msg[0] : msg });
      });
  }, [token]);

  // Auto-redirect countdown when existing user is accepted
  useEffect(() => {
    if (phase.kind !== 'existing_user') return;
    if (countdown <= 0) {
      navigate('/login');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase.kind, countdown, navigate]);

  // ── Registration submit for new users ──
  const handleRegister = async () => {
    if (phase.kind !== 'new_user') return;
    if (!name.trim() || !password.trim()) {
      setFormError('Name and password are required.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      // 1. Register the new account
      await apiService.post('/auth/register', {
        name: name.trim(),
        email: phase.email,
        password,
      });

      // 2. Accept the invitation now that the user exists (sets correct role)
      await invitationService.acceptInvitation(phase.token);

      setPhase({ kind: 'registered' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosErr?.response?.data?.message ?? 'Registration failed. Please try again.';
      setFormError(Array.isArray(msg) ? msg[0] : (msg as string));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4"
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500/5 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">
            JHub
          </span>
        </div>

        {/* ── Loading ── */}
        {phase.kind === 'loading' && (
          <div className={cardBase}>
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              <p className="text-slate-400 text-sm">Verifying your invitation…</p>
            </div>
          </div>
        )}

        {/* ── No token ── */}
        {phase.kind === 'no_token' && (
          <div className={cardBase}>
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <XCircle className="w-12 h-12 text-rose-400" />
              <h2 className="text-xl font-semibold">Invalid Link</h2>
              <p className="text-slate-400 text-sm">
                This invitation link is missing a token. Make sure you copied the full URL.
              </p>
              <Link
                to="/login"
                className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-4"
              >
                Go to login
              </Link>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {phase.kind === 'error' && (
          <div className={cardBase}>
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <XCircle className="w-12 h-12 text-rose-400" />
              <h2 className="text-xl font-semibold">Invitation Error</h2>
              <p className="text-slate-400 text-sm">{phase.message}</p>
              <Link
                to="/login"
                className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-4"
              >
                Go to login
              </Link>
            </div>
          </div>
        )}

        {/* ── Existing user — role updated ── */}
        {phase.kind === 'existing_user' && (
          <div className={cardBase}>
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <h2 className="text-xl font-semibold">Welcome back!</h2>
              <p className="text-slate-400 text-sm">
                Your role has been updated. You'll be redirected to login in{' '}
                <span className="text-amber-400 font-semibold">{countdown}s</span>.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                Go to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── New user — registration form ── */}
        {phase.kind === 'new_user' && (
          <div className={cardBase}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 grid place-items-center flex-shrink-0">
                <Mail className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight">Complete your account</h2>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wide mt-0.5">
                  Invited as{' '}
                  <span className="text-amber-400">{phase.role}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <InputField
                label="Email"
                type="email"
                value={phase.email}
                disabled
                placeholder=""
              />
              <InputField
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="Your full name"
              />
              <InputField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="At least 6 characters"
              />

              {formError && (
                <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <button
                onClick={handleRegister}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {submitting ? 'Creating account…' : 'Create account & accept'}
              </button>
            </div>
          </div>
        )}

        {/* ── Registration complete ── */}
        {phase.kind === 'registered' && (
          <div className={cardBase}>
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <h2 className="text-xl font-semibold">Account created!</h2>
              <p className="text-slate-400 text-sm">
                Your account is ready. Sign in to get started.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                Go to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
