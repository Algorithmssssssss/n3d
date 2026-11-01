import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useSiteText } from '../utils/siteText';
import { assetUrl } from '../utils/api';
import { updateFavicon } from '../utils/branding';

// Renders nothing. Keeps the browser-tab icon and the page description in step with the
// company name, logo and tagline from Admin -> Settings.
const SiteMeta = () => {
  const { settings } = useSettings();
  const { name, tagline } = useSiteText();
  const logoUrl = settings.logo?.url ? assetUrl(settings.logo.url) : '';

  useEffect(() => {
    updateFavicon(logoUrl, name);
  }, [logoUrl, name]);

  useEffect(() => {
    const description = document.querySelector('meta[name="description"]');
    if (description && tagline) {
      description.setAttribute('content', name ? `${name} - ${tagline}` : tagline);
    }
  }, [name, tagline]);

  return null;
};

export default SiteMeta;
