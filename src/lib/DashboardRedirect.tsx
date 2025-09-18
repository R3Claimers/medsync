import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext';
import ChangePasswordModal from '../components/ChangePasswordModal';

const DashboardRedirect: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user must change password
  if (user.mustChangePassword && !showPasswordModal) {
    setShowPasswordModal(true);
  }

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
    // Update user context to reflect password change
    updateUser({ ...user, mustChangePassword: false });
  };

  // Show password change modal if required
  if (showPasswordModal) {
    return <ChangePasswordModal onPasswordChanged={handlePasswordChanged} />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'super-admin':
      return <Navigate to="/superadmin" replace />;
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor-dashboard" replace />;
    case 'patient':
      return <Navigate to="/patient-dashboard" replace />;
    default:
      // For removed roles (pharmacist, receptionist), redirect to login with message
      return <Navigate to="/login" replace />;
  }
};

export default DashboardRedirect;
