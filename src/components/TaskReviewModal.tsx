import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { objectiveService, ObjectiveResponse } from '@/services/objectiveService';
import { taskService } from '@/services/taskService';
import { X, CheckCircle, XCircle, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TaskReviewModalProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

export function TaskReviewModal({ taskId, taskTitle, onClose }: TaskReviewModalProps) {
  const queryClient = useQueryClient();
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [sendBackFeedback, setSendBackFeedback] = useState('');
  const [showSendBackModal, setShowSendBackModal] = useState(false);

  // Fetch review status
  const { data: reviewStatus, isLoading, error } = useQuery({
    queryKey: ['review-status', taskId],
    queryFn: () => objectiveService.getReviewStatus(taskId),
    retry: 1,
  });

  // Show error if query fails
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Error Loading Review</h2>
          <p className="text-sm text-slate-400 mb-4">
            Failed to load review status. This might be because the database schema hasn't been updated yet.
          </p>
          <p className="text-xs text-slate-500 mb-4 font-mono bg-slate-950 p-3 rounded">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <div className="text-sm text-slate-400 mb-4">
            <p className="font-semibold mb-2">To fix this, run:</p>
            <code className="block bg-slate-950 p-2 rounded text-xs">
              cd backend<br/>
              npx prisma generate<br/>
              # Then restart the backend server
            </code>
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Review objective mutation
  const reviewMutation = useMutation({
    mutationFn: ({ objectiveId, isApproved, comment }: { objectiveId: string; isApproved: boolean; comment?: string }) =>
      objectiveService.review(objectiveId, { isApproved, reviewComment: comment }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['review-status', taskId] });
      queryClient.invalidateQueries({ queryKey: ['objectives', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      
      // Clear the comment for this objective
      setReviewComments(prev => {
        const newComments = { ...prev };
        delete newComments[variables.objectiveId];
        return newComments;
      });

      toast.success(variables.isApproved ? 'Objective approved' : 'Objective rejected');

      // Check if all objectives are approved and close modal
      if (reviewStatus && reviewStatus.approved + 1 === reviewStatus.total) {
        setTimeout(() => {
          toast.success('All objectives approved! Task marked as complete.');
          onClose();
        }, 1000);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to review objective';
      toast.error(errorMessage);
    },
  });

  // Send back mutation
  const sendBackMutation = useMutation({
    mutationFn: (feedback: string) => objectiveService.sendBackForRevision(taskId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-status', taskId] });
      queryClient.invalidateQueries({ queryKey: ['objectives', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Task sent back for revision');
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to send task back';
      toast.error(errorMessage);
    },
  });

  const handleApprove = (objectiveId: string) => {
    const comment = reviewComments[objectiveId];
    reviewMutation.mutate({ objectiveId, isApproved: true, comment });
  };

  const handleReject = (objectiveId: string) => {
    const comment = reviewComments[objectiveId];
    if (!comment?.trim()) {
      toast.error('Please provide feedback when rejecting an objective');
      return;
    }
    reviewMutation.mutate({ objectiveId, isApproved: false, comment });
  };

  const handleSendBack = () => {
    if (!sendBackFeedback.trim()) {
      toast.error('Please provide feedback for the assignee');
      return;
    }
    sendBackMutation.mutate(sendBackFeedback);
  };

  if (isLoading || !reviewStatus) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { objectives, approved, rejected, pending, total } = reviewStatus;
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-100 mb-1">Review Task</h2>
                <p className="text-sm text-slate-500">{taskTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all grid place-items-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Review Progress</span>
                <span className="font-mono text-slate-300">
                  {approved}/{total} approved
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-400">✓ {approved} Approved</span>
                <span className="text-rose-400">✗ {rejected} Rejected</span>
                <span className="text-slate-500">○ {pending} Pending</span>
              </div>
            </div>
          </div>

          {/* Objectives List */}
          <div className="p-6 space-y-4">
            {objectives.map((objective) => (
              <div
                key={objective.id}
                className={`p-4 rounded-xl border transition-all ${
                  objective.isApproved === true
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : objective.isApproved === false
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                {/* Objective Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      objective.isApproved === true
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : objective.isApproved === false
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {objective.isApproved === true ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : objective.isApproved === false ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium mb-1">{objective.deliverable}</p>
                    {objective.isApproved !== null && objective.reviewer && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Avatar className="h-4 w-4 border border-slate-700">
                          <AvatarFallback className="text-[8px] bg-slate-800 text-slate-400">
                            {objective.reviewer.name?.[0] || objective.reviewer.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          Reviewed by {objective.reviewer.name || objective.reviewer.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Comment (if exists) */}
                {objective.reviewComment && (
                  <div className="mb-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Review Comment:</p>
                    <p className="text-sm text-slate-300">{objective.reviewComment}</p>
                  </div>
                )}

                {/* Review Actions (if not reviewed yet) */}
                {objective.isApproved === null && (
                  <div className="space-y-2">
                    <textarea
                      value={reviewComments[objective.id] || ''}
                      onChange={(e) =>
                        setReviewComments((prev) => ({ ...prev, [objective.id]: e.target.value }))
                      }
                      placeholder="Add feedback (optional for approval, required for rejection)..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(objective.id)}
                        disabled={reviewMutation.isPending}
                        className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(objective.id)}
                        disabled={reviewMutation.isPending}
                        className="flex-1 px-4 py-2 rounded-lg bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {objectives.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No objectives to review</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-6 pt-4">
            <button
              onClick={() => setShowSendBackModal(true)}
              disabled={sendBackMutation.isPending}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Send Back for Revision
            </button>
          </div>
        </div>
      </div>

      {/* Send Back Modal */}
      {showSendBackModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Send Back for Revision</h3>
              <p className="text-sm text-slate-400 mb-4">
                Provide feedback for the assignee. All objective reviews will be reset and the task will move back to "In Progress".
              </p>
              <textarea
                value={sendBackFeedback}
                onChange={(e) => setSendBackFeedback(e.target.value)}
                placeholder="Explain what needs to be revised..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all resize-none mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSendBackModal(false);
                    setSendBackFeedback('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBack}
                  disabled={sendBackMutation.isPending || !sendBackFeedback.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendBackMutation.isPending ? 'Sending...' : 'Send Back'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
