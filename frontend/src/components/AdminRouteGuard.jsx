import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const AdminRouteGuard = ({ children, redirectTo = '/manager/dashboard' }) => {
  const { isUserAdmin } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (isUserAdmin) {
      navigate(redirectTo);
    }
  }, [isUserAdmin, navigate, redirectTo]);

  // If admin, don't render children (will redirect)
  if (isUserAdmin) {
    return null;
  }

  // If not admin, render children normally
  return children;
};

export default AdminRouteGuard;
