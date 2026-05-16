/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_API_FOOTBALL_KEY?: string;
  readonly VITE_SPORTMONKS_TOKEN?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
