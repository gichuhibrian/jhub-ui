# Phase 6: Role-Based UI Differentiation - Implementation Guide

## ✅ What Was Implemented

### 1. Updated Type System
- Updated `frontend/src/types/index.ts` with proper backend-aligned types:
  - `UserType`: 'ADMIN' | 'MEMBER' | 'CLIENT' (matches backend enum)
  - `Priority`: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  - `TaskStatus`: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  - `ProjectStatus`: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'
  - Added label constants for all enums

### 2. Created Permissions Hook
**File**: `frontend/src/hooks/usePermissions.ts`

```typescript
import { usePermissions } from '@/hooks/usePermissions';

const permissions = usePermissions();

// Check user type
if (permissions.isAdmin) { /* ... */ }
if (permissions.isMember) { /* ... */ }
if (permissions.isClient) { /* ... */ }

// Check specific permissions
if (permissions.can.manageUsers) { /* ... */ }
if (permissions.can.createProjects) { /* ... */ }
if (permissions.can.deleteProjects) { /* ... */ }
```

**Available Permissions**:
- `manageUsers` - ADMIN only
- `viewAuditLogs` - ADMIN only
- `inviteUsers` - ADMIN only
- `createProjects` - ADMIN only
- `deleteProjects` - ADMIN only
- `editAllTasks` - ADMIN only
- `viewAllProjects` - ADMIN only
- `manageProjectMembers` - ADMIN only
- `changeTaskAssignee` - ADMIN only
- `editOwnTasks` - ADMIN + MEMBER
- `addComments` - ADMIN + MEMBER
- `deleteComments` - ADMIN + MEMBER
- `dragTasks` - ADMIN + MEMBER
- `viewAssignedProjects` - MEMBER + CLIENT

### 3. Updated ProtectedRoute Component
- Now supports single role or array of roles
- Properly redirects based on user type
- Example usage:
```typescript
<Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>} />
<Route path="/dashboard" element={<ProtectedRoute requiredRole={["MEMBER", "CLIENT"]}><UserLayout /></ProtectedRoute>} />
```

### 4. Updated BackofficeLayout
- Navigation links now dynamically generated based on permissions
- User role badge displays correct UserType label
- Admin sees: Dashboard, Projects, Tasks, Users, Audit Logs
- Members/Clients see: Dashboard only

### 5. Applied Permissions to ProjectsManagement
- "New Project" button only visible to admins
- Delete button only visible to admins
- Edit button visible to all (but backend should enforce permissions)

## 📋 How to Apply Permissions to Other Pages

### Example 1: Hide Admin-Only Button
```typescript
import { usePermissions } from '@/hooks/usePermissions';

export default function MyComponent() {
  const permissions = usePermissions();

  return (
    <div>
      {permissions.can.inviteUsers && (
        <button onClick={handleInvite}>Invite User</button>
      )}
    </div>
  );
}
```

### Example 2: Conditional Rendering Based on Role
```typescript
import { usePermissions } from '@/hooks/usePermissions';

export default function TaskDetail() {
  const permissions = usePermissions();

  return (
    <div>
      {permissions.isAdmin && (
        <div>Admin-only controls</div>
      )}
      
      {permissions.isMember && (
        <div>Member can edit their own tasks</div>
      )}
      
      {permissions.isClient && (
        <div>Read-only view for clients</div>
      )}
    </div>
  );
}
```

### Example 3: Disable Drag-and-Drop for Clients
```typescript
import { usePermissions } from '@/hooks/usePermissions';

export default function KanbanBoard() {
  const permissions = usePermissions();

  return (
    <div
      draggable={permissions.can.dragTasks}
      onDragStart={permissions.can.dragTasks ? handleDragStart : undefined}
    >
      Task Card
    </div>
  );
}
```

### Example 4: Filter Data Based on Permissions
```typescript
import { usePermissions, useCurrentUser } from '@/hooks/usePermissions';

export default function ProjectsList() {
  const permissions = usePermissions();
  const currentUser = useCurrentUser();
  const { data: projects } = useQuery(['projects'], projectService.getAll);

  // Filter projects based on permissions
  const visibleProjects = useMemo(() => {
    if (permissions.can.viewAllProjects) {
      return projects; // Admin sees all
    }
    // Members/Clients only see projects they're assigned to
    return projects?.filter(p => 
      p.members?.some(m => m.userId === currentUser?.id)
    );
  }, [projects, permissions, currentUser]);

  return (
    <div>
      {visibleProjects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

## 🎯 Pages That Still Need Permission Updates

### High Priority
1. **TasksManagement** (`frontend/src/pages/admin/TasksManagement.tsx`)
   - Hide "Create Task" button for non-admins
   - Hide "Delete Task" button for non-admins
   - Members should only see/edit their own tasks

2. **AdminProjectDetail** (`frontend/src/pages/admin/AdminProjectDetail.tsx`)
   - Hide "Add Member" button for non-admins
   - Hide "Remove Member" button for non-admins
   - Hide "Delete Project" button for non-admins

3. **UserDashboard** (`frontend/src/pages/user/UserDashboard.tsx`)
   - Filter tasks to show only user's assigned tasks
   - Filter projects to show only user's assigned projects

4. **UserProjectDetail** (`frontend/src/pages/user/UserProjectDetail.tsx`)
   - Make kanban read-only for clients
   - Members can only drag their own tasks

### Medium Priority
5. **AuditLogPage** - Already protected by route, but double-check visibility
6. **UsersManagement** - Already well-implemented with permissions

## 🔒 Backend Permission Enforcement

Remember: Frontend permissions are for UX only. Backend MUST enforce all permissions using guards:

```typescript
// Backend example
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
@Delete(':id')
async deleteProject(@Param('id') id: string) {
  return this.projectsService.delete(id);
}
```

## 🧪 Testing Checklist

- [ ] Log in as ADMIN - verify all features visible
- [ ] Log in as MEMBER - verify limited features
- [ ] Log in as CLIENT - verify read-only access
- [ ] Try accessing admin routes as MEMBER - should redirect
- [ ] Try accessing member routes as CLIENT - should work
- [ ] Verify navigation menu shows correct items per role
- [ ] Verify buttons hide/show based on permissions
- [ ] Test that backend rejects unauthorized requests

## 📝 Notes

- The `useCurrentUser()` hook is also exported from `usePermissions.ts` for convenience
- All permission checks are memoized for performance
- Permission checks are reactive - they update when user logs in/out
- Legacy `UserRole` type kept for backward compatibility during migration
