import React from 'react';
import { useAuth } from './authContext';
import { Navigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
  role?: string | string[];
};

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role) {
    if (Array.isArray(role)) {
      if (!role.includes(user.role)) return <Navigate to="/" replace />;
    } else {
      if (user.role !== role) return <Navigate to="/" replace />;
    }
  }
  return <>{children}</>;
};

export default ProtectedRoute; 