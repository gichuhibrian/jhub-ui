import { Project, ProjectStatus } from '@/types';
import { ProjectResponse, CreateProjectPayload, UpdateProjectPayload } from '@/services/projectService';

// Map backend status to frontend status
export const mapBackendStatusToFrontend = (
  backendStatus: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'
): ProjectStatus => {
  const statusMap: Record<string, ProjectStatus> = {
    'PLANNING': 'not-started',
    'IN_PROGRESS': 'in-progress',
    'COMPLETED': 'completed',
    'ON_HOLD': 'on-hold',
  };
  return statusMap[backendStatus] || 'not-started';
};

// Map frontend status to backend status
export const mapFrontendStatusToBackend = (
  frontendStatus: ProjectStatus
): 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' => {
  const statusMap: Record<ProjectStatus, 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'> = {
    'not-started': 'PLANNING',
    'in-progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'on-hold': 'ON_HOLD',
  };
  return statusMap[frontendStatus];
};

// Map backend project response to frontend project
export const mapBackendProjectToFrontend = (backendProject: ProjectResponse): Project => {
  return {
    id: backendProject.id,
    name: backendProject.title,
    description: backendProject.description || '',
    status: mapBackendStatusToFrontend(backendProject.status),
    startDate: backendProject.startDate.split('T')[0], // Extract date only
    dueDate: backendProject.endDate ? backendProject.endDate.split('T')[0] : '',
    isPublic: backendProject.isPublic,
    images: [],
    featuredImage: '',
    teamLeadId: '',
    memberIds: [],
  };
};

// Map frontend project form to backend create payload
export const mapFrontendFormToCreatePayload = (form: {
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
  isPublic: boolean;
}): CreateProjectPayload => {
  return {
    title: form.name,
    description: form.description || undefined,
    startDate: form.startDate,
    endDate: form.dueDate || undefined,
    status: mapFrontendStatusToBackend(form.status),
    isPublic: form.isPublic,
  };
};

// Map frontend project form to backend update payload
export const mapFrontendFormToUpdatePayload = (form: Partial<{
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
  isPublic: boolean;
}>): UpdateProjectPayload => {
  const payload: UpdateProjectPayload = {};
  
  if (form.name !== undefined) payload.title = form.name;
  if (form.description !== undefined) payload.description = form.description || undefined;
  if (form.status !== undefined) payload.status = mapFrontendStatusToBackend(form.status);
  if (form.startDate !== undefined) payload.startDate = form.startDate;
  if (form.dueDate !== undefined) payload.endDate = form.dueDate || undefined;
  if (form.isPublic !== undefined) payload.isPublic = form.isPublic;
  
  return payload;
};
