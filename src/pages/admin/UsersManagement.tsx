import { useState } from 'react';
import { useDataStore } from '@/store/useStore';
import { User, UserRole } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Trash2, Edit, Users, Shield, X } from 'lucide-react';
import { toast } from 'sonner';

// ─── Sub-components (shared design tokens) ───
function InputField({ label, type = "text", value, onChange, placeholder = "" }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
        style={{ fontFamily: "inherit" }}
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
        className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200 appearance-none cursor-pointer"
        style={{ fontFamily: "inherit" }}
      >
        {options.map(o => <option key={o.value} value={o.value} className="bg-slate-950">{o.label}</option>)}
      </select>
    </div>
  );
}

function PrimaryButton({ children, onClick, className = "", small = false }: {
  children: React.ReactNode; onClick?: () => void; className?: string; small?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 cursor-pointer border-none ${small ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-sm"} ${className}`}
      style={{ fontFamily: "inherit" }}
    >{children}</button>
  );
}

function OutlineBtn({ children, onClick, className = "", small = false }: {
  children: React.ReactNode; onClick?: (e?: any) => void; className?: string; small?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-transparent text-slate-400 hover:border-amber-500/40 hover:text-amber-400 cursor-pointer transition-all duration-200 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${className}`}
      style={{ fontFamily: "inherit" }}
    >{children}</button>
  );
}

function GhostBtn({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: (e?: any) => void; className?: string;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-all duration-200 w-8 h-8 ${className}`}
      style={{ fontFamily: "inherit" }}
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
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
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

// ─── Main ───
export default function UsersManagement() {
  const { users, projects, addUser, updateUser, deleteUser } = useDataStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' as UserRole });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: 'user123', role: 'user' });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: u.password, role: u.role });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editingUser) {
      updateUser(editingUser.id, form);
      toast.success('User updated');
    } else {
      addUser({ id: 'u' + Date.now(), ...form, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name.replace(/\s/g, '')}` });
      toast.success('User created');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string, e?: any) => {
    e?.stopPropagation();
    deleteUser(id);
    toast.success('User deleted');
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes hub-float1 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(40px,-30px); } 66% { transform:translate(-20px,40px); } }
        @keyframes hub-float2 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(-30px,40px); } 66% { transform:translate(30px,-20px); } }
        .font-mono { font-family: 'DM Mono', monospace !important; }
      `}</style>

      {/* ── Ambient BG ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "linear-gradient(rgb(51,65,85) 1px, transparent 1px), linear-gradient(90deg, rgb(51,65,85) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 10%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 10%, transparent 70%)",
        }} />
        <div className="absolute w-[600px] h-[600px] rounded-full -top-52 -left-24 bg-amber-500/5 blur-[140px]" style={{ animation: "hub-float1 22s ease-in-out infinite" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full -bottom-52 -right-24 bg-orange-500/5 blur-[140px]" style={{ animation: "hub-float2 26s ease-in-out infinite" }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <SectionLabel>Management</SectionLabel>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">Users</h1>
            <p className="text-slate-500 text-sm">{users.length} total user{users.length !== 1 ? 's' : ''}</p>
          </div>
          <PrimaryButton onClick={openCreate}>
            <Plus className="w-4 h-4" /> New User
          </PrimaryButton>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 grid place-items-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">{users.length}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Total</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 grid place-items-center">
                <Shield className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{adminCount}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Admins</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 grid place-items-center">
                <Users className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{userCount}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Members</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-200"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        {/* ── Table ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-widest">
            <div className="col-span-4">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1">Projects</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {search ? 'No users match your search.' : 'No users yet. Create one to get started.'}
              </p>
            </div>
          )}
          {filtered.map((u) => {
            const userProjects = projects.filter(p => p.memberIds.includes(u.id));
            return (
              <div
                key={u.id}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-b-0 items-center hover:bg-slate-800/30 transition-colors group"
              >
                {/* User */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 border-2 border-slate-800 flex-shrink-0">
                    <AvatarImage src={u.avatarUrl} />
                    <AvatarFallback className="text-xs bg-amber-500/10 text-amber-400 font-bold">{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-slate-200 truncate">{u.name}</span>
                </div>

                {/* Email */}
                <div className="col-span-3 min-w-0">
                  <span className="text-sm text-slate-500 truncate block">{u.email}</span>
                </div>

                {/* Role */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.65rem] font-medium font-mono uppercase tracking-wide ${
                    u.role === 'admin'
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.role === 'admin' ? 'bg-violet-400' : 'bg-slate-500'}`} />
                    {u.role}
                  </span>
                </div>

                {/* Projects count */}
                <div className="col-span-1">
                  <span className="text-sm text-slate-400 font-mono">{userProjects.length}</span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-0.5">
                  <GhostBtn onClick={() => openEdit(u)}>
                    <Edit className="w-3.5 h-3.5" />
                  </GhostBtn>
                  <GhostBtn onClick={(e: any) => handleDelete(u.id, e)} className="hover:text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </GhostBtn>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingUser ? 'Edit User' : 'New User'}
        footer={
          <>
            <OutlineBtn onClick={() => setDialogOpen(false)}>Cancel</OutlineBtn>
            <PrimaryButton small onClick={handleSave}>{editingUser ? 'Update' : 'Create'}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <InputField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" />
          <InputField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="user@example.com" />
          <InputField label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Password" />
          <SelectField
            label="Role"
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v as UserRole })}
            options={[{ value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' }]}
          />
        </div>
      </Modal>
    </div>
  );
}