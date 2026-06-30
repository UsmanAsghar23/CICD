/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_CLOUDWATCH_LOG_GROUP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
