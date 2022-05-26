import i18next from 'i18next';
import moment from 'moment';
import { initReactI18next } from 'react-i18next';
import { resources } from '../locale';
const log = require('debug')('i18next');

export const i18n = i18next.createInstance();

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

const momentLngs = {
  'en-US': 'en',
  'zh-CN': 'zh-cn',
};

function setMomentLng(language) {
  const lng = momentLngs[language || 'en-US'] || 'en';
  log(lng);
  moment.locale(lng);
}

setMomentLng(localStorage.getItem('NOCOBASE_LOCALE'));

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('NOCOBASE_LOCALE', lng);
  setMomentLng(lng);
});
