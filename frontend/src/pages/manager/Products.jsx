import React, { useState, useEffect } from 'react';
import ProductManager from '../../components/ProductManager';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import './AdminTheme.css';

export default function Products() {
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingSettings && !isUserAdmin) {
      navigate('/');
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  if (loadingSettings) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Admin Panel...</div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Products Management</h1>
        <p>Add, edit, and manage your product catalog</p>
      </div>
      <ProductManager />
    </div>
  );
}