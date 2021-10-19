import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locale/zh_CN';
import enUS from './locale/en_US';

export const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  lng: localStorage.getItem('locale') || 'en-US',
  debug: true,
  defaultNS: 'client',
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

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('locale', lng);
});

// export const t = i18n.t;

export default i18n;
