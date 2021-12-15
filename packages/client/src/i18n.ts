import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import moment from 'moment';

const zhCN = require('./locale/zh_CN');
const enUS = require('./locale/en_US');

export const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  lng: localStorage.getItem('locale') || 'en-US',
  debug: true,
  defaultNS: 'client',
  // parseMissingKeyHandler: (key) => {
  //   console.log('parseMissingKeyHandler', `'${key}': '${key}',`);
  //   return key;
  // },
  // ns: ['client'],
  resources: {
    'en-US': {
      client: {
        ...enUS,
      },
    },
    'zh-CN': {
      client: {
        ...zhCN,
      },
    },
  },
});

const momentLngs = {
  'en-US': 'en',
  'zh-CN': 'zh-cn',
};

function setMomentLng(language) {
  const lng = momentLngs[language || 'en-US'] || 'en';
  console.log("localStorage.getItem('locale')", lng);
  moment.locale(lng);
}

setMomentLng(localStorage.getItem('locale'));

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('locale', lng);
  setMomentLng(lng);
});

// export const t = i18n.t;

export default i18n;
