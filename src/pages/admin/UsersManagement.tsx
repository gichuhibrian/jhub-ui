import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserResponse, UserType, CreateUserPayload, UpdateUserPayload } from '@/services/userService';
import { projectMemberService } from '@/services/projectMemberService';
import { taskService } from '@/services/taskService';
import {
  invitationService,
  InvitationResponse,
  InvitationRole,
  InvitationStatus,
} from '@/services/invitationService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus, Search, Trash2, Edit, Users, Shield, ChevronDown, X,
  Loader2, Mail, Send, RefreshCw, Ban, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Style maps ───
const ROLE_BADGE: Record<UserType, string> = {
  ADMIN: 'bg-violet-500/10 text-violet-400',
  MEMBER: 'bg-sky-500/10 text-sky-400',
  CLIENT: 'bg-emerald-500/10 text-emerald-400',
};
const ROLE_DOT: Record<UserType, string> = {
  ADMIN: 'bg-violet-400',
  MEMBER: 'bg-sky-400',
  CLIENT: 'bg-emerald-400',
};
const STATUS_BADGE: Record<InvitationStatus, string> = {
  PENDING:   'bg-amber-500/10 text-amber-400',
  ACCEPTED:  'bg-emerald-500/10 text-emerald-400',
  EXPIRED:   'bg-slate-600/20 text-slate-500',
  CANCELLED: 'bg-rose-500/10 text-rose-400',
};
const ALL_ROLES: UserType[] = ['ADMIN', 'MEMBER', 'CLIENT'];

// ─── Shared primitives ───
function InputField({ label, type = 'text', value, onChange, placeholder = '' }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
        style={{ fontFamily: 'inherit' }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all appearance-none cursor-pointer"
        style={{ fontFamily: 'inherit' }}
      >
        {options.map(o => <option key={o.value} value={o.value} className="bg-slate-950">{o.label}</option>)}
      </select>
    </div>
  );
}

function PrimaryButton({ children, onClick, small = false, disabled = false, className = '' }: {
  children: React.ReactNode; onClick?: () => void; small?: boolean; disabled?: boolean; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${small ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} ${className}`}
      style={{ fontFamily: 'inherit' }}
    >{children}</button>
  );
}

function DangerButton({ children, onClick, small = false, disabled = false }: {
  children: React.ReactNode; onClick?: () => void; small?: boolean; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-semibold hover:-translate-y-0.5 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed ${small ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'}`}
      style={{ fontFamily: 'inherit' }}
    >{children}</button>
  );
}

function OutlineBtn({ children, onClick, small = false, className = '' }: {
  children: React.ReactNode; onClick?: (e?: React.MouseEvent) => void; small?: boolean; className?: string;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-transparent text-slate-400 hover:border-amber-500/40 hover:text-amber-400 cursor-pointer transition-all ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} ${className}`}
      style={{ fontFamily: 'inherit' }}
    >{children}</button>
  );
}

function GhostBtn({ children, onClick, className = '' }: {
  children: React.ReactNode; onClick?: (e?: React.MouseEvent) => void; className?: string;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-all w-8 h-8 ${className}`}
      style={{ fontFamily: 'inherit' }}
    >{children}</button>
  );
}

function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <GhostBtn onClick={onClose}><X className="w-4 h-4" /></GhostBtn>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 pb-6 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-400 uppercase tracking-widest mb-3.5">
      <span className="w-5 h-px bg-amber-400" />{children}
    </div>
  );
}

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-none ${
        active
          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          : 'bg-transparent text-slate-500 hover:text-slate-300'
      }`}
      style={{ fontFamily: 'inherit' }}
    >{children}</button>
  );
}

// ─── Form types ───
interface UserForm { name: string; email: string; password: string; userType: UserType; }
interface InviteForm { email: string; role: InvitationRole; }
const DEFAULT_USER_FORM: UserForm = { name: '', email: '', password: '', userType: 'MEMBER' };
const DEFAULT_INVITE_FORM: InviteForm = { email: '', role: 'MEMBER' };

// ─── Helpers ───
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Main ───
export default function UsersManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [search, setSearch] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(DEFAULT_USER_FORM);
  const [inviteForm, setInviteForm] = useState<InviteForm>(DEFAULT_INVITE_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [roleDropdownId, setRoleDropdownId] = useState<string | null>(null);

  // ── Queries ──
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await userService.getAll();
      } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
      }
    },
  });
  const { data: allMembers = [] } = useQuery({
    queryKey: ['project-members'],
    queryFn: async () => {
      try {
        return await projectMemberService.getAll();
      } catch (error) {
        console.error('Failed to fetch project members:', error);
        return [];
      }
    },
  });
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        return await taskService.getAll();
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return [];
      }
    },
  });
  const { data: invitations = [], isLoading: invitesLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      try {
        return await invitationService.getAll();
      } catch (error) {
        console.error('Failed to fetch invitations:', error);
        return [];
      }
    },
  });

  // ── Close role dropdown on outside click ──
  useEffect(() => {
    if (!roleDropdownId) return;
    const h = () => setRoleDropdownId(null);
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [roleDropdownId]);

  // ── Derived stats ──
  const userProjectCount = (id: string) => allMembers.filter(m => m.userId === id).length;
  const userTaskCount    = (id: string) => allTasks.filter(t => t.userId === id).length;
  const adminCount   = users.filter(u => u.userType === 'ADMIN').length;
  const memberCount  = users.filter(u => u.userType === 'MEMBER').length;
  const clientCount  = users.filter(u => u.userType === 'CLIENT').length;
  const pendingCount = invitations.filter(i => i.status === 'PENDING').length;
  const filtered = users.filter(u =>
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Debug logging
  useEffect(() => {
    console.log('Users data:', { users, usersLoading, usersError });
    console.log('Members data:', allMembers);
    console.log('Tasks data:', allTasks);
    console.log('Invitations data:', invitations);
  }, [users, usersLoading, usersError, allMembers, allTasks, invitations]);

  // ── User mutations ──
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserPayload) => userService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); setUserDialogOpen(false); },
    onError: (e: { response?: { data?: { message?: string | string[] } } }) => {
      const m = e.response?.data?.message ?? 'Failed to create user';
      toast.error(Array.isArray(m) ? m[0] : m);
    },
  });
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) => userService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); setUserDialogOpen(false); },
    onError: () => toast.error('Failed to update user'),
  });
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); setConfirmDeleteId(null); },
    onError: () => toast.error('Failed to delete user'),
  });
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, userType }: { id: string; userType: UserType }) => userService.updateRole(id, userType),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Role updated'); setRoleDropdownId(null); },
    onError: () => toast.error('Failed to update role'),
  });

  // ── Invitation mutations ──
  const sendInviteMutation = useMutation({
    mutationFn: (data: InviteForm) => invitationService.sendInvitation(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invitations'] }); toast.success('Invitation sent'); setInviteDialogOpen(false); setInviteForm(DEFAULT_INVITE_FORM); },
    onError: (e: { response?: { data?: { message?: string | string[] } } }) => {
      const m = e.response?.data?.message ?? 'Failed to send invitation';
      toast.error(Array.isArray(m) ? m[0] : m);
    },
  });
  const cancelInviteMutation = useMutation({
    mutationFn: (id: string) => invitationService.cancel(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invitations'] }); toast.success('Invitation cancelled'); },
    onError: () => toast.error('Failed to cancel invitation'),
  });
  const resendInviteMutation = useMutation({
    mutationFn: (id: string) => invitationService.resend(id),
    onSuccess: () => toast.success('Invitation resent'),
    onError: () => toast.error('Failed to resend invitation'),
  });

  // ── Handlers ──
  const openCreateUser = () => { setEditingUser(null); setUserForm(DEFAULT_USER_FORM); setUserDialogOpen(true); };
  const openEditUser   = (u: UserResponse) => { setEditingUser(u); setUserForm({ name: u.name ?? '', email: u.email, password: '', userType: u.userType }); setUserDialogOpen(true); };

  const handleSaveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) return;
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: { name: userForm.name, email: userForm.email, userType: userForm.userType } });
    } else {
      if (!userForm.password.trim()) return;
      createUserMutation.mutate(userForm);
    }
  };

  const handleRoleChange = (id: string, userType: UserType, e: React.MouseEvent) => {
    e.stopPropagation();
    updateRoleMutation.mutate({ id, userType });
  };

  const isSavingUser  = createUserMutation.isPending || updateUserMutation.isPending;
  const isDeletingUser = deleteUserMutation.isPending;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes hub-float1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(40px,-30px)} 66%{transform:translate(-20px,40px)} }
        @keyframes hub-float2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-30px,40px)} 66%{transform:translate(30px,-20px)} }
        .font-mono { font-family:'DM Mono',monospace !important; }
      `}</style>

      {/* Ambient BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgb(51,65,85) 1px,transparent 1px),linear-gradient(90deg,rgb(51,65,85) 1px,transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 70% 50% at 50% 30%,black 10%,transparent 70%)' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full -top-52 -left-24 bg-amber-500/5 blur-[140px]" style={{ animation: 'hub-float1 22s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full -bottom-52 -right-24 bg-orange-500/5 blur-[140px]" style={{ animation: 'hub-float2 26s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <SectionLabel>Management</SectionLabel>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">Users</h1>
            <p className="text-slate-500 text-sm">{users.length} total user{users.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <OutlineBtn onClick={() => setInviteDialogOpen(true)}>
              <Mail className="w-4 h-4" /> Invite User
            </OutlineBtn>
            <PrimaryButton onClick={openCreateUser}>
              <Plus className="w-4 h-4" /> New User
            </PrimaryButton>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 grid place-items-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">{usersLoading ? '—' : users.length}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Total</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 grid place-items-center">
                <Shield className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{usersLoading ? '—' : adminCount}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Admins</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 grid place-items-center">
                <Users className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{usersLoading ? '—' : memberCount}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Members</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 grid place-items-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{usersLoading ? '—' : clientCount}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Clients</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6">
          <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            Users
          </TabBtn>
          <TabBtn active={activeTab === 'invitations'} onClick={() => setActiveTab('invitations')}>
            Invitations
            {pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[0.6rem] font-mono">
                {pendingCount}
              </span>
            )}
          </TabBtn>
        </div>

        {/* ══════════ USERS TAB ══════════ */}
        {activeTab === 'users' && (
          <>
            {/* Search */}
            <div className="relative max-w-sm mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input
                placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-widest">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-1 text-center">Projects</div>
                <div className="col-span-1 text-center">Tasks</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {usersLoading && (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Loading users…</span>
                </div>
              )}
              {usersError && !usersLoading && (
                <div className="text-center py-16">
                  <p className="text-sm text-rose-400">Failed to load users. Check your connection.</p>
                </div>
              )}
              {!usersLoading && !usersError && filtered.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">{search ? 'No users match your search.' : 'No users yet.'}</p>
                </div>
              )}

              {!usersLoading && !usersError && filtered.map((u) => (
                <div key={u.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-b-0 items-center hover:bg-slate-800/30 transition-colors">
                  {/* User */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 border-2 border-slate-800 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-amber-500/10 text-amber-400 font-bold">
                        {(u.name ?? u.email)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-slate-200 truncate">{u.name ?? '—'}</span>
                  </div>
                  {/* Email */}
                  <div className="col-span-2 min-w-0">
                    <span className="text-sm text-slate-500 truncate block">{u.email}</span>
                  </div>
                  {/* Role — clickable */}
                  <div className="col-span-2 relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRoleDropdownId(roleDropdownId === u.id ? null : u.id); }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.65rem] font-medium font-mono uppercase tracking-wide cursor-pointer hover:ring-1 hover:ring-amber-500/40 transition-all ${ROLE_BADGE[u.userType]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[u.userType]}`} />
                      {u.userType}
                      <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                    </button>
                    {roleDropdownId === u.id && (
                      <div className="absolute top-full left-0 mt-1.5 z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 min-w-[110px]">
                        {ALL_ROLES.map(role => (
                          <button key={role} onClick={(e) => handleRoleChange(u.id, role, e)} disabled={updateRoleMutation.isPending}
                            className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 ${u.userType === role ? 'text-amber-400' : 'text-slate-400'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[role]}`} />{role}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Projects */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-slate-400 font-mono">{userProjectCount(u.id)}</span>
                  </div>
                  {/* Tasks */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-slate-400 font-mono">{userTaskCount(u.id)}</span>
                  </div>
                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-0.5">
                    <GhostBtn onClick={() => openEditUser(u)}><Edit className="w-3.5 h-3.5" /></GhostBtn>
                    <GhostBtn onClick={(e) => { e?.stopPropagation(); setConfirmDeleteId(u.id); }} className="hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </GhostBtn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════ INVITATIONS TAB ══════════ */}
        {activeTab === 'invitations' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-widest">
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Invited By</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {invitesLoading && (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Loading invitations…</span>
              </div>
            )}
            {!invitesLoading && invitations.length === 0 && (
              <div className="text-center py-16">
                <Mail className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No invitations sent yet.</p>
              </div>
            )}
            {!invitesLoading && invitations.map((inv: InvitationResponse) => (
              <div key={inv.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-b-0 items-center hover:bg-slate-800/30 transition-colors">
                {/* Email */}
                <div className="col-span-3 min-w-0">
                  <span className="text-sm text-slate-200 truncate block">{inv.email}</span>
                </div>
                {/* Role */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-mono uppercase tracking-wide ${ROLE_BADGE[inv.role as UserType]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[inv.role as UserType]}`} />{inv.role}
                  </span>
                </div>
                {/* Status */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-mono uppercase tracking-wide ${STATUS_BADGE[inv.status]}`}>
                    {inv.status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                    {inv.status}
                  </span>
                </div>
                {/* Invited by */}
                <div className="col-span-2 min-w-0">
                  <span className="text-xs text-slate-500 truncate block">
                    {inv.invitedBy.name ?? inv.invitedBy.email}
                  </span>
                </div>
                {/* Date */}
                <div className="col-span-2">
                  <span className="text-xs text-slate-500 font-mono">{formatDate(inv.createdAt)}</span>
                </div>
                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-0.5">
                  {inv.status === 'PENDING' && (
                    <>
                      <GhostBtn onClick={() => resendInviteMutation.mutate(inv.id)} className="hover:text-sky-400 hover:bg-sky-500/10">
                        <RefreshCw className={`w-3.5 h-3.5 ${resendInviteMutation.isPending ? 'animate-spin' : ''}`} />
                      </GhostBtn>
                      <GhostBtn onClick={() => cancelInviteMutation.mutate(inv.id)} className="hover:text-rose-400 hover:bg-rose-500/10">
                        <Ban className="w-3.5 h-3.5" />
                      </GhostBtn>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ CREATE / EDIT USER MODAL ══ */}
      <Modal open={userDialogOpen} onClose={() => setUserDialogOpen(false)} title={editingUser ? 'Edit User' : 'New User'}
        footer={
          <>
            <OutlineBtn onClick={() => setUserDialogOpen(false)}>Cancel</OutlineBtn>
            <PrimaryButton small onClick={handleSaveUser} disabled={isSavingUser}>
              {isSavingUser && <Loader2 className="w-3 h-3 animate-spin" />}
              {editingUser ? 'Update' : 'Create'}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <InputField label="Name" value={userForm.name} onChange={(v) => setUserForm({ ...userForm, name: v })} placeholder="Full name" />
          <InputField label="Email" type="email" value={userForm.email} onChange={(v) => setUserForm({ ...userForm, email: v })} placeholder="user@example.com" />
          {!editingUser && (
            <InputField label="Password" type="password" value={userForm.password} onChange={(v) => setUserForm({ ...userForm, password: v })} placeholder="Minimum 6 characters" />
          )}
          <SelectField label="Role" value={userForm.userType} onChange={(v) => setUserForm({ ...userForm, userType: v as UserType })}
            options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'MEMBER', label: 'Member' }, { value: 'CLIENT', label: 'Client' }]}
          />
        </div>
      </Modal>

      {/* ══ INVITE USER MODAL ══ */}
      <Modal open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} title="Invite User"
        footer={
          <>
            <OutlineBtn onClick={() => setInviteDialogOpen(false)}>Cancel</OutlineBtn>
            <PrimaryButton small onClick={() => sendInviteMutation.mutate(inviteForm)} disabled={sendInviteMutation.isPending || !inviteForm.email.trim()}>
              {sendInviteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Send Invitation
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            An invitation email will be sent with a link to create their account.
          </p>
          <InputField label="Email Address" type="email" value={inviteForm.email} onChange={(v) => setInviteForm({ ...inviteForm, email: v })} placeholder="colleague@example.com" />
          <SelectField label="Role" value={inviteForm.role} onChange={(v) => setInviteForm({ ...inviteForm, role: v as InvitationRole })}
            options={[{ value: 'MEMBER', label: 'Member' }, { value: 'CLIENT', label: 'Client' }]}
          />
        </div>
      </Modal>

      {/* ══ DELETE CONFIRMATION MODAL ══ */}
      <Modal open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} title="Delete User"
        footer={
          <>
            <OutlineBtn onClick={() => setConfirmDeleteId(null)}>Cancel</OutlineBtn>
            <DangerButton small disabled={isDeletingUser} onClick={() => confirmDeleteId && deleteUserMutation.mutate(confirmDeleteId)}>
              {isDeletingUser && <Loader2 className="w-3 h-3 animate-spin" />}Delete
            </DangerButton>
          </>
        }
      >
        <p className="text-sm text-slate-400 leading-relaxed">
          Are you sure you want to delete this user? This is permanent and cannot be undone.
          All project memberships for this user will also be removed.
        </p>
      </Modal>
    </div>
  );
}
