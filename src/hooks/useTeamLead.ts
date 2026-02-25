import { useQuery } from '@tanstack/react-query';
import { projectMemberService } from '@/services/projectMemberService';
import { useCurrentUser } from './usePermissions';

/**
 * Hook to check if the current user is a team lead for a specific project
 */
export function useIsTeamLead(projectId: string | undefined) {
  const currentUser = useCurrentUser();

  const { data: members = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const allMembers = await projectMemberService.getAll();
      return allMembers.filter(m => m.projectId === projectId);
    },
    enabled: !!projectId,
  });

  const isTeamLead = members.some(
    m => m.userId === currentUser?.id && m.isTeamLead
  );

  return isTeamLead;
}

/**
 * Hook to check if the current user can review tasks for a specific project
 * (either admin or team lead)
 */
export function useCanReview(projectId: string | undefined) {
  const currentUser = useCurrentUser();
  const isTeamLead = useIsTeamLead(projectId);
  const isAdmin = currentUser?.userType === 'ADMIN';

  return isAdmin || isTeamLead;
}
