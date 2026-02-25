import { useDroppable } from '@dnd-kit/core';
import { TaskResponse, TaskStatus } from '@/services/taskService';
import { KanbanCard } from './KanbanCard';
import { ClipboardCheck } from 'lucide-react';

export interface ColumnConfig {
  status: TaskStatus;
  label: string;
  color: string;       // Tailwind text colour for the header dot
  bgColor: string;     // Tailwind bg colour for the column header
  indicator: string;   // Tailwind bg for the left border indicator
}

export const COLUMNS: ColumnConfig[] = [
  {
    status: 'TODO',
    label: 'To Do',
    color: 'text-slate-400',
    bgColor: 'bg-slate-800/50',
    indicator: 'bg-slate-500',
  },
  {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    indicator: 'bg-blue-500',
  },
  {
    status: 'REVIEW',
    label: 'In Review',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    indicator: 'bg-amber-500',
  },
  {
    status: 'DONE',
    label: 'Done',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    indicator: 'bg-emerald-500',
  },
];

interface KanbanColumnProps {
  config: ColumnConfig;
  tasks: TaskResponse[];
  showProject: boolean;
  readonly: boolean;
  onTaskClick?: (taskId: string) => void;
  onReviewClick?: (taskId: string) => void;
  canReview?: boolean;
}

export function KanbanColumn({ config, tasks, showProject, readonly, onTaskClick, onReviewClick, canReview }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: config.status });
  const isReviewColumn = config.status === 'REVIEW';

  return (
    <div className="flex flex-col min-w-[260px] w-full">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${config.bgColor}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.indicator}`} />
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        </div>
        <span className="text-xs text-slate-500 font-mono bg-slate-800/60 px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2.5 rounded-xl p-2 min-h-[200px] transition-colors duration-200 ${
          isOver ? 'bg-slate-800/40 ring-2 ring-amber-500/30' : 'bg-slate-900/20'
        }`}
      >
        {tasks.map(task => (
          <div key={task.id} className="relative group">
            <KanbanCard
              task={task}
              showProject={showProject}
              readonly={readonly}
              onClick={() => onTaskClick?.(task.id)}
            />
            {/* Review button for tasks in review column */}
            {isReviewColumn && canReview && onReviewClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewClick(task.id);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-600 flex items-center gap-1 shadow-lg"
              >
                <ClipboardCheck className="w-3 h-3" />
                Review
              </button>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="h-20 rounded-lg border-2 border-dashed border-slate-800 flex items-center justify-center">
            <span className="text-xs text-slate-700">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}
