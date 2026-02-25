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
  };
}

export const usePermissions = (): Permissions => {
  const currentUser = useAuthStore((s) => s.currentUser);

  return useMemo(() => {
    const userType = currentUser?.userType as UserType | undefined;

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

        // Member + Client permissions
        viewAssignedProjects: isMember || isClient,
      },
    };
  }, [currentUser?.userType]);
};

export const useCurrentUser = () => {
  return useAuthStore((s) => s.currentUser);
};
