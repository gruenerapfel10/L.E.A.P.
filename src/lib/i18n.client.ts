import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { supportedLngs } from './languages';

const i18nClient = i18n
  .use(HttpBackend) 
  .use(LanguageDetector) 
  .use(initReactI18next);

// Initialize client-side i18next
i18nClient.init({
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: 'en',
  supportedLngs,
  backend: {
    loadPath: '/locales/{{lng}}.json', // Path for HTTP backend
  },
  detection: {
    order: ['localStorage', 'navigator'], // Browser detection order
    caches: ['localStorage'],
  },
  interpolation: { escapeValue: false }, // React already safes from xss
  react: { useSuspense: false },
  saveMissing: true, // Allow missing key saving on client
  updateMissing: true,
});

export default i18nClient; 