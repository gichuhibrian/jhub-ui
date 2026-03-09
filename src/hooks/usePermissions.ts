import { useMemo } from 'react';
import { useAuthStore } from '@/store/useStore';
import { UserType } from '@/types';

export interface Permissions {
  isAdmin: boolean;
  isMember: boolean;
  isClient: boolean;
  can: {
    manageUsers: boolean;
    viewAuditLogs: boolean;
    inviteUsers: boolean;
    createProjects: boolean;
    deleteProjects: boolean;
    editAllTasks: boolean;
    editOwnTasks: boolean;
    viewAllProjects: boolean;
    viewAssignedProjects: boolean;
    addComments: boolean;
    deleteComments: boolean;
    manageProjectMembers: boolean;
    changeTaskAssignee: boolean;
    dragTasks: boolean;
    createTasks: boolean;
    addProjectImages: boolean;
    addProjectDocuments: boolean;
    markObjectivesComplete: boolean;
    reviewTasks: boolean;
    viewAllTasks: boolean; // Admin and members can see all tasks
  };
  canEditTask: (taskAssigneeId: string | null) => boolean;
  canDragTask: (taskAssigneeId: string | null) => boolean;
}

export const usePermissions = (): Permissions => {
  const currentUser = useAuthStore((s) => s.currentUser);

  return useMemo(() => {
    const userType = currentUser?.userType as UserType | undefined;
    const userId = currentUser?.id;

    const isAdmin = userType === 'ADMIN';
    const isMember = userType === 'MEMBER';
    const isClient = userType === 'CLIENT';

    return {
      isAdmin,
      isMember,
      isClient,
      can: {
        // Admin-only permissions
        manageUsers: isAdmin,
        viewAuditLogs: isAdmin,
        inviteUsers: isAdmin,
        createProjects: isAdmin,
        deleteProjects: isAdmin,
        editAllTasks: isAdmin,
        viewAllProjects: isAdmin,
        reviewTasks: isAdmin, // Team leads also have this, checked separately

        // Admin + Team Lead permissions (checked at component level with team lead status)
        manageProjectMembers: isAdmin, // Team leads also have this, checked separately
        changeTaskAssignee: isAdmin, // Team leads also have this, checked separately
        createTasks: isAdmin, // Team leads also have this, checked separately
        addProjectImages: isAdmin, // Team leads also have this, checked separately
        addProjectDocuments: isAdmin, // Team leads also have this, checked separately

        // Admin + Member permissions
        editOwnTasks: isAdmin || isMember,
        addComments: isAdmin || isMember,
        deleteComments: isAdmin || isMember,
        dragTasks: isAdmin || isMember,
        markObjectivesComplete: isAdmin || isMember, // Members can only mark their own
        viewAllTasks: isAdmin || isMember, // Both admin and members can see all tasks

        // Member + Client permissions
        viewAssignedProjects: isMember || isClient,
      },
      // Function to check if user can edit a specific task
      // Only admin or the assignee can edit/action on a task
      canEditTask: (taskAssigneeId: string | null) => {
        if (isAdmin) return true;
        if (!userId) return false;
        return taskAssigneeId === userId;
      },
      // Function to check if user can drag a specific task
      // Only admin or the assignee can drag a task
      canDragTask: (taskAssigneeId: string | null) => {
        if (isAdmin) return true;
        if (!userId) return false;
        return taskAssigneeId === userId;
      },
    };
  }, [currentUser?.userType, currentUser?.id]);
};

export const useCurrentUser = () => {
  return useAuthStore((s) => s.currentUser);
};
