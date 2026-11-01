// API and uploaded-image URLs default to same-origin ("/api", "/uploads"): in production
// Caddy routes them to the backend, in development the "proxy" setting in package.json does.
// Set REACT_APP_API_URL only if the API is hosted on a different origin.
export const API_URL = (process.env.REACT_APP_API_URL || '/api').replace(/\/+$/, '');

// Origin that serves /uploads: the API URL without its trailing "/api" segment
// ("/api" -> "", "http://host:5000/api" -> "http://host:5000").
const API_BASE = API_URL.replace(/\/api$/, '');

// Uploaded images are stored as "/uploads/<file>"; absolute URLs pass through untouched.
export const assetUrl = (url) => {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
};
