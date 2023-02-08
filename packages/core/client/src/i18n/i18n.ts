import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import locale from '../locale';
const log = require('debug')('i18next');

export const i18n = i18next.createInstance();

const resources = {};

Object.keys(locale).forEach((lang) => {
  resources[lang] = locale[lang].resources;
});

i18n
  // .use(Backend)
  .use(initReactI18next)
  .init({
    lng: localStorage.getItem('NOCOBASE_LOCALE') || 'en-US',
    // debug: true,
    defaultNS: 'client',
    // backend: {
    //   // for all available options read the backend's repository readme file
    //   loadPath: '/api/locales/{{lng}}/{{ns}}.json',
    // },
    // parseMissingKeyHandler: (key) => {
    //   console.log('parseMissingKeyHandler', `'${key}': '${key}',`);
    //   return key;
    // },
    // ns: ['client'],
    resources: {},
    keySeparator: false,
    nsSeparator: false,
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('NOCOBASE_LOCALE', lng);
});
