/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Google OAuth
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_REDIRECT_URI: string

  // OpenAI
  readonly VITE_OPENAI_API_KEY: string

  // App Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
