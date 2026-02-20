import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { UserRole } from '@/types';
import { C } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!currentUser) return <Navigate to="/login" replace />;

  console.log('gets to the protected route');

  // return <Navigate to='/admin' replace />;
  if (requiredRole && currentUser.role !== requiredRole) {
    //To update to pick the exact role
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};
