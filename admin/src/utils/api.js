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

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=60&h=60&fit=crop';

// Thumbnail for a product row: its primary image (what the storefront shows), else the first.
export const thumbnailUrl = (product) => {
  const image = product.images?.find(img => img.isPrimary) || product.images?.[0];
  return assetUrl(image?.url) || PLACEHOLDER_IMAGE;
};

// GET /products returns one page at a time (max 100). Follow the pages so the admin lists
// see every product, and include deactivated ones (the API only honours that for signed-in users).
export const fetchAllProducts = async (axios) => {
  const products = [];
  let page = 1;
  let pages = 1;

  do {
    const { data } = await axios.get(`${API_URL}/products`, {
      params: { page, limit: 100, includeInactive: true }
    });
    products.push(...data.products);
    pages = data.pagination.pages;
    page += 1;
  } while (page <= pages);

  return products;
};
