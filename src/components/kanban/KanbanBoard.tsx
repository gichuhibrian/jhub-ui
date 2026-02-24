import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, TaskResponse, TaskStatus, TaskPriority } from '@/services/taskService';
import { toast } from 'sonner';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { isAfter, parseISO, startOfDay, endOfWeek, endOfMonth, startOfWeek, startOfMonth } from 'date-fns';
import { KanbanColumn, COLUMNS } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { TaskDetailPanel } from '../TaskDetailPanel';

export interface KanbanBoardProps {
  /** If provided, only show tasks for this project */
  projectId?: string;
  /** If provided, only show tasks assigned to this user */
  userId?: string;
  /** If true, drag-and-drop is disabled */
  readonly?: boolean;
}

type DueDateFilter = '' | 'overdue' | 'this_week' | 'this_month';

const PRIORITY_OPTIONS: { value: TaskPriority | ''; label: string }[] = [
  { value: '', label: 'All priorities' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const DUE_DATE_OPTIONS: { value: DueDateFilter; label: string }[] = [
  { value: '', label: 'Any due date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
];

function matchesDueDate(endDate: string | null, filter: DueDateFilter): boolean {
  if (!filter || !endDate) return true;
  const due = parseISO(endDate);
  const today = startOfDay(new Date());
  if (filter === 'overdue') return isAfter(today, due);
  if (filter === 'this_week') return due >= startOfWeek(today) && due <= endOfWeek(today);
  if (filter === 'this_month') return due >= startOfMonth(today) && due <= endOfMonth(today);
  return true;
}

export function KanbanBoard({ projectId, userId, readonly = false }: KanbanBoardProps) {
  const queryClient = useQueryClient();

  // ── Drag state ─────────────────────────────────────────────────────────
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  const [filterDueDate, setFilterDueDate] = useState<DueDateFilter>('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Sensors ────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // ── Data ───────────────────────────────────────────────────────────────
  const { data: allTasks = [], isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getAll(),
  });

  // Client-side scope by projectId / userId
  const scopedTasks = useMemo(() => {
    let t = allTasks;
    if (projectId) t = t.filter(task => task.projectId === projectId);
    if (userId) t = t.filter(task => task.userId === userId);
    return t;
  }, [allTasks, projectId, userId]);

  // Unique assignees for filter dropdown
  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of scopedTasks) {
      if (t.assignedTo) {
        map.set(t.assignedTo.id, t.assignedTo.name ?? t.assignedTo.email);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [scopedTasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return scopedTasks.filter(task => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAssigneeId && task.assignedTo?.id !== filterAssigneeId) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (!matchesDueDate(task.endDate, filterDueDate)) return false;
      return true;
    });
  }, [scopedTasks, search, filterAssigneeId, filterPriority, filterDueDate]);

  const hasActiveFilters = !!(search || filterAssigneeId || filterPriority || filterDueDate);

  const clearFilters = () => {
    setSearch('');
    setFilterAssigneeId('');
    setFilterPriority('');
    setFilterDueDate('');
  };

  // ── Move mutation with optimistic update ───────────────────────────────
  const moveMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) =>
      taskService.update(taskId, { status: newStatus }),
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const prev = queryClient.getQueryData<TaskResponse[]>(['tasks']);
      queryClient.setQueryData<TaskResponse[]>(['tasks'], old =>
        old?.map(t => t.id === taskId ? { ...t, status: newStatus } : t) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['tasks'], ctx.prev);
      toast.error('Failed to move task');
    },
    onSuccess: () => {
      toast.success('Task moved');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // ── Drag handlers ──────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = allTasks.find(t => t.id === taskId);

    if (!task || task.status === newStatus) return;
    if (!COLUMNS.some(c => c.status === newStatus)) return; // validate it's a column

    moveMutation.mutate({ taskId, newStatus });
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handled in onDragEnd — no intermediate state needed for column-to-column
  };

  const activeTask = activeTaskId ? allTasks.find(t => t.id === activeTaskId) : null;
  const showProject = !projectId; // Show project name on cards when not scoped to one project

  // ── Loading / error ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 gap-2">
        <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        Loading tasks…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-40 text-rose-400 text-sm">
        Failed to load tasks.
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            style={{ fontFamily: 'inherit' }}
          />
        </div>

        {/* Toggle advanced filters */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-all cursor-pointer ${
            showFilters || hasActiveFilters
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          style={{ fontFamily: 'inherit' }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-900 text-[0.6rem] font-bold grid place-items-center">!</span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none"
            style={{ fontFamily: 'inherit' }}
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Advanced filter row */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
          {/* Assignee filter */}
          <select
            value={filterAssigneeId}
            onChange={e => setFilterAssigneeId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            style={{ fontFamily: 'inherit' }}
          >
            <option value="">All assignees</option>
            {assignees.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as TaskPriority | '')}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            style={{ fontFamily: 'inherit' }}
          >
            {PRIORITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Due date filter */}
          <select
            value={filterDueDate}
            onChange={e => setFilterDueDate(e.target.value as DueDateFilter)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            style={{ fontFamily: 'inherit' }}
          >
            {DUE_DATE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Kanban columns ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.status}
              config={col}
              tasks={filteredTasks.filter(t => t.status === col.status)}
              showProject={showProject}
              readonly={readonly}
              onTaskClick={setSelectedTaskId}
            />
          ))}
        </div>

        {/* Drag overlay — renders a floating copy while dragging */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="opacity-95 rotate-1 shadow-2xl shadow-black/50">
              <KanbanCard
                task={activeTask}
                showProject={showProject}
                readonly
                overlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {filteredTasks.length === 0 && !isLoading && (
        <div className="text-center py-12 text-slate-500 text-sm">
          {hasActiveFilters ? 'No tasks match your filters.' : 'No tasks yet.'}
        </div>
      )}

      {/* Task Detail Panel */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

export default KanbanBoard;
