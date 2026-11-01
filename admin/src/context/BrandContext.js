import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, assetUrl } from '../utils/api';
import { updateFavicon } from '../utils/branding';

// The company name and logo come from Admin -> Settings. They used to be hard-coded as
// "TextilePro" in the tab title, the sidebar and the login page.
//
// Uses the public /settings endpoint, so it also works on the login page. The last
// result is cached in localStorage under the same key as the storefront ("siteSettings"),
// which lets returning visitors see the right name and icon immediately.
const CACHE_KEY = 'siteSettings';

const BrandContext = createContext();

const readCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    return cached && typeof cached === 'object' ? cached : null;
  } catch (e) {
    return null;
  }
};

export const BrandProvider = ({ children }) => {
  const [settings, setSettings] = useState(readCache);

  // Also called after the Settings page saves, so the tab updates straight away.
  const refresh = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      if (response.data) {
        setSettings(response.data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
        } catch (e) {
          // storage full/blocked: no instant paint next time, nothing else lost
        }
      }
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const companyName = settings?.companyName || '';
  const logoUrl = settings?.logo?.url ? assetUrl(settings.logo.url) : '';

  useEffect(() => {
    if (companyName) document.title = `${companyName} Admin`;
  }, [companyName]);

  useEffect(() => {
    updateFavicon(logoUrl, companyName);
  }, [logoUrl, companyName]);

  return (
    <BrandContext.Provider value={{ companyName, logoUrl, refresh }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
