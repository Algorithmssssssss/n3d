import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';

const SettingsContext = createContext();

// The last settings we received are kept in localStorage. Returning visitors then get the
// right name and logo on the very first paint (and the tab title/icon, via the small script
// in public/index.html) instead of waiting for the API. The admin panel shares this key.
const CACHE_KEY = 'siteSettings';

// Deliberately blank: this used to default to "TextilePro", which flashed the wrong
// company name on every load until the real settings arrived.
const EMPTY_SETTINGS = {
  companyName: '',
  tagline: '',
  logo: { url: '', alt: '' },
  contact: { email: '', phone: '', address: '' },
  social: { facebook: '', twitter: '', instagram: '', linkedin: '' },
  workingHours: ''
};

const readCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    return cached && typeof cached === 'object' ? cached : null;
  } catch (e) {
    return null;
  }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => readCache() || EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      if (response.data) {
        setSettings(response.data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
        } catch (e) {
          // storage full/blocked: just no instant paint next time
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
