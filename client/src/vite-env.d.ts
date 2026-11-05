/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_SOCKET_PATH: string;
  readonly VITE_BACKEND_PORT: string;
  readonly VITE_BACKEND_URL: string;
  readonly PORT: string;
  readonly VITE_PORT: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_DESCRIPTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
