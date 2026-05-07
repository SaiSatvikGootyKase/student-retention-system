/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API prefix, e.g. https://your-api.onrender.com/api/v1 (no trailing slash). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
