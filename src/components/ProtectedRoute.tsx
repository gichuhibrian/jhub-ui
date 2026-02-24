import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { UserType } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserType | UserType[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!currentUser) return <Navigate to="/login" replace />;

  // Check if user has required role
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasAccess = allowedRoles.includes(currentUser.userType);

    if (!hasAccess) {
      // Redirect based on user type
      const redirectPath = currentUser.userType === 'ADMIN' ? '/admin' : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};
