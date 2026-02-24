import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, TaskResponse } from '@/services/taskService';
import { objectiveService, ObjectiveResponse } from '@/services/objectiveService';
import { commentService, CommentResponse } from '@/services/commentService';
import { useCurrentUser, usePermissions } from '@/hooks/usePermissions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Check, Plus, Trash2, Send, Clock, User, Flag, Calendar, MessageSquare, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { TASK_STATUS_LABELS, PRIORITY_LABELS, TaskStatus, Priority } from '@/types';

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
}

const statusColor: Record<TaskStatus, { bg: string; text: string }> = {
  'TODO': { bg: 'bg-slate-500/10', text: 'text-slate-400' },
  'IN_PROGRESS': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'REVIEW': { bg: 'bg-sky-500/10', text: 'text-sky-400' },
  'DONE': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

const priorityColor: Record<Priority, { bg: string; text: string }> = {
  'LOW': { bg: 'bg-slate-500/10', text: 'text-slate-400' },
  'MEDIUM': { bg: 'bg-sky-500/10', text: 'text-sky-400' },
  'HIGH': { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  'URGENT': { bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const [newObjective, setNewObjective] = useState('');
  const [newComment, setNewComment] = useState('');

  // Queries
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getById(taskId),
  });

  const { data: objectives = [] } = useQuery({
    queryKey: ['objectives', taskId],
    queryFn: () => objectiveService.getByTask(taskId),
    enabled: !!taskId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.getByTask(taskId),
    enabled: !!taskId,
  });

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: (data: Partial<TaskResponse>) => taskService.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
    },
    onError: () => toast.error('Failed to update task'),
  });

  const createObjectiveMutation = useMutation({
    mutationFn: (deliverable: string) => objectiveService.create({ taskId, deliverable, status: 'TODO' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives', taskId] });
      setNewObjective('');
      toast.success('Objective added');
    },
    onError: () => toast.error('Failed to add objective'),
  });

  const toggleObjectiveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      objectiveService.update(id, { status: status === 'DONE' ? 'TODO' : 'DONE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives', taskId] });
    },
    onError: () => toast.error('Failed to update objective'),
  });

  const deleteObjectiveMutation = useMutation({
    mutationFn: (id: string) => objectiveService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives', taskId] });
      toast.success('Objective deleted');
    },
    onError: () => toast.error('Failed to delete objective'),
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentService.create({ taskId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment('');
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => commentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  if (isLoading || !task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const canEdit = permissions.can.editAllTasks || (permissions.can.editOwnTasks && task.userId === currentUser?.id);
  const completedObjectives = objectives.filter(o => o.status === 'DONE').length;
  const progress = objectives.length > 0 ? Math.round((completedObjectives / objectives.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-slate-900 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-slate-100">Task Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all grid place-items-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Title</label>
            {canEdit ? (
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTaskMutation.mutate({ title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
              />
            ) : (
              <p className="text-lg font-semibold text-slate-100">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Description</label>
            {canEdit ? (
              <textarea
                value={task.description || ''}
                onChange={(e) => updateTaskMutation.mutate({ description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm resize-y focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
                placeholder="Add a description..."
              />
            ) : (
              <p className="text-sm text-slate-400">{task.description || 'No description'}</p>
            )}
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                <Clock className="w-3 h-3 inline mr-1" />
                Status
              </label>
              {canEdit ? (
                <select
                  value={task.status}
                  onChange={(e) => updateTaskMutation.mutate({ status: e.target.value as TaskStatus })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
                >
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${statusColor[task.status].bg} ${statusColor[task.status].text}`}>
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                <Flag className="w-3 h-3 inline mr-1" />
                Priority
              </label>
              {canEdit ? (
                <select
                  value={task.priority}
                  onChange={(e) => updateTaskMutation.mutate({ priority: e.target.value as Priority })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${priorityColor[task.priority].bg} ${priorityColor[task.priority].text}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                <User className="w-3 h-3 inline mr-1" />
                Assignee
              </label>
              <div className="flex items-center gap-2">
                {task.assignedTo ? (
                  <>
                    <Avatar className="h-6 w-6 border-2 border-slate-800">
                      <AvatarFallback className="text-xs bg-amber-500/10 text-amber-400 font-bold">
                        {task.assignedTo.name?.[0] || task.assignedTo.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-300">{task.assignedTo.name || task.assignedTo.email}</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-500">Unassigned</span>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                <Calendar className="w-3 h-3 inline mr-1" />
                Due Date
              </label>
              {canEdit ? (
                <input
                  type="date"
                  value={task.endDate?.split('T')[0] || ''}
                  onChange={(e) => updateTaskMutation.mutate({ endDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
                />
              ) : (
                <span className="text-sm text-slate-300">
                  {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'No due date'}
                </span>
              )}
            </div>
          </div>

          {/* Objectives */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                Objectives ({completedObjectives}/{objectives.length})
              </label>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-slate-500 font-mono">{progress}%</span>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              {objectives.map((obj) => (
                <div key={obj.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 hover:bg-slate-950/60 transition-colors">
                  <button
                    onClick={() => toggleObjectiveMutation.mutate({ id: obj.id, status: obj.status })}
                    disabled={!canEdit}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      obj.status === 'DONE'
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-700 hover:border-amber-500'
                    } ${!canEdit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    {obj.status === 'DONE' && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${obj.status === 'DONE' ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                    {obj.deliverable}
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => deleteObjectiveMutation.mutate(obj.id)}
                      className="w-6 h-6 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all grid place-items-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newObjective.trim()) {
                      createObjectiveMutation.mutate(newObjective);
                    }
                  }}
                  placeholder="Add new objective..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
                />
                <button
                  onClick={() => newObjective.trim() && createObjectiveMutation.mutate(newObjective)}
                  disabled={!newObjective.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Comments */}
          {permissions.can.addComments && (
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                Comments ({comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border-2 border-slate-800">
                          <AvatarFallback className="text-xs bg-amber-500/10 text-amber-400 font-bold">
                            {comment.author.name?.[0] || comment.author.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-300">{comment.author.name || comment.author.email}</span>
                        <span className="text-xs text-slate-600 font-mono">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {(comment.authorId === currentUser?.id || permissions.can.deleteComments) && (
                        <button
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="w-6 h-6 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all grid place-items-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center py-6 text-slate-600 text-sm">No comments yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      createCommentMutation.mutate(newComment);
                    }
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
                />
                <button
                  onClick={() => newComment.trim() && createCommentMutation.mutate(newComment)}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
