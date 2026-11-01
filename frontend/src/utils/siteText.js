import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../i18n/I18nContext';
import en from '../i18n/en';

// Company text from Admin -> Settings, in the visitor's language where we can:
//  - the built-in default tagline / working hours (still unchanged) are shown translated
//  - anything the owner typed is shown exactly as typed
export const useSiteText = () => {
  const { settings } = useSettings();
  const { t } = useI18n();

  const orDefault = (value, key) => (value === en[key] ? t(key) : value);

  return {
    name: settings.companyName,
    tagline: orDefault(settings.tagline, 'defaults.tagline'),
    workingHours: orDefault(settings.workingHours, 'defaults.workingHours')
  };
};

// Browser-tab title: "<page> | <company name>", or "<company name> - <tagline>" on the
// home page. The company name is the one from Admin -> Settings, never a hard-coded one.
export const useDocumentTitle = (pageTitle) => {
  const { name, tagline } = useSiteText();

  useEffect(() => {
    // Settings not loaded yet: leave the title the head script (or the page) already set.
    if (!name) return;

    if (pageTitle) document.title = `${pageTitle} | ${name}`;
    else document.title = tagline ? `${name} - ${tagline}` : name;
  }, [pageTitle, name, tagline]);
};
