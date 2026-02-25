import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService, ProjectMessage } from '@/services/conversationService';
import { projectDocumentService } from '@/services/projectDocumentService';
import { useConversationSocket } from '@/hooks/useConversationSocket';
import { Send, Smile, Paperclip, Search, MoreVertical, Edit, Trash2, MessageSquare, X, FileText, Link as LinkIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { getFileIcon } from '@/lib/s3Upload';

interface ConversationsPanelProps {
  projectId: string;
  currentUserId: string;
  currentUserName: string;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🚀', '👏'];

export function ConversationsPanel({ projectId, currentUserId, currentUserName }: ConversationsPanelProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<ProjectMessage | null>(null);
  const [viewingThread, setViewingThread] = useState<ProjectMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const token = localStorage.getItem('token');
  const { isConnected, newMessage, messageUpdate, reactionUpdate, typingUsers, sendTyping, sendStopTyping } =
    useConversationSocket(projectId, token);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['project-messages', projectId],
    queryFn: () => conversationService.getProjectMessages(projectId),
    enabled: !!projectId,
  });

  // Fetch project documents
  const { data: allDocuments = [] } = useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const docs = await projectDocumentService.getAll();
      return docs.filter(doc => doc.projectId === projectId);
    },
    enabled: !!projectId,
  });

  // Fetch thread replies
  const { data: threadReplies = [] } = useQuery({
    queryKey: ['thread-replies', viewingThread?.id],
    queryFn: () => conversationService.getThreadReplies(viewingThread!.id),
    enabled: !!viewingThread,
  });

  // Search messages
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search-messages', projectId, searchQuery],
    queryFn: () => conversationService.searchMessages(projectId, searchQuery),
    enabled: searchQuery.length > 2,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: conversationService.createMessage,
    onSuccess: (newMsg) => {
      setMessage('');
      setReplyingTo(null);
      sendStopTyping();
      
      // Immediately add the message to the local state
      queryClient.setQueryData(['project-messages', projectId], (old: ProjectMessage[] = []) => {
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });

      // If replying in a thread, update thread replies too
      if (viewingThread && newMsg.parentMessageId === viewingThread.id) {
        queryClient.setQueryData(['thread-replies', viewingThread.id], (old: ProjectMessage[] = []) => {
          if (old.some((m) => m.id === newMsg.id)) return old;
          return [...old, newMsg];
        });
      }
    },
    onError: () => toast.error('Failed to send message'),
  });

  // Update message mutation
  const updateMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      conversationService.updateMessage(messageId, { content }),
    onSuccess: () => {
      setEditingMessageId(null);
      setEditContent('');
      toast.success('Message updated');
    },
    onError: () => toast.error('Failed to update message'),
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: conversationService.deleteMessage,
    onSuccess: () => toast.success('Message deleted'),
    onError: () => toast.error('Failed to delete message'),
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      conversationService.addReaction(messageId, { emoji }),
    onError: () => toast.error('Failed to add reaction'),
  });

  // Handle new message from socket
  useEffect(() => {
    if (newMessage) {
      queryClient.setQueryData(['project-messages', projectId], (old: ProjectMessage[] = []) => {
        if (old.some((m) => m.id === newMessage.id)) return old;
        return [...old, newMessage];
      });

      if (viewingThread && newMessage.parentMessageId === viewingThread.id) {
        queryClient.setQueryData(['thread-replies', viewingThread.id], (old: ProjectMessage[] = []) => {
          if (old.some((m) => m.id === newMessage.id)) return old;
          return [...old, newMessage];
        });
      }
    }
  }, [newMessage, projectId, viewingThread, queryClient]);

  // Handle message update from socket
  useEffect(() => {
    if (messageUpdate) {
      if (messageUpdate.deleted) {
        queryClient.setQueryData(['project-messages', projectId], (old: ProjectMessage[] = []) =>
          old.filter((m) => m.id !== messageUpdate.id)
        );
      } else {
        queryClient.setQueryData(['project-messages', projectId], (old: ProjectMessage[] = []) =>
          old.map((m) => (m.id === messageUpdate.id ? messageUpdate : m))
        );
      }
    }
  }, [messageUpdate, projectId, queryClient]);

  // Handle reaction update from socket
  useEffect(() => {
    if (reactionUpdate) {
      queryClient.setQueryData(['project-messages', projectId], (old: ProjectMessage[] = []) =>
        old.map((m) => (m.id === reactionUpdate.messageId ? { ...m, reactions: reactionUpdate.reactions } : m))
      );
    }
  }, [reactionUpdate, projectId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      projectId,
      content: message.trim(),
      parentMessageId: replyingTo?.id || viewingThread?.id,
      documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined,
    });
    
    setSelectedDocuments([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    sendTyping(currentUserName);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 2000);
  };

  const handleEditMessage = (msg: ProjectMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editContent.trim()) return;
    updateMessageMutation.mutate({ messageId: editingMessageId, content: editContent.trim() });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('Delete this message?')) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
    setShowEmojiPicker(null);
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const displayMessages = searchQuery.length > 2 ? searchResults : viewingThread ? threadReplies : messages;

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {viewingThread && (
            <button
              onClick={() => setViewingThread(null)}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <MessageSquare className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-semibold">
              {viewingThread ? 'Thread' : 'Conversations'}
            </h3>
            {isConnected && (
              <p className="text-xs text-emerald-400">● Connected</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none w-48"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No messages found' : 'No messages yet. Start the conversation!'}
            </p>
          </div>
        ) : (
          displayMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              isEditing={editingMessageId === msg.id}
              editContent={editContent}
              setEditContent={setEditContent}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditingMessageId(null)}
              onEdit={() => handleEditMessage(msg)}
              onDelete={() => handleDeleteMessage(msg.id)}
              onReply={() => setReplyingTo(msg)}
              onViewThread={() => setViewingThread(msg)}
              onReaction={(emoji) => handleReaction(msg.id, emoji)}
              showEmojiPicker={showEmojiPicker === msg.id}
              setShowEmojiPicker={(show) => setShowEmojiPicker(show ? msg.id : null)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-slate-500 italic">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Replying to <span className="text-amber-400">{replyingTo.user.name}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Documents */}
      {selectedDocuments.length > 0 && (
        <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Attached documents:</span>
            {selectedDocuments.map(docId => {
              const doc = allDocuments.find(d => d.id === docId);
              return doc ? (
                <div key={docId} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-xs">
                  <span>{doc.documentName}</span>
                  <button
                    onClick={() => toggleDocumentSelection(docId)}
                    className="hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setShowDocumentPicker(!showDocumentPicker)}
              className="p-2.5 rounded-lg border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800 transition-all"
              title="Attach document"
            >
              <LinkIcon className="w-4 h-4 text-slate-400" />
            </button>
            
            {/* Document Picker Dropdown */}
            {showDocumentPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-64 max-h-64 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                <div className="p-2 border-b border-slate-700">
                  <div className="text-xs font-medium text-slate-400 uppercase">Select Documents</div>
                </div>
                <div className="p-1">
                  {allDocuments.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">
                      No documents available
                    </div>
                  ) : (
                    allDocuments.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => toggleDocumentSelection(doc.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition-colors text-left ${
                          selectedDocuments.includes(doc.id) ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        <div className="text-lg">{getFileIcon(doc.documentName)}</div>
                        <span className="text-xs truncate flex-1">{doc.documentName}</span>
                        {selectedDocuments.includes(doc.id) && (
                          <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                            <span className="text-slate-950 text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none resize-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Message Item Component
function MessageItem({
  message,
  currentUserId,
  isEditing,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete,
  onReply,
  onViewThread,
  onReaction,
  showEmojiPicker,
  setShowEmojiPicker,
}: {
  message: ProjectMessage;
  currentUserId: string;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
  onViewThread: () => void;
  onReaction: (emoji: string) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
}) {
  const isOwn = message.userId === currentUserId;
  const [showActions, setShowActions] = useState(false);

  // Group reactions by emoji
  const groupedReactions = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  return (
    <div
      className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-amber-500/10 text-amber-400 text-xs font-bold">
          {message.user.name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 min-w-0 ${isOwn ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-300">{message.user.name}</span>
          <span className="text-xs text-slate-600">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {message.isEdited && <span className="text-xs text-slate-600">(edited)</span>}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-amber-500 outline-none resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={onSaveEdit}
                className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 rounded-lg border border-slate-700 text-slate-400 text-sm hover:border-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`inline-block px-4 py-2 rounded-2xl ${
                isOwn
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>

            {/* Referenced Documents */}
            {message.referencedDocuments && message.referencedDocuments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.referencedDocuments.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 transition-all group"
                  >
                    <div className="text-2xl">{getFileIcon(doc.documentName)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-300 truncate group-hover:text-amber-400 transition-colors">
                        {doc.documentName}
                      </div>
                      <div className="text-xs text-slate-600">Attached document</div>
                    </div>
                    <LinkIcon className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </a>
                ))}
              </div>
            )}

            {/* Reactions */}
            {Object.keys(groupedReactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                  <button
                    key={emoji}
                    onClick={() => onReaction(emoji)}
                    className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1 transition-colors"
                    title={reactions.map((r) => r.user.name).join(', ')}
                  >
                    <span>{emoji}</span>
                    <span className="text-slate-400">{reactions.length}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Thread count */}
            {message._count && message._count.replies > 0 && (
              <button
                onClick={onViewThread}
                className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                {message._count.replies} {message._count.replies === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </>
        )}

        {/* Actions */}
        {showActions && !isEditing && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors relative"
            >
              <Smile className="w-4 h-4 text-slate-500" />
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex gap-1 z-10">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReaction(emoji);
                      }}
                      className="p-1 hover:bg-slate-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </button>
            <button
              onClick={onReply}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
            </button>
            {isOwn && (
              <>
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Edit className="w-4 h-4 text-slate-500" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
