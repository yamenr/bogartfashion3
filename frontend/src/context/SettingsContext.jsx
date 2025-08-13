import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    site_name: 'BogartFashion',
    currency: 'ILS',
    vat_rate: 18,
  });
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [username, setUsername] = useState(null);
  const [user_id, setUserId] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSiteSettings = useCallback(async () => {
    try {
      const response = await axios.get('/api/settings');
      if (response.data && Object.keys(response.data).length > 0) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error("SettingsContext: Failed to fetch site settings.", error);
    }
  }, []);

  useEffect(() => {
    const checkTokenAndFetchSettings = async () => {
      setLoadingSettings(true);
      
      // Fetch site-wide settings first
      await fetchSiteSettings();

      // Then check user token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          const currentTime = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp > currentTime) {
            setIsUserAdmin(payload.role === 'admin');
            setUsername(payload.username || 'User');
            setUserId(payload.user_id);
          } else {
            localStorage.removeItem('token');
            setIsUserAdmin(false);
            setUsername(null);
            setUserId(null);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setIsUserAdmin(false);
          setUsername(null);
          setUserId(null);
        }
      } else {
        setIsUserAdmin(false);
        setUsername(null);
        setUserId(null);
      }
      setLoadingSettings(false);
    };

    checkTokenAndFetchSettings();
  }, [fetchSiteSettings]);

  const reEvaluateToken = () => {
    window.location.reload(); 
  };
  
  const refreshSiteSettings = async () => {
    setLoadingSettings(true);
    await fetchSiteSettings();
    setLoadingSettings(false);
  };

  const updateUsername = (newUsername) => {
    setUsername(newUsername);
  };

  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Fetch fresh user data from database - use correct endpoint
        const response = await axios.get(`/api/profile/${payload.user_id}`);
        console.log('API response:', response.data);
        if (response.data && response.data.name) {
          console.log('Setting username from', username, 'to', response.data.name);
          setUsername(response.data.name);
          setUserId(payload.user_id);
          console.log('Username refreshed to:', response.data.name);
        } else {
          console.log('No name field in response or response is empty');
        }
      } catch (error) {
        console.log('Could not refresh user data:', error.message);
      }
    }
  };

  const contextValue = {
    ...settings,
    isUserAdmin,
    username,
    user_id,
    loadingSettings,
    reEvaluateToken,
    refreshSiteSettings,
    updateUsername,
    refreshUserData,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext); 