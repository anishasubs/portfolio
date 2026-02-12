/**
 * Environment Configuration for Kaisey
 * 
 * This file reads environment variables and provides them to the app.
 * All variables must be prefixed with VITE_ to be accessible in the browser.
 * 
 * Usage:
 * import { env } from '@/config/env';
 * const clientId = env.google.clientId;
 */

export const env = {
  // Google OAuth
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "439791456473-9icvss2jens8jvnb0v3ne2nhdodqjbd1.apps.googleusercontent.com",
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin,
    scopes: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
  },

  // OpenAI
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  },

  // Canvas LMS
  canvas: {
    apiUrl: import.meta.env.VITE_CANVAS_API_URL || "",
    apiKey: import.meta.env.VITE_CANVAS_API_KEY || "",
  },

  // Health Integrations
  health: {
    appleHealthKey: import.meta.env.VITE_APPLE_HEALTH_API_KEY || "",
    stravaClientId: import.meta.env.VITE_STRAVA_CLIENT_ID || "",
    stravaClientSecret: import.meta.env.VITE_STRAVA_CLIENT_SECRET || "",
    whoopApiKey: import.meta.env.VITE_WHOOP_API_KEY || "",
  },

  // App Config
  app: {
    name: import.meta.env.VITE_APP_NAME || "Kaisey",
    env: import.meta.env.VITE_APP_ENV || "development",
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
} as const;

// Log environment status on load
if (typeof window !== 'undefined') {
  console.log('🔧 Kaisey Environment Configuration:');
  console.log('  Google Client ID:', env.google.clientId ? '✅ Set' : '❌ Missing');
  console.log('  Redirect URI:', env.google.redirectUri);
  console.log('  OpenAI Key:', env.openai.apiKey ? '✅ Set' : '❌ Missing');
  console.log('  Environment:', env.app.env);
}

// Export individual configs for convenience
export const googleConfig = env.google;
export const openaiConfig = env.openai;
export const canvasConfig = env.canvas;
export const healthConfig = env.health;
export const appConfig = env.app;