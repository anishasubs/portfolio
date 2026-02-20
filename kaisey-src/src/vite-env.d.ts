/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Google OAuth
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_REDIRECT_URI: string

  // OpenAI
  readonly VITE_OPENAI_API_KEY: string

  // Canvas LMS
  readonly VITE_CANVAS_API_URL: string
  readonly VITE_CANVAS_API_KEY: string

  // Health Integrations
  readonly VITE_APPLE_HEALTH_API_KEY: string
  readonly VITE_STRAVA_CLIENT_ID: string
  readonly VITE_STRAVA_CLIENT_SECRET: string
  readonly VITE_WHOOP_API_KEY: string

  // App Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
