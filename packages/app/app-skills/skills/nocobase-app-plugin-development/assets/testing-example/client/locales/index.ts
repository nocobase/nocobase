import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
  'zh-TW': () => import('./zh-TW.js'),
  'ja-JP': () => import('./ja-JP.js'),
  'es-ES': () => import('./es-ES.js'),
  'pt-BR': () => import('./pt-BR.js'),
  'fr-FR': () => import('./fr-FR.js'),
  'de-DE': () => import('./de-DE.js'),
  'vi-VN': () => import('./vi-VN.js'),
  'id-ID': () => import('./id-ID.js'),
};

export default locales;
