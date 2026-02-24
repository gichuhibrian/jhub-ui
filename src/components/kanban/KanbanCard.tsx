import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TaskResponse, TaskPriority } from '@/services/taskService';
import { MessageSquare, Calendar, CheckSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { isAfter, parseISO, startOfDay } from 'date-fns';

// ── Priority badge ────────────────────────────────────────────────────────
const PRIORITY_STYLE: Record<TaskPriority, { label: string; cls: string }> = {
  LOW:    { label: 'Low',    cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20' },
  MEDIUM: { label: 'Med',    cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' },
  HIGH:   { label: 'High',   cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
  URGENT: { label: 'Urgent', cls: 'bg-rose-500/15 text-rose-400 border border-rose-500/20' },
};

// ── Helpers ───────────────────────────────────────────────────────────────
function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

interface KanbanCardProps {
  task: TaskResponse;
  showProject: boolean;
  readonly: boolean;
  /** Called when card is being rendered as drag overlay (no drag hooks) */
  overlay?: boolean;
}

export function KanbanCard({ task, showProject, readonly, overlay = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: readonly || overlay,
  });

  const style = {
    transform: overlay ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    cursor: readonly ? 'default' : 'grab',
  };

  const doneObjectives = task.objectives.filter(o => o.status === 'DONE').length;
  const totalObjectives = task.objectives.length;

  const isOverdue = task.endDate
    ? isAfter(startOfDay(new Date()), parseISO(task.endDate)) && task.status !== 'DONE'
    : false;

  const pr = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.MEDIUM;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : { ...listeners, ...attributes })}
      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 shadow-sm select-none touch-none"
    >
      {/* Priority + Project */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider ${pr.cls}`}>
          {pr.label}
        </span>
        {showProject && task.project && (
          <span className="text-[0.6rem] text-slate-500 truncate font-mono">{task.project.title}</span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-200 leading-snug line-clamp-2">{task.title}</p>

      {/* Objective progress */}
      {totalObjectives > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[0.6rem] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckSquare className="h-2.5 w-2.5" />
              {doneObjectives}/{totalObjectives} subtasks
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${Math.round((doneObjectives / totalObjectives) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: assignee + due date + comments */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-1.5">
          {task.assignedTo ? (
            <>
              <Avatar className="h-5 w-5 border border-slate-700">
                <AvatarFallback className="text-[0.5rem] bg-amber-500/10 text-amber-400 font-bold">
                  {initials(task.assignedTo.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[0.6rem] text-slate-400 truncate max-w-[80px]">
                {task.assignedTo.name ?? task.assignedTo.email}
              </span>
            </>
          ) : (
            <span className="text-[0.6rem] text-slate-600">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.endDate && (
            <span className={`flex items-center gap-0.5 text-[0.6rem] font-mono ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5 text-[0.6rem] text-slate-500">
              <MessageSquare className="h-2.5 w-2.5" />
              {task._count.comments}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
