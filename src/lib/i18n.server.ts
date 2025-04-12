// Server-specific i18n setup
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import FsBackend from 'i18next-fs-backend';
import path from 'path';
import { supportedLngs } from './languages';

const i18nServer = i18n
  .use(FsBackend) 
  .use(initReactI18next);

// Initialize server-side i18next
i18nServer.init({
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: 'en',
  supportedLngs,
  backend: {
    loadPath: path.resolve('./public/locales/{{lng}}.json'), // Path for FS backend
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false }, // Suspense not typically needed/used server-side for i18n loading
  saveMissing: false, // Disable missing key saving on server
  updateMissing: false,
});

export default i18nServer; 