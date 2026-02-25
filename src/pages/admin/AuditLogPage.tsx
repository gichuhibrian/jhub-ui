import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogService, AuditLogEntry, AuditLogFilters } from '@/services/auditLogService';
import { userService } from '@/services/userService';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight, Download, Search, X } from 'lucide-react';

// ── Action badge colours ──────────────────────────────────────────────────
const ACTION_COLOUR: Record<string, string> = {
  PROJECT_CREATED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  TASK_CREATED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  MEMBER_ADDED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  USER_REGISTERED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  USER_INVITED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  PROJECT_UPDATED: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  TASK_UPDATED: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  TASK_STATUS_CHANGED: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  TASK_ASSIGNED: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  USER_ROLE_CHANGED: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  TEAM_LEAD_SET: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  PROJECT_DELETED: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  TASK_DELETED: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  USER_DELETED: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  MEMBER_REMOVED: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  USER_LOGIN: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
};

const actionColour = (action: string) =>
  ACTION_COLOUR[action] ?? 'bg-slate-500/15 text-slate-400 border border-slate-500/20';

const ACTION_LABELS = [
  'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED',
  'TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_ASSIGNED', 'TASK_DELETED',
  'USER_INVITED', 'USER_REGISTERED', 'USER_ROLE_CHANGED', 'USER_DELETED', 'USER_LOGIN',
  'MEMBER_ADDED', 'MEMBER_REMOVED', 'TEAM_LEAD_SET',
];

const ENTITY_LABELS = ['Project', 'Task', 'User', 'ProjectMember', 'Invitation'];

const PAGE_SIZE = 25;

// ── CSV export ────────────────────────────────────────────────────────────
function exportCsv(rows: AuditLogEntry[]) {
  const headers = ['Timestamp', 'User', 'Email', 'Action', 'Entity', 'Entity ID', 'Metadata'];
  const lines = rows.map(r => [
    r.createdAt,
    r.user?.name ?? r.userId,
    r.user?.email ?? '',
    r.action,
    r.entity,
    r.entityId,
    r.metadata ? JSON.stringify(r.metadata).replace(/"/g, '""') : '',
  ].map(v => `"${v}"`).join(','));

  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Row component ─────────────────────────────────────────────────────────
function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-4 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">
          {format(parseISO(entry.createdAt), 'MMM d, yyyy HH:mm:ss')}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-slate-200 font-medium">{entry.user?.name ?? '—'}</p>
          <p className="text-xs text-slate-500 font-mono">{entry.user?.email ?? entry.userId}</p>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wider ${actionColour(entry.action)}`}>
            {entry.action.replace(/_/g, ' ')}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-slate-400">{entry.entity}</td>
        <td className="px-4 py-3 text-xs text-slate-500 font-mono truncate max-w-[120px]">{entry.entityId}</td>
        <td className="px-4 py-3 text-slate-600">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-slate-800/60 bg-slate-900/40">
          <td colSpan={6} className="px-4 py-3">
            <pre className="text-xs text-slate-300 font-mono bg-slate-950/60 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
              {entry.metadata
                ? JSON.stringify(entry.metadata, null, 2)
                : <span className="text-slate-600 italic">No metadata</span>}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: PAGE_SIZE });
  const [draftSearch, setDraftSearch] = useState('');

  // Applied filters are what we actually query with
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({ page: 1, limit: PAGE_SIZE });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', appliedFilters],
    queryFn: () => auditLogService.getAll(appliedFilters),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  });

  const users = usersData ?? [];

  const handleApply = () => {
    setAppliedFilters({ ...filters, page: 1 });
  };

  const handleClear = () => {
    setFilters({ page: 1, limit: PAGE_SIZE });
    setAppliedFilters({ page: 1, limit: PAGE_SIZE });
    setDraftSearch('');
  };

  const hasActiveFilters = useMemo(() => {
    return !!(appliedFilters.userId || appliedFilters.entity || appliedFilters.action || appliedFilters.from || appliedFilters.to);
  }, [appliedFilters]);

  const setPage = (page: number) => {
    setAppliedFilters(prev => ({ ...prev, page }));
    setFilters(prev => ({ ...prev, page }));
  };

  const totalPages = data?.totalPages ?? 1;
  const currentPage = appliedFilters.page ?? 1;
  const allRows = data?.data ?? [];

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data ? `${data.total.toLocaleString()} total entries` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={() => allRows.length > 0 && exportCsv(allRows)}
          disabled={allRows.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 transition-all disabled:opacity-40 cursor-pointer"
          style={{ fontFamily: 'inherit' }}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {/* User filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-slate-500 font-semibold uppercase tracking-wider">User</label>
            <select
              value={filters.userId ?? ''}
              onChange={e => setFilters(prev => ({ ...prev, userId: e.target.value || undefined }))}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="">All users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Action filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-slate-500 font-semibold uppercase tracking-wider">Action</label>
            <select
              value={filters.action ?? ''}
              onChange={e => setFilters(prev => ({ ...prev, action: e.target.value || undefined }))}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="">All actions</option>
              {ACTION_LABELS.map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Entity filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-slate-500 font-semibold uppercase tracking-wider">Entity</label>
            <select
              value={filters.entity ?? ''}
              onChange={e => setFilters(prev => ({ ...prev, entity: e.target.value || undefined }))}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="">All entities</option>
              {ENTITY_LABELS.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* From date */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-slate-500 font-semibold uppercase tracking-wider">From</label>
            <input
              type="date"
              value={filters.from ?? ''}
              onChange={e => setFilters(prev => ({ ...prev, from: e.target.value || undefined }))}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              style={{ fontFamily: 'inherit', colorScheme: 'dark' }}
            />
          </div>

          {/* To date */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-slate-500 font-semibold uppercase tracking-wider">To</label>
            <input
              type="date"
              value={filters.to ?? ''}
              onChange={e => setFilters(prev => ({ ...prev, to: e.target.value || undefined }))}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              style={{ fontFamily: 'inherit', colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all cursor-pointer border-none"
            style={{ fontFamily: 'inherit' }}
          >
            <Search className="h-3.5 w-3.5" />
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none"
              style={{ fontFamily: 'inherit' }}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-left text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider">Entity ID</th>
                <th className="px-4 py-3 text-left text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider w-8"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                      Loading audit logs…
                    </div>
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-rose-400 text-sm">
                    Failed to load audit logs. Make sure you are logged in as an admin.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && allRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No audit log entries found.
                  </td>
                </tr>
              )}
              {allRows.map(entry => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {currentPage} of {totalPages} &middot; {data?.total.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-all cursor-pointer border-none"
                style={{ fontFamily: 'inherit' }}
              >
                Prev
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const page = start + i;
                return (
                  <button
                    key={page}
                    onClick={() => setPage(page)}
                    className={`w-8 h-8 text-xs rounded-lg transition-all cursor-pointer border-none ${
                      page === currentPage
                        ? 'bg-amber-500 text-slate-900 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-all cursor-pointer border-none"
                style={{ fontFamily: 'inherit' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
