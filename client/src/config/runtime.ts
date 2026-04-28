const DEFAULT_RENDER_ORIGIN = 'https://sketchdb.onrender.com';

const normalizeBaseUrl = (url: string): string => {
  return url.trim().replace(/\/+$/, '');
};

const withApiSuffix = (url: string): string => {
  const normalized = normalizeBaseUrl(url);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const envSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
const appTarget = import.meta.env.VITE_APP_TARGET?.trim() || 'web';
const isDesktopTarget = appTarget === 'desktop';

const baseApiUrl = envApiUrl
  ? withApiSuffix(envApiUrl)
  : (isDesktopTarget ? '' : `${DEFAULT_RENDER_ORIGIN}/api`);

export const APP_TARGET = appTarget;
export const API_BASE_URL = baseApiUrl;
export const SOCKET_BASE_URL = envSocketUrl
  ? normalizeBaseUrl(envSocketUrl)
  : (isDesktopTarget ? '' : normalizeBaseUrl(API_BASE_URL.replace(/\/api$/, '')));
