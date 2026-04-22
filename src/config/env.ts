// Configuration de l'environnement
export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Tyva',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  // Mode "lecture seule" forcé côté front (non configurable par env).
  ORGA_READ_ONLY: true,
};

export default env;
