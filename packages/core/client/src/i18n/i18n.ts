import i18next from 'i18next';
import moment from 'moment';
import { initReactI18next } from 'react-i18next';
import locale from '../locale';
const log = require('debug')('i18next');

export const i18n = i18next.createInstance();

const resources = {};

Object.keys(locale).forEach((lang) => {
  resources[lang] = locale[lang].resources;
});

i18n.use(initReactI18next).init({
  lng: localStorage.getItem('NOCOBASE_LOCALE') || 'en-US',
  // debug: true,
  defaultNS: 'client',
  // parseMissingKeyHandler: (key) => {
  //   console.log('parseMissingKeyHandler', `'${key}': '${key}',`);
  //   return key;
  // },
  // ns: ['client'],
  resources,
});

function setMomentLng(language) {
  const lng = locale[language || 'en-US'].moment || 'en';
  log(lng);
  moment.locale(lng);
}

setMomentLng(localStorage.getItem('NOCOBASE_LOCALE'));

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('NOCOBASE_LOCALE', lng);
  setMomentLng(lng);
});
